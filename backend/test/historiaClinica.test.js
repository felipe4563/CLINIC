const { SECCIONES, COLUMNAS_PROTOCOLO } = require('../src/config/historiaClinica');
const { validarSeccion, validarProtocolo, ErrorValidacion } = require('../src/services/historiaClinica');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');

describe('Historia clínica: definición y validación', () => {
  test('la definición tiene las tres secciones y claves únicas por sección (incluidos los detalles)', () => {
    expect(SECCIONES.map((s) => s.clave)).toEqual(['datos_clinicos', 'datos_esteticos', 'analisis_estetico']);
    for (const seccion of SECCIONES) {
      const claves = [];
      for (const grupo of seccion.grupos) {
        for (const campo of grupo.campos) {
          expect(['check', 'texto', 'parrafo', 'opcion']).toContain(campo.tipo);
          claves.push(campo.clave);
          for (const det of campo.detalles || []) claves.push(`${campo.clave}_${det.clave}`);
          if (campo.tipo === 'opcion') expect(campo.opciones.length).toBeGreaterThan(1);
        }
      }
      expect(new Set(claves).size).toBe(claves.length);
    }
    expect(COLUMNAS_PROTOCOLO.map((c) => c.clave)).toEqual(['procedimiento', 'sesiones', 'comentario']);
  });

  test('descarta claves desconocidas y vacías, y recorta textos', () => {
    const limpio = validarSeccion('datos_clinicos', {
      alergias: true,
      cardiovascular: false,
      tabaco: true,
      tabaco_frecuencia: '  diario  ',
      especificar: '',
      inventado: 'x',
      dieta: 'vegana',
    });
    expect(limpio).toEqual({ alergias: true, cardiovascular: false, tabaco: true, tabaco_frecuencia: 'diario', dieta: 'vegana' });
  });

  test('rechaza tipos y opciones inválidas indicando el campo', () => {
    expect(() => validarSeccion('datos_clinicos', { alergias: 'si' })).toThrow(ErrorValidacion);
    try {
      validarSeccion('analisis_estetico', { fototipo: 'VII' });
    } catch (err) {
      expect(err).toBeInstanceOf(ErrorValidacion);
      expect(err.campo).toBe('fototipo');
    }
    expect(() => validarSeccion('analisis_estetico', { fototipo: 'VII' })).toThrow(ErrorValidacion);
  });

  test('respeta los límites de largo', () => {
    expect(() => validarSeccion('datos_clinicos', { tabaco_frecuencia: 'x'.repeat(501) })).toThrow(ErrorValidacion);
    expect(validarSeccion('datos_clinicos', { especificar: 'x'.repeat(4000) }).especificar).toHaveLength(4000);
    expect(() => validarSeccion('datos_clinicos', { especificar: 'x'.repeat(4001) })).toThrow(ErrorValidacion);
  });

  test('datos que no son objeto se tratan como vacíos', () => {
    expect(validarSeccion('datos_esteticos', null)).toEqual({});
    expect(validarSeccion('datos_esteticos', ['a'])).toEqual({});
  });

  test('valida el protocolo: descarta filas vacías y limita cantidad', () => {
    expect(validarProtocolo([
      { procedimiento: ' Toxina ', sesiones: '3', comentario: '' },
      { procedimiento: '', sesiones: '', comentario: '' },
    ])).toEqual([{ procedimiento: 'Toxina', sesiones: '3', comentario: '' }]);
    expect(validarProtocolo(undefined)).toEqual([]);
    expect(() => validarProtocolo(Array.from({ length: 21 }, () => ({ procedimiento: 'x' })))).toThrow(ErrorValidacion);
  });
});

async function crearUsuario({ email, rolNombre }) {
  const [rol] = await db.Rol.findOrCreate({ where: { nombre: rolNombre }, defaults: { permisos: PERMISOS_POR_DEFECTO[rolNombre] || [] } });
  return db.Usuario.create({ nombre: rolNombre, email, password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true });
}
async function login(email) {
  return (await request(app).post('/staff/login').send({ email, password: 'secret123' })).body.token;
}

