// Definición única del formulario de historia clínica (secciones 2 a 4 del
// papel). De aquí salen la validación del backend, el formulario del panel,
// el PDF y el Word: agregar o quitar una casilla es cambiar solo este archivo.
//
const path = require('path');

// Tipos de campo:
//   check   -> true/false; `detalles` son textos asociados que se guardan
//              planos como `<clave>_<detalle>` (ej. tabaco_frecuencia)
//   texto   -> línea corta (500 caracteres)
//   parrafo -> texto largo (4000 caracteres)
//   opcion  -> una sola de `opciones`, se guarda la clave
//   numero  -> entero 0 a 99 (fórmula obstétrica)
//   fecha   -> YYYY-MM-DD
//   subtitulo -> solo un rótulo entre campos (sin clave ni dato)
// Un grupo puede tener `imagen`: archivo de DIR_GUIAS que se muestra arriba
// de sus campos en el panel, el PDF y el Word; y `apartado`: título que
// agrupa grupos seguidos bajo un título (ej. "Semiología cutánea").
// Las claves no cambian aunque cambie la etiqueta: así no se pierden datos
// guardados. Quitar un campo descarta su dato la próxima vez que se guarda.

const check = (clave, etiqueta, detalles) => ({ clave, etiqueta, tipo: 'check', ...(detalles ? { detalles } : {}) });
const texto = (clave, etiqueta) => ({ clave, etiqueta, tipo: 'texto' });
const parrafo = (clave, etiqueta) => ({ clave, etiqueta, tipo: 'parrafo' });
const opcion = (clave, etiqueta, opciones) => ({ clave, etiqueta, tipo: 'opcion', opciones });
const o = (clave, etiqueta) => ({ clave, etiqueta });
const numero = (clave, etiqueta) => ({ clave, etiqueta, tipo: 'numero' });
const fecha = (clave, etiqueta) => ({ clave, etiqueta, tipo: 'fecha' });
const subtitulo = (etiqueta) => ({ etiqueta, tipo: 'subtitulo' });
const FRECUENCIA = [o('frecuencia', 'Frecuencia')];
const TIPO_FRECUENCIA = [o('tipo', 'Tipo'), o('frecuencia', 'Frecuencia')];
const TIPO_TIEMPO = [o('tipo', 'Tipo'), o('tiempo', 'Tiempo')];
// Guías de referencia que envió la clínica (sin datos de pacientes).
const DIR_GUIAS = path.join(__dirname, '..', '..', 'assets', 'historia');

