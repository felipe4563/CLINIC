jest.mock('axios', () => ({ post: jest.fn() }));

const axios = require('axios');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { enviarPlantillaWhatsApp, whatsappConfigurado, normalizarTelefono } = require('../src/services/whatsapp');
const { enviarSiCorresponde } = require('../src/services/notificacionesAutomaticas');

const ENV = { ...process.env };
const conectar = () => {
  process.env.WHATSAPP_TOKEN = 'token-real';
  process.env.WHATSAPP_PHONE_NUMBER_ID = '123456';
};

describe('WhatsApp', () => {
  let cita;
  let token;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const paciente = await db.Paciente.create({ codigo_paciente: 'P-WA1', nombre_completo: 'Ana Rojas', telefono: '71234567', carnet_identidad: '1', carnet_expedido: 'CB' });
    const servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100, activo: true });
    cita = await db.Cita.create({ paciente_id: paciente.id, servicio_id: servicio.id, fecha: '2026-11-09', hora_inicio: '10:00:00', hora_fin: '10:30:00', estado: 'confirmada' });
    const rol = await db.Rol.create({ nombre: 'Admin WA', permisos: ['automatizacion'] });
    token = jwt.sign({ usuarioId: 1, rolId: rol.id, rolNombre: rol.nombre, permisos: rol.permisos }, process.env.JWT_STAFF_SECRET);
  });

  afterEach(() => {
    process.env = { ...ENV };
    axios.post.mockReset();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('sin token ni número no está conectado y no llama a Meta', async () => {
    delete process.env.WHATSAPP_TOKEN;
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'change_me';
    expect(whatsappConfigurado()).toBe(false);
    await expect(enviarPlantillaWhatsApp('71234567', 'x')).rejects.toThrow(/no está conectado/);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('los celulares de 8 dígitos llevan el 591 delante', () => {
    expect(normalizarTelefono('71234567')).toBe('59171234567');
    expect(normalizarTelefono('+591 7123-4567')).toBe('59171234567');
    expect(normalizarTelefono('59171234567')).toBe('59171234567');
  });

  test('arma la plantilla con variables y el botón de código', async () => {
    conectar();
    axios.post.mockResolvedValue({ data: {} });
    await enviarPlantillaWhatsApp('71234567', 'otp_login', ['482913'], { boton: '482913' });
    const [url, cuerpo, opciones] = axios.post.mock.calls[0];
    expect(url).toContain('/123456/messages');
    expect(cuerpo.to).toBe('59171234567');
    expect(cuerpo.template.language.code).toBe('es');
    expect(cuerpo.template.components).toEqual([
      { type: 'body', parameters: [{ type: 'text', text: '482913' }] },
      { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: '482913' }] },
    ]);
    expect(opciones.headers.Authorization).toBe('Bearer token-real');
  });

  test('el error de Meta llega entendible', async () => {
    conectar();
    axios.post.mockRejectedValue({ response: { data: { error: { message: 'Template name does not exist', error_data: { details: 'recordatorio_24h (es)' } } } } });
    await expect(enviarPlantillaWhatsApp('71234567', 'recordatorio_24h')).rejects.toThrow('Template name does not exist — recordatorio_24h (es)');
  });

  test('un envío rechazado queda como fallido con el motivo, y al reintentar con éxito pasa a enviado', async () => {
    conectar();
    axios.post.mockRejectedValueOnce({ response: { data: { error: { message: 'Plantilla no aprobada' } } } });
    await expect(enviarSiCorresponde({ tipo: 'post_consulta', telefono: '71234567', template: 'post_consulta', parametros: ['Ana'], citaId: cita.id })).rejects.toThrow();
    let registros = await db.NotificacionAutomatica.findAll({ where: { cita_id: cita.id, tipo: 'post_consulta' } });
    expect(registros).toHaveLength(1);
    expect(registros[0].estado).toBe('fallido');
    expect(registros[0].error).toBe('Plantilla no aprobada');

    axios.post.mockResolvedValueOnce({ data: {} });
    expect(await enviarSiCorresponde({ tipo: 'post_consulta', telefono: '71234567', template: 'post_consulta', parametros: ['Ana'], citaId: cita.id })).toBe(true);
    registros = await db.NotificacionAutomatica.findAll({ where: { cita_id: cita.id, tipo: 'post_consulta' } });
    expect(registros).toHaveLength(1);
    expect(registros[0].estado).toBe('enviado');
    expect(registros[0].error).toBeNull();

    // Ya enviado: no se repite.
    expect(await enviarSiCorresponde({ tipo: 'post_consulta', telefono: '71234567', template: 'post_consulta', citaId: cita.id })).toBe(false);
    expect(axios.post).toHaveBeenCalledTimes(2);
  });

  test('sin WhatsApp conectado no intenta ni registra nada', async () => {
    delete process.env.WHATSAPP_TOKEN;
    expect(await enviarSiCorresponde({ tipo: 'no_show', telefono: '71234567', template: 'cita_no_asistio', citaId: cita.id })).toBe(false);
    expect(await db.NotificacionAutomatica.count({ where: { tipo: 'no_show' } })).toBe(0);
  });

  test('Automatización muestra si está conectado y manda el mensaje de prueba', async () => {
    const auth = { Authorization: `Bearer ${token}` };
    delete process.env.WHATSAPP_TOKEN;
    let res = await request(app).get('/staff/automatizacion').set(auth);
    expect(res.body.whatsapp.conectado).toBe(false);
    expect((await request(app).post('/staff/automatizacion/prueba').set(auth).send({ telefono: '71234567' })).status).toBe(400);

    conectar();
    res = await request(app).get('/staff/automatizacion').set(auth);
    expect(res.body.whatsapp.conectado).toBe(true);
    expect(res.body.whatsapp.plantillas).toHaveProperty('cita_confirmada', 'cita_confirmada');

    axios.post.mockResolvedValue({ data: {} });
    res = await request(app).post('/staff/automatizacion/prueba').set(auth).send({ telefono: '7123 4567' });
    expect(res.status).toBe(200);
    expect(res.body.telefono).toBe('59171234567');
    expect(axios.post.mock.calls[0][1].template).toEqual({ name: 'hello_world', language: { code: 'en_US' }, components: [] });

    axios.post.mockRejectedValue({ response: { data: { error: { message: 'Recipient not in allowed list' } } } });
    res = await request(app).post('/staff/automatizacion/prueba').set(auth).send({ telefono: '71234567' });
    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/Recipient not in allowed list/);
  });
});
