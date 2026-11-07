jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
  whatsappConfigurado: () => true,
  normalizarTelefono: (t) => t,
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');

function dia(desplazamiento) {
  const d = new Date();
  d.setDate(d.getDate() + desplazamiento);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('Tratamientos: pacientes con su último tratamiento', () => {
  let token;
  let ana;
  let luis;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const [rol] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Admin } });
    await db.Usuario.create({ nombre: 'Admin', email: 'admin@test.com', password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true });
    token = (await request(app).post('/staff/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;

    const paciente = (nombre, telefono, codigo) =>
      db.Paciente.create({ nombre_completo: nombre, telefono, codigo_paciente: codigo, carnet_identidad: telefono, carnet_expedido: 'CB' });
    ana = await paciente('Ana Pérez', '70000001', 'NOVA-AAAAA');
    luis = await paciente('Luis Rojas', '70000002', 'NOVA-BBBBB');
    await paciente('Carla Vidal', '70000003', 'NOVA-CCCCC');

    const prof = await db.Profesional.create({ nombre: 'Dra. Prueba', activo: true });
    const toxina = await db.Servicio.create({ nombre: 'Toxina botulínica', duracion_min: 30, precio: 100, activo: true });
    const prp = await db.Servicio.create({ nombre: 'PRP facial', duracion_min: 30, precio: 100, activo: true });
    const cita = (paciente, servicio, fecha, estado, hora = '10:00:00') =>
      db.Cita.create({ paciente_id: paciente.id, profesional_id: prof.id, servicio_id: servicio.id, fecha, hora_inicio: hora, hora_fin: '10:30:00', estado });

    await cita(ana, prp, dia(-30), 'completada');
    await cita(ana, toxina, dia(-3), 'completada');
    await cita(ana, prp, dia(-1), 'cancelada');
    await cita(ana, prp, dia(5), 'confirmada');
    await cita(luis, toxina, dia(-60), 'no_asistio');
    await db.NotaClinica.create({ paciente_id: ana.id, fecha: dia(-3), titulo: 'Control', notas: 'Bien' });
    await db.HistoriaClinica.create({ paciente_id: ana.id, fecha: dia(-3) });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('sin buscar muestra a todos, con lo último que se hicieron y lo más reciente arriba', async () => {
    const res = await request(app).get('/staff/tratamientos/pacientes').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    const primera = res.body.pacientes.find((p) => p.id === ana.id);
    expect(primera.ultimo_tratamiento).toEqual(expect.objectContaining({ servicio: 'Toxina botulínica', fecha: dia(-3), profesional: 'Dra. Prueba' }));
    expect(primera.proxima_cita).toEqual(expect.objectContaining({ servicio: 'PRP facial', fecha: dia(5) }));
    expect(primera).toEqual(expect.objectContaining({ notas: 1, tiene_historia: true }));

    // Luis no asistió: no cuenta como tratamiento.
    const luisRes = res.body.pacientes.find((p) => p.id === luis.id);
    expect(luisRes.ultimo_tratamiento).toBeNull();
    expect(luisRes.tiene_historia).toBe(false);
  });

  test('el buscador filtra por nombre, código o teléfono, y pagina', async () => {
    expect((await request(app).get('/staff/tratamientos/pacientes?q=rojas').set(auth())).body.pacientes.map((p) => p.id)).toEqual([luis.id]);
    expect((await request(app).get('/staff/tratamientos/pacientes?q=NOVA-AAAAA').set(auth())).body.pacientes.map((p) => p.id)).toEqual([ana.id]);
    expect((await request(app).get('/staff/tratamientos/pacientes?q=70000002').set(auth())).body.total).toBe(1);
    expect((await request(app).get('/staff/tratamientos/pacientes?q=nadie').set(auth())).body).toEqual({ pacientes: [], total: 0, pagina: 1, totalPaginas: 1 });

    const pagina2 = await request(app).get('/staff/tratamientos/pacientes?porPagina=2&pagina=2').set(auth());
    expect(pagina2.body).toEqual(expect.objectContaining({ total: 3, pagina: 2, totalPaginas: 2 }));
    expect(pagina2.body.pacientes).toHaveLength(1);
  });
});
