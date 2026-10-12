const { SECCIONES, COLUMNAS_PROTOCOLO } = require('../config/historiaClinica');
const { formatoFecha } = require('./pdf');

// Convierte definición + datos en bloques neutros que dibujan igual el PDF y
// el Word. `enBlanco` arma el formulario vacío para llenar a mano.

const SEXO = [['F', 'F'], ['M', 'M']];
const ESTADO_CIVIL = [['S', 'S'], ['C', 'C'], ['D', 'D'], ['V', 'V']];
const FILAS_EN_BLANCO = 3;
const LINEA = '____________________';

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
      bloques.push({ tipo: 'campo', etiqueta: campo.etiqueta, valor: '' });
      bloques.push(casillasDeOpciones(campo.opciones.map((op) => [op.clave, op.etiqueta]), datos[campo.clave]));
    } else {
      bloques.push({ tipo: campo.tipo === 'parrafo' ? 'parrafo' : 'campo', etiqueta: campo.etiqueta, valor: datos[campo.clave] || '' });
    }
  }
  return bloques;
}

function armarDocumento({ config = {}, paciente = {}, historia = {}, tratamientos = { filas: [] }, enBlanco = false }) {
  const p = enBlanco ? {} : paciente;
  const h = enBlanco ? {} : historia;
  const clinica = config.nombre_consultorio || 'la clínica';
  const especialista = h.Profesional ? h.Profesional.nombre : '';

  const bloques = [
    { tipo: 'seccion', titulo: '1. Datos personales' },
    { tipo: 'campo', etiqueta: 'Nombres y apellidos', valor: p.nombre_completo || '' },
    { tipo: 'campo', etiqueta: 'Fecha de nacimiento', valor: p.fecha_nacimiento ? formatoFecha(p.fecha_nacimiento) : '' },
    { tipo: 'campo', etiqueta: 'Edad', valor: edadA(p.fecha_nacimiento, h.fecha) },
    { tipo: 'campo', etiqueta: 'Sexo', valor: '' },
    casillasDeOpciones(SEXO, p.sexo),
    { tipo: 'campo', etiqueta: 'C.I.', valor: carnet(p) },
    { tipo: 'campo', etiqueta: 'Estado civil', valor: '' },
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

  bloques.push(
    { tipo: 'seccion', titulo: '5. Diagnóstico y tratamiento estético' },
    { tipo: 'parrafo', etiqueta: 'Diagnóstico', valor: h.diagnostico || '' },
    { tipo: 'grupo', titulo: 'Protocolo estético seleccionado' },
    { tipo: 'tabla', columnas: COLUMNAS_PROTOCOLO.map((c) => c.etiqueta), filas: protocolo },
    { tipo: 'grupo', titulo: 'Tratamiento estético realizado' },
    { tipo: 'tabla', columnas: ['Fecha', 'Procedimiento', 'Observación/evaluación'], filas: realizados },
    { tipo: 'seccion', titulo: '6. Compromiso legal' },
    {
      tipo: 'compromiso',
      texto:
        `Yo ${p.nombre_completo || LINEA} portador(a) de la C.I ${carnet(p) || LINEA} certifico que la información ` +
        'consignada en el presente documento es verdadera. Asimismo, autorizo al especialista ' +
        `${especialista || LINEA} a realizar el siguiente procedimiento ${h.procedimiento_autorizado || LINEA}. ` +
        'Conozco todos sus efectos y complicaciones, acepto las recomendaciones sugeridas y eximo de toda ' +
        `responsabilidad a ${enBlanco ? LINEA : clinica} por cualquier alteración que se pueda presentar debido al tratamiento a realizar.`,
    },
    { tipo: 'firmas', paciente: p.nombre_completo || '', especialista }
  );

  return { fecha: h.fecha ? formatoFecha(h.fecha) : '', numero: p.codigo_paciente || '', bloques };
}

module.exports = { armarDocumento, edadA };
