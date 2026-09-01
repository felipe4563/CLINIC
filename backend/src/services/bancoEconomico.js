const axios = require('axios');

const TOKEN_TTL_MS = 4 * 60 * 1000; // refresca antes de que expire el token real (~30min)

let cachedToken = null;
let cachedTokenAt = 0;

function baseUrl() {
  return process.env.BANCO_ECONOMICO_BASE_URL.replace(/\/$/, '');
}

async function encryptValue(text) {
  const res = await axios.get(`${baseUrl()}/api/authentication/encrypt`, {
    params: { text, aesKey: process.env.BANCO_ECONOMICO_AES_KEY },
  });
  return res.data;
}

async function authenticate() {
  const now = Date.now();
  if (cachedToken && now - cachedTokenAt < TOKEN_TTL_MS) {
    return cachedToken;
  }

  const encryptedPassword = await encryptValue(process.env.BANCO_ECONOMICO_PASSWORD);
  const res = await axios.post(`${baseUrl()}/api/authentication/authenticate`, {
    userName: process.env.BANCO_ECONOMICO_USERNAME,
    password: encryptedPassword,
  });

  if (res.data.responseCode !== 0) {
    throw new Error(`Banco Economico authenticate failed: ${res.data.message}`);
  }

  cachedToken = res.data.token;
  cachedTokenAt = now;
  return cachedToken;
}

function todayYYYYMMDD() {
  return new Date().toISOString().slice(0, 10);
}

async function generarQR({ monto, transactionId, descripcion }) {
  const token = await authenticate();
  const accountCredit = await encryptValue(process.env.BANCO_ECONOMICO_ACCOUNT_NUMBER);

  const res = await axios.post(
    `${baseUrl()}/api/qrsimple/generateQR`,
    {
      transactionId,
      accountCredit,
      currency: 'BOB',
      amount: monto,
      description: descripcion,
      dueDate: todayYYYYMMDD(),
      singleUse: true,
      modifyAmount: false,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (res.data.responseCode !== 0) {
    throw new Error(`Banco Economico generateQR failed: ${res.data.message}`);
  }

  return { qrId: res.data.qrId, qrImageBase64: res.data.qrImage };
}

async function consultarEstadoQR(qrId) {
  const token = await authenticate();
  const res = await axios.get(`${baseUrl()}/api/qrsimple/v2/statusQR/${qrId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.data.responseCode !== 0) {
    throw new Error(`Banco Economico statusQR failed: ${res.data.message}`);
  }

  return { pagado: res.data.statusQrCode === 1, payment: res.data.payment };
}

module.exports = { generarQR, consultarEstadoQR };
