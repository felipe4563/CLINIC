const { Op } = require('sequelize');
const db = require('../models');
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

// Alerta para la ficha: si la evaluación más reciente marca Alergias.
function alertaAlergias(historia) {
  const datos = historia ? historia.datos_clinicos || {} : {};
  return { alergias: Boolean(datos.alergias), detalle: datos.alergias ? datos.especificar || null : null };
}

// "Tratamiento estético realizado" de una evaluación: desde su fecha hasta la
// fecha de la evaluación siguiente (excluida). No se guarda: se arma con las
// citas completadas (con su nota de sesión, si la tiene) y las notas manuales.
async function calcularTratamientos(historia) {
  const siguiente = await db.HistoriaClinica.findOne({
    where: {
      paciente_id: historia.paciente_id,
      [Op.or]: [{ fecha: { [Op.gt]: historia.fecha } }, { fecha: historia.fecha, id: { [Op.gt]: historia.id } }],
    },
    order: [['fecha', 'ASC'], ['id', 'ASC']],
  });
  const desde = historia.fecha;
  const hasta = siguiente ? siguiente.fecha : null;
  const rango = hasta ? { [Op.gte]: desde, [Op.lt]: hasta } : { [Op.gte]: desde };

  const [citas, manuales] = await Promise.all([
    db.Cita.findAll({
      where: { paciente_id: historia.paciente_id, estado: 'completada', fecha: rango },
      include: [{ model: db.Servicio, attributes: ['nombre'] }, { model: db.NotaClinica }],
    }),
    db.NotaClinica.findAll({ where: { paciente_id: historia.paciente_id, cita_id: null, fecha: rango } }),
  ]);

  const filas = [
    ...citas.map((c) => ({
      tipo: 'cita',
      fecha: c.fecha,
      hora: c.hora_inicio,
      procedimiento: c.Servicio ? c.Servicio.nombre : 'Cita',
      observacion: c.NotaClinica ? c.NotaClinica.notas : null,
      citaId: c.id,
      notaId: c.NotaClinica ? c.NotaClinica.id : null,
      faltaObservacion: !c.NotaClinica,
    })),
    ...manuales.map((n) => ({
      tipo: 'manual',
      fecha: n.fecha,
      hora: n.hora,
      procedimiento: n.titulo,
      observacion: n.notas,
      citaId: null,
      notaId: n.id,
      faltaObservacion: false,
    })),
  ].sort((a, b) => (a.fecha + (a.hora || '')).localeCompare(b.fecha + (b.hora || '')));

  return { desde, hasta, filas: filas.map(({ hora, ...resto }) => resto) };
}

module.exports = { ErrorValidacion, validarSeccion, validarProtocolo, alertaAlergias, calcularTratamientos, MAX_TEXTO, MAX_PARRAFO };
