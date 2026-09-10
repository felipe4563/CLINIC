const express = require('express');
const db = require('../models');
const { requirePermiso, requireStaff } = require('./auth.middleware');

const router = express.Router();
const onlyPersonal = requirePermiso('personal');
const anyStaff = requireStaff();

const TIPOS_AUSENCIA = ['vacacion', 'licencia_medica', 'permiso', 'falta_justificada', 'falta_injustificada'];
const ESTADOS_AUSENCIA = ['pendiente', 'aprobado', 'rechazado'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function fechaHoy() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function horaAhora() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const usuarioSinHash = { model: db.Usuario, attributes: { exclude: ['password_hash'] } };

// --- Asistencia: autoservicio (cualquier staff logueado) ---

router.get('/staff/asistencia/hoy', anyStaff, async (req, res) => {
  const registro = await db.RegistroAsistencia.findOne({
    where: { usuario_id: req.usuarioId, fecha: fechaHoy() },
  });
  res.json(registro);
});

router.post('/staff/asistencia/marcar', anyStaff, async (req, res) => {
  const fecha = fechaHoy();
  let registro = await db.RegistroAsistencia.findOne({ where: { usuario_id: req.usuarioId, fecha } });

  if (!registro) {
    registro = await db.RegistroAsistencia.create({
      usuario_id: req.usuarioId,
      fecha,
      hora_entrada: horaAhora(),
      hora_salida: null,
    });
    return res.status(201).json(registro);
  }

  if (!registro.hora_salida) {
    registro.hora_salida = horaAhora();
    await registro.save();
    return res.json(registro);
  }

  return res.status(409).json({ error: 'Ya marcaste tu entrada y salida de hoy' });
});

// --- Ausencias (permisos y faltas): autoservicio ---

router.get('/staff/ausencias/mias', anyStaff, async (req, res) => {
  const ausencias = await db.Ausencia.findAll({
    where: { usuario_id: req.usuarioId },
    order: [['fecha_desde', 'DESC']],
  });
  res.json(ausencias);
});

router.post('/staff/ausencias', anyStaff, async (req, res) => {
  const { tipo, fechaDesde, fechaHasta, motivo } = req.body;
  if (!TIPOS_AUSENCIA.includes(tipo)) return res.status(400).json({ error: 'Tipo inválido' });
  if (!fechaDesde || !fechaHasta) return res.status(400).json({ error: 'fechaDesde y fechaHasta son requeridos' });
  if (fechaHasta < fechaDesde) return res.status(400).json({ error: 'fechaHasta no puede ser anterior a fechaDesde' });

  const ausencia = await db.Ausencia.create({
    usuario_id: req.usuarioId,
    tipo,
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
    motivo: motivo || null,
    estado: 'pendiente',
  });
  res.status(201).json(ausencia);
});

router.delete('/staff/ausencias/:id', anyStaff, async (req, res) => {
  const ausencia = await db.Ausencia.findByPk(req.params.id);
  if (!ausencia) return res.status(404).json({ error: 'Ausencia no encontrada' });

  const esPropia = ausencia.usuario_id === req.usuarioId;
  const puedeGestionar = (req.permisos || []).includes('personal');
  if (!puedeGestionar && !(esPropia && ausencia.estado === 'pendiente')) {
    return res.status(403).json({ error: 'No autorizado para eliminar esta ausencia' });
  }

  await ausencia.destroy();
  res.status(204).end();
});

// --- Control de Personal: administración (permiso 'personal') ---

router.get('/staff/asistencia', onlyPersonal, async (req, res) => {
  const { fecha, usuarioId } = req.query;
  const where = {};
  if (fecha) where.fecha = fecha;
  if (usuarioId) where.usuario_id = usuarioId;

  const registros = await db.RegistroAsistencia.findAll({
    where,
    include: [usuarioSinHash],
    order: [['fecha', 'DESC'], ['hora_entrada', 'DESC']],
  });
  res.json(registros);
});

router.patch('/staff/asistencia/:id', onlyPersonal, async (req, res) => {
  const registro = await db.RegistroAsistencia.findByPk(req.params.id);
  if (!registro) return res.status(404).json({ error: 'Registro no encontrado' });

  const { hora_entrada, hora_salida, observacion } = req.body;
  if (hora_entrada !== undefined) registro.hora_entrada = hora_entrada;
  if (hora_salida !== undefined) registro.hora_salida = hora_salida;
  if (observacion !== undefined) registro.observacion = observacion;
  await registro.save();
  res.json(registro);
});

router.delete('/staff/asistencia/:id', onlyPersonal, async (req, res) => {
  const registro = await db.RegistroAsistencia.findByPk(req.params.id);
  if (!registro) return res.status(404).json({ error: 'Registro no encontrado' });
  await registro.destroy();
  res.status(204).end();
});

router.get('/staff/ausencias', onlyPersonal, async (req, res) => {
  const { usuarioId, estado } = req.query;
  const where = {};
  if (usuarioId) where.usuario_id = usuarioId;
  if (estado) where.estado = estado;

  const ausencias = await db.Ausencia.findAll({
    where,
    include: [usuarioSinHash, { model: db.Usuario, as: 'AprobadoPor', attributes: { exclude: ['password_hash'] } }],
    order: [['fecha_desde', 'DESC']],
  });
  res.json(ausencias);
});

router.post('/staff/ausencias/registrar', onlyPersonal, async (req, res) => {
  const { usuarioId, tipo, fechaDesde, fechaHasta, motivo, estado } = req.body;
  if (!usuarioId) return res.status(400).json({ error: 'usuarioId es requerido' });
  if (!TIPOS_AUSENCIA.includes(tipo)) return res.status(400).json({ error: 'Tipo inválido' });
  if (!fechaDesde || !fechaHasta) return res.status(400).json({ error: 'fechaDesde y fechaHasta son requeridos' });
  if (fechaHasta < fechaDesde) return res.status(400).json({ error: 'fechaHasta no puede ser anterior a fechaDesde' });

  const usuario = await db.Usuario.findByPk(usuarioId);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

  const estadoFinal = estado && ESTADOS_AUSENCIA.includes(estado) ? estado : 'aprobado';
  const ausencia = await db.Ausencia.create({
    usuario_id: usuarioId,
    tipo,
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
    motivo: motivo || null,
    estado: estadoFinal,
    aprobado_por_id: estadoFinal === 'pendiente' ? null : req.usuarioId,
  });
  res.status(201).json(ausencia);
});

router.patch('/staff/ausencias/:id/estado', onlyPersonal, async (req, res) => {
  const { estado } = req.body;
  if (!ESTADOS_AUSENCIA.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

  const ausencia = await db.Ausencia.findByPk(req.params.id);
  if (!ausencia) return res.status(404).json({ error: 'Ausencia no encontrada' });

  ausencia.estado = estado;
  ausencia.aprobado_por_id = estado === 'pendiente' ? null : req.usuarioId;
  await ausencia.save();
  res.json(ausencia);
});

module.exports = router;
