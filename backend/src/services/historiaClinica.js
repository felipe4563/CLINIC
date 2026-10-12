const { SECCIONES, COLUMNAS_PROTOCOLO } = require('../config/historiaClinica');

const MAX_TEXTO = 500;
const MAX_PARRAFO = 4000;
const MAX_FILAS_PROTOCOLO = 20;

class ErrorValidacion extends Error {
  constructor(campo, mensaje) {
    super(mensaje);
    this.campo = campo;
  }
}

// clave plana -> { tipo, opciones? } para cada sección. Los detalles de una
// casilla (ej. tabaco_frecuencia) son textos.
const CAMPOS_POR_SECCION = new Map(
  SECCIONES.map((seccion) => {
    const campos = new Map();
    for (const grupo of seccion.grupos) {
      for (const campo of grupo.campos) {
        campos.set(campo.clave, { tipo: campo.tipo, opciones: campo.opciones?.map((op) => op.clave) });
        for (const det of campo.detalles || []) campos.set(`${campo.clave}_${det.clave}`, { tipo: 'texto' });
      }
    }
    return [seccion.clave, campos];
  })
);

function limpiarTexto(clave, valor, max) {
  if (valor === null || valor === undefined) return undefined;
  if (typeof valor !== 'string') throw new ErrorValidacion(clave, `${clave} debe ser texto`);
  const limpio = valor.trim();
  if (limpio.length > max) throw new ErrorValidacion(clave, `${clave} admite hasta ${max} caracteres`);
  return limpio || undefined;
}

// Devuelve solo las claves conocidas, con valores válidos; descarta vacíos.
function validarSeccion(claveSeccion, datos) {
  const campos = CAMPOS_POR_SECCION.get(claveSeccion);
  if (!campos) throw new Error(`Sección desconocida: ${claveSeccion}`);
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return {};

  const limpio = {};
  for (const [clave, valor] of Object.entries(datos)) {
    const campo = campos.get(clave);
    if (!campo) continue;
    let final;
    if (campo.tipo === 'check') {
      if (valor === null || valor === undefined) continue;
      if (typeof valor !== 'boolean') throw new ErrorValidacion(clave, `${clave} debe ser verdadero o falso`);
      final = valor;
    } else if (campo.tipo === 'opcion') {
      if (valor === null || valor === undefined || valor === '') continue;
      if (!campo.opciones.includes(valor)) throw new ErrorValidacion(clave, `${clave} tiene una opción inválida`);
      final = valor;
    } else {
      final = limpiarTexto(clave, valor, campo.tipo === 'parrafo' ? MAX_PARRAFO : MAX_TEXTO);
    }
    if (final !== undefined) limpio[clave] = final;
  }
  return limpio;
}

function validarProtocolo(filas) {
  if (filas === null || filas === undefined) return [];
  if (!Array.isArray(filas)) throw new ErrorValidacion('protocolo', 'protocolo debe ser una lista');
  const limpias = filas
    .map((fila) => {
      const f = fila && typeof fila === 'object' ? fila : {};
      return Object.fromEntries(
        COLUMNAS_PROTOCOLO.map((col) => [col.clave, limpiarTexto(`protocolo.${col.clave}`, f[col.clave] ?? '', MAX_TEXTO) || ''])
      );
    })
    .filter((f) => COLUMNAS_PROTOCOLO.some((col) => f[col.clave]));
  if (limpias.length > MAX_FILAS_PROTOCOLO) {
    throw new ErrorValidacion('protocolo', `El protocolo admite hasta ${MAX_FILAS_PROTOCOLO} filas`);
  }
  return limpias;
}

module.exports = { ErrorValidacion, validarSeccion, validarProtocolo, MAX_TEXTO, MAX_PARRAFO };
