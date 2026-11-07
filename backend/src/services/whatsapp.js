const axios = require('axios');

// WhatsApp Cloud API de Meta. Sin WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID no
// se envía nada (así la copia local nunca le escribe a pacientes reales).
const VERSION_API = 'v19.0';

function whatsappConfigurado() {
  const token = process.env.WHATSAPP_TOKEN;
  const numeroId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const falso = (v) => !v || v === 'change_me' || /fake/i.test(v);
  return !falso(token) && !falso(numeroId);
}

// Bolivia: 8 dígitos sin código de país -> 591XXXXXXXX. Meta pide solo dígitos.
function normalizarTelefono(telefono) {
  const digitos = String(telefono || '').replace(/\D/g, '');
  return /^[67]\d{7}$/.test(digitos) ? `591${digitos}` : digitos;
}

// Mensaje entendible a partir del error que devuelve Meta (o la red).
function motivoError(err) {
  const meta = err.response && err.response.data && err.response.data.error;
  if (meta) return [meta.message, meta.error_data && meta.error_data.details].filter(Boolean).join(' — ').slice(0, 480);
  return String(err.message || err).slice(0, 480);
}

// `boton`: texto para el botón "Copiar código" de las plantillas de autenticación (OTP).
async function enviarPlantillaWhatsApp(telefono, templateName, parametros = [], { boton, idioma } = {}) {
  if (!whatsappConfigurado()) throw new Error('WhatsApp no está conectado (faltan WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID)');
  if (!templateName) throw new Error('Falta el nombre de la plantilla');
  const para = normalizarTelefono(telefono);
  if (para.length < 10) throw new Error(`Número de teléfono inválido: ${telefono}`);

  const components = [];
  if (parametros.length) components.push({ type: 'body', parameters: parametros.map((p) => ({ type: 'text', text: String(p) })) });
  if (boton) components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: String(boton) }] });

  const url = `https://graph.facebook.com/${VERSION_API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  try {
    await axios.post(url, {
      messaging_product: 'whatsapp',
      to: para,
      type: 'template',
      template: { name: templateName, language: { code: idioma || process.env.WHATSAPP_IDIOMA || 'es' }, components },
    }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }, timeout: 15000 });
  } catch (err) {
    throw new Error(motivoError(err));
  }
}

module.exports = { enviarPlantillaWhatsApp, whatsappConfigurado, normalizarTelefono };
