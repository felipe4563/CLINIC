// Envíos de WhatsApp de las reservas que nunca deben romper la operación:
// devuelven el resultado para que el panel avise al personal si no salió.
const { enviarPlantillaWhatsApp } = require('./whatsapp');

async function enviarConfirmacionCita(telefono, fecha, hora) {
  try {
    await enviarPlantillaWhatsApp(telefono, 'cita_confirmada', [fecha, hora]);
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
  if (!plantilla) {
    console.warn('WHATSAPP_AVISO_TEMPLATE no está configurada: aviso de cita no enviado');
    return 'no_configurado';
  }
  try {
    await enviarPlantillaWhatsApp(telefono, plantilla, [nombre, `${fecha} ${hora}`, mensaje]);
    return 'enviado';
  } catch (err) {
    console.error('No se pudo enviar el aviso de cita por WhatsApp:', err.message);
    return 'error';
  }
}

module.exports = { enviarConfirmacionCita, enviarAvisoCita };
