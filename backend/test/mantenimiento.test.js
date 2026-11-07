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

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('Mantenimiento de muebles y equipos', () => {
  let token;
  let lugar;
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const mandar = (datos) => request(app).post('/staff/mantenimientos').set(auth()).send({ fechaSalida: '2026-10-01', ...datos });
  const recoger = (id, datos) => request(app).post(`/staff/mantenimientos/${id}/regreso`).set(auth()).send({ fechaRegreso: '2026-10-10', ...datos });
  const item = (datos) => db.InventarioItem.create({ lugar_id: lugar.id, tipo: 'equipamiento', estado: 'bueno', ...datos });

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const [rol] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Admin } });
    await db.Usuario.create({ nombre: 'Admin', email: 'admin@test.com', password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true });
    token = (await request(app).post('/staff/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;
    lugar = await db.InventarioLugar.create({ nombre: 'Consultorio 2' });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('salen 1 de 2 sillas; al volver con costo, sale de caja y vuelven al inventario', async () => {
    const sillas = await item({ nombre: 'Sillas estáticas guindo', cantidad: 2 });

    const salida = await mandar({ inventarioItemId: sillas.id, cantidad: 1, motivo: 'Pata floja', destino: 'Carpintería Rojas' });
    expect(salida.status).toBe(201);
    expect(salida.body).toEqual(expect.objectContaining({ cantidad: 1, fecha_salida: '2026-10-01', motivo: 'Pata floja', destino: 'Carpintería Rojas', fecha_regreso: null }));
    // Queda una en la clínica: sigue "bueno" y se puede mandar la otra.
    expect((await db.InventarioItem.findByPk(sillas.id)).estado).toBe('bueno');
    const equipos = await request(app).get('/staff/mantenimientos/equipos').set(auth());
    expect(equipos.body.find((e) => e.id === sillas.id).disponibles).toBe(1);
    expect((await mandar({ inventarioItemId: sillas.id, cantidad: 2 })).status).toBe(409);

    const inventario = await request(app).get('/staff/inventario/lugares').set(auth());
    expect(inventario.body[0].InventarioItems.find((i) => i.id === sillas.id).en_mantenimiento).toBe(1);

    const lista = await request(app).get('/staff/mantenimientos').set(auth());
    expect(lista.body.enCurso).toHaveLength(1);
    expect(lista.body.enCurso[0].InventarioItem.InventarioLugar.nombre).toBe('Consultorio 2');

    expect((await recoger(salida.body.id, { fechaRegreso: '2026-09-30' })).status).toBe(400);
    const regreso = await recoger(salida.body.id, { costo: '85.5', trabajoRealizado: 'Se cambió la pata' });
    expect(regreso.status).toBe(200);
    expect(regreso.body.fecha_regreso).toBe('2026-10-10');
    const caja = await db.MovimientoCaja.findByPk(regreso.body.movimiento_caja_id);
    expect(caja.tipo).toBe('egreso');
    expect(Number(caja.monto)).toBe(85.5);
    expect(caja.fecha).toBe('2026-10-10');
    expect(caja.concepto).toMatch(/Mantenimiento: Sillas estáticas guindo - Consultorio 2/);
    // En Caja se ve en qué se gastó.
    const listaCaja = await request(app).get('/staff/caja?fecha=2026-10-10').set(auth());
    expect(listaCaja.body.movimientos[0].origen).toBe('mantenimiento');
    const detalle = await request(app).get(`/staff/caja/${caja.id}/detalle`).set(auth());
    expect(detalle.body.mantenimiento).toEqual(expect.objectContaining({
      equipo: 'Sillas estáticas guindo', lugar: 'Consultorio 2', cantidad: 1, destino: 'Carpintería Rojas', motivo: 'Pata floja', trabajo_realizado: 'Se cambió la pata', fecha_salida: '2026-10-01', fecha_regreso: '2026-10-10',
    }));

    expect((await request(app).delete(`/staff/caja/${caja.id}`).set(auth())).status).toBe(400);

    // No se recoge dos veces (ni se paga dos veces).
    expect((await recoger(salida.body.id, { costo: 85.5 })).status).toBe(409);
    expect(await db.MovimientoCaja.count({ where: { tipo: 'egreso' } })).toBe(1);

    const despues = await request(app).get('/staff/mantenimientos').set(auth());
    expect(despues.body.enCurso).toHaveLength(0);
    expect(despues.body.historial[0].trabajo_realizado).toBe('Se cambió la pata');
  });

  test('si salen todas las unidades figura "En mantenimiento" y vuelve a "Bueno" al recoger sin costo', async () => {
    const camilla = await item({ nombre: 'Camilla armable', cantidad: null });
    const salida = await mandar({ inventarioItemId: camilla.id });
    expect(salida.status).toBe(201);
    expect((await db.InventarioItem.findByPk(camilla.id)).estado).toBe('mantenimiento');
    expect((await request(app).get('/staff/mantenimientos/equipos').set(auth())).body.some((e) => e.id === camilla.id)).toBe(false);
    expect((await request(app).delete(`/staff/inventario/items/${camilla.id}`).set(auth())).status).toBe(409);

    const cajaAntes = await db.MovimientoCaja.count();
    const regreso = await recoger(salida.body.id, {});
    expect(regreso.status).toBe(200);
    expect(regreso.body.movimiento_caja_id).toBeNull();
    expect(await db.MovimientoCaja.count()).toBe(cajaAntes);
    expect((await db.InventarioItem.findByPk(camilla.id)).estado).toBe('bueno');
  });

  test('los insumos y lo dado de baja no van a mantenimiento; las fechas se validan', async () => {
    const insumo = await item({ nombre: 'Alcohol en gel', tipo: 'insumos', cantidad: 3 });
    const baja = await item({ nombre: 'Silla rota', cantidad: 1, estado: 'baja' });
    const mesa = await item({ nombre: 'Mesa de vidrio', tipo: 'equipos', cantidad: 1 });
    expect((await mandar({ inventarioItemId: insumo.id })).status).toBe(400);
    expect((await mandar({ inventarioItemId: baja.id })).status).toBe(400);
    expect((await mandar({ inventarioItemId: 999999 })).status).toBe(404);
    expect((await mandar({ inventarioItemId: mesa.id, fechaSalida: '2999-01-01' })).status).toBe(400);
    expect((await mandar({ inventarioItemId: mesa.id, fechaSalida: 'ayer' })).status).toBe(400);
    expect((await mandar({ inventarioItemId: mesa.id, cantidad: 0 })).status).toBe(400);
    expect((await mandar({ inventarioItemId: mesa.id, fechaSalida: hoyISO() })).status).toBe(201);

    const equipos = (await request(app).get('/staff/mantenimientos/equipos').set(auth())).body.map((e) => e.nombre);
    expect(equipos).not.toContain('Alcohol en gel');
    expect(equipos).not.toContain('Silla rota');
  });

  test('un envío anotado por error se borra mientras sigue afuera', async () => {
    const compu = await item({ nombre: 'Computadora', tipo: 'equipos', cantidad: 1 });
    const salida = await mandar({ inventarioItemId: compu.id });
    expect((await db.InventarioItem.findByPk(compu.id)).estado).toBe('mantenimiento');
    expect((await request(app).delete(`/staff/mantenimientos/${salida.body.id}`).set(auth())).status).toBe(204);
    expect((await db.InventarioItem.findByPk(compu.id)).estado).toBe('bueno');

    const otra = await mandar({ inventarioItemId: compu.id });
    await recoger(otra.body.id, { costo: 50 });
    expect((await request(app).delete(`/staff/mantenimientos/${otra.body.id}`).set(auth())).status).toBe(409);
  });
});
