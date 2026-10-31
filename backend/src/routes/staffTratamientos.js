const express = require('express');
const { Op } = require('sequelize');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');

const router = express.Router();
const onlyPacientes = requirePermiso('pacientes');

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function normalizarHora(hora) {
  if (!hora) return null;
  return hora.length === 5 ? `${hora}:00` : hora;
}

async function chocaConCita(profesionalId, fecha, hora) {
  if (!profesionalId || !fecha || !hora) return false;
  const citas = await db.Cita.findAll({
    where: { profesional_id: profesionalId, fecha, estado: { [Op.ne]: 'cancelada' } },
  });
  return citas.some((c) => hora >= c.hora_inicio && hora < c.hora_fin);
}

router.get('/staff/tratamientos', onlyPacientes, async (req, res) => {
  const { q } = req.query;
  const incluirPaciente = q
    ? { model: db.Paciente, where: { nombre_completo: { [Op.like]: `%${q}%` } } }
    : db.Paciente;

  const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
  const porPagina = Math.min(100, Math.max(1, parseInt(req.query.porPagina, 10) || 20));

  const { count, rows } = await db.NotaClinica.findAndCountAll({
    include: [incluirPaciente, db.Profesional],
    order: [['fecha', 'DESC'], ['hora', 'DESC'], ['id', 'DESC']],
    limit: porPagina,
    offset: (pagina - 1) * porPagina,
    distinct: true,
  });

  res.json({ notas: rows, total: count, pagina, totalPaginas: Math.max(1, Math.ceil(count / porPagina)) });
});

// Portada de Tratamientos: los pacientes con lo último que se hicieron, su próxima
// cita, si tienen historia clínica y cuántas notas; el más reciente arriba.
const ESTADOS_ATENDIDA = ['completada', 'confirmada'];
const ESTADOS_PROXIMA = ['confirmada', 'pendiente_pago'];

router.get('/staff/tratamientos/pacientes', onlyPacientes, async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
  const porPagina = Math.min(100, Math.max(1, parseInt(req.query.porPagina, 10) || 20));
  const hoy = hoyISO();

  const where = q
    ? { [Op.or]: ['nombre_completo', 'codigo_paciente', 'telefono', 'carnet_identidad'].map((c) => ({ [c]: { [Op.like]: `%${q}%` } })) }
    : {};
  const pacientes = await db.Paciente.findAll({ where, attributes: ['id', 'nombre_completo', 'codigo_paciente', 'telefono', 'createdAt'], raw: true });
  const ids = pacientes.map((p) => p.id);
  if (!ids.length) return res.json({ pacientes: [], total: 0, pagina: 1, totalPaginas: 1 });

  const citas = await db.Cita.findAll({
    where: { paciente_id: ids, estado: { [Op.notIn]: ['cancelada'] } },
    attributes: ['id', 'paciente_id', 'fecha', 'hora_inicio', 'estado'],
    include: [{ model: db.Servicio, attributes: ['nombre'] }, { model: db.Profesional, attributes: ['nombre'] }],
    order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
  });
  const notas = await db.NotaClinica.findAll({
    where: { paciente_id: ids },
    attributes: ['paciente_id', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'cantidad'], [db.sequelize.fn('MAX', db.sequelize.col('fecha')), 'ultima']],
    group: ['paciente_id'],
    raw: true,
  });
  const historias = new Set((await db.HistoriaClinica.findAll({ where: { paciente_id: ids }, attributes: ['paciente_id'], raw: true })).map((h) => h.paciente_id));

  const porPaciente = new Map(ids.map((id) => [id, { ultimo: null, proxima: null }]));
  for (const c of citas) {
    const info = porPaciente.get(c.paciente_id);
    const resumen = { fecha: c.fecha, hora: c.hora_inicio, servicio: c.Servicio?.nombre || null, profesional: c.Profesional?.nombre || null, estado: c.estado };
    if (c.fecha < hoy && ESTADOS_ATENDIDA.includes(c.estado)) info.ultimo = resumen; // en orden: queda la más reciente
    else if (c.estado === 'completada' && c.fecha === hoy) info.ultimo = resumen;
    else if (c.fecha >= hoy && ESTADOS_PROXIMA.includes(c.estado) && !info.proxima) info.proxima = resumen;
  }
  const notasPor = Object.fromEntries(notas.map((n) => [n.paciente_id, n]));

  const lista = pacientes.map((p) => {
    const info = porPaciente.get(p.id);
    const nota = notasPor[p.id];
    const creado = new Date(p.createdAt);
    const actividad = [info.ultimo?.fecha, nota?.ultima, info.proxima?.fecha, `${creado.getFullYear()}-${String(creado.getMonth() + 1).padStart(2, '0')}-${String(creado.getDate()).padStart(2, '0')}`]
      .filter(Boolean)
      .sort()
      .pop();
    return {
      id: p.id,
      nombre_completo: p.nombre_completo,
      codigo_paciente: p.codigo_paciente,
      telefono: p.telefono,
      ultimo_tratamiento: info.ultimo,
      proxima_cita: info.proxima,
      notas: nota ? Number(nota.cantidad) : 0,
      ultima_nota: nota?.ultima || null,
      tiene_historia: historias.has(p.id),
      actividad,
    };
  });
  lista.sort((a, b) => b.actividad.localeCompare(a.actividad) || a.nombre_completo.localeCompare(b.nombre_completo, 'es'));

  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const paginaFinal = Math.min(pagina, totalPaginas);
  res.json({
    pacientes: lista.slice((paginaFinal - 1) * porPagina, paginaFinal * porPagina),
    total: lista.length,
    pagina: paginaFinal,
    totalPaginas,
  });
});

