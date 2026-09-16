const db = require('../models');

// Otorga puntos de fidelidad por un gasto (cita completada o venta pagada),
// segun la tasa configurada (Bs. por punto). No hace nada si el monto no
// alcanza para al menos 1 punto.
async function otorgarPuntosPorGasto({ pacienteId, monto, motivo, citaId, ventaId }) {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  const bsPorPunto = Number(config.bs_por_punto);
  if (!bsPorPunto || bsPorPunto <= 0) return null;

  const puntos = Math.floor(Number(monto) / bsPorPunto);
  if (puntos <= 0) return null;

  const paciente = await db.Paciente.findByPk(pacienteId);
  if (!paciente) return null;

  paciente.puntos_actuales += puntos;
  await paciente.save();

  return db.MovimientoPuntos.create({
    paciente_id: pacienteId,
    tipo: 'ganado',
    puntos,
    motivo,
    cita_id: citaId || null,
    venta_id: ventaId || null,
  });
}

module.exports = { otorgarPuntosPorGasto };
