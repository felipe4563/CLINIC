jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');
const { normalizarUid } = require('../src/services/sellos');

describe('Tarjeta de sellos', () => {
  let token, profesional, facial, consulta, ana, beto;
  let hora = 8 * 60;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  async function cita(servicio, paciente = ana) {
    hora += 30;
    const hh = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`;
    return db.Cita.create({
      paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id,
      fecha: '2026-10-13', hora_inicio: hh(hora), hora_fin: hh(hora + 30), estado: 'confirmada',
    });
  }
  const estado = (c, e) => request(app).patch(`/staff/citas/${c.id}/estado`).set(auth()).send({ estado: e });
  const cartilla = async (paciente = ana) => (await request(app).get(`/staff/pacientes/${paciente.id}/tarjeta`).set(auth())).body;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const [rol] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Admin } });
    await db.Usuario.create({ nombre: 'Admin', email: 'admin@test.com', password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true });
    token = (await request(app).post('/staff/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;

    facial = await db.Servicio.create({ nombre: 'Limpieza facial', duracion_min: 30, precio: 150, sellos_requeridos: 3 });
    consulta = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100 });
    profesional = await db.Profesional.create({ nombre: 'Dra. Test', activo: true });
    ana = await db.Paciente.create({ nombre_completo: 'Ana', telefono: '59170000001', codigo_paciente: 'P-1', carnet_identidad: '1', carnet_expedido: 'CB' });
    beto = await db.Paciente.create({ nombre_completo: 'Beto', telefono: '59170000002', codigo_paciente: 'P-2', carnet_identidad: '2', carnet_expedido: 'CB' });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('normaliza el número de la tarjeta venga del lector USB o del celular', () => {
    expect(normalizarUid('04:a2:3f:1b')).toBe('04A23F1B');
    expect(normalizarUid(' 04 A2 3F 1B ')).toBe('04A23F1B');
    expect(normalizarUid('0001193046')).toBe('00123456');
    expect(normalizarUid('hola')).toBe('');
    expect(normalizarUid('')).toBe('');
  });

  test('completar una cita suma un sello; un servicio sin cartilla no suma', async () => {
    const res = await estado(await cita(facial), 'completada');
    expect(res.status).toBe(200);
    expect(res.body.sello).toEqual({ servicio: 'Limpieza facial', sellos: 1, requeridos: 3, premio: false });

    expect((await estado(await cita(consulta), 'completada')).body.sello).toBeNull();
    const { cartillas } = await cartilla();
    expect(cartillas).toEqual([{ servicioId: facial.id, servicio: 'Limpieza facial', sellos: 1, requeridos: 3, premiosGanados: 0 }]);
  });

  test('volver a completar la misma cita no duplica; revertirla quita el sello', async () => {
    const c = await cita(facial);
    await estado(c, 'completada');
    expect((await cartilla()).cartillas[0].sellos).toBe(2);
    await estado(c, 'completada');
    expect((await cartilla()).cartillas[0].sellos).toBe(2);
    await estado(c, 'confirmada');
    expect((await cartilla()).cartillas[0].sellos).toBe(1);
  });

  test('al llenar la cartilla gana una sesión gratis, que la próxima cita usa sin sumar sello', async () => {
    await estado(await cita(facial), 'completada');
    const res = await estado(await cita(facial), 'completada');
    expect(res.body.sello).toEqual({ servicio: 'Limpieza facial', sellos: 3, requeridos: 3, premio: true });

    let datos = await cartilla();
    expect(datos.cartillas[0]).toMatchObject({ sellos: 0, premiosGanados: 1 });
    expect(datos.premiosDisponibles).toEqual([expect.objectContaining({ servicio: 'Limpieza facial' })]);

    const gratis = await cita(facial);
    const usado = await estado(gratis, 'completada');
    expect(usado.body.sello).toBeNull();
    const paquete = await db.PaqueteSesiones.findByPk(usado.body.paquete_sesiones_id);
    expect(paquete).toMatchObject({ es_premio: true, sesiones_usadas: 1 });

    datos = await cartilla();
    expect(datos.cartillas[0].sellos).toBe(0);
    expect(datos.premiosDisponibles).toEqual([]);
  });

  test('revertir el sello que dio un premio sin usar retira el premio', async () => {
    const c1 = await cita(facial, beto);
    const c2 = await cita(facial, beto);
    const c3 = await cita(facial, beto);
    for (const c of [c1, c2, c3]) await estado(c, 'completada');
    expect((await cartilla(beto)).premiosDisponibles).toHaveLength(1);

    await estado(c3, 'cancelada');
    const datos = await cartilla(beto);
    expect(datos.premiosDisponibles).toEqual([]);
    expect(datos.cartillas[0]).toMatchObject({ sellos: 2, premiosGanados: 0 });
  });

  test('vincular, pasar, reemplazar y bloquear la tarjeta', async () => {
    let res = await request(app).post(`/staff/pacientes/${ana.id}/tarjeta`).set(auth()).send({ uid: '04:a2:3f:1b' });
    expect(res.status).toBe(201);
    expect(res.body.tarjeta).toMatchObject({ uid: '04A23F1B', estado: 'activa' });

    res = await request(app).get('/staff/tarjetas/04A23F1B').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.paciente).toMatchObject({ nombre_completo: 'Ana', codigo_paciente: 'P-1' });
    expect(res.body.cartillas[0].servicio).toBe('Limpieza facial');

    res = await request(app).post(`/staff/pacientes/${beto.id}/tarjeta`).set(auth()).send({ uid: '04A23F1B' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Ana/);

    // Reemplazo: la tarjeta vieja queda bloqueada.
    res = await request(app).post(`/staff/pacientes/${ana.id}/tarjeta`).set(auth()).send({ uid: 'AABBCCDD' });
    expect(res.status).toBe(201);
    expect((await request(app).get('/staff/tarjetas/04A23F1B').set(auth())).status).toBe(410);
    expect((await cartilla()).tarjeta.uid).toBe('AABBCCDD');

    await request(app).patch(`/staff/tarjetas/${res.body.tarjeta.id}/bloquear`).set(auth());
    expect((await request(app).get('/staff/tarjetas/AABBCCDD').set(auth())).status).toBe(410);
    expect((await cartilla()).tarjeta).toBeNull();
  });

  test('tarjeta desconocida o número inválido', async () => {
    expect((await request(app).get('/staff/tarjetas/DEADBEEF').set(auth())).status).toBe(404);
    expect((await request(app).get('/staff/tarjetas/zzz').set(auth())).status).toBe(400);
    expect((await request(app).post(`/staff/pacientes/${ana.id}/tarjeta`).set(auth()).send({ uid: '' })).status).toBe(400);
  });

  test('el servicio acepta configurar la cartilla y rechaza valores inválidos', async () => {
    let res = await request(app).patch(`/staff/servicios/${consulta.id}`).set(auth()).send({ sellos_requeridos: 5 });
    expect(res.status).toBe(200);
    expect(res.body.sellos_requeridos).toBe(5);
    res = await request(app).patch(`/staff/servicios/${consulta.id}`).set(auth()).send({ sellos_requeridos: '' });
    expect(res.body.sellos_requeridos).toBeNull();
    expect((await request(app).patch(`/staff/servicios/${consulta.id}`).set(auth()).send({ sellos_requeridos: 1 })).status).toBe(400);
  });
});
