const crypto = require('crypto');

// Sin 0/O/1/I para evitar confusiones al escribir o decir el codigo en voz alta.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LARGO = 5;
const MAX_INTENTOS = 10;

function generarSufijo() {
  let sufijo = '';
  for (let i = 0; i < LARGO; i += 1) {
    sufijo += ALFABETO[crypto.randomInt(ALFABETO.length)];
  }
  return sufijo;
}

async function generarCodigoCliente(db) {
  for (let intento = 0; intento < MAX_INTENTOS; intento += 1) {
    const codigo = `NOVA-${generarSufijo()}`;
    const existente = await db.Paciente.findOne({ where: { codigo_paciente: codigo } });
    if (!existente) return codigo;
  }
  throw new Error('No se pudo generar un codigo de cliente unico, intenta de nuevo');
}

module.exports = { generarCodigoCliente };
