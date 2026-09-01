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
  // DEPLOY BLOCKER: this only checks payload shape. Once the real Banco
  // Economico webhook docs are available, this MUST verify the
  // signature/HMAC header before trusting payload.referencia / payload.estado.
  // Do not ship to production without real signature validation here.
  return payload && payload.referencia && payload.estado;
}

module.exports = { generarQR, validarWebhook };
