const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');
const { pngFalso } = require('./helpers/archivos');

describe('perfil web de los profesionales ("Nuestro equipo")', () => {
  let token, doctora, fisio, oculto, servicio;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const rol = await db.Rol.create({ nombre: 'Admin', permisos: PERMISOS_POR_DEFECTO.Admin });
    await db.Usuario.create({
      nombre: 'Admin', email: 'admin@equipo.test', password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true,
    });
    const login = await request(app).post('/staff/login').send({ email: 'admin@equipo.test', password: 'secret123' });
    token = login.body.token;

    servicio = await db.Servicio.create({ nombre: 'Masaje relajante', duracion_min: 60, precio: 150, activo: true });
    const inactivo = await db.Servicio.create({ nombre: 'Ya no se ofrece', duracion_min: 30, precio: 50, activo: false });
    doctora = await db.Profesional.create({
      nombre: 'Dra. María Noemí Ponce', biografia: 'Médico estético.', mostrar_en_web: true, orden_web: 0,
      formacion: [{ titulo: 'SEDES', detalle: 'Matriculada' }],
    });
    fisio = await db.Profesional.create({ nombre: 'Lic. Ana Rojas', biografia: 'Fisioterapeuta.', mostrar_en_web: true, orden_web: 1 });
    oculto = await db.Profesional.create({ nombre: 'Dr. Sin Perfil' });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: fisio.id });
    await db.ServicioProfesional.create({ servicio_id: inactivo.id, profesional_id: fisio.id });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('cada profesional recibe una dirección sin título ni tildes, que no se repite', async () => {
    expect(doctora.slug).toBe('maria-noemi-ponce');
    expect(fisio.slug).toBe('ana-rojas');
    const otra = await db.Profesional.create({ nombre: 'Dra. Maria Noemi Ponce' });
    expect(otra.slug).toBe('maria-noemi-ponce-2');
    await otra.destroy();
  });

  test('la dirección no cambia al renombrar', async () => {
    oculto.nombre = 'Dr. Otro Nombre';
    await oculto.save();
    expect(oculto.slug).toBe('sin-perfil');
  });

  test('GET /equipo lista solo a quien está en la web, en orden y sin datos internos', async () => {
    const res = await request(app).get('/equipo');
    expect(res.status).toBe(200);
    expect(res.body.map((p) => p.slug)).toEqual(['maria-noemi-ponce', 'ana-rojas']);
    expect(res.body[0].formacion).toEqual([{ titulo: 'SEDES', detalle: 'Matriculada' }]);
    expect(res.body[0]).not.toHaveProperty('usuario_id');
    expect(res.body[0]).not.toHaveProperty('mostrar_en_web');
    expect(res.body[1].Servicios.map((s) => s.nombre)).toEqual(['Masaje relajante']);
  });

  test('GET /equipo/:slug devuelve el perfil, y 404 si no está publicado', async () => {
    const ok = await request(app).get('/equipo/ana-rojas');
    expect(ok.status).toBe(200);
    expect(ok.body.nombre).toBe('Lic. Ana Rojas');
    expect((await request(app).get('/equipo/sin-perfil')).status).toBe(404);
    expect((await request(app).get('/equipo/no-existe')).status).toBe(404);
  });

  test('un profesional inactivo deja de aparecer aunque esté marcado para la web', async () => {
    await fisio.update({ activo: false });
    const res = await request(app).get('/equipo');
    expect(res.body.map((p) => p.slug)).toEqual(['maria-noemi-ponce']);
    await fisio.update({ activo: true });
  });

  test('GET /profesionales no expone datos internos', async () => {
    const res = await request(app).get('/profesionales');
    expect(Object.keys(res.body[0]).sort()).toEqual(['cargo', 'especialidad', 'foto_url', 'id', 'nombre', 'slug']);
  });

  test('el panel guarda cargo, biografía, formación, orden y "mostrar en la web"', async () => {
    const res = await request(app)
      .patch(`/staff/profesionales/${oculto.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        cargo: '  Médico general ',
        biografia: 'Atiende consultas.',
        formacion: [{ titulo: ' UMSS ', detalle: 'Medicina' }, { titulo: '', detalle: '  ' }],
        orden_web: 5,
        mostrar_en_web: true,
      });
    expect(res.status).toBe(200);
    expect(res.body.cargo).toBe('Médico general');
    expect(res.body.formacion).toEqual([{ titulo: 'UMSS', detalle: 'Medicina' }]);
    const equipo = await request(app).get('/equipo');
    expect(equipo.body.map((p) => p.slug)).toEqual(['maria-noemi-ponce', 'ana-rojas', 'sin-perfil']);
  });

  test('no deja mostrar en la web a alguien sin biografía', async () => {
    const res = await request(app)
      .patch(`/staff/profesionales/${oculto.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ biografia: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/biografía/);
  });

  test('rechaza formación u orden inválidos', async () => {
    const auth = { Authorization: `Bearer ${token}` };
    expect((await request(app).patch(`/staff/profesionales/${fisio.id}`).set(auth).send({ formacion: 'texto' })).status).toBe(400);
    expect((await request(app).patch(`/staff/profesionales/${fisio.id}`).set(auth).send({ orden_web: -1 })).status).toBe(400);
  });

  test('sube y quita la foto del profesional', async () => {
    const auth = { Authorization: `Bearer ${token}` };
    const subida = await request(app)
      .post(`/staff/profesionales/${fisio.id}/foto`)
      .set(auth)
      .attach('foto', pngFalso(), { filename: 'ana.png', contentType: 'image/png' });
    expect(subida.status).toBe(200);
    expect(subida.body.foto_url).toMatch(/^\/uploads\/profesionales\/profesional-\d+-\d+\.png$/);

    const quitada = await request(app).delete(`/staff/profesionales/${fisio.id}/foto`).set(auth);
    expect(quitada.status).toBe(200);
    expect(quitada.body.foto_url).toBeNull();
  });

  test('rechaza una foto en formato no soportado', async () => {
    const res = await request(app)
      .post(`/staff/profesionales/${fisio.id}/foto`)
      .set('Authorization', `Bearer ${token}`)
      .attach('foto', Buffer.from('GIF89a'), { filename: 'a.gif', contentType: 'image/gif' });
    expect(res.status).toBe(400);
  });
});