const SECCIONES = [
  {
    clave: 'datos_clinicos',
    titulo: '2. Datos clínicos',
    grupos: [
      {
        titulo: 'Antecedentes personales patológicos',
        subtitulo: '(Padece alguna enfermedad)',
        campos: [
          check('cardiovascular', 'Cardiología'),
          check('pulmonar', 'Neumología'),
          check('renal', 'Renal'),
          check('gastrointestinal', 'Gastroenterología'),
          check('hematologica', 'Hematología'),
          check('endocrina', 'Endocrinología'),
          check('inmunologica', 'Inmunología'),
          check('dermatologica', 'Dermatología'),
          check('oftalmologica', 'Oftalmología'),
          check('neurologica', 'Neurología'),
          check('reumatica', 'Reumatología'),
          check('mental', 'Psicológico'),
          check('alergias', 'Alergias'),
          parrafo('especificar', 'Especificar'),
          check('marcapasos', 'Marcapasos'),
          check('protesis_dentales', 'Prótesis dentales'),
          check('protesis_ortopedicas', 'Prótesis ortopédicas'),
          check('protesis_mamarias', 'Implante mamario'),
          texto('protesis_otras', 'Otras prótesis'),
          parrafo('procedimientos_quirurgicos', 'Procedimientos quirúrgicos'),
          parrafo('tratamiento_actual', 'Tratamiento médico actual'),
        ],
      },
      {
        titulo: 'Antecedentes personales no patológicos',
        campos: [parrafo('no_patologicos', 'Especificar')],
      },
      {
        titulo: 'Antecedentes ginecológicos',
        campos: [
          subtitulo('Fórmula obstétrica'),
          numero('gestas', 'Gestas'),
          numero('partos', 'Partos'),
          numero('cesareas', 'Cesáreas'),
          numero('abortos', 'Abortos'),
          check('menopausia', 'Menopausia'),
          texto('planificacion_familiar', 'Planificación familiar (método)'),
          texto('menstruacion', 'Ciclo menstrual'),
          fecha('fum', 'Fecha de última menstruación (FUM)'),
        ],
      },
      {
        titulo: 'Hábitos de vida',
        campos: [
          check('tabaco', 'Tabaco', FRECUENCIA),
          check('alcohol', 'Alcohol', FRECUENCIA),
          check('toxicomania', 'Drogas', FRECUENCIA),
          check('cafeina', 'Cafeína', FRECUENCIA),
          check('actividad_fisica', 'Actividad física', TIPO_TIEMPO),
          texto('sueno', 'Calidad de sueño'),
          texto('agua', 'Cantidad de agua al día'),
          parrafo('observaciones', 'Observaciones'),
        ],
      },
      {
        titulo: 'Alimentación',
        campos: [
          texto('desayuno', 'Desayuno'),
          texto('media_manana', 'Media mañana'),
          texto('almuerzo', 'Almuerzo'),
          texto('media_tarde', 'Media tarde'),
          texto('cena', 'Cena'),
        ],
      },
    ],
  },
  {
    clave: 'datos_esteticos',
    titulo: '3. Datos estéticos',
    grupos: [
      {
        titulo: 'Rutina facial (skin care)',
        campos: [
          check('skin_limpiador', 'Limpiador facial', FRECUENCIA),
          check('skin_desmaquillante', 'Desmaquillante', FRECUENCIA),
          check('skin_tonico', 'Tónico', FRECUENCIA),
          check('skin_serum', 'Sérum', FRECUENCIA),
          check('skin_hidratante', 'Hidratante/Humectante', FRECUENCIA),
          check('skin_protector', 'Protector solar', FRECUENCIA),
          check('skin_maquillaje', 'Maquillaje', FRECUENCIA),
          check('skin_otro', 'Otro', FRECUENCIA),
          parrafo('skin_especifique', 'Especifique'),
        ],
      },
      {
        titulo: 'Mascarillas y exfoliantes',
        campos: [
          check('mascarillas', 'Uso de mascarillas', TIPO_FRECUENCIA),
          check('exfoliantes', 'Uso de exfoliantes', TIPO_FRECUENCIA),
        ],
      },
      {
        titulo: 'Antecedentes estéticos',
        subtitulo: '(procedimientos que se realizó antes)',
        campos: [1, 2, 3, 4, 5, 6].map((n) => texto(`antecedente_${n}`, `${n}.`)),
      },
    ],
  },
  {
    clave: 'analisis_estetico',
    titulo: '4. Análisis estético',
    grupos: [
      {
        titulo: 'Fototipo Fitzpatrick',
        campos: [
          opcion('fototipo', 'Fototipo', [o('I', 'I'), o('II', 'II'), o('III', 'III'), o('IV', 'IV'), o('V', 'V'), o('VI', 'VI')]),
        ],
      },
      {
        // Clasificación del fotoenvejecimiento de Glogau (tipos I a IV).
        titulo: 'Escala de Glogau',
        campos: [
          opcion('glogau', 'Tipo', [
            o('I', 'I · Sin arrugas'),
            o('II', 'II · Arrugas en movimiento'),
            o('III', 'III · Arrugas en reposo'),
            o('IV', 'IV · Solo arrugas'),
          ]),
        ],
      },
      {
        titulo: 'Biotipo de piel',
        campos: [
          check('piel_normal', 'Piel normal'),
          check('piel_seca', 'Piel seca'),
          check('piel_mixta', 'Piel mixta'),
          check('piel_sensible', 'Piel sensible'),
          check('piel_grasa', 'Piel grasa'),
          check('piel_seborreica', 'Seborreica'),
          check('piel_deshidratada', 'Deshidratada'),
          check('piel_desvitalizada', 'Otros'),
        ],
      },
      {
        titulo: 'Grado de deshidratación',
        campos: [opcion('deshidratacion', 'Grado', [o('leve', 'Leve'), o('medio', 'Medio'), o('alto', 'Alto')])],
      },
      {
        titulo: 'Grosor de piel',
        campos: [
          opcion('grosor', 'Grosor', [
            o('levemente_gruesa', 'Levemente gruesa'),
            o('medianamente_gruesa', 'Medianamente gruesa'),
            o('muy_gruesa', 'Muy gruesa'),
            o('levemente_fina', 'Levemente fina'),
            o('medianamente_fina', 'Medianamente fina'),
            o('muy_fina', 'Muy fina'),
          ]),
        ],
      },
      {
        titulo: 'Evaluación de la piel',
        campos: [
          check('hiper_macula', 'Mácula'),
          check('hiper_nevos', 'Nevus'),
          check('hiper_mancha', 'Hiperpigmentación'),
          check('hiper_hipopigmentacion', 'Hipopigmentación'),
          check('hiper_efelides', 'Efélides'),
          check('hiper_melasma', 'Melasma'),
          check('hiper_lentigos', 'Léntigos solares'),
          texto('hiper_tiempo', 'Tiempo de aparición'),
          texto('hiper_causa', 'Causa'),
          texto('hiper_localizacion', 'Localización'),
          parrafo('hiper_observacion', 'Observación'),
        ],
      },
      {
        titulo: 'Cicatrices',
        campos: [
          check('cic_normotrofica', 'Normotrófica'),
          check('cic_atrofica', 'Atrófica'),
          check('cic_hipertrofica', 'Hipertrófica'),
          check('cic_queloide', 'Queloide'),
          texto('cic_tiempo', 'Tiempo de aparición'),
          texto('cic_causa', 'Causa'),
          texto('cic_localizacion', 'Localización'),
        ],
      },
      {
        titulo: 'Tipo facial',
        imagen: 'guia-tipos-faciales.png',
        campos: [
          opcion('tipo_facial', 'Tipo facial', [o('braquifacial', 'Braquifacial'), o('mesofacial', 'Mesofacial'), o('dolicofacial', 'Dolicofacial')]),
        ],
      },
      {
        titulo: 'Ubicación de grasa corporal',
        imagen: 'guia-grasa-corporal.png',
        campos: [check('grasa_abdominal', 'Abdominal'), check('grasa_muslos', 'Muslos'), check('grasa_cadera_cintura', 'Cadera/cintura')],
      },
      {
        apartado: 'Semiología cutánea',
        titulo: 'Arrugas',
        campos: [
          check('arr_dinamicas', 'Dinámicas'),
          check('arr_estaticas', 'Estáticas'),
          check('arr_mixtas', 'Mixtas'),
          check('arr_superficiales', 'Superficiales'),
          check('arr_profundas', 'Profundas'),
          texto('arr_localizacion', 'Localización'),
        ],
      },
      {
        apartado: 'Semiología cutánea',
        titulo: 'Líneas de expresión',
        campos: [texto('lineas_localizacion', 'Localización')],
      },
      {
        apartado: 'Semiología cutánea',
        titulo: 'Clínica cutánea',
        campos: [
          check('pat_eritema', 'Eritema'),
          check('pat_vesiculas', 'Vesículas'),
          check('pat_costras', 'Costras'),
          check('pat_queratosis', 'Queratosis'),
          check('pat_papulas', 'Pápulas'),
          check('pat_pustulas', 'Pústulas'),
          check('pat_cuperosis', 'Cuperosis'),
          check('pat_eczema', 'Eczema'),
          check('pat_quistes', 'Quistes'),
          check('pat_milliums', 'Milliums'),
          check('pat_xantelasmas', 'Xantelasmas'),
          check('pat_telangiectasias', 'Telangiectasias'),
          check('pat_rosacea', 'Rosácea'),
          check('pat_poros', 'Poros visibles'),
          texto('pat_otros', 'Otros'),
          texto('pat_localizacion', 'Localización'),
        ],
      },
      {
        apartado: 'Semiología cutánea',
        titulo: 'Acné',
        campos: [
          opcion('acne_grado', 'Clasificación', [o('I', 'Grado 1'), o('II', 'Grado 2'), o('III', 'Grado 3'), o('IV', 'Grado 4')]),
          texto('acne_localizacion', 'Localización'),
          parrafo('acne_observacion', 'Observación'),
        ],
      },
    ],
  },
];

const COLUMNAS_PROTOCOLO = [
  { clave: 'procedimiento', etiqueta: 'Procedimiento' },
  { clave: 'sesiones', etiqueta: 'Sesiones' },
  { clave: 'comentario', etiqueta: 'Comentario' },
];

// Fotos de la evaluación: las de "Iconografía" (inicial) y las de
// "Seguimiento". Las subidas antes de separar las etapas son iniciales.
const ETAPAS_FOTO = ['inicial', 'seguimiento'];
const etapaDeFoto = (foto) => (foto.etapa === 'seguimiento' ? 'seguimiento' : 'inicial');

module.exports = { SECCIONES, COLUMNAS_PROTOCOLO, DIR_GUIAS, ETAPAS_FOTO, etapaDeFoto };
