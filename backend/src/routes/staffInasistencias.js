// Política de inasistencia: el personal registra la justificación que el
// paciente envió por WhatsApp y, si la acepta, reprograma la MISMA cita
// conservando su pago (una sola vez).
const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { getSlotsDisponibles } = require('../services/disponibilidad');
const { recibirArchivo, guardarArchivoPrivado, borrarArchivoPrivado, enviarArchivoPrivado } = require('../services/archivosPrivados');
const { enviarConfirmacionCita } = require('../services/avisosCita');
const { plazos, conPolitica } = require('../services/politicaInasistencia');

const router = express.Router();
const onlyAgenda = requirePermiso('agenda');

async function citaCompleta(id) {
  return db.Cita.findByPk(id, { include: [db.Paciente, db.Profesional, db.Servicio, db.Pago] });
}

router.post('/staff/citas/:id/justificacion', onlyAgenda, recibirArchivo('archivo'), async (req, res) => {
  const { decision } = req.body;
  const nota = String(req.body.nota || '').trim();
  if (!['aceptada', 'rechazada'].includes(decision)) {
    return res.status(400).json({ error: 'decision debe ser aceptada o rechazada' });
  }
  if (!nota) return res.status(400).json({ error: 'Escribe una nota con el motivo' });

  const cita = await citaCompleta(req.params.id);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  if (cita.estado !== 'no_asistio') {
    return res.status(400).json({ error: 'Solo se puede justificar una cita marcada como "No asistió"' });
  }
  if (cita.justificacion_estado) {
    return res.status(400).json({ error: 'Esta cita ya tiene una justificación registrada' });
  }
  if (!plazos(cita.toJSON()).conAdelanto) {
    return res.status(400).json({ error: 'Esta cita no tiene un pago adelantado retenido' });
  }

  const archivo = req.file ? await guardarArchivoPrivado('justificaciones', req.file.buffer) : null;
  try {
    cita.justificacion_estado = decision;
    cita.justificacion_nota = nota;
    cita.justificacion_archivo = archivo;
    cita.justificacion_registrada_en = new Date();
    await cita.save();
  } catch (err) {
    await borrarArchivoPrivado('justificaciones', archivo);
    throw err;
  }

  res.json(conPolitica(await citaCompleta(cita.id)));
});

router.get('/staff/citas/:id/justificacion', onlyAgenda, async (req, res) => {
  const cita = await db.Cita.findByPk(req.params.id);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  return enviarArchivoPrivado(res, 'justificaciones', cita.justificacion_archivo);
});

router.patch('/staff/citas/:id/reprogramar', onlyAgenda, async (req, res) => {
  const { fecha, horaInicio } = req.body;
  if (!fecha || !horaInicio) return res.status(400).json({ error: 'fecha y horaInicio son requeridos' });

  const cita = await citaCompleta(req.params.id);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  if (cita.reprogramacion_usada) return res.status(400).json({ error: 'Ya se reprogramó una vez' });
  // Fuera de los 30 días no se bloquea: el panel solo lo advierte.
  if (!plazos(cita.toJSON()).puedeReprogramar) {
    return res.status(400).json({ error: 'Solo se puede reprogramar una inasistencia con justificación aceptada' });
  }

  const slots = await getSlotsDisponibles({ profesionalId: cita.profesional_id, servicioId: cita.servicio_id, fecha });
  const slot = slots.find((s) => s.hora_inicio === horaInicio);
  if (!slot) return res.status(409).json({ error: 'Ese horario no está disponible' });

  cita.fecha_original = cita.fecha;
  cita.hora_original = cita.hora_inicio;
  cita.fecha = fecha;
  cita.hora_inicio = `${slot.hora_inicio}:00`;
  cita.hora_fin = `${slot.hora_fin}:00`;
  cita.estado = 'confirmada';
  cita.reprogramacion_usada = true;
  await cita.save();

  const avisoWhatsApp = await enviarConfirmacionCita(cita.Paciente.telefono, fecha, slot.hora_inicio);
  res.json({ cita: conPolitica(await citaCompleta(cita.id)), avisoWhatsApp });
});

module.exports = router;
