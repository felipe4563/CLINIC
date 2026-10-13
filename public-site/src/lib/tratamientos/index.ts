import type { Categoria, Credito, Enlace, Tratamiento } from './tipos';
import { ubicarTratamiento } from './categorias';
import { CREDITOS } from './creditos';
import { faciales } from './contenido/faciales';
import { armonizacion } from './contenido/armonizacion';
import { rejuvenecimiento } from './contenido/rejuvenecimiento';
import { corporales } from './contenido/corporales';
import { plasma } from './contenido/plasma';
import { ginecologia } from './contenido/ginecologia';
import { ecografia } from './contenido/ecografia';
import { fisioterapia } from './contenido/fisioterapia';
import { enfermeria } from './contenido/enfermeria';

export { CATEGORIAS } from './categorias';

export const TRATAMIENTOS: Tratamiento[] = [
  ...faciales,
  ...armonizacion,
  ...rejuvenecimiento,
  ...corporales,
  ...plasma,
  ...ginecologia,
  ...ecografia,
  ...fisioterapia,
  ...enfermeria,
];

const POR_SLUG = new Map(TRATAMIENTOS.map((t) => [t.slug, t]));

export type InfoTratamiento = {
  tratamiento: Tratamiento;
  categoria: Categoria;
  contexto: string;
  hermanos: Enlace[];
  imagen: string;
  credito?: Credito;
};

export function buscarTratamiento(slug: string): InfoTratamiento | null {
  const tratamiento = POR_SLUG.get(slug);
  const lugar = ubicarTratamiento(slug);
  if (!tratamiento || !lugar) return null;
  const credito = CREDITOS[slug];
  return {
    tratamiento,
    categoria: lugar.categoria,
    contexto: lugar.contexto,
    hermanos: lugar.vecinos.filter((v) => v.slug !== slug && POR_SLUG.has(v.slug)),
    imagen: credito ? `/tratamientos/${slug}.jpg` : lugar.categoria.imagen,
    credito,
  };
}
