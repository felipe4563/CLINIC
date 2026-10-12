jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');

describe('Inventario: listado de productos', () => {
  let token;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const [rol] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Admin } });
    await db.Usuario.create({
      nombre: 'Admin',
      email: 'admin@test.com',
      password_hash: await bcrypt.hash('secret123', 10),
      rol_id: rol.id,
      activo: true,
    });

    const botox = await db.Servicio.create({ nombre: 'Toxina botulínica (Botox)', duracion_min: 45, precio: 1800 });
    const fillers = await db.Servicio.create({ nombre: 'Ácido hialurónico (Fillers)', duracion_min: 60, precio: 2200 });
    const guantes = await db.Producto.create({ nombre: 'Guantes de nitrilo', precio_venta: 95 });
    await db.Producto.create({ nombre: 'Protector solar', precio_venta: 180 });
    await guantes.addServicios([botox, fillers]);

    const login = await request(app).post('/staff/login').send({ email: 'admin@test.com', password: 'secret123' });
    token = login.body.token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('cada producto trae los servicios donde se usa (solo id y nombre)', async () => {
    const res = await request(app).get('/staff/productos').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const guantes = res.body.find((p) => p.nombre === 'Guantes de nitrilo');
    expect(guantes.Servicios.map((s) => s.nombre).sort()).toEqual(['Toxina botulínica (Botox)', 'Ácido hialurónico (Fillers)'].sort());
    expect(Object.keys(guantes.Servicios[0]).sort()).toEqual(['id', 'nombre']);

    const protector = res.body.find((p) => p.nombre === 'Protector solar');
    expect(protector.Servicios).toEqual([]);
  });
});
