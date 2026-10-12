// backend/test/comprobantes.test.js
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.PRIVADO_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'privado-'));

jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');
const { proximoLunes } = require('./helpers/fechas');
const { pngFalso } = require('./helpers/archivos');

async function loginPaciente(telefono) {
  await request(app).post('/auth/otp/request').send({ telefono, nombre_completo: 'Paciente QR' });
  const otp = await db.OtpCode.findOne({ where: { telefono }, order: [['id', 'DESC']] });
  return (await request(app).post('/auth/otp/verify').send({ telefono, codigo: otp.codigo })).body.token;
}

async function loginStaff(email) {
  return (await request(app).post('/staff/login').send({ email, password: 'secret123' })).body.token;
}

describe('Revisión de comprobantes', () => {
  let profesional, servicio, tokenPaciente, admin, tokenAdmin, tokenCaja;
  const lunes = proximoLunes(0);
  const auth = (t) => ({ Authorization: `Bearer ${t}` });

  async function reservar(hora) {
    const res = await request(app).post('/citas').set(auth(tokenPaciente))
      .field('profesionalId', String(profesional.id)).field('servicioId', String(servicio.id))
      .field('fecha', lunes).field('horaInicio', hora).field('aceptaPolitica', 'true')
      .attach('comprobante', pngFalso(), { filename: 'c.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    return res.body;
  }

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const [rolAdmin] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Admin } });
    const rolCaja = await db.Rol.create({ nombre: 'SoloCaja', permisos: ['caja'] });
    const hash = await bcrypt.hash('secret123', 10);
    admin = await db.Usuario.create({ nombre: 'Admin', email: 'admin@test.com', password_hash: hash, rol_id: rolAdmin.id, activo: true });
    await db.Usuario.create({ nombre: 'Caja', email: 'caja@test.com', password_hash: hash, rol_id: rolCaja.id, activo: true });
    tokenAdmin = await loginStaff('admin@test.com');
    tokenCaja = await loginStaff('caja@test.com');

    servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100, activo: true });
    profesional = await db.Profesional.create({ nombre: 'Dra. Test', activo: true });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    await db.HorarioDisponible.create({ profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '12:00:00' });

    const config = await db.ConfiguracionClinica.obtenerConfig();
    config.metodo_pago_online = 'qr_fijo';
    config.qr_fijo_url = '/uploads/qr/qr-1.png';
    await config.save();

    tokenPaciente = await loginPaciente('59170000040');
  });

  afterAll(async () => {
    fs.rmSync(process.env.PRIVADO_DIR, { recursive: true, force: true });
    await db.sequelize.close();
  });

  test('la agenda trae el pago con su revisión y la política, sin el nombre del archivo', async () => {
    await reservar('09:00');
    const res = await request(app).get(`/staff/citas?fecha=${lunes}`).set(auth(tokenAdmin));
    expect(res.status).toBe(200);
    const cita = res.body[0];
    expect(cita.Pago.comprobante_revision).toBe('sin_revisar');
    expect(cita.Pago.tieneComprobante).toBe(true);
    expect(cita.Pago).not.toHaveProperty('comprobante_archivo');
    expect(cita.politica).toBeDefined();
  });

  test('?revision=sin_revisar lista las pendientes de cualquier fecha', async () => {
    const res = await request(app).get('/staff/citas?revision=sin_revisar').set(auth(tokenAdmin));
    expect(res.body).toHaveLength(1);
  });

  test('el comprobante exige sesión y permiso de agenda, y nunca sale por /uploads', async () => {
    const cita = (await request(app).get('/staff/citas?revision=sin_revisar').set(auth(tokenAdmin))).body[0];
    const ruta = `/staff/pagos/${cita.Pago.id}/comprobante`;
    expect((await request(app).get(ruta)).status).toBe(401);
    expect((await request(app).get(ruta).set(auth(tokenCaja))).status).toBe(403);
    const ok = await request(app).get(ruta).set(auth(tokenAdmin));
    expect(ok.status).toBe(200);
    expect(ok.headers['content-type']).toMatch(/^image\/png/);

    const pago = await db.Pago.findByPk(cita.Pago.id);
    expect((await request(app).get(`/uploads/comprobantes/${pago.comprobante_archivo}`)).status).toBe(404);
    expect((await request(app).get(`/uploads/../privado/comprobantes/${pago.comprobante_archivo}`)).status).toBe(404);
  });

  test('el dashboard cuenta los comprobantes por revisar', async () => {
    const res = await request(app).get('/staff/dashboard').set(auth(tokenAdmin));
    expect(res.body.comprobantesPorRevisar).toBe(1);
  });

  test('válido: guarda quién y cuándo revisó', async () => {
    const cita = (await request(app).get('/staff/citas?revision=sin_revisar').set(auth(tokenAdmin))).body[0];
    const res = await request(app).patch(`/staff/pagos/${cita.Pago.id}/revision`).set(auth(tokenAdmin)).send({ resultado: 'valido' });
    expect(res.status).toBe(200);
    expect(res.body.cita.Pago.comprobante_revision).toBe('valido');
    const pago = await db.Pago.findByPk(cita.Pago.id);
    expect(pago.comprobante_revisado_por_id).toBe(admin.id);
    expect(pago.comprobante_revisado_en).toBeTruthy();
  });

  test('inválido: cancela la cita, marca el pago fallido y libera el horario', async () => {
    const { pago } = await reservar('10:00');
    const res = await request(app).patch(`/staff/pagos/${pago.id}/revision`).set(auth(tokenAdmin)).send({ resultado: 'invalido' });
    expect(res.status).toBe(200);
    expect(res.body.cita.estado).toBe('cancelada');
    expect(res.body.cita.Pago.estado).toBe('fallido');
    expect(res.body.avisoWhatsApp).toBe('no_configurado');

    const slots = await request(app).get(`/disponibilidad?profesionalId=${profesional.id}&servicioId=${servicio.id}&fecha=${lunes}`);
    expect(slots.body.map((s) => s.hora_inicio)).toContain('10:00');
  });

  test('no se puede reactivar con "válido" un comprobante ya anulado', async () => {
    const cita = (await db.Pago.findOne({ where: { comprobante_revision: 'invalido' } }));
    const res = await request(app).patch(`/staff/pagos/${cita.id}/revision`).set(auth(tokenAdmin)).send({ resultado: 'valido' });
    expect(res.status).toBe(400);
  });

  test('inválido sobre una cita completada responde 400 y no cambia nada', async () => {
    const { cita, pago } = await reservar('11:00');
    await db.Cita.update({ estado: 'completada' }, { where: { id: cita.id } });
    const res = await request(app).patch(`/staff/pagos/${pago.id}/revision`).set(auth(tokenAdmin)).send({ resultado: 'invalido' });
    expect(res.status).toBe(400);
    expect((await db.Cita.findByPk(cita.id)).estado).toBe('completada');
    expect((await db.Pago.findByPk(pago.id)).estado).toBe('pagado');
  });

  test('un pago que no es qr_fijo o un resultado desconocido responden 400', async () => {
    const otraCita = await db.Cita.create({ paciente_id: 1, profesional_id: profesional.id, servicio_id: servicio.id, fecha: lunes, hora_inicio: '11:30:00', hora_fin: '12:00:00', estado: 'confirmada' });
    const pagoBanco = await db.Pago.create({ cita_id: otraCita.id, monto: 100, monto_total: 100, estado: 'pagado', metodo_adelanto: 'qr_banco' });
    expect((await request(app).patch(`/staff/pagos/${pagoBanco.id}/revision`).set(auth(tokenAdmin)).send({ resultado: 'valido' })).status).toBe(400);
    expect((await request(app).patch(`/staff/pagos/${pagoBanco.id}/revision`).set(auth(tokenAdmin)).send({ resultado: 'quizas' })).status).toBe(400);
  });
});
