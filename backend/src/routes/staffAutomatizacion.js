const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');

const router = express.Router();
const onlyAutomatizacion = requirePermiso('automatizacion');

const CAMPOS_CONFIG = ['recordatorio_24h', 'recordatorio_2h', 'no_show', 'post_consulta', 'saldo_pendiente'];

router.get('/staff/automatizacion', onlyAutomatizacion, async (req, res) => {
  const config = await db.AutomatizacionConfig.obtenerConfig();
  const notificaciones = await db.NotificacionAutomatica.findAll({
    include: [
      { model: db.Cita, include: [db.Paciente] },
      { model: db.Pago, as: 'Pago', include: [{ model: db.Cita, as: 'Cita', include: [db.Paciente] }] },
    ],
    order: [['enviado_at', 'DESC']],
    limit: 30,
  });
  res.json({ config, notificaciones });
});

router.patch('/staff/automatizacion', onlyAutomatizacion, async (req, res) => {
  const config = await db.AutomatizacionConfig.obtenerConfig();
  for (const campo of CAMPOS_CONFIG) {
    if (typeof req.body[campo] === 'boolean') config[campo] = req.body[campo];
  }
  await config.save();
  res.json(config);
});

module.exports = router;
