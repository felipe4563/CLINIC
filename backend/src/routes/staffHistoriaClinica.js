const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { SECCIONES, COLUMNAS_PROTOCOLO } = require('../config/historiaClinica');
const { CONSENTIMIENTOS } = require('../config/consentimientos');
const { ErrorValidacion, fechaValida, validarSeccion, validarProtocolo, validarConsentimientos, alertaAlergias, calcularTratamientos } = require('../services/historiaClinica');
const { armarDocumento } = require('../services/historiaClinicaDocumento');
const { enviarHistoriaPdf } = require('../services/historiaClinicaPdf');
const { generarHistoriaWord } = require('../services/historiaClinicaWord');
const { recibirArchivo, recibirImagen, guardarArchivoPrivado, borrarArchivoPrivado, enviarArchivoPrivado } = require('../services/archivosPrivados');

const router = express.Router();
const onlyHistoria = requirePermiso('historia_clinica');

const CLAVES_SECCION = SECCIONES.map((s) => s.clave);
const ORDEN_RECIENTE = [['fecha', 'DESC'], ['id', 'DESC']];

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function textoOpcional(valor, max) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'string') throw new ErrorValidacion('texto', 'Valor de texto inválido');
  const limpio = valor.trim();
  if (limpio.length > max) throw new ErrorValidacion('texto', `Texto de hasta ${max} caracteres`);
  return limpio || null;
}

async function cargarCompleta(id) {
  return db.HistoriaClinica.findByPk(id, {
    include: [
      { model: db.Paciente },
      { model: db.Profesional, attributes: ['id', 'nombre', 'especialidad', 'registro_profesional'] },
      { model: db.Usuario, as: 'CreadoPor', attributes: ['id', 'nombre'] },
      { model: db.Usuario, as: 'ActualizadoPor', attributes: ['id', 'nombre'] },
    ],
  });
}

router.get('/staff/historia-clinica/definicion', onlyHistoria, (req, res) => {
  res.json({ secciones: SECCIONES, columnasProtocolo: COLUMNAS_PROTOCOLO, consentimientos: CONSENTIMIENTOS.map(({ clave, titulo }) => ({ clave, titulo })) });
});

// Especialistas para el compromiso legal: lo necesita quien llena la historia,
// aunque no tenga permiso de catálogo.
router.get('/staff/historia-clinica/profesionales', onlyHistoria, async (req, res) => {
  const profesionales = await db.Profesional.findAll({ where: { activo: true }, attributes: ['id', 'nombre'], order: [['nombre', 'ASC']] });
  res.json(profesionales);
});

router.get('/staff/pacientes/:id/historias', onlyHistoria, async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id, { attributes: ['id'] });
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
  const historias = await db.HistoriaClinica.findAll({
    where: { paciente_id: paciente.id },
    include: [
      { model: db.Usuario, as: 'CreadoPor', attributes: ['nombre'] },
      { model: db.Usuario, as: 'ActualizadoPor', attributes: ['nombre'] },
    ],
    order: ORDEN_RECIENTE,
  });
  res.json({
    historias: historias.map((h) => ({
      id: h.id,
      fecha: h.fecha,
      autor: (h.ActualizadoPor || h.CreadoPor || {}).nombre || null,
      actualizada: h.updated_at || h.updatedAt,
      firmado: Boolean(h.documento_firmado),
    })),
    alerta: alertaAlergias(historias[0]),
  });
});

