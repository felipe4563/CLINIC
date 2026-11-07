const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { enviarPlantillaWhatsApp, whatsappConfigurado, normalizarTelefono } = require('../services/whatsapp');

const router = express.Router();
const onlyAutomatizacion = requirePermiso('automatizacion');

const CAMPOS_CONFIG = ['recordatorio_24h', 'recordatorio_2h', 'no_show', 'post_consulta', 'saldo_pendiente'];

// Qué plantilla usa cada mensaje (las que hay que crear y aprobar en Meta).
function plantillas() {
  const env = (clave, porDefecto) => process.env[clave] || porDefecto || null;
  return {
    cita_confirmada: env('WHATSAPP_CITA_CONFIRMADA_TEMPLATE', 'cita_confirmada'),
    aviso_cita: env('WHATSAPP_AVISO_TEMPLATE'),
    recordatorio_24h: env('WHATSAPP_RECORDATORIO_24H_TEMPLATE'),
    recordatorio_2h: env('WHATSAPP_RECORDATORIO_2H_TEMPLATE'),
    no_show: env('WHATSAPP_NO_SHOW_TEMPLATE'),
    post_consulta: env('WHATSAPP_POST_CONSULTA_TEMPLATE'),
    saldo_pendiente: env('WHATSAPP_SALDO_PENDIENTE_TEMPLATE'),
  };
}

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
  const fallidos = await db.NotificacionAutomatica.count({ where: { estado: 'fallido' } });
  res.json({ config, notificaciones, whatsapp: { conectado: whatsappConfigurado(), plantillas: plantillas(), fallidos } });
});

// Mensaje de prueba con "hello_world", la plantilla que Meta trae aprobada en
// toda cuenta nueva (en inglés): sirve para probar el número antes de tener las propias.
router.post('/staff/automatizacion/prueba', onlyAutomatizacion, async (req, res) => {
  if (!whatsappConfigurado()) return res.status(400).json({ error: 'WhatsApp todavía no está conectado en el servidor' });
  const telefono = normalizarTelefono(req.body.telefono);
  if (telefono.length < 10) return res.status(400).json({ error: 'Escribe un número de celular, por ejemplo 71234567' });
  try {
    await enviarPlantillaWhatsApp(telefono, 'hello_world', [], { idioma: 'en_US' });
    res.json({ ok: true, telefono });
  } catch (err) {
    res.status(502).json({ error: `WhatsApp no lo aceptó: ${err.message}` });
  }
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
