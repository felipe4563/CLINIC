const express = require('express');
const { Op } = require('sequelize');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { generarCodigoCliente } = require('../services/codigoCliente');
const { borrarArchivoPrivado } = require('../services/archivosPrivados');
const { borrarFotosDe } = require('./staffHistoriaClinica');

const router = express.Router();

const LARGO_PERSONAL = { direccion: 255, ocupacion: 120, email: 160, contacto_emergencia: 160, parentesco_emergencia: 60 };
const CAMPOS_PERSONALES = [
  'sexo', 'estado_civil', 'grupo_sanguineo', 'direccion', 'ocupacion', 'email', 'contacto_emergencia', 'parentesco_emergencia',
];

router.get('/staff/pacientes', requirePermiso('pacientes'), async (req, res) => {
  const { q } = req.query;
  const where = q
    ? {
        [Op.or]: [
          { nombre_completo: { [Op.like]: `%${q}%` } },
          { telefono: { [Op.like]: `%${q}%` } },
          { carnet_identidad: { [Op.like]: `%${q}%` } },
          { codigo_paciente: { [Op.like]: `%${q}%` } },
        ],
      }
    : {};

  const pagina = Math.max(1, parseInt(req.query.pagina, 10) || 1);
  const porPagina = Math.min(100, Math.max(1, parseInt(req.query.porPagina, 10) || 30));

  const { count, rows } = await db.Paciente.findAndCountAll({
    where,
    order: [['nombre_completo', 'ASC']],
    limit: porPagina,
    offset: (pagina - 1) * porPagina,
  });

  res.json({ pacientes: rows, total: count, pagina, totalPaginas: Math.max(1, Math.ceil(count / porPagina)) });
});

router.post('/staff/pacientes', requirePermiso('pacientes'), async (req, res) => {
  const { nombre_completo, telefono, carnet_identidad, carnet_complemento, carnet_expedido, fecha_nacimiento } = req.body;
  if (!nombre_completo || !telefono || !carnet_identidad || !carnet_expedido) {
    return res.status(400).json({ error: 'nombre_completo, telefono, carnet_identidad y carnet_expedido son requeridos' });
  }

  const existente = await db.Paciente.findOne({ where: { telefono } });
  if (existente) return res.status(409).json({ error: 'Ya existe un paciente con ese telefono' });

  const paciente = await db.Paciente.create({
    codigo_paciente: await generarCodigoCliente(db),
    nombre_completo,
    telefono,
    carnet_identidad,
    carnet_complemento: carnet_complemento || null,
    carnet_expedido,
    fecha_nacimiento: fecha_nacimiento || null,
  });

  res.status(201).json(paciente);
});

router.get('/staff/pacientes/:id', requirePermiso('pacientes'), async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id, {
    include: [{ model: db.Cita, include: [db.Profesional, db.Servicio] }],
    order: [[db.Cita, 'fecha', 'DESC'], [db.Cita, 'hora_inicio', 'DESC']],
  });
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
  res.json(paciente);
});

router.patch('/staff/pacientes/:id', requirePermiso('pacientes'), async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id);
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

  const { nombre_completo, carnet_identidad, carnet_complemento, carnet_expedido, fecha_nacimiento } = req.body;
  if (nombre_completo !== undefined) paciente.nombre_completo = nombre_completo;
  if (carnet_identidad !== undefined) paciente.carnet_identidad = carnet_identidad;
  if (carnet_complemento !== undefined) paciente.carnet_complemento = carnet_complemento;
  if (carnet_expedido !== undefined) paciente.carnet_expedido = carnet_expedido;
  if (fecha_nacimiento !== undefined) paciente.fecha_nacimiento = fecha_nacimiento;

  // Datos personales de la historia clínica: '' borra el valor.
  if (req.body.sexo !== undefined && !['', null, 'F', 'M'].includes(req.body.sexo)) {
    return res.status(400).json({ error: 'sexo debe ser F o M' });
  }
  if (req.body.estado_civil !== undefined && !['', null, 'S', 'C', 'D', 'V'].includes(req.body.estado_civil)) {
    return res.status(400).json({ error: 'estado_civil debe ser S, C, D o V' });
  }
  for (const [campo, max] of Object.entries(LARGO_PERSONAL)) {
    if (typeof req.body[campo] === 'string' && req.body[campo].trim().length > max) {
      return res.status(400).json({ error: `${campo} admite hasta ${max} caracteres`, campo });
    }
  }
  for (const campo of CAMPOS_PERSONALES) {
    if (req.body[campo] === undefined) continue;
    const valor = typeof req.body[campo] === 'string' ? req.body[campo].trim() : req.body[campo];
    paciente[campo] = valor === '' ? null : valor;
  }

  await paciente.save();
  res.json(paciente);
});

router.delete('/staff/pacientes/:id', requirePermiso('pacientes'), async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id);
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

  const citasCount = await db.Cita.count({ where: { paciente_id: paciente.id } });
  if (citasCount > 0) {
    return res.status(409).json({ error: 'No se puede eliminar: el paciente tiene citas registradas' });
  }

  // Estas FK son RESTRICT: se avisa antes de tocar nada.
  if (await db.NotaClinica.count({ where: { paciente_id: paciente.id } }) > 0) {
    return res.status(409).json({ error: 'No se puede eliminar: el paciente tiene notas clínicas registradas' });
  }
  if (await db.MovimientoPuntos.count({ where: { paciente_id: paciente.id } }) > 0) {
    return res.status(409).json({ error: 'No se puede eliminar: el paciente tiene movimientos de puntos registrados' });
  }

  // La FK borra las evaluaciones en cascada; los archivos firmados se borran a mano,
  // pero solo después de que el borrado de la paciente haya tenido éxito.
  const historias = await db.HistoriaClinica.findAll({ where: { paciente_id: paciente.id }, attributes: ['documento_firmado', 'fotos'] });
  await paciente.destroy();
  for (const h of historias) await borrarArchivoPrivado('historias', h.documento_firmado);
  await borrarFotosDe(historias);
  res.status(204).end();
});

module.exports = router;
