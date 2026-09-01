const axios = require('axios');

async function enviarPlantillaWhatsApp(telefono, templateName, parametros = []) {
  const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: telefono,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'es' },
      components: parametros.length
        ? [{ type: 'body', parameters: parametros.map((p) => ({ type: 'text', text: p })) }]
        : [],
    },
  };
  await axios.post(url, payload, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
  });
}

module.exports = { enviarPlantillaWhatsApp };
