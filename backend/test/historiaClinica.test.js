const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.PRIVADO_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'privado-hc-'));

const { SECCIONES, COLUMNAS_PROTOCOLO, DIR_GUIAS } = require('../src/config/historiaClinica');
const { validarSeccion, validarProtocolo, ErrorValidacion } = require('../src/services/historiaClinica');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');
const { pngFalso, pdfFalso, exeFalso, jpgFalso, pngReal } = require('./helpers/archivos');
const { armarDocumento } = require('../src/services/historiaClinicaDocumento');

function binario(res, cb) {
  const partes = [];
  res.on('data', (c) => partes.push(c));
  res.on('end', () => cb(null, Buffer.concat(partes)));
}

describe('Historia clínica: definición y validación', () => {
  test('la definición tiene las tres secciones y claves únicas por sección (incluidos los detalles)', () => {
    expect(SECCIONES.map((s) => s.clave)).toEqual(['datos_clinicos', 'datos_esteticos', 'analisis_estetico']);
    for (const seccion of SECCIONES) {
      const claves = [];
      for (const grupo of seccion.grupos) {
        for (const campo of grupo.campos) {
          expect(['check', 'texto', 'parrafo', 'opcion', 'numero', 'fecha', 'subtitulo']).toContain(campo.tipo);
          if (campo.tipo === 'subtitulo') {
            expect(campo.clave).toBeUndefined();
            continue;
          }
          claves.push(campo.clave);
          for (const det of campo.detalles || []) claves.push(`${campo.clave}_${det.clave}`);
          if (campo.tipo === 'opcion') expect(campo.opciones.length).toBeGreaterThan(1);
        }
      }
      expect(new Set(claves).size).toBe(claves.length);
      for (const grupo of seccion.grupos) {
        if (grupo.imagen) expect(fs.existsSync(path.join(DIR_GUIAS, grupo.imagen))).toBe(true);
      }
    }
    expect(COLUMNAS_PROTOCOLO.map((c) => c.clave)).toEqual(['procedimiento', 'sesiones', 'comentario']);
  });

  test('descarta claves desconocidas (incluidas las que se quitaron del formulario) y recorta textos', () => {
    const limpio = validarSeccion('datos_clinicos', {
      alergias: true,
      cardiovascular: false,
      tabaco: true,
      tabaco_frecuencia: '  diario  ',
      especificar: '',
      inventado: 'x',
      dieta: 'vegana',
      esterilizacion: true,
      menstruacion_dolorosa: true,
      sexual: true,
      odontologica: true,
      agua: '  2 litros ',
    });
    expect(limpio).toEqual({ alergias: true, cardiovascular: false, tabaco: true, tabaco_frecuencia: 'diario', agua: '2 litros' });
  });

  test('números de la fórmula obstétrica: enteros 0–99, también si llegan como texto', () => {
    expect(validarSeccion('datos_clinicos', { gestas: 2, partos: '1', cesareas: '', abortos: 0 })).toEqual({ gestas: 2, partos: 1, abortos: 0 });
    expect(validarSeccion('datos_clinicos', { gestas: '   ', partos: ' 3 ' })).toEqual({ partos: 3 });
    for (const malo of ['abc', -1, 100, 1.5, true, '1e1', '0x10', '1.5', '-1', '100', '1 2']) {
      try {
        validarSeccion('datos_clinicos', { gestas: malo });
        throw new Error(`aceptó ${malo}`);
      } catch (err) {
        expect(err).toBeInstanceOf(ErrorValidacion);
        expect(err.campo).toBe('gestas');
      }
    }
  });

  test('FUM: fecha YYYY-MM-DD real', () => {
    expect(validarSeccion('datos_clinicos', { fum: '2026-09-30' })).toEqual({ fum: '2026-09-30' });
    expect(validarSeccion('datos_clinicos', { fum: '' })).toEqual({});
    for (const malo of ['2026-02-30', '30/09/2026', 5]) {
      expect(() => validarSeccion('datos_clinicos', { fum: malo })).toThrow(ErrorValidacion);
    }
  });

  test('el formulario tiene los grupos pedidos por la clínica', () => {
    const titulos = (clave) => SECCIONES.find((s) => s.clave === clave).grupos.map((g) => g.titulo);
    expect(titulos('datos_clinicos')).toEqual([
      'Antecedentes personales patológicos',
      'Antecedentes personales no patológicos',
      'Antecedentes ginecológicos',
      'Hábitos de vida',
      'Alimentación',
    ]);
    expect(titulos('datos_esteticos')).toEqual(['Rutina facial (skin care)', 'Mascarillas y exfoliantes', 'Antecedentes estéticos']);
    expect(titulos('analisis_estetico')).toEqual([
      'Fototipo Fitzpatrick', 'Escala de Glogau', 'Biotipo de piel', 'Grado de deshidratación', 'Grosor de piel',
      'Evaluación de la piel', 'Cicatrices', 'Tipo facial', 'Ubicación de grasa corporal',
      'Arrugas', 'Líneas de expresión', 'Clínica cutánea', 'Acné',
    ]);
    const semiologia = SECCIONES.find((s) => s.clave === 'analisis_estetico').grupos.filter((g) => g.apartado === 'Semiología cutánea');
    expect(semiologia.map((g) => g.titulo)).toEqual(['Arrugas', 'Líneas de expresión', 'Clínica cutánea', 'Acné']);
  });

  test('cambios de la doctora (audios del 15/10): etiquetas, orden y campos quitados', () => {
    const grupo = (seccion, titulo) => SECCIONES.find((s) => s.clave === seccion).grupos.find((g) => g.titulo === titulo);
    const etiquetas = (seccion, titulo) => grupo(seccion, titulo).campos.map((c) => c.etiqueta);
    const patologicos = etiquetas('datos_clinicos', 'Antecedentes personales patológicos');
    expect(patologicos).toEqual(expect.arrayContaining(['Cardiología', 'Neumología', 'Reumatología', 'Psicológico', 'Implante mamario', 'Hematología']));
    expect(patologicos).not.toContain('Sexual');
    expect(patologicos).not.toContain('Odontológica');
    expect(etiquetas('datos_clinicos', 'Antecedentes ginecológicos')).toEqual([
      'Fórmula obstétrica', 'Gestas', 'Partos', 'Cesáreas', 'Abortos', 'Menopausia', 'Planificación familiar (método)', 'Ciclo menstrual',
      'Fecha de última menstruación (FUM)',
    ]);
    expect(etiquetas('datos_clinicos', 'Hábitos de vida').slice(0, 7)).toEqual([
      'Tabaco', 'Alcohol', 'Drogas', 'Cafeína', 'Actividad física', 'Calidad de sueño', 'Cantidad de agua al día',
    ]);
    expect(etiquetas('analisis_estetico', 'Biotipo de piel')).not.toContain('Asfíctica');
    expect(etiquetas('analisis_estetico', 'Biotipo de piel')).toContain('Otros');
    expect(etiquetas('analisis_estetico', 'Evaluación de la piel').slice(0, 7)).toEqual([
      'Mácula', 'Nevus', 'Hiperpigmentación', 'Hipopigmentación', 'Efélides', 'Melasma', 'Léntigos solares',
    ]);
    expect(grupo('analisis_estetico', 'Acné').campos[0].opciones.map((op) => op.etiqueta)).toEqual(['Grado 1', 'Grado 2', 'Grado 3', 'Grado 4']);
    expect(grupo('analisis_estetico', 'Escala de Glogau').campos[0].opciones.map((op) => op.clave)).toEqual(['I', 'II', 'III', 'IV']);
    // Datos guardados con claves de antes siguen valiendo; los quitados se descartan.
    expect(validarSeccion('analisis_estetico', { hiper_mancha: true, piel_asfictica: true, flacidez_grado: 'I', hipo_vitiligo: true, glogau: 'III' }))
      .toEqual({ hiper_mancha: true, glogau: 'III' });
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
    fs.rmSync(process.env.PRIVADO_DIR, { recursive: true, force: true });
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

  test('subir, ver, reemplazar y quitar el documento firmado', async () => {
    const h = await db.HistoriaClinica.create({ paciente_id: paciente.id, fecha: '2026-10-01', datos_clinicos: {}, datos_esteticos: {}, analisis_estetico: {}, protocolo: [] });
    const ruta = `/staff/historias/${h.id}/documento-firmado`;

    expect((await request(app).post(ruta).set(auth()).attach('archivo', exeFalso(), { filename: 'x.png', contentType: 'image/png' })).status).toBe(400);
    expect((await request(app).post(ruta).set(auth())).status).toBe(400);

    let res = await request(app).post(ruta).set(auth()).attach('archivo', pngFalso(), { filename: 'firmado.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    const primero = res.body.documento_firmado;
    expect(fs.existsSync(path.join(process.env.PRIVADO_DIR, 'historias', primero))).toBe(true);

    res = await request(app).get(ruta).set(auth());
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
    expect((await request(app).get(ruta).set(auth(tokenRecepcion))).status).toBe(403);

    res = await request(app).post(ruta).set(auth()).attach('archivo', pngFalso(), { filename: 'otra.png', contentType: 'image/png' });
    expect(fs.existsSync(path.join(process.env.PRIVADO_DIR, 'historias', primero))).toBe(false);

    res = await request(app).delete(ruta).set(auth());
    expect(res.body.documento_firmado).toBeNull();
    expect(fs.readdirSync(path.join(process.env.PRIVADO_DIR, 'historias'))).toHaveLength(0);
  });

  test('borrar paciente: 409 si tiene notas o puntos (el archivo firmado sigue), 204 y archivo borrado si no', async () => {
    const dirHistorias = path.join(process.env.PRIVADO_DIR, 'historias');
    const subir = async (historiaId) => (await request(app).post(`/staff/historias/${historiaId}/documento-firmado`).set(auth())
      .attach('archivo', pngFalso(), { filename: 'f.png', contentType: 'image/png' })).body.documento_firmado;

    const conNota = await db.Paciente.create({ nombre_completo: 'Con Nota', telefono: '59170000091', codigo_paciente: 'P-0091', carnet_identidad: '91', carnet_expedido: 'CB' });
    const h1 = await db.HistoriaClinica.create({ paciente_id: conNota.id, fecha: '2026-10-01', datos_clinicos: {}, datos_esteticos: {}, analisis_estetico: {}, protocolo: [] });
    const archivo1 = await subir(h1.id);
    await db.NotaClinica.create({ paciente_id: conNota.id, fecha: '2026-10-01', titulo: 'Nota', notas: 'x' });
    let res = await request(app).delete(`/staff/pacientes/${conNota.id}`).set(auth());
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/notas clínicas/);
    expect(fs.existsSync(path.join(dirHistorias, archivo1))).toBe(true);
    expect(await db.HistoriaClinica.findByPk(h1.id)).not.toBeNull();

    const conPuntos = await db.Paciente.create({ nombre_completo: 'Con Puntos', telefono: '59170000092', codigo_paciente: 'P-0092', carnet_identidad: '92', carnet_expedido: 'CB' });
    await db.MovimientoPuntos.create({ paciente_id: conPuntos.id, tipo: 'ajuste', puntos: 5, motivo: 'x' });
    res = await request(app).delete(`/staff/pacientes/${conPuntos.id}`).set(auth());
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/puntos/);

    const limpia = await db.Paciente.create({ nombre_completo: 'Limpia', telefono: '59170000093', codigo_paciente: 'P-0093', carnet_identidad: '93', carnet_expedido: 'CB' });
    const h2 = await db.HistoriaClinica.create({ paciente_id: limpia.id, fecha: '2026-10-01', datos_clinicos: {}, datos_esteticos: {}, analisis_estetico: {}, protocolo: [] });
    const archivo2 = await subir(h2.id);
    expect(fs.existsSync(path.join(dirHistorias, archivo2))).toBe(true);
    res = await request(app).delete(`/staff/pacientes/${limpia.id}`).set(auth());
    expect(res.status).toBe(204);
    expect(await db.HistoriaClinica.findByPk(h2.id)).toBeNull();
    expect(fs.existsSync(path.join(dirHistorias, archivo2))).toBe(false);

    // Admin borra una evaluación: el archivo firmado también desaparece.
    const h3 = await db.HistoriaClinica.create({ paciente_id: conNota.id, fecha: '2026-10-02', datos_clinicos: {}, datos_esteticos: {}, analisis_estetico: {}, protocolo: [] });
    const archivo3 = await subir(h3.id);
    expect((await request(app).delete(`/staff/historias/${h3.id}`).set(auth())).status).toBe(204);
    expect(fs.existsSync(path.join(dirHistorias, archivo3))).toBe(false);

    await db.HistoriaClinica.destroy({ where: { paciente_id: conNota.id } });
    fs.rmSync(path.join(dirHistorias, archivo1), { force: true });
    await db.NotaClinica.destroy({ where: { paciente_id: conNota.id } });
    await db.MovimientoPuntos.destroy({ where: { paciente_id: conPuntos.id } });
  });

  test('PATCH de paciente rechaza textos personales demasiado largos; PUT de historia rechaza fechas imposibles', async () => {
    const largos = { direccion: 256, ocupacion: 121, email: 161, contacto_emergencia: 161, parentesco_emergencia: 61 };
    for (const [campo, n] of Object.entries(largos)) {
      const res = await request(app).patch(`/staff/pacientes/${paciente.id}`).set(auth()).send({ [campo]: 'a'.repeat(n) });
      expect(res.status).toBe(400);
      expect(res.body.campo).toBe(campo);
    }
    expect((await request(app).patch(`/staff/pacientes/${paciente.id}`).set(auth()).send({ direccion: 'a'.repeat(255) })).status).toBe(200);

    const h = await db.HistoriaClinica.create({ paciente_id: paciente.id, fecha: '2026-10-01', datos_clinicos: {}, datos_esteticos: {}, analisis_estetico: {}, protocolo: [] });
    for (const fecha of ['2026-13-45', '2026-02-30', '2026-00-10']) {
      expect((await request(app).put(`/staff/historias/${h.id}`).set(auth()).send({ fecha })).status).toBe(400);
    }
    expect((await request(app).put(`/staff/historias/${h.id}`).set(auth()).send({ fecha: '2028-02-29' })).status).toBe(200);
    await h.destroy();
  });

  test('armarDocumento: datos personales, casillas con detalles, opciones y consentimiento', () => {
    const doc = armarDocumento({
      config: { nombre_consultorio: 'Clinic NovagED' },
      paciente: { nombre_completo: 'Ana Pérez', codigo_paciente: 'P-0001', carnet_identidad: '1234567', carnet_complemento: null, carnet_expedido: 'CB', fecha_nacimiento: '1990-05-10', sexo: 'F', telefono: '591' },
      historia: {
        fecha: '2026-10-01', motivo_consulta: 'Manchas', datos_clinicos: { tabaco: true, tabaco_frecuencia: 'diario' }, datos_esteticos: {},
        analisis_estetico: { fototipo: 'III' }, diagnostico: 'Melasma', protocolo: [{ procedimiento: 'Peeling', sesiones: '4', comentario: '' }],
        procedimiento_autorizado: 'Peeling', Profesional: { nombre: 'Dra. Noemí' },
      },
      tratamientos: { filas: [{ fecha: '2026-10-05', procedimiento: 'Peeling', observacion: 'Bien' }] },
    });
    expect(doc.numero).toBe('P-0001');
    const campos = doc.bloques.filter((b) => b.tipo === 'campo');
    expect(campos).toEqual(expect.arrayContaining([
      { tipo: 'campo', etiqueta: 'Edad', valor: '36' },
      { tipo: 'campo', etiqueta: 'C.I.', valor: '1234567 CB' },
    ]));
    const tabaco = doc.bloques.flatMap((b) => (b.tipo === 'casillas' ? b.items : [])).find((i) => i.etiqueta === 'Tabaco');
    expect(tabaco).toEqual({ etiqueta: 'Tabaco', marcado: true, detalles: [{ etiqueta: 'Frecuencia', valor: 'diario' }] });
    const fototipo = doc.bloques.flatMap((b) => (b.tipo === 'casillas' ? b.items : [])).filter((i) => ['I', 'II', 'III'].includes(i.etiqueta)).slice(0, 3); // las 3 primeras son del fototipo (flacidez y acné también tienen grados)
    expect(fototipo.map((i) => i.marcado)).toEqual([false, false, true]);
    // Las opciones llevan solo la etiqueta (sin línea para llenar) encima de sus casillas.
    expect(doc.bloques.filter((b) => b.tipo === 'campo' && ['Sexo', 'Estado civil'].includes(b.etiqueta))).toEqual([]);
    expect(doc.bloques).toEqual(expect.arrayContaining([{ tipo: 'etiqueta', texto: 'Sexo' }, { tipo: 'etiqueta', texto: 'Fototipo' }]));
    const campoConsentimiento = (etiqueta) => doc.bloques.slice(doc.bloques.findIndex((b) => b.tipo === 'consentimiento')).filter((b) => b.tipo === 'campo' && b.etiqueta === etiqueta).map((b) => b.valor);
    expect(campoConsentimiento('Nombre completo')).toEqual(['Dra. Noemí', 'Ana Pérez']);
    expect(campoConsentimiento('Clínica/Consultorio')).toEqual(['Clinic NovagED']);
    expect(campoConsentimiento('Documento de identidad')).toEqual(['1234567 CB']);
    // El protocolo ya no se imprime: la única tabla es la de tratamiento.
    expect(doc.bloques.filter((b) => b.tipo === 'tabla').map((t) => t.filas)).toEqual([[['05/10/2026', 'Peeling', 'Bien']]]);
  });

  test('documento: emitido, grupos nuevos, guías, fotos y consentimientos', () => {
    const historia = {
      fecha: '2026-10-01',
      datos_clinicos: { gestas: 2, fum: '2026-09-15', no_patologicos: 'Vive con su familia' },
      datos_esteticos: { antecedente_1: 'Toxina 2025' },
      analisis_estetico: { tipo_facial: 'mesofacial', grasa_muslos: true },
      protocolo: [],
      fotos: [{ archivo: 'a.jpg', nota: 'frente' }, { archivo: 'b.jpg', nota: null, etapa: 'seguimiento' }],
      consentimientos: ['general'],
      Profesional: { nombre: 'Dra. X' },
    };
    const doc = armarDocumento({ config: { nombre_consultorio: 'Clinic' }, paciente: { nombre_completo: 'Ana' }, historia });
    expect(doc.emitido).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    const campo = (etiqueta) => doc.bloques.find((b) => b.tipo === 'campo' && b.etiqueta === etiqueta);
    expect(campo('Gestas').valor).toBe('2');
    expect(campo('Fecha de última menstruación (FUM)').valor).toBe('15/09/2026');
    expect(campo('1.').valor).toBe('Toxina 2025');
    expect(doc.bloques.filter((b) => b.tipo === 'imagen').map((b) => path.basename(b.archivo))).toEqual(['guia-tipos-faciales.png', 'guia-grasa-corporal.png']);
    expect(doc.bloques.find((b) => b.tipo === 'parrafo' && b.etiqueta === 'Diagnóstico').lineas).toBe(6);
    const [iconografia, seguimiento] = doc.bloques.filter((b) => b.tipo === 'fotos');
    expect(iconografia.fotos).toEqual([{ ruta: path.join(process.env.PRIVADO_DIR, 'historias-fotos', 'a.jpg'), nota: 'frente' }]);
    expect(seguimiento.fotos).toEqual([{ ruta: path.join(process.env.PRIVADO_DIR, 'historias-fotos', 'b.jpg'), nota: '' }]);
    const titulos = doc.bloques.filter((b) => b.tipo === 'seccion').map((b) => b.titulo);
    expect(titulos.slice(-5)).toEqual(['5. Iconografía', '6. Diagnóstico', '7. Tratamiento', '8. Seguimiento', '9. Consentimiento']);
    expect(doc.bloques.some((b) => b.tipo === 'grupo' && /Protocolo/.test(b.titulo))).toBe(false);
    expect(doc.bloques.filter((b) => b.tipo === 'apartado').map((b) => b.titulo)).toEqual(['Semiología cutánea']);
    expect(doc.bloques.filter((b) => b.tipo === 'etiqueta').map((b) => b.texto)).toContain('Fórmula obstétrica');
    const consentimiento = doc.bloques.find((b) => b.tipo === 'consentimiento');
    expect(consentimiento.titulo).toBe('Consentimiento informado general – Medicina estética');
    expect(doc.bloques.filter((b) => b.tipo === 'texto').every((b) => !/\{\w+\}/.test(b.texto))).toBe(true);
    expect(doc.bloques.some((b) => b.tipo === 'compromiso')).toBe(false);
  });

  test('documento en blanco: consentimiento general, fotos vacías, emitido presente', () => {
    const doc = armarDocumento({ config: {}, enBlanco: true });
    expect(doc.emitido).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(doc.bloques.find((b) => b.tipo === 'fotos').fotos).toEqual([]);
    expect(doc.bloques.filter((b) => b.tipo === 'consentimiento').map((b) => b.titulo)).toEqual(['Consentimiento informado general – Medicina estética']);
  });

  test('consentimiento de la doctora: 15 apartados, datos del sistema, fotos a mano y tres firmas', () => {
    const doc = armarDocumento({
      config: { nombre_consultorio: 'ClinicNovagED', direccion: 'Calle Lanza N.º 670', ciudad: 'Cochabamba ', telefono: '65359810', email: 'info@novaged.com' },
      paciente: { nombre_completo: 'Ana Pérez', carnet_identidad: '1234567', carnet_expedido: 'CB', fecha_nacimiento: '1990-05-10', telefono: '70000000' },
      historia: {
        fecha: '2026-10-01', motivo_consulta: 'Manchas en la cara', procedimiento_autorizado: 'Peeling médico',
        Profesional: { nombre: 'Dra. Noemí', especialidad: 'Medicina estética', registro_profesional: 'MP-123' },
      },
    });
    const cons = doc.bloques.slice(doc.bloques.findIndex((b) => b.tipo === 'consentimiento'));
    const apartados = cons.filter((b) => b.tipo === 'grupo').map((b) => b.titulo);
    expect(apartados).toHaveLength(15);
    expect(apartados[0]).toBe('1. Identificación del establecimiento');
    expect(apartados[14]).toBe('15. Revocación del consentimiento');
    const valor = (etiqueta) => cons.find((b) => b.tipo === 'campo' && b.etiqueta === etiqueta).valor;
    expect(valor('Dirección')).toBe('Calle Lanza N.º 670, Cochabamba');
    expect(valor('Teléfono y correo electrónico')).toBe('65359810 · info@novaged.com');
    expect(valor('Registro profesional')).toBe('MP-123');
    expect(valor('Especialidad')).toBe('Medicina estética');
    expect(valor('Fecha de nacimiento')).toBe('10/05/1990');
    expect(valor('Teléfono')).toBe('70000000');
    expect(valor('Firma y sello')).toBe('');
    const textos = cons.filter((b) => b.tipo === 'texto').map((b) => b.texto);
    expect(textos).toContain('Solicito valoración médica y tratamiento de medicina estética para la siguiente condición: Manchas en la cara.');
    expect(textos).toContain('Procedimiento indicado: Peeling médico.');
    expect(textos.join(' ')).not.toMatch(/eximo/);
    expect(cons.find((b) => b.tipo === 'casillas').items).toEqual([
      { etiqueta: 'Sí', marcado: false, detalles: [] }, { etiqueta: 'No', marcado: false, detalles: [] },
    ]);
    expect(cons.find((b) => b.tipo === 'firmas').firmantes).toEqual([
      { titulo: 'Firma del paciente', lineas: ['Ana Pérez', 'C.I.: 1234567 CB'] },
      { titulo: 'Firma y sello del médico', lineas: ['Dra. Noemí'] },
      { titulo: 'Testigo (si corresponde)', lineas: ['Nombre:', 'C.I.:'] },
    ]);
  });

  test('consentimiento en blanco: líneas para llenar a mano, sin datos de la clínica', () => {
    const doc = armarDocumento({ config: { nombre_consultorio: 'ClinicNovagED', telefono: '1' }, enBlanco: true });
    const cons = doc.bloques.slice(doc.bloques.findIndex((b) => b.tipo === 'consentimiento'));
    expect(cons.filter((b) => b.tipo === 'campo').every((b) => b.valor === '')).toBe(true);
    expect(cons.filter((b) => b.tipo === 'texto').map((b) => b.texto)).toContain('Procedimiento indicado: ____________________.');
    expect(cons.find((b) => b.tipo === 'firmas').firmantes.map((x) => x.lineas)).toEqual([['C.I.:'], [], ['Nombre:', 'C.I.:']]);
  });

  test('sin consentimientos marcados sale el general', () => {
    const doc = armarDocumento({ config: {}, paciente: {}, historia: { fecha: '2026-10-01', consentimientos: [] } });
    expect(doc.bloques.filter((b) => b.tipo === 'consentimiento')).toHaveLength(1);
  });

  test('armarDocumento en blanco: sin valores y con filas vacías para llenar a mano', () => {
    const doc = armarDocumento({ config: {}, enBlanco: true });
    expect(doc.bloques.filter((b) => b.tipo === 'campo').every((b) => b.valor === '')).toBe(true);
    expect(doc.bloques.filter((b) => b.tipo === 'etiqueta').map((b) => b.texto)).toEqual(expect.arrayContaining(['Sexo', 'Estado civil']));
    expect(doc.bloques.flatMap((b) => (b.tipo === 'casillas' ? b.items : [])).some((i) => i.marcado)).toBe(false);
    expect(doc.bloques.filter((b) => b.tipo === 'tabla').every((t) => t.filas.length === 3)).toBe(true);
  });

  test('descarga el PDF de una evaluación llena al máximo y el formulario en blanco', async () => {
    const llenas = {};
    for (const s of SECCIONES) {
      llenas[s.clave] = {};
      for (const g of s.grupos) for (const c of g.campos) {
        if (c.tipo === 'check') llenas[s.clave][c.clave] = true;
        if (c.tipo === 'opcion') llenas[s.clave][c.clave] = c.opciones[0].clave;
        if (c.tipo === 'texto') llenas[s.clave][c.clave] = 'x'.repeat(500);
        if (c.tipo === 'parrafo') llenas[s.clave][c.clave] = 'palabra '.repeat(500).trim();
        for (const d of c.detalles || []) llenas[s.clave][`${c.clave}_${d.clave}`] = 'y'.repeat(100);
      }
    }
    const h = await db.HistoriaClinica.create({ paciente_id: paciente.id, fecha: '2026-10-02', ...llenas, protocolo: [{ procedimiento: 'P', sesiones: '1', comentario: 'c'.repeat(500) }], diagnostico: 'd '.repeat(2000) });

    let res = await request(app).get(`/staff/historias/${h.id}/pdf`).set(auth()).buffer(true).parse(binario);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('historia-clinica-P-0001-2026-10-02.pdf');
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');

    res = await request(app).get('/staff/historia-clinica/en-blanco.pdf').set(auth()).buffer(true).parse(binario);
    expect(res.status).toBe(200);
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
    expect((await request(app).get(`/staff/historias/${h.id}/pdf`).set(auth(tokenRecepcion))).status).toBe(403);
  }, 30000);
  test('descarga el Word de una evaluación y el formulario en blanco', async () => {
    const h = await db.HistoriaClinica.create({ paciente_id: paciente.id, fecha: '2026-10-03', datos_clinicos: { tabaco: true }, datos_esteticos: {}, analisis_estetico: {}, protocolo: [] });
    let res = await request(app).get(`/staff/historias/${h.id}/word`).set(auth()).buffer(true).parse(binario);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(res.headers['content-disposition']).toContain('historia-clinica-P-0001-2026-10-03.docx');
    expect(res.body.subarray(0, 2).toString()).toBe('PK');
    res = await request(app).get('/staff/historia-clinica/en-blanco.docx').set(auth()).buffer(true).parse(binario);
    expect(res.status).toBe(200);
    expect(res.body.subarray(0, 2).toString()).toBe('PK');
  }, 30000);
  test('PDF: ninguna casilla ni detalle largo se recorta (se parte en líneas)', () => {
    const PDFDocument = require('pdfkit');
    const { enviarHistoriaPdf } = require('../src/services/historiaClinicaPdf');
    const { PassThrough } = require('stream');
    const largo = `frecuencia-${'z'.repeat(150)}-FIN`;
    const llamadas = [];
    const original = PDFDocument.prototype.text;
    const espia = jest.spyOn(PDFDocument.prototype, 'text').mockImplementation(function (texto, ...resto) {
      llamadas.push({ texto: String(texto), opciones: resto.find((r) => r && typeof r === 'object') || {} });
      return original.call(this, texto, ...resto);
    });
    try {
      const res = new PassThrough();
      res.setHeader = () => {};
      res.resume();
      enviarHistoriaPdf(res, {
        fecha: '', numero: '',
        bloques: [{ tipo: 'casillas', items: [{ etiqueta: 'Corta', marcado: false, detalles: [] }, { etiqueta: 'Tabaco', marcado: true, detalles: [{ etiqueta: 'Frecuencia', valor: largo }] }, { etiqueta: 'Otra', marcado: false, detalles: [] }] }],
      }, {}, 'x.pdf');
    } finally {
      espia.mockRestore();
    }
    const dibujada = llamadas.filter((l) => l.texto.includes('Tabaco'));
    expect(dibujada).toHaveLength(1);
    expect(dibujada[0].texto).toContain(largo);
    expect(dibujada[0].texto).not.toContain('…');
    expect(dibujada[0].opciones.ellipsis).toBeFalsy();
    expect(dibujada[0].opciones.height).toBeUndefined();
    expect(dibujada[0].opciones.lineBreak).not.toBe(false);
    // y la altura necesaria con ese ancho es de varias líneas (la fila crece)
    const medidor = new PDFDocument({ size: 'A4', margin: 48 });
    medidor.font('Helvetica').fontSize(9);
    expect(medidor.heightOfString(dibujada[0].texto, { width: dibujada[0].opciones.width })).toBeGreaterThan(20);
  });

  // Crea una evaluación vacía de la paciente (por la API) y la devuelve como modelo.
  const crearEvaluacion = async (pac = paciente) => {
    const res = await request(app).post(`/staff/pacientes/${pac.id}/historias`).set(auth()).send({});
    expect(res.status).toBe(201);
    return db.HistoriaClinica.findByPk(res.body.id);
  };

  test('consentimientos: se guardan solo claves válidas, sin repetir', async () => {
    const h = await crearEvaluacion();
    const ok = await request(app).put(`/staff/historias/${h.id}`).set(auth()).send({ consentimientos: ['general', 'general'] });
    expect(ok.status).toBe(200);
    expect(ok.body.consentimientos).toEqual(['general']);
    const malo = await request(app).put(`/staff/historias/${h.id}`).set(auth()).send({ consentimientos: ['inventado'] });
    expect(malo.status).toBe(400);
    expect(malo.body.campo).toBe('consentimientos');
  });

  test('la definición incluye los consentimientos disponibles', async () => {
    const res = await request(app).get('/staff/historia-clinica/definicion').set(auth());
    expect(res.body.consentimientos).toEqual([{ clave: 'general', titulo: 'Consentimiento informado general – Medicina estética' }]);
  });

  test('copiar una evaluación no copia fotos ni consentimientos', async () => {
    const base = await crearEvaluacion();
    await db.HistoriaClinica.update({ fotos: [{ archivo: 'x.jpg', nota: null }], consentimientos: ['general'] }, { where: { id: base.id } });
    const res = await request(app).post(`/staff/pacientes/${base.paciente_id}/historias`).set(auth()).send({ copiarDe: base.id });
    expect(res.status).toBe(201);
    expect(res.body.fotos).toEqual([]);
    expect(res.body.consentimientos).toEqual([]);
  });

  describe('fotos', () => {
    const subir = (id, buffer, nombre = 'f.jpg', nota) => {
      const r = request(app).post(`/staff/historias/${id}/fotos`).set(auth()).attach('archivo', buffer, nombre);
      return nota === undefined ? r : r.field('nota', nota);
    };
    const carpeta = path.join(process.env.PRIVADO_DIR, 'historias-fotos');

    test('sube, lista con nota, envía, cambia nota y borra', async () => {
      const h = await crearEvaluacion();
      const r1 = await subir(h.id, jpgFalso(), 'f.jpg', ' frente, antes ');
      expect(r1.status).toBe(200);
      expect(r1.body.fotos).toHaveLength(1);
      const { archivo, nota } = r1.body.fotos[0];
      expect(nota).toBe('frente, antes');
      expect(fs.existsSync(path.join(carpeta, archivo))).toBe(true);

      const ver = await request(app).get(`/staff/historias/${h.id}/fotos/${archivo}`).set(auth());
      expect(ver.status).toBe(200);
      expect(ver.headers['content-type']).toMatch(/image\/jpeg/);

      const nueva = await request(app).patch(`/staff/historias/${h.id}/fotos/${archivo}`).set(auth()).send({ nota: 'perfil' });
      expect(nueva.body.fotos[0].nota).toBe('perfil');

      const borrada = await request(app).delete(`/staff/historias/${h.id}/fotos/${archivo}`).set(auth());
      expect(borrada.body.fotos).toEqual([]);
      expect(fs.existsSync(path.join(carpeta, archivo))).toBe(false);
    });

    test('rechaza formatos que no son JPEG/PNG y más de 10 fotos', async () => {
      const h = await crearEvaluacion();
      expect((await subir(h.id, pdfFalso(), 'a.pdf')).status).toBe(400);
      expect((await subir(h.id, exeFalso(), 'a.jpg')).status).toBe(400);
      for (let i = 0; i < 10; i += 1) expect((await subir(h.id, pngFalso(), 'a.png')).status).toBe(200);
      expect((await subir(h.id, pngFalso(), 'a.png')).status).toBe(409);
    });

    test('las fotos de seguimiento van aparte y tienen su propio límite', async () => {
      const h = await crearEvaluacion();
      for (let i = 0; i < 10; i += 1) expect((await subir(h.id, pngFalso(), 'a.png')).status).toBe(200);
      const seg = await request(app).post(`/staff/historias/${h.id}/fotos`).set(auth()).attach('archivo', pngFalso(), 'b.png').field('etapa', 'seguimiento');
      expect(seg.status).toBe(200);
      expect(seg.body.fotos.map((x) => x.etapa)).toEqual([...Array(10).fill('inicial'), 'seguimiento']);
      const mala = await request(app).post(`/staff/historias/${h.id}/fotos`).set(auth()).attach('archivo', pngFalso(), 'c.png').field('etapa', 'otra');
      expect(mala.status).toBe(400);
      expect(mala.body.campo).toBe('etapa');
    });

    test('subir y cambiar una nota a la vez no pierde ninguna de las dos', async () => {
      const h = await crearEvaluacion();
      const primera = (await subir(h.id, jpgFalso(), 'a.jpg', 'inicial')).body.fotos[0].archivo;
      const [subida, nota] = await Promise.all([
        subir(h.id, pngFalso(), 'b.png', 'nueva'),
        request(app).patch(`/staff/historias/${h.id}/fotos/${primera}`).set(auth()).send({ nota: 'cambiada' }),
      ]);
      expect(subida.status).toBe(200);
      expect(nota.status).toBe(200);
      const final = await db.HistoriaClinica.findByPk(h.id);
      expect(final.fotos).toHaveLength(2);
      expect(final.fotos.find((f) => f.archivo === primera).nota).toBe('cambiada');
      expect(final.fotos.some((f) => f.nota === 'nueva')).toBe(true);
      for (const f of final.fotos) expect(fs.existsSync(path.join(carpeta, f.archivo))).toBe(true);
    });

    test('la foto de la subida rechazada por el límite no queda huérfana en disco', async () => {
      const h = await crearEvaluacion();
      for (let i = 0; i < 10; i += 1) await subir(h.id, pngFalso(), 'a.png');
      const antes = fs.readdirSync(carpeta).length;
      expect((await subir(h.id, pngFalso(), 'a.png')).status).toBe(409);
      expect(fs.readdirSync(carpeta).length).toBe(antes);
    });

    test('no entrega fotos de otra evaluación ni nombres manipulados', async () => {
      const a = await crearEvaluacion();
      const b = await crearEvaluacion();
      const { archivo } = (await subir(a.id, jpgFalso())).body.fotos[0];
      for (const ruta of [`/staff/historias/${b.id}/fotos/${archivo}`, `/staff/historias/${a.id}/fotos/..%2F..%2F.env`, `/staff/historias/${a.id}/fotos/nada.jpg`]) {
        expect((await request(app).get(ruta).set(auth())).status).toBe(404);
      }
      expect((await request(app).delete(`/staff/historias/${b.id}/fotos/${archivo}`).set(auth())).status).toBe(404);
    });

    test('borrar la evaluación o la paciente borra sus fotos', async () => {
      const h = await crearEvaluacion();
      const { archivo } = (await subir(h.id, jpgFalso())).body.fotos[0];
      expect((await request(app).delete(`/staff/historias/${h.id}`).set(auth())).status).toBe(204);
      expect(fs.existsSync(path.join(carpeta, archivo))).toBe(false);

      // Paciente nueva, sin citas, notas ni puntos: se puede borrar.
      const limpia = await db.Paciente.create({ nombre_completo: 'Con Fotos', telefono: '59170000094', codigo_paciente: 'P-0094', carnet_identidad: '94', carnet_expedido: 'CB' });
      const h2 = await crearEvaluacion(limpia);
      const otra = (await subir(h2.id, jpgFalso())).body.fotos[0].archivo;
      expect(fs.existsSync(path.join(carpeta, otra))).toBe(true);
      const res = await request(app).delete(`/staff/pacientes/${limpia.id}`).set(auth());
      expect(res.status).toBe(204);
      expect(fs.existsSync(path.join(carpeta, otra))).toBe(false);
    });
  });

  test('PDF y Word se generan con guías y fotos; una foto que falta en disco no rompe', async () => {
    const h = await crearEvaluacion();
    const subida = await request(app).post(`/staff/historias/${h.id}/fotos`).set(auth()).attach('archivo', pngReal(), 'f.png');
    expect(subida.status).toBe(200);
    // Una foto registrada cuyo archivo ya no existe:
    await db.HistoriaClinica.update({ fotos: [...subida.body.fotos, { archivo: 'no-existe.png', nota: 'x' }] }, { where: { id: h.id } });

    const pdf = await request(app).get(`/staff/historias/${h.id}/pdf`).set(auth()).buffer(true).parse(binario);
    expect(pdf.status).toBe(200);
    expect(pdf.body.subarray(0, 5).toString()).toBe('%PDF-');

    const word = await request(app).get(`/staff/historias/${h.id}/word`).set(auth()).buffer(true).parse(binario);
    expect(word.status).toBe(200);
    expect(word.body.subarray(0, 2).toString()).toBe('PK');

    for (const formato of ['pdf', 'docx']) {
      const blanco = await request(app).get(`/staff/historia-clinica/en-blanco.${formato}`).set(auth()).buffer(true).parse(binario);
      expect(blanco.status).toBe(200);
    }
  });

  test('PDF y Word: imagen ilegible en disco y notas largas de fotos no rompen', async () => {
    const h = await crearEvaluacion();
    const subida = await request(app).post(`/staff/historias/${h.id}/fotos`).set(auth()).attach('archivo', pngReal(), 'f.png');
    const corrupta = path.join(process.env.PRIVADO_DIR, 'historias-fotos', 'corrupta.png');
    fs.writeFileSync(corrupta, 'esto no es un png');
    const larga = 'nota muy larga '.repeat(8);
    await db.HistoriaClinica.update({ fotos: [{ ...subida.body.fotos[0], nota: larga }, { archivo: 'corrupta.png', nota: larga }, { ...subida.body.fotos[0], nota: larga }] }, { where: { id: h.id } });
    for (const formato of ['pdf', 'word']) {
      const res = await request(app).get(`/staff/historias/${h.id}/${formato}`).set(auth()).buffer(true).parse(binario);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(1000);
    }
  });
});
