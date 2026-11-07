// Cómo se escriben la fecha y la hora de una cita en los mensajes al paciente.
// 2026-11-09 -> "lunes 9 de noviembre"; "10:30:00" -> "10:30". Así llegan en los mensajes.
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function fechaLegible(iso) {
  const [a, m, d] = String(iso).split('-').map(Number);
  if (!a || !m || !d) return String(iso);
  return `${DIAS[new Date(a, m - 1, d).getDay()]} ${d} de ${MESES[m - 1]}`;
}
const horaCorta = (hora) => String(hora || '').slice(0, 5);

module.exports = { fechaLegible, horaCorta };
