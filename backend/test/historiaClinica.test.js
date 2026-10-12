const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.PRIVADO_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'privado-hc-'));

const { SECCIONES, COLUMNAS_PROTOCOLO } = require('../src/config/historiaClinica');
const { validarSeccion, validarProtocolo, ErrorValidacion } = require('../src/services/historiaClinica');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');
const { pngFalso, exeFalso } = require('./helpers/archivos');
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

  test('armarDocumento: datos personales, casillas con detalles, opciones y compromiso legal', () => {
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
    const compromiso = doc.bloques.find((b) => b.tipo === 'compromiso').texto;
    expect(compromiso).toContain('Ana Pérez');
    expect(compromiso).toContain('Dra. Noemí');
    expect(compromiso).toContain('Clinic NovagED');
    expect(doc.bloques.filter((b) => b.tipo === 'tabla').map((t) => t.filas)).toEqual([[['Peeling', '4', '']], [['05/10/2026', 'Peeling', 'Bien']]]);
  });

  test('armarDocumento en blanco: sin valores y con filas vacías para llenar a mano', () => {
    const doc = armarDocumento({ config: {}, enBlanco: true });
    expect(doc.bloques.filter((b) => b.tipo === 'campo').every((b) => b.valor === '')).toBe(true);
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
});
