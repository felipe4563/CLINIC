const path = require('path');
const { SECCIONES, COLUMNAS_PROTOCOLO, DIR_GUIAS } = require('../config/historiaClinica');
const { CONSENTIMIENTOS } = require('../config/consentimientos');
const { formatoFecha } = require('./pdf');
const { rutaArchivo } = require('./archivosPrivados');

// Convierte definición + datos en bloques neutros que dibujan igual el PDF y
// el Word. `enBlanco` arma el formulario vacío para llenar a mano.

const SEXO = [['F', 'F'], ['M', 'M']];
const ESTADO_CIVIL = [['S', 'S'], ['C', 'C'], ['D', 'D'], ['V', 'V']];
const FILAS_EN_BLANCO = 3;
const LINEA = '____________________';

// Fecha de emisión del documento en Bolivia (no la de la evaluación).
function hoyEnBolivia() {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return formatoFecha(partes);
}

function edadA(fechaNacimiento, fechaReferencia) {
  if (!fechaNacimiento) return '';
  const [an, mn, dn] = fechaNacimiento.split('-').map(Number);
  const [ar, mr, dr] = (fechaReferencia || new Date().toISOString().slice(0, 10)).split('-').map(Number);
  let edad = ar - an;
  if (mr < mn || (mr === mn && dr < dn)) edad -= 1;
  return edad >= 0 ? String(edad) : '';
}

function carnet(p) {
  if (!p.carnet_identidad) return '';
  return `${p.carnet_identidad}${p.carnet_complemento ? `-${p.carnet_complemento}` : ''} ${p.carnet_expedido || ''}`.trim();
}

function casillasDeOpciones(opciones, valor) {
  return { tipo: 'casillas', items: opciones.map(([clave, etiqueta]) => ({ etiqueta, marcado: valor === clave, detalles: [] })) };
}

function bloquesDeGrupo(grupo, datos) {
  const bloques = [{ tipo: 'grupo', titulo: grupo.titulo, ...(grupo.subtitulo ? { subtitulo: grupo.subtitulo } : {}) }];
  if (grupo.imagen) bloques.push({ tipo: 'imagen', archivo: path.join(DIR_GUIAS, grupo.imagen) });
  let casillas = null;
  for (const campo of grupo.campos) {
    if (campo.tipo === 'check') {
      if (!casillas) {
        casillas = { tipo: 'casillas', items: [] };
        bloques.push(casillas);
      }
      casillas.items.push({
        etiqueta: campo.etiqueta,
        marcado: datos[campo.clave] === true,
        detalles: (campo.detalles || []).map((d) => ({ etiqueta: d.etiqueta, valor: datos[`${campo.clave}_${d.clave}`] || '' })),
      });
      continue;
    }
    casillas = null;
    if (campo.tipo === 'opcion') {
      bloques.push({ tipo: 'etiqueta', texto: campo.etiqueta });
      bloques.push(casillasDeOpciones(campo.opciones.map((op) => [op.clave, op.etiqueta]), datos[campo.clave]));
    } else if (campo.tipo === 'numero') {
      const v = datos[campo.clave];
      bloques.push({ tipo: 'campo', etiqueta: campo.etiqueta, valor: v === undefined || v === null ? '' : String(v) });
    } else if (campo.tipo === 'fecha') {
      bloques.push({ tipo: 'campo', etiqueta: campo.etiqueta, valor: datos[campo.clave] ? formatoFecha(datos[campo.clave]) : '' });
    } else {
      bloques.push({ tipo: campo.tipo === 'parrafo' ? 'parrafo' : 'campo', etiqueta: campo.etiqueta, valor: datos[campo.clave] || '' });
    }
  }
  return bloques;
}

