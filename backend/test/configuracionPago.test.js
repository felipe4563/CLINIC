jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');
const { TEXTO_POR_DEFECTO } = require('../src/services/politicaInasistencia');
const { pngFalso } = require('./helpers/archivos');

describe('Configuración de pagos', () => {
  let token;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const [rol] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Admin } });
    await db.Usuario.create({ nombre: 'Admin', email: 'admin@test.com', password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true });
    token = (await request(app).post('/staff/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;
  });

  afterAll(async () => {
    await request(app).put('/staff/configuracion').set(auth()).send({ metodo_pago_online: 'qr_banco' });
    await request(app).delete('/staff/configuracion/qr').set(auth());
    await db.sequelize.close();
  });

  test('por defecto el modo es qr_banco y la política pública es el texto por defecto', async () => {
    const res = await request(app).get('/configuracion-publica');
    expect(res.body.metodo_pago_online).toBe('qr_banco');
    expect(res.body.politica_inasistencia).toBe(TEXTO_POR_DEFECTO);
    expect(res.body).not.toHaveProperty('cobra_adelanto_online');
  });

  test('GET /staff/configuracion trae el texto por defecto para rellenar el formulario', async () => {
    const res = await request(app).get('/staff/configuracion').set(auth());
    expect(res.body.politica_inasistencia_por_defecto).toBe(TEXTO_POR_DEFECTO);
  });

  test('rechaza un modo desconocido', async () => {
    const res = await request(app).put('/staff/configuracion').set(auth()).send({ metodo_pago_online: 'efectivo' });
    expect(res.status).toBe(400);
  });

  test('rechaza qr_fijo_datos de más de 255 caracteres', async () => {
    const res = await request(app).put('/staff/configuracion').set(auth()).send({ qr_fijo_datos: 'x'.repeat(256) });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Los datos para el paciente no pueden superar 255 caracteres');
  });

  test('no deja elegir qr_fijo sin imagen del QR', async () => {
    const res = await request(app).put('/staff/configuracion').set(auth()).send({ metodo_pago_online: 'qr_fijo' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Sube primero la imagen del QR');
  });

  test('sube el QR, elige qr_fijo y lo expone en la configuración pública', async () => {
    const subida = await request(app).post('/staff/configuracion/qr').set(auth()).attach('qr', pngFalso(), { filename: 'qr.png', contentType: 'image/png' });
    expect(subida.status).toBe(200);
    expect(subida.body.qr_fijo_url).toMatch(/^\/uploads\/qr\/qr-\d+\.png$/);

    const put = await request(app).put('/staff/configuracion').set(auth()).send({
      metodo_pago_online: 'qr_fijo',
      qr_fijo_datos: 'Titular: Clínica — Banco X',
      politica_inasistencia: 'Política propia',
    });
    expect(put.status).toBe(200);

    const pub = await request(app).get('/configuracion-publica');
    expect(pub.body.metodo_pago_online).toBe('qr_fijo');
    expect(pub.body.qr_fijo_url).toBe(subida.body.qr_fijo_url);
    expect(pub.body.qr_fijo_datos).toBe('Titular: Clínica — Banco X');
    expect(pub.body.politica_inasistencia).toBe('Política propia');
  });

  test('no deja quitar el QR mientras el modo es qr_fijo', async () => {
    const res = await request(app).delete('/staff/configuracion/qr').set(auth());
    expect(res.status).toBe(400);
  });

  test('una política vacía vuelve al texto por defecto en la web', async () => {
    await request(app).put('/staff/configuracion').set(auth()).send({ politica_inasistencia: '   ' });
    const pub = await request(app).get('/configuracion-publica');
    expect(pub.body.politica_inasistencia).toBe(TEXTO_POR_DEFECTO);
  });
});