// Nueva evaluación, vacía o copiada de otra de la MISMA paciente (secciones 2-5).
router.post('/staff/pacientes/:id/historias', onlyHistoria, async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id, { attributes: ['id'] });
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

  let base = null;
  if (req.body.copiarDe !== undefined && req.body.copiarDe !== null) {
    base = await db.HistoriaClinica.findByPk(req.body.copiarDe);
    if (!base || base.paciente_id !== paciente.id) {
      return res.status(400).json({ error: 'La evaluación a copiar no pertenece a esta paciente' });
    }
  }

  const historia = await db.HistoriaClinica.create({
    paciente_id: paciente.id,
    fecha: hoyISO(),
    motivo_consulta: null,
    datos_clinicos: base ? base.datos_clinicos : {},
    datos_esteticos: base ? base.datos_esteticos : {},
    analisis_estetico: base ? base.analisis_estetico : {},
    diagnostico: base ? base.diagnostico : null,
    protocolo: base ? base.protocolo : [],
    fotos: [],
    consentimientos: [],
    procedimiento_autorizado: base ? base.procedimiento_autorizado : null,
    profesional_id: base ? base.profesional_id : null,
    creado_por_id: req.usuarioId,
    actualizado_por_id: req.usuarioId,
  });
  res.status(201).json(await cargarCompleta(historia.id));
});

router.get('/staff/historias/:id', onlyHistoria, async (req, res) => {
  const historia = await cargarCompleta(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  res.json({ ...historia.toJSON(), tratamientos: await calcularTratamientos(historia) });
});

router.put('/staff/historias/:id', onlyHistoria, async (req, res) => {
  const historia = await db.HistoriaClinica.findByPk(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });

  try {
    for (const clave of CLAVES_SECCION) {
      if (req.body[clave] !== undefined) historia[clave] = validarSeccion(clave, req.body[clave]);
    }
    if (req.body.protocolo !== undefined) {
      historia.protocolo = validarProtocolo(req.body.protocolo);
    }
    if (req.body.consentimientos !== undefined) historia.consentimientos = validarConsentimientos(req.body.consentimientos);
    if (req.body.motivo_consulta !== undefined) historia.motivo_consulta = textoOpcional(req.body.motivo_consulta, 4000);
    if (req.body.diagnostico !== undefined) historia.diagnostico = textoOpcional(req.body.diagnostico, 4000);
    if (req.body.procedimiento_autorizado !== undefined) {
      historia.procedimiento_autorizado = textoOpcional(req.body.procedimiento_autorizado, 255);
    }
  } catch (err) {
    if (err instanceof ErrorValidacion) return res.status(400).json({ error: err.message, campo: err.campo });
    throw err;
  }

  if (req.body.fecha !== undefined) {
    if (!fechaValida(String(req.body.fecha))) return res.status(400).json({ error: 'fecha inválida' });
    historia.fecha = req.body.fecha;
  }
  if (req.body.profesional_id !== undefined) {
    if (req.body.profesional_id === null || req.body.profesional_id === '') {
      historia.profesional_id = null;
    } else {
      const profesional = await db.Profesional.findByPk(req.body.profesional_id);
      if (!profesional) return res.status(400).json({ error: 'Especialista no encontrado' });
      historia.profesional_id = profesional.id;
    }
  }
  // Por defecto el compromiso legal autoriza el primer procedimiento del protocolo.
  if (!historia.procedimiento_autorizado && historia.protocolo.length > 0) {
    historia.procedimiento_autorizado = historia.protocolo[0].procedimiento || null;
  }

  historia.actualizado_por_id = req.usuarioId;
  await historia.save();
  res.json(await cargarCompleta(historia.id));
});