describe('Historia clínica: API', () => {
  let tokenAdmin, tokenRecepcion, paciente, otraPaciente, profesional, servicio;
  const auth = (t = tokenAdmin) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    await crearUsuario({ email: 'admin@test.com', rolNombre: 'Admin' });
    await crearUsuario({ email: 'recepcion@test.com', rolNombre: 'Recepcion' });
    tokenAdmin = await login('admin@test.com');
    tokenRecepcion = await login('recepcion@test.com');
    paciente = await db.Paciente.create({ nombre_completo: 'Ana Pérez', telefono: '59170000001', codigo_paciente: 'P-0001', carnet_identidad: '1234567', carnet_expedido: 'CB', fecha_nacimiento: '1990-05-10' });
    otraPaciente = await db.Paciente.create({ nombre_completo: 'Beto', telefono: '59170000002', codigo_paciente: 'P-0002', carnet_identidad: '7654321', carnet_expedido: 'LP' });
    profesional = await db.Profesional.create({ nombre: 'Dra. Noemí', activo: true });
    servicio = await db.Servicio.create({ nombre: 'Limpieza facial', duracion_min: 30, precio: 150 });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('el permiso historia_clinica viene por defecto para Admin y Profesional, no Recepción', () => {
    expect(PERMISOS_POR_DEFECTO.Admin).toContain('historia_clinica');
    expect(PERMISOS_POR_DEFECTO.Profesional).toContain('historia_clinica');
    expect(PERMISOS_POR_DEFECTO.Recepcion).not.toContain('historia_clinica');
  });

  test('las columnas JSON se leen como objetos (también si la base las devuelve como texto)', async () => {
    const h = await db.HistoriaClinica.create({
      paciente_id: paciente.id, fecha: '2026-10-01', datos_clinicos: { alergias: true }, datos_esteticos: {}, analisis_estetico: {}, protocolo: [],
    });
    const fresca = await db.HistoriaClinica.findByPk(h.id);
    expect(fresca.datos_clinicos).toEqual({ alergias: true });
    expect(fresca.protocolo).toEqual([]);
    await h.destroy();
  });

  test('PATCH de paciente guarda los datos personales nuevos y valida los ENUM', async () => {
    let res = await request(app).patch(`/staff/pacientes/${paciente.id}`).set(auth()).send({
      sexo: 'F', estado_civil: 'S', grupo_sanguineo: 'O+', direccion: 'Calle 1', ocupacion: 'Abogada',
      email: 'ana@correo.com', contacto_emergencia: 'Luis Pérez', parentesco_emergencia: 'Hermano',
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ sexo: 'F', estado_civil: 'S', grupo_sanguineo: 'O+', parentesco_emergencia: 'Hermano' });
    res = await request(app).patch(`/staff/pacientes/${paciente.id}`).set(auth()).send({ ocupacion: '' });
    expect(res.body.ocupacion).toBeNull();
    expect((await request(app).patch(`/staff/pacientes/${paciente.id}`).set(auth()).send({ sexo: 'X' })).status).toBe(400);
  });

  test('Recepción no puede ver la historia clínica', async () => {
    expect((await request(app).get(`/staff/pacientes/${paciente.id}/historias`).set(auth(tokenRecepcion))).status).toBe(403);
    expect((await request(app).get('/staff/historia-clinica/definicion').set(auth(tokenRecepcion))).status).toBe(403);
  });

  test('entrega la definición del formulario', async () => {
    const res = await request(app).get('/staff/historia-clinica/definicion').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.secciones.map((s) => s.clave)).toEqual(['datos_clinicos', 'datos_esteticos', 'analisis_estetico']);
  });

  test('crear, guardar, listar con alerta de alergias y copiar una evaluación', async () => {
    let res = await request(app).post(`/staff/pacientes/${paciente.id}/historias`).set(auth()).send({});
    expect(res.status).toBe(201);
    const primera = res.body;
    expect(primera.datos_clinicos).toEqual({});

    res = await request(app).put(`/staff/historias/${primera.id}`).set(auth()).send({
      fecha: '2026-09-01',
      motivo_consulta: 'Manchas en mejillas',
      datos_clinicos: { alergias: true, especificar: 'Penicilina', desconocido: 1 },
      analisis_estetico: { fototipo: 'III' },
      diagnostico: 'Melasma',
      protocolo: [{ procedimiento: 'Peeling', sesiones: '4', comentario: '' }],
      profesional_id: profesional.id,
    });
    expect(res.status).toBe(200);
    expect(res.body.datos_clinicos).toEqual({ alergias: true, especificar: 'Penicilina' });
    expect(res.body.procedimiento_autorizado).toBe('Peeling');

    res = await request(app).get(`/staff/pacientes/${paciente.id}/historias`).set(auth());
    expect(res.body.historias).toHaveLength(1);
    expect(res.body.alerta).toEqual({ alergias: true, detalle: 'Penicilina' });

    res = await request(app).post(`/staff/pacientes/${paciente.id}/historias`).set(auth()).send({ copiarDe: primera.id });
    expect(res.status).toBe(201);
    expect(res.body.analisis_estetico).toEqual({ fototipo: 'III' });
    expect(res.body.diagnostico).toBe('Melasma');
    expect(res.body.motivo_consulta).toBeNull();
    expect(res.body.documento_firmado).toBeNull();
    expect(res.body.id).not.toBe(primera.id);
  });

  test('no se copia una evaluación de otra paciente, y un dato inválido responde 400', async () => {
    const ajena = await db.HistoriaClinica.create({ paciente_id: otraPaciente.id, fecha: '2026-09-01', datos_clinicos: {}, datos_esteticos: {}, analisis_estetico: {}, protocolo: [] });
    expect((await request(app).post(`/staff/pacientes/${paciente.id}/historias`).set(auth()).send({ copiarDe: ajena.id })).status).toBe(400);
    const res = await request(app).put(`/staff/historias/${ajena.id}`).set(auth()).send({ analisis_estetico: { fototipo: 'VII' } });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/fototipo/);
  });

  test('solo un Admin borra una evaluación', async () => {
    const h = await db.HistoriaClinica.create({ paciente_id: otraPaciente.id, fecha: '2026-09-02', datos_clinicos: {}, datos_esteticos: {}, analisis_estetico: {}, protocolo: [] });
    await crearUsuario({ email: 'prof@test.com', rolNombre: 'Profesional' });
    const tokenProf = await login('prof@test.com');
    expect((await request(app).delete(`/staff/historias/${h.id}`).set(auth(tokenProf))).status).toBe(403);
    expect((await request(app).delete(`/staff/historias/${h.id}`).set(auth())).status).toBe(204);
    expect(await db.HistoriaClinica.findByPk(h.id)).toBeNull();
  });

  test('lista los especialistas para quien tiene historia_clinica (aunque no tenga catálogo)', async () => {
    await crearUsuario({ email: 'prof-lista@test.com', rolNombre: 'Profesional' });
    const res = await request(app).get('/staff/historia-clinica/profesionales').set(auth(await login('prof-lista@test.com')));
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining([{ id: profesional.id, nombre: 'Dra. Noemí' }]));
    expect((await request(app).get('/staff/historia-clinica/profesionales').set(auth(tokenRecepcion))).status).toBe(403);
  });

  test('tratamiento realizado: citas completadas del rango, notas manuales y "falta observación"', async () => {
    const p = await db.Paciente.create({ nombre_completo: 'Caro', telefono: '59170000003', codigo_paciente: 'P-0003', carnet_identidad: '111', carnet_expedido: 'CB' });
    const base = { datos_clinicos: {}, datos_esteticos: {}, analisis_estetico: {}, protocolo: [] };
    const h1 = await db.HistoriaClinica.create({ ...base, paciente_id: p.id, fecha: '2026-08-01' });
    const h2 = await db.HistoriaClinica.create({ ...base, paciente_id: p.id, fecha: '2026-09-01' });
    const cita = (fecha, estado = 'completada', hora = '10:00:00') => db.Cita.create({
      paciente_id: p.id, profesional_id: profesional.id, servicio_id: servicio.id, fecha, hora_inicio: hora, hora_fin: '10:30:00', estado,
    });
    const c1 = await cita('2026-08-05');
    await db.NotaClinica.create({ paciente_id: p.id, cita_id: c1.id, fecha: '2026-08-05', titulo: 'Limpieza', notas: 'Buena respuesta' });
    await cita('2026-08-20');
    await cita('2026-08-21', 'cancelada');
    await cita('2026-09-01');
    await db.NotaClinica.create({ paciente_id: p.id, fecha: '2026-08-10', titulo: 'Peeling (antes del sistema)', notas: 'Sin complicaciones' });

    let res = await request(app).get(`/staff/historias/${h1.id}`).set(auth());
    expect(res.body.tratamientos.desde).toBe('2026-08-01');
    expect(res.body.tratamientos.hasta).toBe('2026-09-01');
    expect(res.body.tratamientos.filas.map((f) => [f.fecha, f.tipo, f.procedimiento, f.observacion, f.faltaObservacion])).toEqual([
      ['2026-08-05', 'cita', 'Limpieza facial', 'Buena respuesta', false],
      ['2026-08-10', 'manual', 'Peeling (antes del sistema)', 'Sin complicaciones', false],
      ['2026-08-20', 'cita', 'Limpieza facial', null, true],
    ]);

    res = await request(app).get(`/staff/historias/${h2.id}`).set(auth());
    expect(res.body.tratamientos.hasta).toBeNull();
    expect(res.body.tratamientos.filas.map((f) => f.fecha)).toEqual(['2026-09-01']);
  });

  test('crear la nota de sesión de una cita completada: sin chocar con la cita y sin duplicar', async () => {
    const c = await db.Cita.create({
      paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id, fecha: '2026-09-15', hora_inicio: '11:00:00', hora_fin: '11:30:00', estado: 'completada',
    });
    let res = await request(app).post(`/staff/pacientes/${paciente.id}/tratamientos`).set(auth()).send({ citaId: c.id, titulo: 'Limpieza facial', notas: 'Piel hidratada' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ cita_id: c.id, fecha: '2026-09-15', profesional_id: profesional.id });
    res = await request(app).post(`/staff/pacientes/${paciente.id}/tratamientos`).set(auth()).send({ citaId: c.id, titulo: 'x', notas: 'y' });
    expect(res.status).toBe(409);

    const pendiente = await db.Cita.create({
      paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id, fecha: '2026-09-16', hora_inicio: '11:00:00', hora_fin: '11:30:00', estado: 'confirmada',
    });
    expect((await request(app).post(`/staff/pacientes/${paciente.id}/tratamientos`).set(auth()).send({ citaId: pendiente.id, titulo: 'x', notas: 'y' })).status).toBe(400);
    expect((await request(app).post(`/staff/pacientes/${otraPaciente.id}/tratamientos`).set(auth()).send({ citaId: c.id, titulo: 'x', notas: 'y' })).status).toBe(400);
  });
});
