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

  test('OTP is locked out after 5 failed attempts, even with the correct code', async () => {
    const telefono = '59170000012';
    await request(app).post('/auth/otp/request').send({ telefono, nombre_completo: 'Bloqueo Test' });
    const otp = await db.OtpCode.findOne({ where: { telefono }, order: [['id', 'DESC']] });

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app)
        .post('/auth/otp/verify')
        .send({ telefono, codigo: '000000' });
      expect(res.status).toBe(401);
    }

    await otp.reload();
    expect(otp.intentos).toBe(5);

    const res = await request(app)
      .post('/auth/otp/verify')
      .send({ telefono, codigo: otp.codigo });
    expect(res.status).toBe(401);
  });
});

describe('Login con codigo de paciente', () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    await db.Paciente.create({
      codigo_paciente: 'PAC-000001',
      nombre_completo: 'Cliente Recurrente',
      telefono: '59170000050',
      carnet_identidad: '1112223',
      carnet_expedido: 'CB',
    });
  });

  test('codigo + telefono correctos devuelven un JWT', async () => {
    const res = await request(app)
      .post('/auth/codigo/login')
      .send({ codigo_paciente: 'PAC-000001', telefono: '59170000050' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('telefono que no coincide con el codigo devuelve 401', async () => {
    const res = await request(app)
      .post('/auth/codigo/login')
      .send({ codigo_paciente: 'PAC-000001', telefono: '59170000099' });
    expect(res.status).toBe(401);
  });

  test('codigo inexistente devuelve 401', async () => {
    const res = await request(app)
      .post('/auth/codigo/login')
      .send({ codigo_paciente: 'PAC-999999', telefono: '59170000050' });
    expect(res.status).toBe(401);
  });
});

describe('Registro directo (sin OTP)', () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('crea un paciente nuevo y devuelve token sin pedir OTP', async () => {
    const res = await request(app).post('/auth/registro').send({
      telefono: '59170000060',
      nombre_completo: 'Registro Directo',
      carnet_identidad: '2223334',
      carnet_expedido: 'CB',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.codigo_paciente).toMatch(/^NOVA-/);

    const paciente = await db.Paciente.findOne({ where: { telefono: '59170000060' } });
    expect(paciente).not.toBeNull();
  });

  test('un telefono ya registrado reutiliza el mismo paciente', async () => {
    const primero = await request(app).post('/auth/registro').send({
      telefono: '59170000061',
      nombre_completo: 'Cliente Repetido',
      carnet_identidad: '4445556',
      carnet_expedido: 'LP',
    });
    const segundo = await request(app).post('/auth/registro').send({
      telefono: '59170000061',
      nombre_completo: 'Cliente Repetido',
      carnet_identidad: '4445556',
      carnet_expedido: 'LP',
    });
    expect(segundo.body.codigo_paciente).toBe(primero.body.codigo_paciente);

    const count = await db.Paciente.count({ where: { telefono: '59170000061' } });
    expect(count).toBe(1);
  });

  test('rechaza datos incompletos', async () => {
    const res = await request(app).post('/auth/registro').send({ telefono: '59170000062' });
    expect(res.status).toBe(400);
  });
});
