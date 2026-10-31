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
    expect((await crear({ acapite: 'insumos', nombre: 'Lavandina' })).body.stock).toBe(0);

    for (const malo of [{ acapite: 'otro', nombre: 'X' }, { acapite: 'ventas', nombre: '  ' }, { acapite: 'ventas', nombre: 'X', stock: -1 }, { acapite: 'ventas', nombre: 'X', precio_venta: -5 }]) {
      expect((await crear(malo)).status).toBe(400);
    }
    const lista = await request(app).get('/staff/ventas/productos').set(auth());
    expect(lista.body.map((p) => p.acapite).sort()).toEqual(['activos', 'insumos', 'ventas']);
  });

  test('llegaron (suma y queda como ingreso) y se usaron (resta, sin pasar de cero)', async () => {
    const p = (await crear({ acapite: 'insumos', nombre: 'Alcohol en gel', stock: 1 })).body;
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

  test('descuento en % sobre toda la venta: la caja recibe el total con descuento', async () => {
    const a = (await crear({ acapite: 'ventas', nombre: 'Mandelac crema', stock: 5, precio_venta: 100 })).body;
    const b = (await crear({ acapite: 'ventas', nombre: 'Acglicolic gel', stock: 5, precio_venta: 50 })).body;
    const vender = (datos) =>
      request(app).post('/staff/ventas').set(auth()).send({ items: [{ productoId: a.id, cantidad: 1 }, { productoId: b.id, cantidad: 2 }], metodoPago: 'efectivo', ...datos });

    for (const malo of [-1, 101, 'diez']) {
      expect((await vender({ descuentoPorcentaje: malo })).status).toBe(400);
    }
    expect((await vender({ descuentoPorcentaje: 100, metodoPago: 'qr' })).status).toBe(400);

    const res = await vender({ descuentoPorcentaje: 15 });
    expect(res.status).toBe(201);
    const venta = res.body.venta;
    expect(Number(venta.subtotal)).toBe(200);
    expect(Number(venta.descuento_porcentaje)).toBe(15);
    expect(Number(venta.total)).toBe(170);
    const caja = await db.MovimientoCaja.findOne({ where: { venta_id: venta.id } });
    expect(Number(caja.monto)).toBe(170);
    // En Caja, el movimiento muestra qué se vendió.
    const detalleCaja = await request(app).get(`/staff/caja/${caja.id}/detalle`).set(auth());
    expect(detalleCaja.body.origen).toBe('venta');
    expect(detalleCaja.body.venta).toEqual(expect.objectContaining({ cliente: 'Cliente mostrador', metodo_pago: 'efectivo' }));
    expect(detalleCaja.body.venta.items.map((i) => i.nombre).sort()).toEqual(['Acglicolic gel', 'Mandelac crema']);
    // Lo que viene de una venta no se borra desde Caja.
    const borrar = await request(app).delete(`/staff/caja/${caja.id}`).set(auth());
    expect(borrar.status).toBe(400);
    expect(borrar.body.error).toMatch(/una venta/);
    expect(await db.MovimientoCaja.findByPk(caja.id)).not.toBeNull();
    // El precio de cada producto queda tal cual: el descuento es de la venta.
    expect(venta.VentaItems.map((i) => Number(i.precio_unitario)).sort()).toEqual([100, 50]);

    // El comprobante trae la venta, quién la cobró y los datos de la clínica.
    await db.ConfiguracionClinica.obtenerConfig();
    await db.ConfiguracionClinica.update({ nombre_consultorio: 'Clinic NovagED', telefono: '65359810', pie_pdf: 'Gracias' }, { where: { id: 1 } });
    const comp = await request(app).get(`/staff/ventas/${venta.id}/comprobante`).set(auth());
    expect(comp.status).toBe(200);
    expect(Number(comp.body.venta.total)).toBe(170);
    expect(comp.body.venta.Usuario.nombre).toBe('Admin');
    expect(comp.body.venta.VentaItems).toHaveLength(2);
    expect(comp.body.clinica).toEqual(expect.objectContaining({ nombre_consultorio: 'Clinic NovagED', telefono: '65359810', pie: 'Gracias' }));
    expect(comp.body.venta.Usuario.password_hash).toBeUndefined();
  });

  test('el comprobante solo sale de una venta pagada', async () => {
    const p = (await crear({ acapite: 'ventas', nombre: 'Daeses gel', stock: 2, precio_venta: 80 })).body;
    const pendiente = (await request(app).post('/staff/ventas').set(auth()).send({ items: [{ productoId: p.id, cantidad: 1 }], metodoPago: 'qr' })).body.venta;
    expect((await request(app).get(`/staff/ventas/${pendiente.id}/comprobante`).set(auth())).status).toBe(409);
    expect((await request(app).get('/staff/ventas/999999/comprobante').set(auth())).status).toBe(404);
  });

  describe('cobro con QR según la configuración', () => {
    const { generarQR } = require('../src/services/bancoEconomico');
    const venderQR = (productoId, cantidad = 1) =>
      request(app).post('/staff/ventas').set(auth()).send({ items: [{ productoId, cantidad }], metodoPago: 'qr' });
    const configurar = (datos) => db.ConfiguracionClinica.update(datos, { where: { id: 1 } });

    beforeAll(async () => {
      await db.ConfiguracionClinica.obtenerConfig();
    });
    afterEach(async () => {
      await configurar({ metodo_pago_online: 'qr_banco', qr_fijo_url: null, qr_fijo_datos: null });
    });

    test('si el banco falla, la venta no queda colgada y el stock vuelve', async () => {
      const p = (await crear({ acapite: 'ventas', nombre: 'Azelac RU', stock: 3, precio_venta: 150 })).body;
      generarQR.mockRejectedValueOnce(new Error('banco caído'));
      const res = await venderQR(p.id, 2);
      expect(res.status).toBe(502);
      expect(res.body.error).toMatch(/efectivo/);
      expect((await db.Producto.findByPk(p.id)).stock).toBe(3);
      expect(await db.VentaItem.count({ where: { producto_id: p.id } })).toBe(0);
    });

    test('con QR fijo muestra el QR de la clínica y el personal confirma el pago una sola vez', async () => {
      await configurar({ metodo_pago_online: 'qr_fijo', qr_fijo_url: '/uploads/qr/clinica.png', qr_fijo_datos: 'Banco Económico · Cta 123' });
      const p = (await crear({ acapite: 'ventas', nombre: 'Atpeptide', stock: 4, precio_venta: 120 })).body;
      generarQR.mockClear();
      const res = await venderQR(p.id, 2);
      expect(res.status).toBe(201);
      expect(generarQR).not.toHaveBeenCalled();
      expect(res.body).toEqual(expect.objectContaining({ modo: 'fijo', qrFijo: { url: '/uploads/qr/clinica.png', datos: 'Banco Económico · Cta 123' } }));
      const id = res.body.venta.id;
      expect((await request(app).get(`/staff/ventas/${id}/estado`).set(auth())).body.pagado).toBe(false);

      const [a, b] = await Promise.all([
        request(app).post(`/staff/ventas/${id}/confirmar-qr`).set(auth()),
        request(app).post(`/staff/ventas/${id}/confirmar-qr`).set(auth()),
      ]);
      expect(a.status).toBe(200);
      expect(b.status).toBe(200);
      expect((await db.Venta.findByPk(id)).estado).toBe('pagado');
      const movimientos = await db.MovimientoCaja.findAll({ where: { venta_id: id } });
      expect(movimientos).toHaveLength(1);
      expect(Number(movimientos[0].monto)).toBe(240);
    });

    test('una venta con QR del banco no se confirma a mano', async () => {
      const p = (await crear({ acapite: 'ventas', nombre: 'Sesretinal', stock: 2, precio_venta: 300 })).body;
      const venta = (await venderQR(p.id)).body.venta;
      const res = await request(app).post(`/staff/ventas/${venta.id}/confirmar-qr`).set(auth());
      expect(res.status).toBe(400);
      expect((await db.Venta.findByPk(venta.id)).estado).toBe('pendiente');
    });

    test('sin pago online: usa el QR fijo si hay uno subido; si no, pide cobrar en efectivo', async () => {
      const p = (await crear({ acapite: 'ventas', nombre: 'Hidraderm TRX', stock: 5, precio_venta: 90 })).body;
      await configurar({ metodo_pago_online: 'ninguno' });
      const sinQR = await venderQR(p.id);
      expect(sinQR.status).toBe(400);
      expect(sinQR.body.error).toMatch(/efectivo/);
      expect((await db.Producto.findByPk(p.id)).stock).toBe(5);

      await configurar({ qr_fijo_url: '/uploads/qr/clinica.png' });
      const conQR = await venderQR(p.id);
      expect(conQR.status).toBe(201);
      expect(conQR.body.modo).toBe('fijo');
    });
  });

  test('borrar: sin historial se borra; con ventas o ingresos solo se desactiva', async () => {
    const libre = (await crear({ acapite: 'insumos', nombre: 'Bolsas' })).body;
    expect((await request(app).delete(`/staff/ventas/productos/${libre.id}`).set(auth())).status).toBe(204);
    expect(await db.Producto.findByPk(libre.id)).toBeNull();

    const usado = (await crear({ acapite: 'insumos', nombre: 'Papel' })).body;
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
