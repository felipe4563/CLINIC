export interface Servicio {
  id: number;
  nombre: string;
  precio: number | string;
}

export interface Profesional {
  id: number;
  nombre: string;
}

export interface Pago {
  porcentaje: number | string;
  monto: number | string;
  monto_total: number | string;
}

export interface ConfiguracionPublica {
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  telefono?: string | null;
  email?: string | null;
  cobra_adelanto_online?: boolean;
}

export function mensajeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
