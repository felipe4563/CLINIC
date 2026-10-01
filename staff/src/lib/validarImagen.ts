const TAMANO_MAX_IMAGEN = 3 * 1024 * 1024;
const TIPOS_IMAGEN_VALIDOS = ['image/png', 'image/jpeg', 'image/webp'];

export function validarImagen(archivo: File): string | null {
  if (!TIPOS_IMAGEN_VALIDOS.includes(archivo.type)) return 'Formato no soportado. Usa PNG, JPG o WEBP.';
  if (archivo.size > TAMANO_MAX_IMAGEN) return 'La imagen pesa demasiado. El máximo permitido es 3 MB.';
  return null;
}
