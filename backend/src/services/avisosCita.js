// Envíos de WhatsApp de las reservas que nunca deben romper la operación:
// devuelven el resultado para que el panel avise al personal si no salió.
const { enviarPlantillaWhatsApp, whatsappConfigurado } = require('./whatsapp');
const { fechaLegible, horaCorta } = require('./textosCita');

// Plantilla "cita_confirmada" (Utilidad):
//   Hola {{1}}, tu cita de {{2}} en Clinic NovagED quedó confirmada para el {{3}} a las {{4}}.
async function enviarConfirmacionCita({ telefono, nombre, servicio, fecha, hora }) {
  if (!whatsappConfigurado()) return 'no_configurado';
  try {
    await enviarPlantillaWhatsApp(telefono, process.env.WHATSAPP_CITA_CONFIRMADA_TEMPLATE || 'cita_confirmada', [nombre, servicio, fechaLegible(fecha), horaCorta(hora)]);
    return 'enviado';
  } catch (err) {
    console.error('No se pudo enviar la confirmación de cita por WhatsApp:', err.message);
    return 'error';
  }
}

// Plantilla general "aviso_cita" (Utilidad):
//   Hola {{1}}, te escribimos de Clinic NovagED sobre tu cita del {{2}}: {{3}}
// Su nombre viene de WHATSAPP_AVISO_TEMPLATE; sin aprobar en Meta no se envía.
async function enviarAvisoCita({ telefono, nombre, fecha, hora, mensaje }) {
  const plantilla = process.env.WHATSAPP_AVISO_TEMPLATE;
  if (!plantilla || !whatsappConfigurado()) {
    console.warn('WhatsApp o WHATSAPP_AVISO_TEMPLATE no están configurados: aviso de cita no enviado');
    return 'no_configurado';
  }
  try {
    await enviarPlantillaWhatsApp(telefono, plantilla, [nombre, `${fechaLegible(fecha)} a las ${horaCorta(hora)}`, mensaje]);
    return 'enviado';
  } catch (err) {
    console.error('No se pudo enviar el aviso de cita por WhatsApp:', err.message);
    return 'error';
  }
}

module.exports = { enviarConfirmacionCita, enviarAvisoCita };
