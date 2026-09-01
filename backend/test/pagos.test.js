jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/services/bancoEconomico', () => ({
  generarQR: jest.fn().mockResolvedValue({ qrId: 'QR-123', qrImageBase64: 'FAKE_BASE64' }),
  consultarEstadoQR: jest.fn(),
}));

const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { enviarPlantillaWhatsApp } = require('../src/services/whatsapp');
const { consultarEstadoQR } = require('../src/services/bancoEconomico');

async function loginPaciente(telefono) {
  await request(app).post('/auth/otp/request').send({ telefono, nombre_completo: 'Test' });
  const otp = await db.OtpCode.findOne({ where: { telefono }, order: [['id', 'DESC']] });
  const res = await request(app).post('/auth/otp/verify').send({ telefono, codigo: otp.codigo });
  return res.body.token;
}

describe('pagos routes', () => {
  let cita, token;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100, activo: true });
    const profesional = await db.Profesional.create({ nombre: 'Dra. Test', activo: true });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    await db.HorarioDisponible.create({
      profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '10:00:00',
    });
    token = await loginPaciente('59170000030');

    const bookRes = await request(app)
      .post('/citas')
      .set('Authorization', `Bearer ${token}`)
      .send({ profesionalId: profesional.id, servicioId: servicio.id, fecha: '2026-09-14', horaInicio: '09:00' });
    cita = bookRes.body.cita;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('POST /pagos/:citaId/qr returns a QR and stores the qrId as referencia', async () => {
    const res = await request(app)
      .post(`/pagos/${cita.id}/qr`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.qrImageBase64).toBe('FAKE_BASE64');

    const pago = await db.Pago.findOne({ where: { cita_id: cita.id } });
    expect(pago.referencia_qr_banco).toBe('QR-123');
  });

  test('POST /pagos/webhook ignores an unknown qrId without touching any pago', async () => {
    const res = await request(app)
      .post('/pagos/webhook')
      .send({ payment: { qrId: 'QR-DESCONOCIDO' } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ responseCode: 0, message: '' });
    expect(consultarEstadoQR).not.toHaveBeenCalled();
  });

  test('POST /pagos/webhook does not confirm payment when statusQR says not paid', async () => {
    consultarEstadoQR.mockResolvedValueOnce({ pagado: false });

    const res = await request(app)
      .post('/pagos/webhook')
      .send({ payment: { qrId: 'QR-123' } });
    expect(res.status).toBe(200);
    expect(consultarEstadoQR).toHaveBeenCalledWith('QR-123');

    const pago = await db.Pago.findOne({ where: { cita_id: cita.id } });
    expect(pago.estado).toBe('pendiente');
  });

  test('POST /pagos/webhook confirms payment only after statusQR says pagado', async () => {
    consultarEstadoQR.mockResolvedValueOnce({ pagado: true });

    const res = await request(app)
      .post('/pagos/webhook')
      .send({ payment: { qrId: 'QR-123' } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ responseCode: 0, message: '' });

    const pago = await db.Pago.findOne({ where: { cita_id: cita.id } });
    expect(pago.estado).toBe('pagado');

    const citaActualizada = await db.Cita.findByPk(cita.id);
    expect(citaActualizada.estado).toBe('confirmada');
    expect(enviarPlantillaWhatsApp).toHaveBeenCalled();
  });

  test('POST /pagos/webhook is idempotent for an already-paid pago', async () => {
    enviarPlantillaWhatsApp.mockClear();
    consultarEstadoQR.mockClear();

    const res = await request(app)
      .post('/pagos/webhook')
      .send({ payment: { qrId: 'QR-123' } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ responseCode: 0, message: '' });
    expect(consultarEstadoQR).not.toHaveBeenCalled();
    expect(enviarPlantillaWhatsApp).not.toHaveBeenCalled();
  });
});
