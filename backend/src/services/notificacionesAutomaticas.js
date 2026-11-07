const db = require('../models');
const { enviarPlantillaWhatsApp, whatsappConfigurado } = require('./whatsapp');

function filtro(tipo, { citaId, pagoId }) {
  const where = { tipo };
  if (citaId) where.cita_id = citaId;
  if (pagoId) where.pago_id = pagoId;
  return where;
}

// Envia una plantilla de WhatsApp para un evento automatico, respetando la
// configuracion (on/off) y evitando reenvios duplicados para la misma cita/pago.
// Si WhatsApp la rechaza, queda un registro 'fallido' con el motivo (uno solo por
// cita/pago, que se actualiza en cada reintento) y el error sigue hacia quien llamó.
async function enviarSiCorresponde({ tipo, telefono, template, parametros = [], citaId, pagoId }) {
  const config = await db.AutomatizacionConfig.obtenerConfig();
  if (!config[tipo]) return false;
  // Sin WhatsApp conectado no hay nada que intentar ni que registrar.
  if (!whatsappConfigurado()) return false;

  const where = filtro(tipo, { citaId, pagoId });
  const anterior = await db.NotificacionAutomatica.findOne({ where });
  if (anterior && anterior.estado === 'enviado') return false;

  try {
    if (!template) throw new Error(`No hay plantilla configurada para "${tipo}" (WHATSAPP_${tipo.toUpperCase()}_TEMPLATE)`);
    await enviarPlantillaWhatsApp(telefono, template, parametros);
  } catch (err) {
    const datos = { tipo, cita_id: citaId || null, pago_id: pagoId || null, estado: 'fallido', error: String(err.message).slice(0, 500), enviado_at: new Date() };
    if (anterior) await anterior.update(datos);
    else await db.NotificacionAutomatica.create(datos);
    throw err;
  }

  const enviado = { tipo, cita_id: citaId || null, pago_id: pagoId || null, estado: 'enviado', error: null, enviado_at: new Date() };
  if (anterior) await anterior.update(enviado);
  else await db.NotificacionAutomatica.create(enviado);
  return true;
}

module.exports = { enviarSiCorresponde };
