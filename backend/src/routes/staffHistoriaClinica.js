const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { SECCIONES, COLUMNAS_PROTOCOLO } = require('../config/historiaClinica');
const { ErrorValidacion, validarSeccion, validarProtocolo, alertaAlergias, calcularTratamientos } = require('../services/historiaClinica');

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
      { model: db.Profesional, attributes: ['id', 'nombre'] },
      { model: db.Usuario, as: 'CreadoPor', attributes: ['id', 'nombre'] },
      { model: db.Usuario, as: 'ActualizadoPor', attributes: ['id', 'nombre'] },
    ],
  });
}

router.get('/staff/historia-clinica/definicion', onlyHistoria, (req, res) => {
  res.json({ secciones: SECCIONES, columnasProtocolo: COLUMNAS_PROTOCOLO });
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(req.body.fecha))) return res.status(400).json({ error: 'fecha inválida' });
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
  await historia.destroy();
  res.status(204).end();
});

module.exports = router;
