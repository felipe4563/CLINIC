// Reglas de la política de inasistencia (ver
// docs/superpowers/specs/2026-10-12-reserva-qr-fijo-comprobante-design.md).
// Las horas se interpretan en la hora local del servidor, igual que
// services/disponibilidad.js.

const HORAS_PARA_JUSTIFICAR = 48;
const DIAS_PARA_REPROGRAMAR = 30;
const MS_HORA = 60 * 60 * 1000;

const TEXTO_POR_DEFECTO = [
  'Al reservar tu cita realizas un pago anticipado que asegura tu horario. Ese horario queda reservado exclusivamente para ti, y la clínica deja de ofrecerlo a otros pacientes.',
  'Si no asistes a tu cita, pierdes el monto depositado.',
  `Si no pudiste asistir por un motivo justificado (por ejemplo, enfermedad o emergencia), puedes enviar una prueba a la clínica por WhatsApp, como un certificado médico u otro documento, dentro de las ${HORAS_PARA_JUSTIFICAR} horas siguientes a la hora de tu cita. Si la clínica acepta la justificación, podrás reprogramar tu cita para otro día sin volver a pagar, dentro de los ${DIAS_PARA_REPROGRAMAR} días siguientes.`,
  'La reprogramación sin costo se concede una sola vez por pago. La clínica evalúa cada justificación y su decisión es final.',
].join('\n\n');

function inicioCita(cita) {
  return new Date(`${cita.fecha}T${String(cita.hora_inicio).slice(0, 8)}`);
}

function plazos(cita, ahora = new Date()) {
  const pago = cita.Pago || null;
  const conAdelanto = Boolean(pago && pago.metodo_adelanto && pago.estado === 'pagado');
  const noAsistio = cita.estado === 'no_asistio';
  const aceptada = cita.justificacion_estado === 'aceptada';

  const limiteJustificar = new Date(inicioCita(cita).getTime() + HORAS_PARA_JUSTIFICAR * MS_HORA);
  const limiteReprogramar = cita.justificacion_registrada_en
    ? new Date(new Date(cita.justificacion_registrada_en).getTime() + DIAS_PARA_REPROGRAMAR * 24 * MS_HORA)
    : null;

  return {
    conAdelanto,
    montoRetenido: conAdelanto && noAsistio && !aceptada,
    puedeJustificar: conAdelanto && noAsistio && !cita.justificacion_estado,
    puedeReprogramar: conAdelanto && noAsistio && aceptada && !cita.reprogramacion_usada,
    limiteJustificar: limiteJustificar.toISOString(),
    justificacionFueraDePlazo: ahora > limiteJustificar,
    limiteReprogramar: limiteReprogramar ? limiteReprogramar.toISOString() : null,
    reprogramacionFueraDePlazo: limiteReprogramar ? ahora > limiteReprogramar : false,
  };
}

// JSON de una cita para el panel: agrega `politica` y nunca expone los
// nombres de archivo privados, solo si existen.
function conPolitica(cita) {
  const json = typeof cita.toJSON === 'function' ? cita.toJSON() : { ...cita };
  if (json.Pago) {
    const { comprobante_archivo, ...pago } = json.Pago;
    json.Pago = { ...pago, tieneComprobante: Boolean(comprobante_archivo) };
  }
  const { justificacion_archivo, ...resto } = json;
  return { ...resto, tieneJustificacion: Boolean(justificacion_archivo), politica: plazos(json) };
}

module.exports = { HORAS_PARA_JUSTIFICAR, DIAS_PARA_REPROGRAMAR, TEXTO_POR_DEFECTO, plazos, conPolitica };
