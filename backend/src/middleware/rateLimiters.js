const rateLimit = require('express-rate-limit');

function crearLimiter(max, mensaje, windowMs = 15 * 60 * 1000) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    message: { error: mensaje },
  });
}

module.exports = { crearLimiter };
