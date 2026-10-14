// Buffers mínimos con la firma real de cada formato: detectarTipo solo mira
// los bytes iniciales.
const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function pngFalso() {
  return Buffer.concat([FIRMA_PNG, Buffer.alloc(32)]);
}

function pdfFalso() {
  return Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(32)]);
}

function exeFalso() {
  return Buffer.concat([Buffer.from('MZ'), Buffer.alloc(64)]);
}

function pngGrande() {
  return Buffer.concat([FIRMA_PNG, Buffer.alloc(5 * 1024 * 1024 + 1 - FIRMA_PNG.length)]);
}

function jpgFalso() {
  return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]);
}

// PNG 1x1 válido: pdfkit y docx lo pueden decodificar (los "falsos" no).
function pngReal() {
  return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
}

module.exports = { pngFalso, pdfFalso, exeFalso, pngGrande, jpgFalso, pngReal };
