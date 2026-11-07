// Especialidades de la clínica y los grupos de Medicina Estética: las mismas de la
// carta de la web. Cada servicio lleva una especialidad y, si la tiene, un grupo.
const ESPECIALIDADES = [
  {
    nombre: 'Medicina Estética',
    grupos: ['Tratamientos Faciales', 'Armonización Facial', 'Rejuvenecimiento · Lifting', 'Tratamientos Corporales', 'Plasma Láser'],
  },
  { nombre: 'Ginecología y Obstetricia', grupos: [] },
  { nombre: 'Ecografía', grupos: [] },
  { nombre: 'Fisioterapia', grupos: [] },
  { nombre: 'Enfermería', grupos: [] },
];

// Devuelve { especialidad, grupo } válidos, o { error } si no corresponden.
// `lista`: las fijas más las que se agregaron desde el Catálogo.
function leerCategoria(especialidad, grupo, lista = ESPECIALIDADES) {
  const e = lista.find((x) => x.nombre === especialidad);
  if (!e) return { error: 'Elige una especialidad de la lista' };
  if (!grupo) return { especialidad: e.nombre, grupo: null };
  if (!e.grupos.includes(grupo)) return { error: `El grupo no corresponde a ${e.nombre}` };
  return { especialidad: e.nombre, grupo };
}

module.exports = { ESPECIALIDADES, leerCategoria };