function armarDocumento({ config = {}, paciente = {}, historia = {}, tratamientos = { filas: [] }, enBlanco = false }) {
  const p = enBlanco ? {} : paciente;
  const h = enBlanco ? {} : historia;
  const especialista = h.Profesional ? h.Profesional.nombre : '';

  const bloques = [
    { tipo: 'seccion', titulo: '1. Datos personales' },
    { tipo: 'campo', etiqueta: 'Nombres y apellidos', valor: p.nombre_completo || '' },
    { tipo: 'campo', etiqueta: 'Fecha de nacimiento', valor: p.fecha_nacimiento ? formatoFecha(p.fecha_nacimiento) : '' },
    { tipo: 'campo', etiqueta: 'Edad', valor: edadA(p.fecha_nacimiento, h.fecha) },
    { tipo: 'etiqueta', texto: 'Sexo' },
    casillasDeOpciones(SEXO, p.sexo),
    { tipo: 'campo', etiqueta: 'C.I.', valor: carnet(p) },
    { tipo: 'etiqueta', texto: 'Estado civil' },
    casillasDeOpciones(ESTADO_CIVIL, p.estado_civil),
    { tipo: 'campo', etiqueta: 'Grupo sanguíneo', valor: p.grupo_sanguineo || '' },
    { tipo: 'campo', etiqueta: 'Dirección', valor: p.direccion || '' },
    { tipo: 'campo', etiqueta: 'Ocupación', valor: p.ocupacion || '' },
    { tipo: 'campo', etiqueta: 'E-mail', valor: p.email || '' },
    { tipo: 'campo', etiqueta: 'Teléfono', valor: p.telefono || '' },
    { tipo: 'campo', etiqueta: 'Contacto de emergencia', valor: p.contacto_emergencia || '' },
    { tipo: 'campo', etiqueta: 'Parentesco', valor: p.parentesco_emergencia || '' },
    { tipo: 'parrafo', etiqueta: 'Motivo de la consulta', valor: h.motivo_consulta || '' },
  ];

  for (const seccion of SECCIONES) {
    bloques.push({ tipo: 'seccion', titulo: seccion.titulo });
    const datos = (h[seccion.clave] && typeof h[seccion.clave] === 'object') ? h[seccion.clave] : {};
    for (const grupo of seccion.grupos) bloques.push(...bloquesDeGrupo(grupo, datos));
  }

  const vacias = (n) => Array.from({ length: FILAS_EN_BLANCO }, () => Array(n).fill(''));
  const protocolo = enBlanco ? vacias(3) : (h.protocolo || []).map((f) => COLUMNAS_PROTOCOLO.map((c) => f[c.clave] || ''));
  const realizados = enBlanco
    ? vacias(3)
    : (tratamientos.filas || []).map((f) => [formatoFecha(f.fecha), f.procedimiento || '', f.observacion || '']);

  const fotos = enBlanco ? [] : (h.fotos || []).map((f) => ({ ruta: rutaArchivo('historias-fotos', f.archivo), nota: f.nota || '' }));
  const marcados = enBlanco ? [] : (h.consentimientos || []);
  const consentimientos = CONSENTIMIENTOS.filter((c) => marcados.includes(c.clave));
  const aImprimir = consentimientos.length ? consentimientos : CONSENTIMIENTOS.filter((c) => c.clave === 'general');
  const conf = enBlanco ? {} : config;
  const prof = h.Profesional || {};
  const valores = {
    clinica: conf.nombre_consultorio || '',
    direccion_clinica: [conf.direccion, conf.ciudad].map((x) => (x || '').trim()).filter(Boolean).join(', '),
    contacto_clinica: [conf.telefono, conf.email].filter(Boolean).join(' · '),
    especialista,
    registro: prof.registro_profesional || '',
    especialidad: prof.especialidad || '',
    paciente: p.nombre_completo || '',
    ci: carnet(p),
    fecha_nacimiento: p.fecha_nacimiento ? formatoFecha(p.fecha_nacimiento) : '',
    telefono: p.telefono || '',
    motivo: h.motivo_consulta || '',
    procedimiento: h.procedimiento_autorizado || '',
  };
  // `vacio`: qué poner si no hay dato (una línea en el texto; nada en un campo, que ya dibuja su línea).
  const rellenar = (texto, vacio) => texto.replace(/\{(\w+)\}/g, (_, k) => valores[k] || vacio).trim();
  const bloquesConsentimiento = (cons) => [
    { tipo: 'consentimiento', titulo: cons.titulo },
    ...cons.apartados.flatMap((a, i) => [
      // El último apartado va en la misma hoja que las firmas.
      { tipo: 'grupo', titulo: `${i + 1}. ${a.titulo}`, ...(i === cons.apartados.length - 1 ? { juntoAFirmas: true } : {}) },
      ...(a.campos || []).map(([etiqueta, valor]) => ({ tipo: 'campo', etiqueta, valor: rellenar(valor, '') })),
      ...(a.parrafos || []).map((t) => ({ tipo: 'texto', texto: rellenar(t, LINEA), ...(i === cons.apartados.length - 1 ? { juntoAFirmas: true } : {}) })),
      ...(a.casillas ? [{ tipo: 'casillas', items: a.casillas.map((etiqueta) => ({ etiqueta, marcado: false, detalles: [] })) }] : []),
    ]),
    {
      tipo: 'firmas',
      // Sin dato queda la etiqueta ("C.I.:") para llenar a mano; una línea vacía se omite.
      firmantes: cons.firmas.map((f) => ({ titulo: f.titulo, lineas: f.lineas.map((l) => rellenar(l, '')).filter(Boolean) })),
    },
  ];

  bloques.push(
    { tipo: 'seccion', titulo: '5. Diagnóstico' },
    { tipo: 'parrafo', etiqueta: 'Diagnóstico', valor: h.diagnostico || '', lineas: 6 },
    { tipo: 'grupo', titulo: 'Protocolo estético seleccionado' },
    { tipo: 'tabla', columnas: COLUMNAS_PROTOCOLO.map((c) => c.etiqueta), filas: protocolo },
    { tipo: 'grupo', titulo: 'Fotos' },
    { tipo: 'fotos', fotos },
    { tipo: 'grupo', titulo: 'Tratamiento estético realizado' },
    { tipo: 'tabla', columnas: ['Fecha', 'Procedimiento', 'Observación/evaluación'], filas: realizados },
    { tipo: 'seccion', titulo: '6. Consentimiento' },
    ...aImprimir.flatMap(bloquesConsentimiento)
  );

  return { fecha: h.fecha ? formatoFecha(h.fecha) : '', emitido: hoyEnBolivia(), numero: p.codigo_paciente || '', bloques };
}

module.exports = { armarDocumento, edadA };
