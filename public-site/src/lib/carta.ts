import type { Categoria, Tratamiento } from './tratamientos/tipos';

// La carta de tratamientos de la portada: las cinco especialidades con todos sus
// tratamientos. Se arma desde CATEGORIAS (orden y agrupación del menú) y TRATAMIENTOS
// (nombre exacto del servicio en la base, para reservar y para mostrar su duración).

export type ItemCarta = {
  slug: string;
  nombre: string; // como se muestra en la carta
  nombreServicio: string; // como está en la tabla `servicios`
  descripcion?: string;
};

export type SeccionCarta = { titulo: string | null; items: ItemCarta[] };

export type EspecialidadCarta = {
  numero: string;
  titulo: string;
  descripcion: string;
  secciones: SeccionCarta[];
  total: number;
};

export function armarCarta(categorias: Categoria[], tratamientos: Tratamiento[]): EspecialidadCarta[] {
  const nombrePorSlug = new Map(tratamientos.map((t) => [t.slug, t.nombre]));
  const item = (slug: string, nombre: string, descripcion?: string): ItemCarta[] => {
    const nombreServicio = nombrePorSlug.get(slug);
    return nombreServicio ? [{ slug, nombre, nombreServicio, descripcion }] : [];
  };

  return categorias.map((c) => {
    // Medicina Estética agrupa sus tratamientos en columnas; las demás tienen un tratamiento por grupo.
    const conColumnas = c.grupos.some((g) => g.columnas);
    const secciones: SeccionCarta[] = conColumnas
      ? c.grupos.map((g) => ({
          titulo: g.titulo,
          items: (g.columnas ?? []).flatMap((col) => col.items).flatMap((i) => (i.slug ? item(i.slug, i.nombre) : [])),
        }))
      : [{ titulo: null, items: c.grupos.flatMap((g) => (g.slug ? item(g.slug, g.titulo, g.descripcion) : [])) }];
    const llenas = secciones.filter((s) => s.items.length > 0);
    return {
      numero: c.numero,
      titulo: c.titulo,
      descripcion: c.descripcion,
      secciones: llenas,
      total: llenas.reduce((n, s) => n + s.items.length, 0),
    };
  });
}
