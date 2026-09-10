jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');

async function loginPaciente(telefono) {
  await request(app).post('/auth/otp/request').send({ telefono, nombre_completo: 'Test' });
  const otp = await db.OtpCode.findOne({ where: { telefono }, order: [['id', 'DESC']] });
  const res = await request(app).post('/auth/otp/verify').send({ telefono, codigo: otp.codigo });
  return res.body.token;
}

describe('citas routes', () => {
  let profesional, servicio, token;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100, activo: true });
    profesional = await db.Profesional.create({ nombre: 'Dra. Test', activo: true });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    await db.HorarioDisponible.create({
      profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '10:00:00',
    });
    token = await loginPaciente('59170000020');
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('rejects booking without auth', async () => {
    const res = await request(app).post('/citas').send({
      profesionalId: profesional.id, servicioId: servicio.id, fecha: '2026-09-14', horaInicio: '09:00',
    });
    expect(res.status).toBe(401);
  });

  test('books an available slot and creates a pending pago', async () => {
    const res = await request(app)
      .post('/citas')
      .set('Authorization', `Bearer ${token}`)
      .send({ profesionalId: profesional.id, servicioId: servicio.id, fecha: '2026-09-14', horaInicio: '09:00' });

    expect(res.status).toBe(201);
    expect(res.body.cita.estado).toBe('pendiente_pago');
    expect(res.body.pago.estado).toBe('pendiente');
    expect(Number(res.body.pago.monto)).toBe(100);
  });

  test('rejects double-booking the same slot', async () => {
    const res = await request(app)
      .post('/citas')
      .set('Authorization', `Bearer ${token}`)
      .send({ profesionalId: profesional.id, servicioId: servicio.id, fecha: '2026-09-14', horaInicio: '09:00' });
    expect(res.status).toBe(409);
  });

  test('GET /citas/mias returns only the authenticated patient citas', async () => {
    const res = await request(app).get('/citas/mias').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test('books with a 50% deposit and computes monto from monto_total', async () => {
    const res = await request(app)
      .post('/citas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        profesionalId: profesional.id,
        servicioId: servicio.id,
        fecha: '2026-09-14',
        horaInicio: '09:30',
        porcentajePago: 50,
      });

    expect(res.status).toBe(201);
    expect(Number(res.body.pago.monto)).toBe(50);
    expect(Number(res.body.pago.monto_total)).toBe(100);
    expect(res.body.pago.porcentaje).toBe(50);
  });

  test('rejects an invalid porcentajePago', async () => {
    const res = await request(app)
      .post('/citas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        profesionalId: profesional.id,
        servicioId: servicio.id,
        fecha: '2026-09-15',
        horaInicio: '09:00',
        porcentajePago: 75,
      });
    expect(res.status).toBe(400);
  });
});
