// Fechas de la reserva: siempre "AAAA-MM-DD" en hora local, igual que la agenda.
export function aTexto(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function hoyTexto(): string {
  return aTexto(new Date());
}

// "jueves 29 de octubre"
export function fechaLarga(fecha: string): string {
  return mayuscula(new Date(`${fecha}T00:00:00`).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' }));
}

export function mayuscula(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}
