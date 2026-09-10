const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');

const router = express.Router();
const onlyCaja = requirePermiso('caja');

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

router.get('/staff/caja', onlyCaja, async (req, res) => {
  const fecha = req.query.fecha || hoyISO();
  const movimientos = await db.MovimientoCaja.findAll({
    where: { fecha },
    include: [{ model: db.Usuario, attributes: { exclude: ['password_hash'] } }],
    order: [['id', 'ASC']],
  });

  const totalIngresos = movimientos.filter((m) => m.tipo === 'ingreso').reduce((acc, m) => acc + Number(m.monto), 0);
  const totalEgresos = movimientos.filter((m) => m.tipo === 'egreso').reduce((acc, m) => acc + Number(m.monto), 0);

  res.json({
    fecha,
    movimientos,
    totalIngresos,
    totalEgresos,
    saldoNeto: totalIngresos - totalEgresos,
  });
});

router.post('/staff/caja', onlyCaja, async (req, res) => {
  const { tipo, concepto, monto, fecha } = req.body;
  if (!['ingreso', 'egreso'].includes(tipo) || !concepto || !monto) {
    return res.status(400).json({ error: 'tipo (ingreso|egreso), concepto y monto son requeridos' });
  }

  const movimiento = await db.MovimientoCaja.create({
    tipo,
    concepto,
    monto,
    fecha: fecha || hoyISO(),
    usuario_id: req.usuarioId,
  });

  const conUsuario = await db.MovimientoCaja.findByPk(movimiento.id, {
    include: [{ model: db.Usuario, attributes: { exclude: ['password_hash'] } }],
  });
  res.status(201).json(conUsuario);
});

router.delete('/staff/caja/:id', onlyCaja, async (req, res) => {
  const movimiento = await db.MovimientoCaja.findByPk(req.params.id);
  if (!movimiento) return res.status(404).json({ error: 'Movimiento no encontrado' });
  if (movimiento.pago_id) {
    return res.status(400).json({ error: 'Este movimiento se generó automáticamente por un cobro y no se puede eliminar' });
  }

  await movimiento.destroy();
  res.status(204).end();
});

module.exports = router;
