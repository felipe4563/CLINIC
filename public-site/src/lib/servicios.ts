// Las páginas de tratamiento buscan su servicio por nombre y no por id, porque los
// ids cambian entre la base local y la de producción.
export function normalizarNombre(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function buscarServicioPorNombre<T extends { nombre: string }>(servicios: T[], nombre: string): T | null {
  const buscado = normalizarNombre(nombre);
  if (!buscado) return null;
  return servicios.find((s) => normalizarNombre(s.nombre) === buscado) ?? null;
}
