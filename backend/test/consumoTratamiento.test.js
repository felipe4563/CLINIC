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

describe('Inventario en 3 cajas y lo que descuenta cada tratamiento', () => {
  let token;
  let servicio;
  let paciente;
  let profesional;
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const crearProducto = (datos) => request(app).post('/staff/ventas/productos').set(auth()).send(datos);
  const estado = (cita, nuevo) => request(app).patch(`/staff/citas/${cita.id}/estado`).set(auth()).send({ estado: nuevo });
  const nuevaCita = (hora) =>
    db.Cita.create({ paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id, fecha: '2026-10-20', hora_inicio: hora, hora_fin: '23:59:00', estado: 'confirmada' });

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const [rol] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Admin } });
    await db.Usuario.create({ nombre: 'Admin', email: 'admin@test.com', password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true });
    token = (await request(app).post('/staff/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;
    paciente = await db.Paciente.create({ nombre_completo: 'Ana Pérez', telefono: '70000001', codigo_paciente: 'NOVA-AAAAA', carnet_identidad: '1', carnet_expedido: 'CB' });
    profesional = await db.Profesional.create({ nombre: 'Dra. Prueba', activo: true });
    servicio = await db.Servicio.create({ nombre: 'Toxina botulínica', duracion_min: 30, precio: 1800, activo: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('las cajas son insumos, activos y ventas; el acápite viejo ya no existe', async () => {
    expect((await crearProducto({ acapite: 'insumos', nombre: 'Jeringa 1 ml', stock: 10, stock_minimo: 5 })).body).toEqual(expect.objectContaining({ acapite: 'insumos', stock: 10, stock_minimo: 5 }));
    expect((await crearProducto({ acapite: 'mantenimiento', nombre: 'Lavandina' })).status).toBe(400);
    expect((await crearProducto({ acapite: 'insumos', nombre: 'X', stock_minimo: -1 })).status).toBe(400);
  });

  test('al completar la cita se descuenta lo que usa el tratamiento; al deshacerla vuelve', async () => {
    const toxina = (await crearProducto({ acapite: 'activos', nombre: 'Toxina 100 U', stock: 3 })).body;
    const jeringa = (await crearProducto({ acapite: 'insumos', nombre: 'Jeringa insulina', stock: 10 })).body;

    expect((await request(app).post(`/staff/servicios/${servicio.id}/productos`).set(auth()).send({ productoId: toxina.id })).status).toBe(201);
    expect((await request(app).post(`/staff/servicios/${servicio.id}/productos`).set(auth()).send({ productoId: jeringa.id, cantidad: 0 })).status).toBe(400);
    await request(app).post(`/staff/servicios/${servicio.id}/productos`).set(auth()).send({ productoId: jeringa.id, cantidad: 2 });
    expect((await request(app).patch(`/staff/servicios/${servicio.id}/productos/${jeringa.id}`).set(auth()).send({ cantidad: 3 })).body.cantidad).toBe(3);
    const lista = await request(app).get('/staff/servicios').set(auth());
    const usos = lista.body.find((s) => s.id === servicio.id).Productos;
    expect(usos.find((p) => p.id === jeringa.id).ServicioProducto.cantidad).toBe(3);

    const cita = await nuevaCita('10:00:00');
    expect((await estado(cita, 'completada')).status).toBe(200);
    expect((await db.Producto.findByPk(toxina.id)).stock).toBe(2);
    expect((await db.Producto.findByPk(jeringa.id)).stock).toBe(7);

    // Volver a marcarla completada no descuenta otra vez (no cambia de estado).
    await estado(cita, 'completada');
    expect((await db.Producto.findByPk(jeringa.id)).stock).toBe(7);

    await estado(cita, 'confirmada');
    expect((await db.Producto.findByPk(toxina.id)).stock).toBe(3);
    expect((await db.Producto.findByPk(jeringa.id)).stock).toBe(10);

    await estado(cita, 'completada');
    expect((await db.Producto.findByPk(jeringa.id)).stock).toBe(7);

    const historial = await request(app).get(`/staff/ventas/productos/${jeringa.id}/historial`).set(auth());
    expect(historial.status).toBe(200);
    expect(historial.body.movimientos.map((m) => [m.tipo, m.cantidad])).toEqual(expect.arrayContaining([['cita', -3], ['cita_revertida', 3]]));
    expect(historial.body.movimientos.find((m) => m.tipo === 'cita').detalle).toMatch(/Toxina botulínica · Ana Pérez/);
  });

  test('si no alcanza, la cita se completa igual: queda en 0 y se anota lo que faltó', async () => {
    const guantes = (await crearProducto({ acapite: 'insumos', nombre: 'Guantes', stock: 1 })).body;
    await request(app).post(`/staff/servicios/${servicio.id}/productos`).set(auth()).send({ productoId: guantes.id, cantidad: 2 });
    const cita = await nuevaCita('12:00:00');
    const res = await estado(cita, 'completada');
    expect(res.status).toBe(200);
    expect(res.body.faltantes).toEqual(expect.arrayContaining([{ producto: 'Guantes', falta: 1 }]));
    expect((await db.Producto.findByPk(guantes.id)).stock).toBe(0);

    // Al deshacer vuelve solo lo que de verdad se descontó.
    await estado(cita, 'confirmada');
    expect((await db.Producto.findByPk(guantes.id)).stock).toBe(1);
  });

  test('el historial junta llegadas, usos a mano y ventas', async () => {
    const crema = (await crearProducto({ acapite: 'ventas', nombre: 'Crema', stock: 0, precio_venta: 100 })).body;
    await request(app).post(`/staff/ventas/productos/${crema.id}/movimiento`).set(auth()).send({ tipo: 'ingreso', cantidad: 5 });
    await request(app).post(`/staff/ventas/productos/${crema.id}/movimiento`).set(auth()).send({ tipo: 'uso', cantidad: 1 });
    await request(app).post('/staff/ventas').set(auth()).send({ items: [{ productoId: crema.id, cantidad: 2 }], metodoPago: 'efectivo' });
    const res = await request(app).get(`/staff/ventas/productos/${crema.id}/historial`).set(auth());
    expect(res.body.movimientos.map((m) => [m.tipo, m.cantidad]).sort()).toEqual([['ingreso', 5], ['uso', -1], ['venta', -2]]);
    expect(res.body.producto.stock).toBe(2);

    // Con historial ya no se borra: se desactiva.
    expect((await request(app).delete(`/staff/ventas/productos/${crema.id}`).set(auth())).body).toEqual({ desactivado: true });
  });
});