router.delete('/staff/historias/:id', onlyHistoria, async (req, res) => {
  if (req.rolNombre !== 'Admin') return res.status(403).json({ error: 'Solo un administrador puede borrar una evaluación' });
  const historia = await db.HistoriaClinica.findByPk(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  const firmado = historia.documento_firmado;
  await historia.destroy();
  await borrarArchivoPrivado('historias', firmado);
  await borrarFotosDe([historia]);
  res.status(204).end();
});

// Escaneo o foto del papel firmado (compromiso legal). Vive fuera de /uploads.
router.post('/staff/historias/:id/documento-firmado', onlyHistoria, recibirArchivo('archivo'), async (req, res) => {
  const historia = await db.HistoriaClinica.findByPk(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  if (!req.file) return res.status(400).json({ error: 'Adjunta el documento firmado (imagen o PDF)' });
  const anterior = historia.documento_firmado;
  historia.documento_firmado = await guardarArchivoPrivado('historias', req.file.buffer);
  historia.actualizado_por_id = req.usuarioId;
  await historia.save();
  await borrarArchivoPrivado('historias', anterior);
  res.json(await cargarCompleta(historia.id));
});

router.get('/staff/historias/:id/documento-firmado', onlyHistoria, async (req, res) => {
  const historia = await db.HistoriaClinica.findByPk(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  return enviarArchivoPrivado(res, 'historias', historia.documento_firmado);
});

router.delete('/staff/historias/:id/documento-firmado', onlyHistoria, async (req, res) => {
  const historia = await db.HistoriaClinica.findByPk(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  const anterior = historia.documento_firmado;
  historia.documento_firmado = null;
  historia.actualizado_por_id = req.usuarioId;
  await historia.save();
  await borrarArchivoPrivado('historias', anterior);
  res.json(await cargarCompleta(historia.id));
});

const MAX_FOTOS = 10;
const CARPETA_FOTOS = 'historias-fotos';

function notaDeFoto(valor) {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'string') throw new ErrorValidacion('nota', 'Nota inválida');
  const limpia = valor.trim();
  if (limpia.length > 120) throw new ErrorValidacion('nota', 'La nota admite hasta 120 caracteres');
  return limpia || null;
}

// Las rutas de fotos leen-modifican-escriben el JSON `fotos`: se hace dentro de
// una transacción con la fila bloqueada para que cambios simultáneos (subir
// varias, editar una nota, borrar) no se pisen. La foto se busca en el JSON de
// ESA evaluación: un nombre de otra historia o manipulado nunca llega al disco.
// `cambiar(historia, foto)` devuelve { status, error } para abortar o nada.
async function conHistoriaBloqueada(req, res, { archivo = null, cambiar, alFallar = null }) {
  let borrar = null;
  let resultado;
  try {
    resultado = await db.sequelize.transaction(async (t) => {
      const historia = await db.HistoriaClinica.findByPk(req.params.id, { lock: t.LOCK.UPDATE, transaction: t });
      if (!historia) return { status: 404, error: 'Evaluación no encontrada' };
      let foto = null;
      if (archivo) {
        foto = historia.fotos.find((f) => f.archivo === archivo);
        if (!foto) return { status: 404, error: 'Foto no encontrada' };
      }
      const r = cambiar(historia, foto);
      if (r && r.error) return r;
      historia.actualizado_por_id = req.usuarioId;
      await historia.save({ transaction: t });
      borrar = r && r.borrar ? r.borrar : null;
      return { id: historia.id };
    });
  } catch (err) {
    if (alFallar) await alFallar();
    throw err;
  }
  if (resultado.error) {
    if (alFallar) await alFallar();
    res.status(resultado.status).json({ error: resultado.error, ...(resultado.campo ? { campo: resultado.campo } : {}) });
    return;
  }
  if (borrar) await borrarArchivoPrivado(CARPETA_FOTOS, borrar);
  res.json(await cargarCompleta(resultado.id));
}

async function borrarFotosDe(historias) {
  for (const h of historias) {
    for (const f of h.fotos || []) await borrarArchivoPrivado(CARPETA_FOTOS, f.archivo);
  }
}

router.post('/staff/historias/:id/fotos', onlyHistoria, recibirImagen('archivo'), async (req, res) => {
  const existe = await db.HistoriaClinica.findByPk(req.params.id, { attributes: ['id'] });
  if (!existe) return res.status(404).json({ error: 'Evaluación no encontrada' });
  if (!req.file) return res.status(400).json({ error: 'Adjunta una foto JPG o PNG' });
  let nota;
  try {
    nota = notaDeFoto(req.body.nota);
  } catch (err) {
    return res.status(400).json({ error: err.message, campo: 'nota' });
  }
  // El archivo se escribe antes de la transacción; si ésta falla o está llena, se borra.
  const archivo = await guardarArchivoPrivado(CARPETA_FOTOS, req.file.buffer);
  await conHistoriaBloqueada(req, res, {
    cambiar: (historia) => {
      if (historia.fotos.length >= MAX_FOTOS) return { status: 409, error: `Máximo ${MAX_FOTOS} fotos por evaluación` };
      historia.fotos = [...historia.fotos, { archivo, nota }];
      return null;
    },
    alFallar: () => borrarArchivoPrivado(CARPETA_FOTOS, archivo),
  });
});

router.get('/staff/historias/:id/fotos/:archivo', onlyHistoria, async (req, res) => {
  const historia = await db.HistoriaClinica.findByPk(req.params.id, { attributes: ['id', 'fotos'] });
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  const foto = historia.fotos.find((f) => f.archivo === req.params.archivo);
  if (!foto) return res.status(404).json({ error: 'Foto no encontrada' });
  return enviarArchivoPrivado(res, CARPETA_FOTOS, foto.archivo);
});

router.patch('/staff/historias/:id/fotos/:archivo', onlyHistoria, async (req, res) => {
  let nota;
  try {
    nota = notaDeFoto(req.body.nota);
  } catch (err) {
    return res.status(400).json({ error: err.message, campo: 'nota' });
  }
  await conHistoriaBloqueada(req, res, {
    archivo: req.params.archivo,
    cambiar: (historia, foto) => {
      historia.fotos = historia.fotos.map((f) => (f.archivo === foto.archivo ? { ...f, nota } : f));
      return null;
    },
  });
});

router.delete('/staff/historias/:id/fotos/:archivo', onlyHistoria, async (req, res) => {
  await conHistoriaBloqueada(req, res, {
    archivo: req.params.archivo,
    cambiar: (historia, foto) => {
      historia.fotos = historia.fotos.filter((f) => f.archivo !== foto.archivo);
      return { borrar: foto.archivo };
    },
  });
});

async function documentoDe(historia) {
  const [config, tratamientos] = await Promise.all([db.ConfiguracionClinica.obtenerConfig(), calcularTratamientos(historia)]);
  const documento = armarDocumento({ config, paciente: historia.Paciente, historia, tratamientos });
  return { config, documento, base: `historia-clinica-${historia.Paciente.codigo_paciente}-${historia.fecha}` };
}

router.get('/staff/historia-clinica/en-blanco.pdf', onlyHistoria, async (req, res) => {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  enviarHistoriaPdf(res, armarDocumento({ config, enBlanco: true }), config, 'historia-clinica-en-blanco.pdf');
});

router.get('/staff/historias/:id/pdf', onlyHistoria, async (req, res) => {
  const historia = await cargarCompleta(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  const { config, documento, base } = await documentoDe(historia);
  enviarHistoriaPdf(res, documento, config, `${base}.pdf`);
});

const MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function enviarWord(res, buffer, nombreArchivo) {
  res.setHeader('Content-Type', MIME_DOCX);
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
  res.send(buffer);
}

router.get('/staff/historia-clinica/en-blanco.docx', onlyHistoria, async (req, res) => {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  enviarWord(res, await generarHistoriaWord(armarDocumento({ config, enBlanco: true }), config), 'historia-clinica-en-blanco.docx');
});

router.get('/staff/historias/:id/word', onlyHistoria, async (req, res) => {
  const historia = await cargarCompleta(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  const { config, documento, base } = await documentoDe(historia);
  enviarWord(res, await generarHistoriaWord(documento, config), `${base}.docx`);
});

module.exports = router;
module.exports.borrarFotosDe = borrarFotosDe;
