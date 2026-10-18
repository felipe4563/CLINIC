jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const ExcelJS = require('exceljs');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');
const { tiempoDeUso } = require('../src/routes/staffInventarioLugares');
const LUGARES_DOCTORA = require('../src/data/inventarioDoctora.json');

function binario(res, cb) {
  const partes = [];
  res.on('data', (c) => partes.push(c));
  res.on('end', () => cb(null, Buffer.concat(partes)));
}

describe('Inventario por lugar', () => {
  let token;
  let tokenSinPermiso;
  const auth = (t = token) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    for (const [nombre, email] of [['Admin', 'admin@test.com'], ['Profesional', 'profesional@test.com']]) {
      const [rol] = await db.Rol.findOrCreate({ where: { nombre }, defaults: { permisos: PERMISOS_POR_DEFECTO[nombre] || [] } });
      await db.Usuario.create({ nombre, email, password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true });
    }
    token = (await request(app).post('/staff/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;
    tokenSinPermiso = (await request(app).post('/staff/login').send({ email: 'profesional@test.com', password: 'secret123' })).body.token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('las planillas de la doctora: 6 lugares, 224 cosas con tipo válido y nombre', () => {
    expect(LUGARES_DOCTORA.map((l) => l.nombre)).toEqual(['Consultorio 1', 'Consultorio 2', 'Baño consultorio 2', 'Recepción', 'Sala', 'Baño pacientes']);
    const items = LUGARES_DOCTORA.flatMap((l) => l.items);
    expect(items).toHaveLength(224);
    for (const i of items) {
      expect(db.InventarioItem.TIPOS).toContain(i.tipo);
      expect(i.nombre.trim()).toBe(i.nombre);
      expect(i.nombre.length).toBeGreaterThan(0);
      expect(i.nombre).not.toMatch(/[‎‏]/);
      expect(i.cantidad === null || Number.isInteger(i.cantidad)).toBe(true);
    }
    const sala = LUGARES_DOCTORA.find((l) => l.nombre === 'Sala').items;
    expect(sala.find((i) => i.nombre === 'Botellas de agua')).toEqual({ tipo: 'insumos', nombre: 'Botellas de agua', cantidad: 36 });
  });

  test('crea un lugar, agrega, edita, ordena y borra cosas; no borra un lugar con cosas', async () => {
    const lugar = await request(app).post('/staff/inventario/lugares').set(auth()).send({ nombre: ' Consultorio 2 ' });
    expect(lugar.status).toBe(201);
    expect(lugar.body.nombre).toBe('Consultorio 2');
    expect((await request(app).post('/staff/inventario/lugares').set(auth()).send({ nombre: 'Consultorio 2' })).status).toBe(409);

    const camilla = await request(app).post('/staff/inventario/items').set(auth()).send({ lugar_id: lugar.body.id, tipo: 'equipamiento', nombre: 'Camilla armable', cantidad: 1 });
    expect(camilla.status).toBe(201);
    expect(camilla.body.estado).toBe('bueno');
    const jabon = await request(app).post('/staff/inventario/items').set(auth()).send({ lugar_id: lugar.body.id, tipo: 'insumos', nombre: 'Jabón líquido', cantidad: null });
    expect(jabon.body.cantidad).toBeNull();
    expect(jabon.body.orden).toBeGreaterThan(camilla.body.orden);

    const editado = await request(app).patch(`/staff/inventario/items/${camilla.body.id}`).set(auth())
      .send({ estado: 'mantenimiento', fecha_ingreso: '2025-01-15', observacion: 'Funda rota', cantidad: '2' });
    expect(editado.status).toBe(200);
    expect(editado.body).toEqual(expect.objectContaining({ estado: 'mantenimiento', fecha_ingreso: '2025-01-15', observacion: 'Funda rota', cantidad: 2 }));

    const lista = await request(app).get('/staff/inventario/lugares').set(auth());
    expect(lista.body.find((l) => l.id === lugar.body.id).InventarioItems.map((i) => i.nombre)).toEqual(['Camilla armable', 'Jabón líquido']);

    expect((await request(app).delete(`/staff/inventario/lugares/${lugar.body.id}`).set(auth())).status).toBe(409);
    expect((await request(app).delete(`/staff/inventario/items/${camilla.body.id}`).set(auth())).status).toBe(204);
    expect((await request(app).delete(`/staff/inventario/items/${jabon.body.id}`).set(auth())).status).toBe(204);
    expect((await request(app).delete(`/staff/inventario/lugares/${lugar.body.id}`).set(auth())).status).toBe(204);
  });

  test('rechaza datos inválidos y a quien no tiene permiso de inventario', async () => {
    const lugar = (await request(app).post('/staff/inventario/lugares').set(auth()).send({ nombre: 'Sala' })).body;
    const malos = [
      { lugar_id: lugar.id, tipo: 'otro', nombre: 'X' },
      { lugar_id: lugar.id, tipo: 'insumos', nombre: '   ' },
      { lugar_id: lugar.id, tipo: 'insumos', nombre: 'X', cantidad: -1 },
      { lugar_id: lugar.id, tipo: 'insumos', nombre: 'X', cantidad: 1.5 },
      { lugar_id: lugar.id, tipo: 'insumos', nombre: 'X', fecha_ingreso: '15/01/2025' },
      { lugar_id: lugar.id, tipo: 'insumos', nombre: 'X', estado: 'roto' },
      { lugar_id: 99999, tipo: 'insumos', nombre: 'X' },
    ];
    for (const m of malos) expect((await request(app).post('/staff/inventario/items').set(auth()).send(m)).status).toBe(400);
    expect((await request(app).post('/staff/inventario/lugares').set(auth()).send({ nombre: '' })).status).toBe(400);
    expect((await request(app).get('/staff/inventario/lugares').set(auth(tokenSinPermiso))).status).toBe(403);
  });

  test('Excel: una hoja por lugar con los tipos como títulos y el tiempo de uso', async () => {
    const consultorio = (await request(app).post('/staff/inventario/lugares').set(auth()).send({ nombre: 'Baño: pacientes/visitas' })).body;
    await request(app).post('/staff/inventario/items').set(auth()).send({ lugar_id: consultorio.id, tipo: 'equipamiento', nombre: 'Basurero blanco con pedal', cantidad: 1, fecha_ingreso: '2024-01-01' });
    await request(app).post('/staff/inventario/items').set(auth()).send({ lugar_id: consultorio.id, tipo: 'insumos', nombre: 'Rollo de papel higiénico', cantidad: 1 });

    const res = await request(app).get(`/staff/inventario/excel?lugar_id=${consultorio.id}`).set(auth()).buffer(true).parse(binario);
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toBe('attachment; filename="inventario-bano-pacientes-visitas.xlsx"');
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(res.body);
    expect(libro.worksheets.map((h) => h.name)).toEqual(['Baño  pacientes visitas']);
    const filas = [];
    libro.worksheets[0].eachRow((r) => filas.push(r.values.slice(1)));
    expect(filas[0]).toEqual(['INVENTARIO BAÑO: PACIENTES/VISITAS']);
    expect(filas[1]).toEqual(['Cantidad', 'Nombre', 'Estado', 'Fecha de ingreso', 'Tiempo de uso', 'Observación']);
    expect(filas[2]).toEqual(['EQUIPAMIENTO']);
    expect(filas[3].slice(0, 4)).toEqual([1, 'Basurero blanco con pedal', 'Bueno', '01/01/2024']);
    expect(filas[3][4]).toMatch(/años?/);
    expect(filas[4]).toEqual(['INSUMOS']);

    const todo = await request(app).get('/staff/inventario/excel').set(auth()).buffer(true).parse(binario);
    expect(todo.status).toBe(200);
    expect(todo.headers['content-disposition']).toBe('attachment; filename="inventario.xlsx"');
  });

  test('tiempo de uso legible', () => {
    const hoy = new Date(2026, 9, 18);
    expect(tiempoDeUso(null, hoy)).toBe('');
    expect(tiempoDeUso('2026-10-01', hoy)).toBe('Menos de 1 mes');
    expect(tiempoDeUso('2026-09-18', hoy)).toBe('1 mes');
    expect(tiempoDeUso('2025-07-19', hoy)).toBe('1 año 2 meses');
    expect(tiempoDeUso('2024-10-18', hoy)).toBe('2 años');
  });

  test('el panel de inicio cuenta el inventario por estado', async () => {
    const lugar = (await request(app).post('/staff/inventario/lugares').set(auth()).send({ nombre: 'Recepción' })).body;
    await db.InventarioItem.bulkCreate([
      { lugar_id: lugar.id, tipo: 'equipos', nombre: 'A', estado: 'bueno' },
      { lugar_id: lugar.id, tipo: 'equipos', nombre: 'B', estado: 'mantenimiento' },
      { lugar_id: lugar.id, tipo: 'equipos', nombre: 'C', estado: 'baja' },
    ]);
    const res = await request(app).get('/staff/dashboard').set(auth());
    expect(res.status).toBe(200);
    const buenos = await db.InventarioItem.count({ where: { estado: 'bueno' } });
    expect(res.body.activos).toEqual({ operativos: buenos, mantenimiento: 1 });
  });
});
