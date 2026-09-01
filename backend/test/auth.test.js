jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { enviarPlantillaWhatsApp } = require('../src/services/whatsapp');

describe('OTP auth flow', () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('request OTP creates paciente and sends WhatsApp code', async () => {
    const res = await request(app)
      .post('/auth/otp/request')
      .send({ telefono: '59170000009', nombre_completo: 'Nuevo Paciente' });
    expect(res.status).toBe(200);
    expect(enviarPlantillaWhatsApp).toHaveBeenCalled();

    const paciente = await db.Paciente.findOne({ where: { telefono: '59170000009' } });
    expect(paciente).not.toBeNull();
  });

  test('verify OTP with correct code returns a JWT', async () => {
    await request(app).post('/auth/otp/request').send({ telefono: '59170000010', nombre_completo: 'Otro' });
    const otp = await db.OtpCode.findOne({ where: { telefono: '59170000010' }, order: [['id', 'DESC']] });

    const res = await request(app)
      .post('/auth/otp/verify')
      .send({ telefono: '59170000010', codigo: otp.codigo });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('verify OTP with wrong code returns 401', async () => {
    await request(app).post('/auth/otp/request').send({ telefono: '59170000011', nombre_completo: 'Otro Mas' });
    const res = await request(app)
      .post('/auth/otp/verify')
      .send({ telefono: '59170000011', codigo: '000000' });
    expect(res.status).toBe(401);
  });
});
