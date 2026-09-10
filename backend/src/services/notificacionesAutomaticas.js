const db = require('../models');
const { enviarPlantillaWhatsApp } = require('./whatsapp');

async function yaEnviada(tipo, { citaId, pagoId }) {
  const where = { tipo };
  if (citaId) where.cita_id = citaId;
  if (pagoId) where.pago_id = pagoId;
  return db.NotificacionAutomatica.findOne({ where });
}

// Envia una plantilla de WhatsApp para un evento automatico, respetando la
// configuracion (on/off) y evitando reenvios duplicados para la misma cita/pago.
async function enviarSiCorresponde({ tipo, telefono, template, parametros = [], citaId, pagoId }) {
  const config = await db.AutomatizacionConfig.obtenerConfig();
  if (!config[tipo]) return false;

  const existente = await yaEnviada(tipo, { citaId, pagoId });
  if (existente) return false;

  await enviarPlantillaWhatsApp(telefono, template, parametros);
  await db.NotificacionAutomatica.create({ tipo, cita_id: citaId || null, pago_id: pagoId || null });
  return true;
}

module.exports = { enviarSiCorresponde };
