jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/services/bancoEconomico', () => ({
  generarQR: jest.fn().mockResolvedValue({ qrId: 'QR-1', qrImageBase64: 'aW1n' }),
  consultarEstadoQR: jest.fn().mockResolvedValue({ pagado: true }),
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');

describe('Ventas por acápites', () => {
  let token;
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const crear = (datos) => request(app).post('/staff/ventas/productos').set(auth()).send(datos);

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const [rol] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Admin } });
    await db.Usuario.create({ nombre: 'Admin', email: 'admin@test.com', password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true });
    token = (await request(app).post('/staff/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('crea productos en cada acápite: solo nombre y cuántos hay (precio solo en ventas)', async () => {
    const venta = await crear({ acapite: 'ventas', nombre: ' Retisil crema 50 ml ', stock: 10, precio_venta: 180, codigo: '40007943' });
    expect(venta.status).toBe(201);
    expect(venta.body).toEqual(expect.objectContaining({ nombre: 'Retisil crema 50 ml', acapite: 'ventas', stock: 10, codigo: '40007943' }));
    const activo = await crear({ acapite: 'activos', nombre: 'Ác. glicólico 30 ml', stock: 2 });
    expect(Number(activo.body.precio_venta)).toBe(0);
    expect((await crear({ acapite: 'mantenimiento', nombre: 'Lavandina' })).body.stock).toBe(0);

    for (const malo of [{ acapite: 'otro', nombre: 'X' }, { acapite: 'ventas', nombre: '  ' }, { acapite: 'ventas', nombre: 'X', stock: -1 }, { acapite: 'ventas', nombre: 'X', precio_venta: -5 }]) {
      expect((await crear(malo)).status).toBe(400);
    }
    const lista = await request(app).get('/staff/ventas/productos').set(auth());
    expect(lista.body.map((p) => p.acapite).sort()).toEqual(['activos', 'mantenimiento', 'ventas']);
  });

  test('llegaron (suma y queda como ingreso) y se usaron (resta, sin pasar de cero)', async () => {
    const p = (await crear({ acapite: 'mantenimiento', nombre: 'Alcohol en gel', stock: 1 })).body;
    const mov = (datos) => request(app).post(`/staff/ventas/productos/${p.id}/movimiento`).set(auth()).send(datos);

    const ingreso = await mov({ tipo: 'ingreso', cantidad: 5 });
    expect(ingreso.status).toBe(200);
    expect(ingreso.body.stock).toBe(6);
    const item = await db.CompraItem.findOne({ where: { producto_id: p.id }, include: [db.Compra] });
    expect(item.cantidad).toBe(5);
    expect(Number(item.Compra.total)).toBe(0);

    expect((await mov({ tipo: 'uso', cantidad: 4 })).body.stock).toBe(2);
    expect((await mov({ tipo: 'uso', cantidad: 3 })).status).toBe(409);
    expect((await mov({ tipo: 'uso', cantidad: 0 })).status).toBe(400);
    expect((await mov({ tipo: 'regalo', cantidad: 1 })).status).toBe(400);
    expect((await db.Producto.findByPk(p.id)).stock).toBe(2);
  });

  test('solo se vende lo del acápite Ventas y con precio', async () => {
    const activo = (await crear({ acapite: 'activos', nombre: 'Sérum B5', stock: 3, precio_venta: 50 })).body;
    const sinPrecio = (await crear({ acapite: 'ventas', nombre: 'Hidraven 300 ml', stock: 10 })).body;
    const vender = (productoId) => request(app).post('/staff/ventas').set(auth()).send({ items: [{ productoId, cantidad: 1 }], metodoPago: 'efectivo' });
    const r1 = await vender(activo.id);
    expect(r1.status).toBe(400);
    expect(r1.body.error).toMatch(/no está a la venta/);
    const r2 = await vender(sinPrecio.id);
    expect(r2.status).toBe(400);
    expect(r2.body.error).toMatch(/no tiene precio/);
  });

  test('el pago con QR entra a la caja una sola vez aunque se consulte varias veces', async () => {
    const p = (await crear({ acapite: 'ventas', nombre: 'Repaskin SPF50', stock: 5, precio_venta: 200 })).body;
    const venta = await request(app).post('/staff/ventas').set(auth()).send({ items: [{ productoId: p.id, cantidad: 2 }], metodoPago: 'qr' });
    expect(venta.status).toBe(201);
    expect(venta.body.venta.estado).toBe('pendiente');
    expect(await db.MovimientoCaja.count({ where: { venta_id: venta.body.venta.id } })).toBe(0);

    const [a, b] = await Promise.all([
      request(app).get(`/staff/ventas/${venta.body.venta.id}/estado`).set(auth()),
      request(app).get(`/staff/ventas/${venta.body.venta.id}/estado`).set(auth()),
    ]);
    expect(a.body.pagado && b.body.pagado).toBe(true);
    const movimientos = await db.MovimientoCaja.findAll({ where: { venta_id: venta.body.venta.id } });
    expect(movimientos).toHaveLength(1);
    expect(Number(movimientos[0].monto)).toBe(400);
  });

  test('borrar: sin historial se borra; con ventas o ingresos solo se desactiva', async () => {
    const libre = (await crear({ acapite: 'mantenimiento', nombre: 'Bolsas' })).body;
    expect((await request(app).delete(`/staff/ventas/productos/${libre.id}`).set(auth())).status).toBe(204);
    expect(await db.Producto.findByPk(libre.id)).toBeNull();

    const usado = (await crear({ acapite: 'mantenimiento', nombre: 'Papel' })).body;
    await request(app).post(`/staff/ventas/productos/${usado.id}/movimiento`).set(auth()).send({ tipo: 'ingreso', cantidad: 2 });
    const res = await request(app).delete(`/staff/ventas/productos/${usado.id}`).set(auth());
    expect(res.body).toEqual({ desactivado: true });
    expect((await db.Producto.findByPk(usado.id)).activo).toBe(false);
  });

  test('una compra con proveedor suma a cuántos hay del acápite y sale de caja', async () => {
    const proveedor = await request(app).post('/staff/proveedores').set(auth()).send({ nombre: 'Distribuidora Sesderma' });
    expect(proveedor.status).toBe(201);
    const activo = (await crear({ acapite: 'activos', nombre: 'Ác. salicílico 30 ml', stock: 1 })).body;
    const compra = await request(app).post('/staff/compras').set(auth()).send({
      proveedorId: proveedor.body.id, items: [{ productoId: activo.id, cantidad: 4, costoUnitario: 35, lote: 'L1', fechaVencimiento: '2027-06-30' }],
    });
    expect(compra.status).toBe(201);
    expect(Number(compra.body.compra.total)).toBe(140);
    const actualizado = await db.Producto.findByPk(activo.id);
    expect(actualizado.stock).toBe(5);
    expect(actualizado.acapite).toBe('activos');
    const egreso = await db.MovimientoCaja.findOne({ where: { compra_id: compra.body.compra.id } });
    expect(egreso.tipo).toBe('egreso');
    expect(Number(egreso.monto)).toBe(140);
  });

  test('editar nombre, precio y código; el acápite no se pierde', async () => {
    const p = (await crear({ acapite: 'ventas', nombre: 'C-Vit', stock: 1 })).body;
    const res = await request(app).patch(`/staff/ventas/productos/${p.id}`).set(auth()).send({ nombre: 'C-Vit liposomal sérum 30 ml', precio_venta: '250.5', codigo: '40002447' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ nombre: 'C-Vit liposomal sérum 30 ml', acapite: 'ventas', codigo: '40002447', stock: 1 }));
    expect(Number(res.body.precio_venta)).toBe(250.5);
  });
});
