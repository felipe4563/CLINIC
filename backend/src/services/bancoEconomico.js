const axios = require('axios');

async function generarQR({ monto, referencia }) {
  const res = await axios.post(
    `${process.env.BANCO_ECONOMICO_BASE_URL}/qr/generar`,
    { monto, referencia, moneda: 'BOB' },
    { headers: { Authorization: `Bearer ${process.env.BANCO_ECONOMICO_API_KEY}` } }
  );
  return { qrImageBase64: res.data.qrImageBase64, referencia: res.data.referencia };
}

function validarWebhook(payload) {
  // TODO once the bank's webhook signature scheme is confirmed from the docs:
  // verify signature/HMAC header before trusting payload.referencia / payload.estado.
  return payload && payload.referencia && payload.estado;
}

module.exports = { generarQR, validarWebhook };
