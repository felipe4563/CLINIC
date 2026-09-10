const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { generarQR, consultarEstadoQR } = require('../services/bancoEconomico');

const router = express.Router();
const onlyPacientes = requirePermiso('pacientes');

async function buscarPagoConSaldo(id) {
  const pago = await db.Pago.findByPk(id, { include: [{ model: db.Cita, as: 'Cita', include: [db.Paciente, db.Servicio] }] });
  if (!pago) return null;
  if (pago.porcentaje !== 50 || pago.estado !== 'pagado') return undefined;
  return pago;
}

router.get('/staff/saldos-pendientes', onlyPacientes, async (req, res) => {
  const pagos = await db.Pago.findAll({
    where: { porcentaje: 50, estado: 'pagado', saldo_cobrado: false },
    include: [{ model: db.Cita, as: 'Cita', include: [db.Paciente, db.Profesional, db.Servicio] }],
  });

  pagos.sort((a, b) => `${a.Cita.fecha} ${a.Cita.hora_inicio}`.localeCompare(`${b.Cita.fecha} ${b.Cita.hora_inicio}`));
  res.json(pagos);
});

router.patch('/staff/pagos/:id/saldo', onlyPacientes, async (req, res) => {
  const pago = await buscarPagoConSaldo(req.params.id);
  if (pago === null) return res.status(404).json({ error: 'Pago no encontrado' });
  if (pago === undefined) return res.status(400).json({ error: 'Este pago no tiene un saldo pendiente por cobrar' });

  pago.saldo_cobrado = true;
  pago.metodo_pago_saldo = 'efectivo';
  await pago.save();

  const saldo = Number(pago.monto_total) - Number(pago.monto);
  await db.MovimientoCaja.create({
    tipo: 'ingreso',
    concepto: `Saldo cita ${pago.cita_id} - ${pago.Cita.Paciente.nombre_completo}`,
    monto: saldo,
    fecha: new Date().toISOString().slice(0, 10),
    usuario_id: req.usuarioId,
    pago_id: pago.id,
  });

  res.json(pago);
});

router.post('/staff/pagos/:id/saldo/qr', onlyPacientes, async (req, res) => {
  const pago = await buscarPagoConSaldo(req.params.id);
  if (pago === null) return res.status(404).json({ error: 'Pago no encontrado' });
  if (pago === undefined) return res.status(400).json({ error: 'Este pago no tiene un saldo pendiente por cobrar' });

  const saldo = Number(pago.monto_total) - Number(pago.monto);
  const { qrId, qrImageBase64 } = await generarQR({
    monto: saldo,
    transactionId: `SALDO-${pago.id}-${Date.now()}`,
    descripcion: `Saldo cita ${pago.cita_id} - ${pago.Cita.Servicio.nombre}`,
  });

  pago.referencia_qr_saldo = qrId;
  await pago.save();

  res.json({ qrImageBase64, referencia: qrId });
});

router.get('/staff/pagos/:id/saldo/estado', onlyPacientes, async (req, res) => {
  const pago = await db.Pago.findByPk(req.params.id);
  if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

  if (pago.saldo_cobrado) return res.json({ pagado: true });
  if (!pago.referencia_qr_saldo) return res.json({ pagado: false });

  const { pagado } = await consultarEstadoQR(pago.referencia_qr_saldo);
  if (pagado) {
    pago.saldo_cobrado = true;
    pago.metodo_pago_saldo = 'qr';
    await pago.save();
  }

  res.json({ pagado });
});

module.exports = router;
