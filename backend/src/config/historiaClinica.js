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
// Un grupo puede tener `imagen`: archivo de DIR_GUIAS que se muestra arriba
// de sus campos en el panel, el PDF y el Word.

const check = (clave, etiqueta, detalles) => ({ clave, etiqueta, tipo: 'check', ...(detalles ? { detalles } : {}) });
const texto = (clave, etiqueta) => ({ clave, etiqueta, tipo: 'texto' });
const parrafo = (clave, etiqueta) => ({ clave, etiqueta, tipo: 'parrafo' });
const opcion = (clave, etiqueta, opciones) => ({ clave, etiqueta, tipo: 'opcion', opciones });
const o = (clave, etiqueta) => ({ clave, etiqueta });
const numero = (clave, etiqueta) => ({ clave, etiqueta, tipo: 'numero' });
const fecha = (clave, etiqueta) => ({ clave, etiqueta, tipo: 'fecha' });
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
          check('cardiovascular', 'Cardiovascular'),
          check('pulmonar', 'Pulmonar'),
          check('renal', 'Renal'),
          check('gastrointestinal', 'Gastrointestinal'),
          check('hematologica', 'Hematológica'),
          check('endocrina', 'Endocrina'),
          check('inmunologica', 'Inmunológica'),
          check('dermatologica', 'Dermatológica'),
          check('oftalmologica', 'Oftalmológica'),
          check('neurologica', 'Neurológica'),
          check('reumatica', 'Reumática'),
          check('mental', 'Mental'),
          check('sexual', 'Sexual'),
          check('odontologica', 'Odontológica'),
          check('alergias', 'Alergias'),
          parrafo('especificar', 'Especificar'),
          check('marcapasos', 'Marcapasos'),
          check('protesis_dentales', 'Prótesis dentales'),
          check('protesis_ortopedicas', 'Prótesis ortopédicas'),
          check('protesis_mamarias', 'Prótesis mamarias'),
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
          texto('menstruacion', 'Menstruación (¿cómo es?)'),
          fecha('fum', 'Fecha de última menstruación (FUM)'),
          texto('planificacion_familiar', 'Planificación familiar (método)'),
          check('menopausia', 'Menopausia'),
        ],
      },
      {
        titulo: 'Fórmula obstétrica',
        campos: [numero('gestas', 'Gestas'), numero('partos', 'Partos'), numero('cesareas', 'Cesáreas'), numero('abortos', 'Abortos')],
      },
      {
        titulo: 'Hábitos de vida',
        campos: [
          check('tabaco', 'Tabaco', FRECUENCIA),
          check('alcohol', 'Alcohol', FRECUENCIA),
          check('cafeina', 'Cafeína', FRECUENCIA),
          check('toxicomania', 'Toxicomanía', FRECUENCIA),
          check('actividad_fisica', 'Actividad física', TIPO_TIEMPO),
          texto('sueno', 'Horas y calidad de sueño'),
          texto('agua', 'Agua al día (litros)'),
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
        titulo: 'Fototipo cutáneo',
        campos: [
          opcion('fototipo', 'Fototipo', [o('I', 'I'), o('II', 'II'), o('III', 'III'), o('IV', 'IV'), o('V', 'V'), o('VI', 'VI')]),
        ],
      },
      {
        titulo: 'Tipología cutánea',
        campos: [
          check('piel_normal', 'Piel normal'),
          check('piel_seca', 'Piel seca'),
          check('piel_mixta', 'Piel mixta'),
          check('piel_sensible', 'Piel sensible'),
          check('piel_grasa', 'Piel grasa'),
          check('piel_seborreica', 'Seborreica'),
          check('piel_deshidratada', 'Deshidratada'),
          check('piel_asfictica', 'Asfíctica'),
          check('piel_desvitalizada', 'Piel desvitalizada'),
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
        titulo: 'Alteraciones en la pigmentación — Hipercromías',
        campos: [
          check('hiper_macula', 'Mácula'),
          check('hiper_mancha', 'Mancha'),
          check('hiper_melasma', 'Melasma'),
          check('hiper_nevos', 'Nevos'),
          check('hiper_efelides', 'Efélides'),
          check('hiper_lentigos', 'Lentigos'),
          texto('hiper_tiempo', 'Tiempo de aparición'),
          texto('hiper_causa', 'Causa'),
          texto('hiper_localizacion', 'Localización'),
          parrafo('hiper_observacion', 'Observación'),
        ],
      },
      {
        titulo: 'Hipocromías',
        campos: [
          check('hipo_micosis', 'Micosis solar'),
          check('hipo_vitiligo', 'Vitíligo'),
          check('hipo_otros', 'Otros'),
          texto('hipo_especifique', 'Especifique'),
          texto('hipo_localizacion', 'Localización'),
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
        titulo: 'Envejecimiento cutáneo — Flacidez',
        campos: [
          opcion('flacidez_grado', 'Grado', [o('I', 'I'), o('II', 'II'), o('III', 'III')]),
          texto('flacidez_localizacion', 'Localización'),
        ],
      },
      {
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
        titulo: 'Líneas de expresión',
        campos: [texto('lineas_localizacion', 'Localización')],
      },
      {
        titulo: 'Patologías cutáneas',
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
        titulo: 'Acné',
        campos: [
          opcion('acne_grado', 'Grado', [o('I', 'I'), o('II', 'II'), o('III', 'III'), o('IV', 'IV')]),
          texto('acne_localizacion', 'Localización'),
          parrafo('acne_observacion', 'Observación'),
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
    ],
  },
];

const COLUMNAS_PROTOCOLO = [
  { clave: 'procedimiento', etiqueta: 'Procedimiento' },
  { clave: 'sesiones', etiqueta: 'Sesiones' },
  { clave: 'comentario', etiqueta: 'Comentario' },
];

module.exports = { SECCIONES, COLUMNAS_PROTOCOLO, DIR_GUIAS };
