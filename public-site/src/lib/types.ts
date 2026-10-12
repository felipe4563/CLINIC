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
  estado?: 'pendiente' | 'pagado' | 'fallido';
}

export interface ConfiguracionPublica {
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  telefono?: string | null;
  email?: string | null;
  metodo_pago_online?: 'ninguno' | 'qr_banco' | 'qr_fijo';
  qr_fijo_url?: string | null;
  qr_fijo_datos?: string | null;
  politica_inasistencia?: string;
}

export function mensajeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

export function estadoHttp(e: unknown): number | undefined {
  return typeof e === 'object' && e !== null && 'status' in e ? Number((e as { status: unknown }).status) : undefined;
}