router.get('/staff/pacientes/:id/tratamientos', onlyPacientes, async (req, res) => {
  const notas = await db.NotaClinica.findAll({
    where: { paciente_id: req.params.id },
    include: [db.Profesional],
    order: [['fecha', 'DESC'], ['hora', 'DESC'], ['id', 'DESC']],
  });
  res.json(notas);
});

router.post('/staff/pacientes/:id/tratamientos', onlyPacientes, async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id);
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

  const { titulo, notas, fecha, hora, profesionalId, citaId } = req.body;
  if (!titulo || !notas) return res.status(400).json({ error: 'titulo y notas son requeridos' });

  // Nota de sesión de una cita atendida: toma fecha, hora y profesional de la
  // cita. No se revisa choque de horario: la única "cita" a esa hora es ella.
  if (citaId) {
    const cita = await db.Cita.findOne({ where: { id: citaId, paciente_id: paciente.id } });
    if (!cita || cita.estado !== 'completada') {
      return res.status(400).json({ error: 'La cita no es de esta paciente o no está completada' });
    }
    if (await db.NotaClinica.findOne({ where: { cita_id: cita.id } })) {
      return res.status(409).json({ error: 'Esa sesión ya tiene una observación' });
    }
    const nota = await db.NotaClinica.create({
      paciente_id: paciente.id,
      cita_id: cita.id,
      profesional_id: cita.profesional_id,
      fecha: cita.fecha,
      hora: cita.hora_inicio,
      titulo,
      notas,
    });
    return res.status(201).json(await db.NotaClinica.findByPk(nota.id, { include: [db.Profesional] }));
  }

  const fechaNota = fecha || hoyISO();
  const horaNota = normalizarHora(hora);

  if (await chocaConCita(profesionalId, fechaNota, horaNota)) {
    return res.status(409).json({ error: 'El profesional ya tiene una cita reservada a esa hora' });
  }

  const nota = await db.NotaClinica.create({
    paciente_id: paciente.id,
    profesional_id: profesionalId || null,
    fecha: fechaNota,
    hora: horaNota,
    titulo,
    notas,
  });

  const conProfesional = await db.NotaClinica.findByPk(nota.id, { include: [db.Profesional] });
  res.status(201).json(conProfesional);
});

router.patch('/staff/tratamientos/:id', onlyPacientes, async (req, res) => {
  const nota = await db.NotaClinica.findByPk(req.params.id);
  if (!nota) return res.status(404).json({ error: 'Nota no encontrada' });

  const { titulo, notas, fecha, hora, profesionalId } = req.body;
  const fechaFinal = fecha !== undefined ? fecha : nota.fecha;
  const horaFinal = hora !== undefined ? normalizarHora(hora) : nota.hora;
  const profesionalFinal = profesionalId !== undefined ? profesionalId || null : nota.profesional_id;

  if (await chocaConCita(profesionalFinal, fechaFinal, horaFinal)) {
    return res.status(409).json({ error: 'El profesional ya tiene una cita reservada a esa hora' });
  }

  if (titulo !== undefined) nota.titulo = titulo;
  if (notas !== undefined) nota.notas = notas;
  nota.fecha = fechaFinal;
  nota.hora = horaFinal;
  nota.profesional_id = profesionalFinal;

  await nota.save();
  const conProfesional = await db.NotaClinica.findByPk(nota.id, { include: [db.Profesional] });
  res.json(conProfesional);
});

router.delete('/staff/tratamientos/:id', onlyPacientes, async (req, res) => {
  const nota = await db.NotaClinica.findByPk(req.params.id);
  if (!nota) return res.status(404).json({ error: 'Nota no encontrada' });
  await nota.destroy();
  res.status(204).end();
});

module.exports = router;
