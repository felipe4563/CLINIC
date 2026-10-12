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
const { enviarPlantillaWhatsApp } = require('../src/services/whatsapp');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');
const { proximoLunes } = require('./helpers/fechas');
const { pngFalso, pdfFalso } = require('./helpers/archivos');

describe('Inasistencia: justificación y reprogramación', () => {
  let profesional, servicio, paciente, token;
  const lunes = proximoLunes(0);
  const lunesSiguiente = proximoLunes(1);
  const auth = () => ({ Authorization: `Bearer ${token}` });

  function sumar30(hora) {
    const [h, m] = hora.split(':').map(Number);
    const total = h * 60 + m + 30;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`;
  }

  async function citaConAdelanto(hora, { estado = 'no_asistio', metodo = 'qr_fijo', fecha = lunes } = {}) {
    const cita = await db.Cita.create({
      paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id,
      fecha, hora_inicio: `${hora}:00`, hora_fin: sumar30(hora), estado,
    });
    await db.Pago.create({
      cita_id: cita.id, monto: 50, monto_total: 100, porcentaje: 50, estado: 'pagado',
      metodo_adelanto: metodo, comprobante_revision: metodo === 'qr_fijo' ? 'valido' : null,
    });
    return cita;
  }

  function justificar(citaId, campos, archivo) {
    const req = request(app).post(`/staff/citas/${citaId}/justificacion`).set(auth());
    for (const [k, v] of Object.entries(campos)) req.field(k, v);
    return archivo ? req.attach('archivo', archivo, { filename: 'certificado.pdf', contentType: 'application/pdf' }) : req;
  }

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const [rol] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Admin } });
    await db.Usuario.create({ nombre: 'Admin', email: 'admin@test.com', password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true });
    token = (await request(app).post('/staff/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;

    servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100, activo: true });
    profesional = await db.Profesional.create({ nombre: 'Dra. Test', activo: true });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    await db.HorarioDisponible.create({ profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '12:00:00' });
    paciente = await db.Paciente.create({ nombre_completo: 'Ana Paciente', telefono: '59170000050', codigo_paciente: 'P-0050', carnet_identidad: '1234567', carnet_expedido: 'CB' });
  });

  afterAll(async () => {
    fs.rmSync(process.env.PRIVADO_DIR, { recursive: true, force: true });
    await db.sequelize.close();
  });

  test('solo se justifica una cita en "No asistió"', async () => {
    const cita = await citaConAdelanto('09:00', { estado: 'confirmada' });
    const res = await justificar(cita.id, { decision: 'aceptada', nota: 'Certificado' });
    expect(res.status).toBe(400);
  });

  test('la nota es obligatoria y la decisión debe ser válida', async () => {
    const cita = await citaConAdelanto('09:30');
    expect((await justificar(cita.id, { decision: 'aceptada', nota: '  ' })).status).toBe(400);
    expect((await justificar(cita.id, { decision: 'quizas', nota: 'x' })).status).toBe(400);
  });

  test('una cita sin pago adelantado no se justifica', async () => {
    const cita = await db.Cita.create({ paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id, fecha: lunes, hora_inicio: '11:30:00', hora_fin: '12:00:00', estado: 'no_asistio' });
    await db.Pago.create({ cita_id: cita.id, monto: 100, monto_total: 100, estado: 'pagado' });
    const res = await justificar(cita.id, { decision: 'aceptada', nota: 'x' });
    expect(res.status).toBe(400);
  });

  let citaAceptada;
  test('aceptada con PDF: habilita reprogramar y guarda el archivo en privado', async () => {
    citaAceptada = await citaConAdelanto('10:00');
    const res = await justificar(citaAceptada.id, { decision: 'aceptada', nota: 'Certificado médico' }, pdfFalso());
    expect(res.status).toBe(200);
    expect(res.body.justificacion_estado).toBe('aceptada');
    expect(res.body.tieneJustificacion).toBe(true);
    expect(res.body.politica.puedeReprogramar).toBe(true);
    expect(res.body.politica.montoRetenido).toBe(false);

    const ver = await request(app).get(`/staff/citas/${citaAceptada.id}/justificacion`).set(auth());
    expect(ver.status).toBe(200);
    expect(ver.headers['content-type']).toMatch(/^application\/pdf/);
  });

  test('una segunda justificación responde 400', async () => {
    const res = await justificar(citaAceptada.id, { decision: 'rechazada', nota: 'otra' });
    expect(res.status).toBe(400);
  });

  test('reprogramar a un horario ocupado responde 409', async () => {
    await citaConAdelanto('09:00', { estado: 'confirmada', fecha: lunesSiguiente });
    const res = await request(app).patch(`/staff/citas/${citaAceptada.id}/reprogramar`).set(auth()).send({ fecha: lunesSiguiente, horaInicio: '09:00' });
    expect(res.status).toBe(409);
  });

  test('reprogramar mueve la misma cita, conserva su pago y avisa por WhatsApp', async () => {
    enviarPlantillaWhatsApp.mockClear();
    const res = await request(app).patch(`/staff/citas/${citaAceptada.id}/reprogramar`).set(auth()).send({ fecha: lunesSiguiente, horaInicio: '10:30' });
    expect(res.status).toBe(200);
    expect(res.body.cita.id).toBe(citaAceptada.id);
    expect(res.body.cita.fecha).toBe(lunesSiguiente);
    expect(res.body.cita.hora_inicio).toBe('10:30:00');
    expect(res.body.cita.hora_fin).toBe('11:00:00');
    expect(res.body.cita.estado).toBe('confirmada');
    expect(res.body.cita.fecha_original).toBe(lunes);
    expect(res.body.cita.hora_original).toBe('10:00:00');
    expect(res.body.cita.reprogramacion_usada).toBe(true);
    expect(res.body.cita.Pago.estado).toBe('pagado');
    expect(res.body.avisoWhatsApp).toBe('enviado');
    expect(enviarPlantillaWhatsApp).toHaveBeenCalledWith('59170000050', 'cita_confirmada', [lunesSiguiente, '10:30']);
  });

  test('una segunda reprogramación responde 400 "Ya se reprogramó una vez"', async () => {
    const res = await request(app).patch(`/staff/citas/${citaAceptada.id}/reprogramar`).set(auth()).send({ fecha: lunesSiguiente, horaInicio: '11:00' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Ya se reprogramó una vez');
  });

  test('rechazada: sigue en "No asistió" con el monto retenido y no puede reprogramar', async () => {
    const cita = await citaConAdelanto('11:00');
    const res = await justificar(cita.id, { decision: 'rechazada', nota: 'Sin pruebas' });
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('no_asistio');
    expect(res.body.politica.montoRetenido).toBe(true);
    const rep = await request(app).patch(`/staff/citas/${cita.id}/reprogramar`).set(auth()).send({ fecha: lunesSiguiente, horaInicio: '11:30' });
    expect(rep.status).toBe(400);
  });

  test('una justificación aceptada fuera de plazo igual se registra (decide el personal)', async () => {
    const cita = await citaConAdelanto('09:00', { fecha: '2020-01-06' });
    const res = await justificar(cita.id, { decision: 'aceptada', nota: 'Excepción de la doctora' }, pngFalso());
    expect(res.status).toBe(200);
    expect(res.body.politica.justificacionFueraDePlazo).toBe(true);
  });
});
