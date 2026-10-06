const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { generarQR, consultarEstadoQR } = require('../services/bancoEconomico');
const { otorgarPuntosPorGasto } = require('../services/fidelizacion');

const router = express.Router();
const onlyPacientes = requirePermiso('pacientes');

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function registrarIngresoCaja(paquete, paciente, servicio, usuarioId) {
  await db.MovimientoCaja.create({
    tipo: 'ingreso',
    concepto: `Paquete ${paquete.sesiones_totales}x ${servicio.nombre} - ${paciente.nombre_completo}`,
    monto: paquete.precio_total,
    fecha: paquete.fecha_compra,
    usuario_id: usuarioId,
    paquete_sesiones_id: paquete.id,
  });
}

router.get('/staff/pacientes/:id/paquetes', onlyPacientes, async (req, res) => {
  const paquetes = await db.PaqueteSesiones.findAll({
    where: { paciente_id: req.params.id },
    include: [db.Servicio],
    order: [['id', 'DESC']],
  });
  res.json(paquetes);
});

router.post('/staff/pacientes/:id/paquetes', onlyPacientes, async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id);
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

  const { servicioId, sesionesTotales, precioTotal, metodoPago } = req.body;
  if (!servicioId || !sesionesTotales || sesionesTotales <= 0) {
    return res.status(400).json({ error: 'servicioId y sesionesTotales (mayor a 0) son requeridos' });
  }
  if (!precioTotal || precioTotal <= 0) {
    return res.status(400).json({ error: 'precioTotal debe ser mayor a 0' });
  }
  if (!['efectivo', 'qr'].includes(metodoPago)) {
    return res.status(400).json({ error: 'metodoPago debe ser efectivo o qr' });
  }

  const servicio = await db.Servicio.findByPk(servicioId);
  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

  const paquete = await db.PaqueteSesiones.create({
    paciente_id: paciente.id,
    servicio_id: servicio.id,
    sesiones_totales: sesionesTotales,
    precio_total: precioTotal,
    fecha_compra: hoyISO(),
    estado: metodoPago === 'efectivo' ? 'pagado' : 'pendiente',
    usuario_id: req.usuarioId,
  });

  if (metodoPago === 'efectivo') {
    await registrarIngresoCaja(paquete, paciente, servicio, req.usuarioId);
    await otorgarPuntosPorGasto({
      pacienteId: paciente.id,
      monto: paquete.precio_total,
      motivo: `Paquete de sesiones #${paquete.id}`,
    });
    const paqueteCompleto = await db.PaqueteSesiones.findByPk(paquete.id, { include: [db.Servicio] });
    return res.status(201).json({ paquete: paqueteCompleto });
  }

  const { qrId, qrImageBase64 } = await generarQR({
    monto: precioTotal,
    transactionId: `PAQUETE-${paquete.id}-${Date.now()}`,
    descripcion: `Paquete ${sesionesTotales}x ${servicio.nombre}`,
  });
  paquete.referencia_qr = qrId;
  await paquete.save();

  res.status(201).json({ paquete, qrImageBase64, referencia: qrId });
});

router.get('/staff/paquetes/:id/estado', onlyPacientes, async (req, res) => {
  const paquete = await db.PaqueteSesiones.findByPk(req.params.id, { include: [db.Paciente, db.Servicio] });
  if (!paquete) return res.status(404).json({ error: 'Paquete no encontrado' });

  if (paquete.estado === 'pagado') return res.json({ pagado: true });
  if (!paquete.referencia_qr) return res.json({ pagado: false });

  const { pagado } = await consultarEstadoQR(paquete.referencia_qr);
  if (pagado) {
    paquete.estado = 'pagado';
    await paquete.save();
    await registrarIngresoCaja(paquete, paquete.Paciente, paquete.Servicio, req.usuarioId);
    await otorgarPuntosPorGasto({
      pacienteId: paquete.paciente_id,
      monto: paquete.precio_total,
      motivo: `Paquete de sesiones #${paquete.id}`,
    });
  }

  res.json({ pagado });
});

module.exports = router;
