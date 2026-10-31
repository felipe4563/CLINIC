// Ayudas de texto para "Nuestro equipo". Sin dependencias, para probarlas con node --test.

const TITULOS = /^(dra|dr|lic|licda|lcda|lcdo)\.?$/i;

// La biografía se escribe en el panel; una línea en blanco separa los párrafos.
export function parrafos(texto: string | null | undefined): string[] {
  return (texto || '')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

// "Dra. Maria Noemi Ponce Caisiri" → ["Dra. Maria Noemi", "Ponce Caisiri"]: el final va en cursiva.
export function separarNombre(nombre: string): [string, string] {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length < 3) return [partes.join(' '), ''];
  return [partes.slice(0, -2).join(' '), partes.slice(-2).join(' ')];
}

// Para el botón "Reservar con …": el primer nombre, con su título si lo tiene ("Dra. Maria").
export function nombreCorto(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length && TITULOS.test(partes[0])) return partes.slice(0, 2).join(' ');
  return partes[0] || nombre;
}
