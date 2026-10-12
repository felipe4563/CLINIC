import type { Cita } from './DayAgendaCards';

export function fmtFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export const REVISION_LABEL = {
  sin_revisar: 'Comprobante sin revisar',
  valido: 'Comprobante válido',
  invalido: 'Comprobante inválido',
} as const;

export const REVISION_COLOR = {
  sin_revisar: 'var(--stat-amber)',
  valido: 'var(--stat-green)',
  invalido: 'var(--stat-rose)',
} as const;

export function avisoWhatsAppTexto(estado?: string) {
  if (estado === 'no_configurado') return 'Avisa al paciente: la plantilla de WhatsApp no está configurada.';
  if (estado === 'error') return 'No se pudo enviar el WhatsApp al paciente: avísale por tu cuenta.';
  return null;
}

export function tieneRevisionPendiente(cita: Cita) {
  return cita.Pago?.comprobante_revision === 'sin_revisar' && cita.estado !== 'cancelada';
}
