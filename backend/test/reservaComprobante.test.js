// backend/test/reservaComprobante.test.js
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.PRIVADO_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'privado-'));

jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { enviarPlantillaWhatsApp } = require('../src/services/whatsapp');
const { proximoLunes } = require('./helpers/fechas');
const { pngFalso, exeFalso, pngGrande } = require('./helpers/archivos');

const DIR_COMPROBANTES = path.join(process.env.PRIVADO_DIR, 'comprobantes');
const archivosGuardados = () => (fs.existsSync(DIR_COMPROBANTES) ? fs.readdirSync(DIR_COMPROBANTES).length : 0);

async function loginPaciente(telefono) {
  await request(app).post('/auth/otp/request').send({ telefono, nombre_completo: 'Test' });
  const otp = await db.OtpCode.findOne({ where: { telefono }, order: [['id', 'DESC']] });
  return (await request(app).post('/auth/otp/verify').send({ telefono, codigo: otp.codigo })).body.token;
}

describe('POST /citas según el modo de pago', () => {
  let profesional, servicio, token;
  const lunes = proximoLunes(0);

  async function modo(metodo) {
    const config = await db.ConfiguracionClinica.obtenerConfig();
    config.metodo_pago_online = metodo;
    config.qr_fijo_url = '/uploads/qr/qr-1.png';
    await config.save();
  }

  function reservarConComprobante(hora, archivo = pngFalso(), contentType = 'image/png', extra = {}) {
    const req = request(app)
      .post('/citas')
      .set('Authorization', `Bearer ${token}`)
      .field('profesionalId', String(profesional.id))
      .field('servicioId', String(servicio.id))
      .field('fecha', lunes)
      .field('horaInicio', hora)
      .field('porcentajePago', '50')
      .field('aceptaPolitica', extra.aceptaPolitica ?? 'true');
    return archivo ? req.attach('comprobante', archivo, { filename: 'c.png', contentType }) : req;
  }

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100, activo: true });
    profesional = await db.Profesional.create({ nombre: 'Dra. Test', activo: true });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    await db.HorarioDisponible.create({ profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '12:00:00' });
    token = await loginPaciente('59170000030');
  });

  afterAll(async () => {
    fs.rmSync(process.env.PRIVADO_DIR, { recursive: true, force: true });
    await db.sequelize.close();
  });

  beforeEach(() => enviarPlantillaWhatsApp.mockClear());

  test('qr_banco: sin aceptar la política responde 400', async () => {
    await modo('qr_banco');
    const res = await request(app).post('/citas').set('Authorization', `Bearer ${token}`)
      .send({ profesionalId: profesional.id, servicioId: servicio.id, fecha: lunes, horaInicio: '09:00' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Debes aceptar la política de inasistencia');
  });

  test('qr_banco: aceptando queda pendiente de pago, con método y fecha de aceptación', async () => {
    const res = await request(app).post('/citas').set('Authorization', `Bearer ${token}`)
      .send({ profesionalId: profesional.id, servicioId: servicio.id, fecha: lunes, horaInicio: '09:00', aceptaPolitica: true });
    expect(res.status).toBe(201);
    expect(res.body.requierePago).toBe(true);
    expect(res.body.cita.estado).toBe('pendiente_pago');
    expect(res.body.cita.politica_aceptada_en).toBeTruthy();
    expect(res.body.pago.metodo_adelanto).toBe('qr_banco');
  });

  test('ninguno: no exige la política y confirma sin pago online', async () => {
    await modo('ninguno');
    const res = await request(app).post('/citas').set('Authorization', `Bearer ${token}`)
      .send({ profesionalId: profesional.id, servicioId: servicio.id, fecha: lunes, horaInicio: '09:30' });
    expect(res.status).toBe(201);
    expect(res.body.cita.estado).toBe('confirmada');
    expect(res.body.requierePago).toBe(false);
    expect(res.body.pago.metodo_adelanto).toBeNull();
  });

  test('qr_fijo: sin comprobante responde 400', async () => {
    await modo('qr_fijo');
    const res = await reservarConComprobante('10:00', null);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Sube el comprobante de pago');
  });

  test('qr_fijo: sin aceptar la política responde 400 y no guarda archivo', async () => {
    const antes = archivosGuardados();
    const res = await reservarConComprobante('10:00', pngFalso(), 'image/png', { aceptaPolitica: 'false' });
    expect(res.status).toBe(400);
    expect(archivosGuardados()).toBe(antes);
  });

  test('qr_fijo: un .exe disfrazado o un archivo de más de 5 MB responden 400', async () => {
    expect((await reservarConComprobante('10:00', exeFalso(), 'image/jpeg')).status).toBe(400);
    expect((await reservarConComprobante('10:00', pngGrande())).status).toBe(400);
  });

  test('qr_fijo: con comprobante queda confirmada, pagada y sin revisar, y avisa por WhatsApp', async () => {
    const antes = archivosGuardados();
    const res = await reservarConComprobante('10:00');
    expect(res.status).toBe(201);
    expect(res.body.requierePago).toBe(false);
    expect(res.body.cita.estado).toBe('confirmada');
    expect(res.body.pago.estado).toBe('pagado');
    expect(res.body.pago.metodo_adelanto).toBe('qr_fijo');
    expect(res.body.pago.comprobante_revision).toBe('sin_revisar');
    expect(res.body.pago).not.toHaveProperty('comprobante_archivo');
    expect(Number(res.body.pago.monto)).toBe(50);
    expect(res.body.avisoWhatsApp).toBe('enviado');
    expect(archivosGuardados()).toBe(antes + 1);
    expect(enviarPlantillaWhatsApp).toHaveBeenCalledWith('59170000030', 'cita_confirmada', [lunes, '10:00']);

    const pago = await db.Pago.findByPk(res.body.pago.id);
    expect(fs.existsSync(path.join(DIR_COMPROBANTES, pago.comprobante_archivo))).toBe(true);
  });

  test('qr_fijo: el mismo horario otra vez (doble clic) da 409 y no deja archivo huérfano', async () => {
    const antes = archivosGuardados();
    const res = await reservarConComprobante('10:00');
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Ese horario acaba de ocuparse, elige otro');
    expect(archivosGuardados()).toBe(antes);
  });

  test('qr_fijo: si WhatsApp falla, la reserva igual queda creada', async () => {
    enviarPlantillaWhatsApp.mockRejectedValueOnce(new Error('caído'));
    const res = await reservarConComprobante('10:30');
    expect(res.status).toBe(201);
    expect(res.body.avisoWhatsApp).toBe('error');
  });
});
