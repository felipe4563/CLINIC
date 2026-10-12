# Historia clínica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Historia clínica digital por paciente, basada en el formulario en papel de la clínica, con evaluaciones fechadas, la tabla de tratamientos conectada a las citas y descargas PDF/Word con logo.

**Architecture:**
- Una sola definición del formulario (`backend/src/config/historiaClinica.js`) describe secciones, grupos y campos. La usan la validación del backend, el formulario del panel (que la pide por API), el PDF y el Word.
- Cada evaluación es una fila de `historias_clinicas`, con las secciones guardadas en JSON.
- "Tratamiento realizado" se calcula a partir de las citas completadas y de `notas_clinicas`.
- Un armador neutro (`historiaClinicaDocumento.js`) convierte definición + datos en bloques, y dos renderizadores (pdfkit y docx) dibujan esos bloques.

**Tech Stack:** Express + Sequelize (MySQL/MariaDB), Jest + supertest, pdfkit (ya instalado), `docx` (dependencia nueva), Next.js (App Router) + Tailwind v4 en `staff/`.

**Spec:** `docs/superpowers/specs/2026-10-12-historia-clinica-design.md`

## Global Constraints

- Las migraciones nuevas usan `tipoIdDe` para las FK hacia tablas viejas (`pacientes`, `profesionales`, `usuarios`), porque en producción los `id` son INT con signo. Cada migración se refleja en `backend/sql/produccion.sql` en la misma tarea.
- Permiso nuevo con clave exacta `historia_clinica`, etiqueta "Historia clínica". Por defecto lo tienen Admin y Profesional; Recepción no.
- Límites de texto: `texto` 500 caracteres y `parrafo` 4000, ambos después de `trim`.
- Archivos privados en la carpeta `historias` de `archivosPrivados`: imagen (JPG/PNG/WebP) o PDF de hasta 5 MB, con validación de la firma de bytes.
- Nombres de descarga: `historia-clinica-<codigo_paciente>-<fecha>.pdf` / `.docx`. Los formularios en blanco se llaman `historia-clinica-en-blanco.pdf` / `.docx`.
- Texto de la interfaz en español. Los comentarios del código se escriben en español, con la densidad del código vecino.
- Tests del backend: se corren por archivo, con `npx jest test/<archivo>.test.js --runInBand`. La suite completa tiene fallas previas que no son de esta tarea: 3 en `staff.test.js`.
- No escribir archivos dentro de `backend/` mientras corre nodemon, salvo los del plan: nodemon reinicia el API.
- Commits locales en la rama de trabajo. **No hacer push.**

## Review Focus

1. **JSON leído como string en MariaDB.** XAMPP devuelve las columnas JSON como texto. Si el modelo no las parsea, el panel recibe `"{\"tabaco\":true}"` y el formulario aparece vacío. Se cubre con un test de lectura tras un `findByPk` fresco (Task 2) y con el getter `jsonCampo`.
2. **Copiar una evaluación de otra paciente.** Debe responder 400 y no filtrar datos. Test en Task 3.
3. **Rango de "Tratamiento realizado" con dos evaluaciones.** Una cita del día de la evaluación 2 pertenece a la 2, no a la 1. Test en Task 4.
4. **Nota de sesión para una cita.** Crearla no debe chocar con la propia cita (`chocaConCita`), y no puede haber dos notas para la misma cita. Test en Task 4.
5. **PDF con textos largos o muchas casillas.** No debe salirse de la página ni entrar en paginación infinita. Test en Task 6 con un párrafo de 4000 caracteres y todas las casillas marcadas: 200 y `%PDF`.

---

## File Structure

**Backend**

| Archivo | Responsabilidad |
|---|---|
| `src/config/historiaClinica.js` (nuevo) | Definición del formulario: secciones 2–4, grupos, campos y opciones. También `columnasProtocolo` |
| `src/services/historiaClinica.js` (nuevo) | `validarSeccion`, `validarProtocolo`, `calcularTratamientos`, `alertaAlergias` |
| `src/services/historiaClinicaDocumento.js` (nuevo) | `armarDocumento(...)`: bloques neutros para PDF y Word |
| `src/services/historiaClinicaPdf.js` (nuevo) | `enviarHistoriaPdf(res, documento, config, nombreArchivo)` |
| `src/services/historiaClinicaWord.js` (nuevo) | `generarHistoriaWord(documento, config)` → Buffer |
| `src/models/historiaClinica.js` (nuevo) | Modelo `HistoriaClinica` |
| `src/models/paciente.js`, `src/models/index.js` | Campos personales nuevos y asociaciones |
| `src/migrations/20261014000000-historia-clinica.js` (nuevo) | Columnas de paciente y tabla |
| `src/migrations/20261014000100-permiso-historia-clinica.js` (nuevo) | Agrega el permiso a Admin y Profesional |
| `src/config/permisos.js` | Módulo y permisos por defecto |
| `src/routes/staffHistoriaClinica.js` (nuevo) | Todas las rutas `/staff/historia*` |
| `src/routes/staffPacientes.js` | PATCH acepta los campos personales nuevos; DELETE borra los documentos firmados |
| `src/routes/staffTratamientos.js` | POST acepta `citaId` |
| `src/services/archivosPrivados.js` | Carpeta `historias` |
| `src/app.js` | Monta la ruta |
| `sql/produccion.sql` | Reflejo de las migraciones |
| `test/historiaClinica.test.js` (nuevo) | Tests de todo lo anterior |

**Panel (`staff/src`)**

| Archivo | Responsabilidad |
|---|---|
| `lib/api.js` | Métodos de historia clínica |
| `app/pacientes/[id]/page.tsx` | Campos personales, alerta de alergias, sección de historias |
| `app/pacientes/[id]/SeccionHistoria.tsx` (nuevo) | Lista de evaluaciones y botones |
| `app/pacientes/[id]/historia/[historiaId]/page.tsx` (nuevo) | Editor de la evaluación |
| `app/pacientes/[id]/historia/[historiaId]/CampoHistoria.tsx` (nuevo) | Dibuja un grupo de la definición |
| `app/pacientes/[id]/historia/[historiaId]/TablaTratamientos.tsx` (nuevo) | Tratamiento realizado, con observaciones y filas manuales |

---

### Task 1: Definición del formulario y validación

**Files:**
- Create: `backend/src/config/historiaClinica.js`
- Create: `backend/src/services/historiaClinica.js` (solo la validación en esta tarea)
- Test: `backend/test/historiaClinica.test.js`

**Interfaces:**
- Produce `SECCIONES`: arreglo de `{ clave: 'datos_clinicos'|'datos_esteticos'|'analisis_estetico', titulo, grupos: [{ titulo, subtitulo?, campos }] }`.
- Produce `COLUMNAS_PROTOCOLO`. Cada campo es uno de estos:
  - `{ clave, etiqueta, tipo: 'check', detalles?: [{ clave, etiqueta }] }`;
  - `{ clave, etiqueta, tipo: 'texto' | 'parrafo' }`;
  - `{ clave, etiqueta, tipo: 'opcion', opciones: [{ clave, etiqueta }] }`.
- Un detalle se guarda plano, como `<clave>_<detalle>` de tipo texto.
- `validarSeccion(claveSeccion, datos)` → objeto limpio. Lanza `ErrorValidacion` con `.campo`.
- `validarProtocolo(filas)` → arreglo limpio. Lanza `ErrorValidacion`.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `backend/test/historiaClinica.test.js`:

```js
const { SECCIONES, COLUMNAS_PROTOCOLO } = require('../src/config/historiaClinica');
const { validarSeccion, validarProtocolo, ErrorValidacion } = require('../src/services/historiaClinica');

describe('Historia clínica: definición y validación', () => {
  test('la definición tiene las tres secciones y claves únicas por sección (incluidos los detalles)', () => {
    expect(SECCIONES.map((s) => s.clave)).toEqual(['datos_clinicos', 'datos_esteticos', 'analisis_estetico']);
    for (const seccion of SECCIONES) {
      const claves = [];
      for (const grupo of seccion.grupos) {
        for (const campo of grupo.campos) {
          expect(['check', 'texto', 'parrafo', 'opcion']).toContain(campo.tipo);
          claves.push(campo.clave);
          for (const det of campo.detalles || []) claves.push(`${campo.clave}_${det.clave}`);
          if (campo.tipo === 'opcion') expect(campo.opciones.length).toBeGreaterThan(1);
        }
      }
      expect(new Set(claves).size).toBe(claves.length);
    }
    expect(COLUMNAS_PROTOCOLO.map((c) => c.clave)).toEqual(['procedimiento', 'sesiones', 'comentario']);
  });

  test('descarta claves desconocidas y vacías, y recorta textos', () => {
    const limpio = validarSeccion('datos_clinicos', {
      alergias: true,
      cardiovascular: false,
      tabaco: true,
      tabaco_frecuencia: '  diario  ',
      especificar: '',
      inventado: 'x',
      dieta: 'vegana',
    });
    expect(limpio).toEqual({ alergias: true, cardiovascular: false, tabaco: true, tabaco_frecuencia: 'diario', dieta: 'vegana' });
  });

  test('rechaza tipos y opciones inválidas indicando el campo', () => {
    expect(() => validarSeccion('datos_clinicos', { alergias: 'si' })).toThrow(ErrorValidacion);
    try {
      validarSeccion('analisis_estetico', { fototipo: 'VII' });
    } catch (err) {
      expect(err).toBeInstanceOf(ErrorValidacion);
      expect(err.campo).toBe('fototipo');
    }
    expect(() => validarSeccion('analisis_estetico', { fototipo: 'VII' })).toThrow(ErrorValidacion);
  });

  test('respeta los límites de largo', () => {
    expect(() => validarSeccion('datos_clinicos', { tabaco_frecuencia: 'x'.repeat(501) })).toThrow(ErrorValidacion);
    expect(validarSeccion('datos_clinicos', { especificar: 'x'.repeat(4000) }).especificar).toHaveLength(4000);
    expect(() => validarSeccion('datos_clinicos', { especificar: 'x'.repeat(4001) })).toThrow(ErrorValidacion);
  });

  test('datos que no son objeto se tratan como vacíos', () => {
    expect(validarSeccion('datos_esteticos', null)).toEqual({});
    expect(validarSeccion('datos_esteticos', ['a'])).toEqual({});
  });

  test('valida el protocolo: descarta filas vacías y limita cantidad', () => {
    expect(validarProtocolo([
      { procedimiento: ' Toxina ', sesiones: '3', comentario: '' },
      { procedimiento: '', sesiones: '', comentario: '' },
    ])).toEqual([{ procedimiento: 'Toxina', sesiones: '3', comentario: '' }]);
    expect(validarProtocolo(undefined)).toEqual([]);
    expect(() => validarProtocolo(Array.from({ length: 21 }, () => ({ procedimiento: 'x' })))).toThrow(ErrorValidacion);
  });
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `cd backend && npx jest test/historiaClinica.test.js --runInBand`
Expected: FAIL con "Cannot find module '../src/config/historiaClinica'".

- [ ] **Step 3: Escribir la definición**

Crear `backend/src/config/historiaClinica.js`:

```js
// Definición única del formulario de historia clínica (secciones 2 a 4 del
// papel). De aquí salen la validación del backend, el formulario del panel,
// el PDF y el Word: agregar o quitar una casilla es cambiar solo este archivo.
//
// Tipos de campo:
//   check   -> true/false; `detalles` son textos asociados que se guardan
//              planos como `<clave>_<detalle>` (ej. tabaco_frecuencia)
//   texto   -> línea corta (500 caracteres)
//   parrafo -> texto largo (4000 caracteres)
//   opcion  -> una sola de `opciones`, se guarda la clave

const check = (clave, etiqueta, detalles) => ({ clave, etiqueta, tipo: 'check', ...(detalles ? { detalles } : {}) });
const texto = (clave, etiqueta) => ({ clave, etiqueta, tipo: 'texto' });
const parrafo = (clave, etiqueta) => ({ clave, etiqueta, tipo: 'parrafo' });
const opcion = (clave, etiqueta, opciones) => ({ clave, etiqueta, tipo: 'opcion', opciones });
const o = (clave, etiqueta) => ({ clave, etiqueta });
const FRECUENCIA = [o('frecuencia', 'Frecuencia')];
const TIPO_FRECUENCIA = [o('tipo', 'Tipo'), o('frecuencia', 'Frecuencia')];

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
        titulo: 'Antecedentes ginecológicos',
        campos: [
          check('menstruacion_regular', 'Menstruación regular'),
          check('menstruacion_dolorosa', 'Dolorosa'),
          texto('metodo_anticonceptivo', 'Uso de método anticonceptivo'),
          check('parto_natural', 'Embarazos: parto natural'),
          check('cesarea', 'Cesárea'),
          check('perdidas', 'Pérdidas'),
          check('menopausia', 'Menopausia'),
          check('esterilizacion', 'Esterilización'),
        ],
      },
      {
        titulo: 'Hábitos de vida',
        campos: [
          check('tabaco', 'Tabaco', FRECUENCIA),
          check('alcohol', 'Alcohol', FRECUENCIA),
          check('cafeina', 'Cafeína', FRECUENCIA),
          check('toxicomania', 'Toxicomanía', FRECUENCIA),
          texto('sueno', 'Horas y calidad de sueño'),
          check('actividad_fisica', 'Actividad física', TIPO_FRECUENCIA),
          opcion('dieta', 'Ud. considera su dieta', [
            o('balanceada', 'Balanceada'),
            o('desequilibrada', 'Desequilibrada'),
            o('vegana', 'Vegana'),
            o('vegetariana', 'Vegetariana'),
          ]),
          parrafo('observaciones', 'Observaciones'),
          opcion('agua', 'Cuánta agua consume al día', [
            o('muy_poca', 'Muy poca'),
            o('poca', 'Poca'),
            o('adecuada', 'Adecuada'),
            o('mucha', 'Mucha'),
          ]),
        ],
      },
    ],
  },
  {
    clave: 'datos_esteticos',
    titulo: '3. Datos estéticos',
    grupos: [
      {
        titulo: 'Rutina facial diurna',
        campos: [
          check('diurna_limpiador', 'Limpiador facial'),
          check('diurna_tonico', 'Tónico'),
          check('diurna_serum', 'Sérum'),
          check('diurna_hidratante', 'Hidratante/Humectante'),
          check('diurna_protector', 'Protector solar'),
          check('diurna_maquillaje', 'Maquillaje'),
          check('diurna_otro', 'Otro'),
          parrafo('diurna_especifique', 'Especifique'),
        ],
      },
      {
        titulo: 'Rutina facial nocturna',
        campos: [
          check('nocturna_desmaquillante', 'Desmaquillante'),
          check('nocturna_limpiador', 'Limpiador facial'),
          check('nocturna_tonico', 'Tónico'),
          check('nocturna_serum', 'Sérum'),
          check('nocturna_hidratante', 'Hidratante/Humectante'),
          check('nocturna_otro', 'Otro'),
          parrafo('nocturna_especifique', 'Especifique'),
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
        titulo: 'Procedimientos estéticos anteriores',
        campos: [
          check('toxina_botulinica', 'Toxina botulínica', FRECUENCIA),
          check('rellenos_dermicos', 'Rellenos dérmicos', TIPO_FRECUENCIA),
          check('hilos_tensores', 'Hilos tensores', FRECUENCIA),
          check('prp', 'PRP', FRECUENCIA),
          check('peeling_quimico', 'Peeling químico', FRECUENCIA),
          check('micropuncion', 'Micropunción dérmica', FRECUENCIA),
          check('limpieza_profunda', 'Limpieza facial profunda', FRECUENCIA),
          check('terapia_laser', 'Terapia láser', TIPO_FRECUENCIA),
          parrafo('otros_procedimientos', 'Otros'),
        ],
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
    ],
  },
];

const COLUMNAS_PROTOCOLO = [
  { clave: 'procedimiento', etiqueta: 'Procedimiento' },
  { clave: 'sesiones', etiqueta: 'Sesiones' },
  { clave: 'comentario', etiqueta: 'Comentario' },
];

module.exports = { SECCIONES, COLUMNAS_PROTOCOLO };
```

- [ ] **Step 4: Escribir la validación**

Crear `backend/src/services/historiaClinica.js`:

```js
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
```

Nota: el test de las filas de protocolo pasa 21 filas con solo `procedimiento: 'x'`. No son vacías, así que cuentan y deben lanzar el error.

- [ ] **Step 5: Correr los tests y verificar que pasan**

Run: `cd backend && npx jest test/historiaClinica.test.js --runInBand`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add backend/src/config/historiaClinica.js backend/src/services/historiaClinica.js backend/test/historiaClinica.test.js
git commit -m "feat(historia): definición del formulario y validación"
```

---

### Task 2: Migraciones, modelo, permiso y datos personales

**Files:**
- Create: `backend/src/migrations/20261014000000-historia-clinica.js`
- Create: `backend/src/migrations/20261014000100-permiso-historia-clinica.js`
- Create: `backend/src/models/historiaClinica.js`
- Modify: `backend/src/models/paciente.js`, `backend/src/models/index.js`
- Modify: `backend/src/config/permisos.js`
- Modify: `backend/src/routes/staffPacientes.js` (PATCH)
- Modify: `backend/sql/produccion.sql`
- Test: `backend/test/historiaClinica.test.js` (agregar un bloque `describe`)

**Interfaces:**
- `db.HistoriaClinica` tiene los campos de la spec. Sus columnas JSON siempre se leen como objeto o arreglo, gracias al getter `jsonCampo`.
- Asociaciones:
  - `HistoriaClinica.belongsTo(Paciente)` y `Paciente.hasMany(HistoriaClinica)`;
  - `belongsTo(Profesional, { foreignKey: 'profesional_id' })`;
  - `belongsTo(Usuario, { as: 'CreadoPor', foreignKey: 'creado_por_id' })`;
  - `belongsTo(Usuario, { as: 'ActualizadoPor', foreignKey: 'actualizado_por_id' })`.
- `PERMISOS_POR_DEFECTO.Admin` y `.Profesional` incluyen `'historia_clinica'`.
- PATCH `/staff/pacientes/:id` acepta `sexo`, `estado_civil`, `grupo_sanguineo`, `direccion`, `ocupacion`, `email`, `contacto_emergencia` y `parentesco_emergencia`. `''` se guarda como `null`. Un `sexo` o `estado_civil` fuera del ENUM responde 400.

- [ ] **Step 1: Escribir los tests que fallan**

Agregar al final de `backend/test/historiaClinica.test.js` (y sus `require` arriba del archivo, después de los existentes):

```js
const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');

async function crearUsuario({ email, rolNombre }) {
  const [rol] = await db.Rol.findOrCreate({ where: { nombre: rolNombre }, defaults: { permisos: PERMISOS_POR_DEFECTO[rolNombre] || [] } });
  return db.Usuario.create({ nombre: rolNombre, email, password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true });
}
async function login(email) {
  return (await request(app).post('/staff/login').send({ email, password: 'secret123' })).body.token;
}

describe('Historia clínica: API', () => {
  let tokenAdmin, tokenRecepcion, paciente, otraPaciente, profesional, servicio;
  const auth = (t = tokenAdmin) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    await crearUsuario({ email: 'admin@test.com', rolNombre: 'Admin' });
    await crearUsuario({ email: 'recepcion@test.com', rolNombre: 'Recepcion' });
    tokenAdmin = await login('admin@test.com');
    tokenRecepcion = await login('recepcion@test.com');
    paciente = await db.Paciente.create({ nombre_completo: 'Ana Pérez', telefono: '59170000001', codigo_paciente: 'P-0001', carnet_identidad: '1234567', carnet_expedido: 'CB', fecha_nacimiento: '1990-05-10' });
    otraPaciente = await db.Paciente.create({ nombre_completo: 'Beto', telefono: '59170000002', codigo_paciente: 'P-0002', carnet_identidad: '7654321', carnet_expedido: 'LP' });
    profesional = await db.Profesional.create({ nombre: 'Dra. Noemí', activo: true });
    servicio = await db.Servicio.create({ nombre: 'Limpieza facial', duracion_min: 30, precio: 150 });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('el permiso historia_clinica viene por defecto para Admin y Profesional, no Recepción', () => {
    expect(PERMISOS_POR_DEFECTO.Admin).toContain('historia_clinica');
    expect(PERMISOS_POR_DEFECTO.Profesional).toContain('historia_clinica');
    expect(PERMISOS_POR_DEFECTO.Recepcion).not.toContain('historia_clinica');
  });

  test('las columnas JSON se leen como objetos (también si la base las devuelve como texto)', async () => {
    const h = await db.HistoriaClinica.create({
      paciente_id: paciente.id, fecha: '2026-10-01', datos_clinicos: { alergias: true }, datos_esteticos: {}, analisis_estetico: {}, protocolo: [],
    });
    const fresca = await db.HistoriaClinica.findByPk(h.id);
    expect(fresca.datos_clinicos).toEqual({ alergias: true });
    expect(fresca.protocolo).toEqual([]);
    await h.destroy();
  });

  test('PATCH de paciente guarda los datos personales nuevos y valida los ENUM', async () => {
    let res = await request(app).patch(`/staff/pacientes/${paciente.id}`).set(auth()).send({
      sexo: 'F', estado_civil: 'S', grupo_sanguineo: 'O+', direccion: 'Calle 1', ocupacion: 'Abogada',
      email: 'ana@correo.com', contacto_emergencia: 'Luis Pérez', parentesco_emergencia: 'Hermano',
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ sexo: 'F', estado_civil: 'S', grupo_sanguineo: 'O+', parentesco_emergencia: 'Hermano' });
    res = await request(app).patch(`/staff/pacientes/${paciente.id}`).set(auth()).send({ ocupacion: '' });
    expect(res.body.ocupacion).toBeNull();
    expect((await request(app).patch(`/staff/pacientes/${paciente.id}`).set(auth()).send({ sexo: 'X' })).status).toBe(400);
  });
});
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `cd backend && npx jest test/historiaClinica.test.js --runInBand`
Expected: FAIL. `PERMISOS_POR_DEFECTO.Admin` no contiene `historia_clinica` y `db.HistoriaClinica` es undefined.

- [ ] **Step 3: Migración de la tabla y los campos de paciente**

Crear `backend/src/migrations/20261014000000-historia-clinica.js`:

```js
// backend/src/migrations/20261014000000-historia-clinica.js
'use strict';

// Ver 20261006000000-add-paquetes-sesiones.js: en producción los `id` viejos
// son INT con signo, y MySQL exige que la FK tenga el mismo tipo.
async function tipoIdDe(queryInterface, Sequelize, tabla) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'id'`,
    { replacements: [tabla] }
  );
  const unsigned = rows.length && /unsigned/i.test(rows[0].COLUMN_TYPE);
  return unsigned ? Sequelize.INTEGER.UNSIGNED : Sequelize.INTEGER;
}

const COLUMNAS_PACIENTE = [
  ['sexo', (S) => S.ENUM('F', 'M')],
  ['estado_civil', (S) => S.ENUM('S', 'C', 'D', 'V')],
  ['grupo_sanguineo', (S) => S.STRING(5)],
  ['direccion', (S) => S.STRING(255)],
  ['ocupacion', (S) => S.STRING(120)],
  ['email', (S) => S.STRING(160)],
  ['contacto_emergencia', (S) => S.STRING(160)],
  ['parentesco_emergencia', (S) => S.STRING(60)],
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const tipoPaciente = await tipoIdDe(queryInterface, Sequelize, 'pacientes');
    const tipoProfesional = await tipoIdDe(queryInterface, Sequelize, 'profesionales');
    const tipoUsuario = await tipoIdDe(queryInterface, Sequelize, 'usuarios');

    for (const [columna, tipo] of COLUMNAS_PACIENTE) {
      await queryInterface.addColumn('pacientes', columna, { type: tipo(Sequelize), allowNull: true });
    }

    // Las columnas JSON no llevan DEFAULT: MySQL no lo permite; el modelo lo pone.
    await queryInterface.createTable('historias_clinicas', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      paciente_id: {
        type: tipoPaciente,
        allowNull: false,
        references: { model: 'pacientes', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      motivo_consulta: { type: Sequelize.TEXT, allowNull: true },
      datos_clinicos: { type: Sequelize.JSON, allowNull: false },
      datos_esteticos: { type: Sequelize.JSON, allowNull: false },
      analisis_estetico: { type: Sequelize.JSON, allowNull: false },
      diagnostico: { type: Sequelize.TEXT, allowNull: true },
      protocolo: { type: Sequelize.JSON, allowNull: false },
      procedimiento_autorizado: { type: Sequelize.STRING(255), allowNull: true },
      profesional_id: {
        type: tipoProfesional,
        allowNull: true,
        references: { model: 'profesionales', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      documento_firmado: { type: Sequelize.STRING, allowNull: true },
      creado_por_id: {
        type: tipoUsuario,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      actualizado_por_id: {
        type: tipoUsuario,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('historias_clinicas', ['paciente_id', 'fecha']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('historias_clinicas');
    for (const [columna] of [...COLUMNAS_PACIENTE].reverse()) {
      await queryInterface.removeColumn('pacientes', columna);
    }
  },
};
```

- [ ] **Step 4: Migración del permiso**

Crear `backend/src/migrations/20261014000100-permiso-historia-clinica.js`:

```js
// backend/src/migrations/20261014000100-permiso-historia-clinica.js
'use strict';

// Los roles ya existentes no toman PERMISOS_POR_DEFECTO (solo se usa al
// crearlos): se agrega el permiso nuevo a mano a Admin y Profesional.
const PERMISO = 'historia_clinica';

function leer(permisos) {
  if (Array.isArray(permisos)) return permisos;
  try {
    return JSON.parse(permisos || '[]');
  } catch {
    return [];
  }
}

module.exports = {
  async up(queryInterface) {
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id, permisos FROM roles WHERE nombre IN ('Admin', 'Profesional')"
    );
    for (const rol of roles) {
      const permisos = leer(rol.permisos);
      if (permisos.includes(PERMISO)) continue;
      await queryInterface.sequelize.query('UPDATE roles SET permisos = ? WHERE id = ?', {
        replacements: [JSON.stringify([...permisos, PERMISO]), rol.id],
      });
    }
  },

  async down(queryInterface) {
    const [roles] = await queryInterface.sequelize.query('SELECT id, permisos FROM roles');
    for (const rol of roles) {
      const permisos = leer(rol.permisos);
      if (!permisos.includes(PERMISO)) continue;
      await queryInterface.sequelize.query('UPDATE roles SET permisos = ? WHERE id = ?', {
        replacements: [JSON.stringify(permisos.filter((p) => p !== PERMISO)), rol.id],
      });
    }
  },
};
```

- [ ] **Step 5: Modelo y asociaciones**

Crear `backend/src/models/historiaClinica.js`:

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// MariaDB (XAMPP) devuelve las columnas JSON como texto; MySQL 8 como objeto.
// El getter las normaliza para que el resto del código siempre vea objetos.
function jsonCampo(nombre, porDefecto) {
  return {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: porDefecto,
    get() {
      const raw = this.getDataValue(nombre);
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch {
          return porDefecto;
        }
      }
      return raw ?? porDefecto;
    },
  };
}

const HistoriaClinica = sequelize.define('HistoriaClinica', {
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  motivo_consulta: { type: DataTypes.TEXT, allowNull: true },
  datos_clinicos: jsonCampo('datos_clinicos', {}),
  datos_esteticos: jsonCampo('datos_esteticos', {}),
  analisis_estetico: jsonCampo('analisis_estetico', {}),
  diagnostico: { type: DataTypes.TEXT, allowNull: true },
  protocolo: jsonCampo('protocolo', []),
  procedimiento_autorizado: { type: DataTypes.STRING(255), allowNull: true },
  documento_firmado: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'historias_clinicas', underscored: true });

module.exports = HistoriaClinica;
```

En `backend/src/models/paciente.js`, después de `puntos_actuales`, agregar:

```js
  sexo: { type: DataTypes.ENUM('F', 'M'), allowNull: true },
  estado_civil: { type: DataTypes.ENUM('S', 'C', 'D', 'V'), allowNull: true },
  grupo_sanguineo: { type: DataTypes.STRING(5), allowNull: true },
  direccion: { type: DataTypes.STRING(255), allowNull: true },
  ocupacion: { type: DataTypes.STRING(120), allowNull: true },
  email: { type: DataTypes.STRING(160), allowNull: true },
  contacto_emergencia: { type: DataTypes.STRING(160), allowNull: true },
  parentesco_emergencia: { type: DataTypes.STRING(60), allowNull: true },
```

En `backend/src/models/index.js`:
- después de `const CartillaSellos = require('./cartillaSellos');`, agregar `const HistoriaClinica = require('./historiaClinica');`;
- antes de `module.exports = {`, agregar las asociaciones de abajo;
- agregar `HistoriaClinica,` al objeto exportado.

```js
HistoriaClinica.belongsTo(Paciente, { foreignKey: { name: 'paciente_id', allowNull: false } });
Paciente.hasMany(HistoriaClinica, { foreignKey: 'paciente_id' });

HistoriaClinica.belongsTo(Profesional, { foreignKey: { name: 'profesional_id', allowNull: true } });
HistoriaClinica.belongsTo(Usuario, { foreignKey: { name: 'creado_por_id', allowNull: true }, as: 'CreadoPor' });
HistoriaClinica.belongsTo(Usuario, { foreignKey: { name: 'actualizado_por_id', allowNull: true }, as: 'ActualizadoPor' });
```

- [ ] **Step 6: Permisos**

En `backend/src/config/permisos.js`:
- agregar al final de `MODULOS`:
  ```js
  {
    clave: 'historia_clinica',
    etiqueta: 'Historia clínica',
    descripcion: 'Ver, llenar y descargar la historia clínica de los pacientes',
  },
  ```
- agregar `'historia_clinica'` al final de los arreglos `Admin` y `Profesional` de `PERMISOS_POR_DEFECTO`.

- [ ] **Step 7: PATCH de paciente**

En `backend/src/routes/staffPacientes.js`, reemplazar el cuerpo del PATCH desde `const { nombre_completo, ...` hasta `await paciente.save();` por:

```js
  const { nombre_completo, carnet_identidad, carnet_complemento, carnet_expedido, fecha_nacimiento } = req.body;
  if (nombre_completo !== undefined) paciente.nombre_completo = nombre_completo;
  if (carnet_identidad !== undefined) paciente.carnet_identidad = carnet_identidad;
  if (carnet_complemento !== undefined) paciente.carnet_complemento = carnet_complemento;
  if (carnet_expedido !== undefined) paciente.carnet_expedido = carnet_expedido;
  if (fecha_nacimiento !== undefined) paciente.fecha_nacimiento = fecha_nacimiento;

  // Datos personales de la historia clínica: '' borra el valor.
  if (req.body.sexo !== undefined && !['', null, 'F', 'M'].includes(req.body.sexo)) {
    return res.status(400).json({ error: 'sexo debe ser F o M' });
  }
  if (req.body.estado_civil !== undefined && !['', null, 'S', 'C', 'D', 'V'].includes(req.body.estado_civil)) {
    return res.status(400).json({ error: 'estado_civil debe ser S, C, D o V' });
  }
  for (const campo of CAMPOS_PERSONALES) {
    if (req.body[campo] === undefined) continue;
    const valor = typeof req.body[campo] === 'string' ? req.body[campo].trim() : req.body[campo];
    paciente[campo] = valor === '' ? null : valor;
  }

  await paciente.save();
```

Y arriba de las rutas (después de `const router = ...`):

```js
const CAMPOS_PERSONALES = [
  'sexo', 'estado_civil', 'grupo_sanguineo', 'direccion', 'ocupacion', 'email', 'contacto_emergencia', 'parentesco_emergencia',
];
```

- [ ] **Step 8: Correr los tests**

Run: `cd backend && npx jest test/historiaClinica.test.js --runInBand`
Expected: PASS, 9 tests.

- [ ] **Step 9: Probar las migraciones en una base desechable**

Se aplican sobre una copia de la base de desarrollo, nunca sobre `bd_novaged` directamente.

```bash
M=/c/xampp/mysql/bin/mysql
$M -u root -e "DROP DATABASE IF EXISTS tmp_mig_hc; CREATE DATABASE tmp_mig_hc CHARACTER SET utf8mb4"
/c/xampp/mysql/bin/mysqldump -u root bd_novaged | $M -u root tmp_mig_hc
cd backend && DB_NAME=tmp_mig_hc npx sequelize-cli db:migrate && DB_NAME=tmp_mig_hc npx sequelize-cli db:migrate:undo && DB_NAME=tmp_mig_hc npx sequelize-cli db:migrate:undo && DB_NAME=tmp_mig_hc npx sequelize-cli db:migrate
$M -u root tmp_mig_hc -e "SHOW COLUMNS FROM pacientes LIKE 'sexo'; SHOW TABLES LIKE 'historias%'; SELECT nombre, permisos FROM roles"
$M -u root -e "DROP DATABASE tmp_mig_hc"
```

Expected:
- `sexo enum('F','M')`;
- la tabla `historias_clinicas` existe;
- los roles Admin y Profesional incluyen `historia_clinica`.

Si `sequelize-cli` no toma `DB_NAME` del entorno, revisar `backend/src/config/config.js` o el archivo que use la CLI, y usar el mismo mecanismo con que se probó `20261012000000`.

- [ ] **Step 10: Reflejar en `produccion.sql`**

En `backend/sql/produccion.sql`:
1. Cambiar la cabecera "Actualizado a mano hasta la migración ..." a `20261014000100-permiso-historia-clinica`, y agregar `20261014000000-historia-clinica` y `20261014000100-permiso-historia-clinica` a la lista "Incluye lo agregado por".
2. En `CREATE TABLE \`pacientes\``, antes de `created_at`, agregar:
   ```sql
     `sexo` ENUM('F','M') DEFAULT NULL,
     `estado_civil` ENUM('S','C','D','V') DEFAULT NULL,
     `grupo_sanguineo` VARCHAR(5) DEFAULT NULL,
     `direccion` VARCHAR(255) DEFAULT NULL,
     `ocupacion` VARCHAR(120) DEFAULT NULL,
     `email` VARCHAR(160) DEFAULT NULL,
     `contacto_emergencia` VARCHAR(160) DEFAULT NULL,
     `parentesco_emergencia` VARCHAR(60) DEFAULT NULL,
   ```
3. Antes de la primera línea `SET FOREIGN_KEY_CHECKS = 1;`, agregar:
   ```sql
   -- ---------------------------------------------------------------------
   -- historias_clinicas (una fila por evaluación; secciones en JSON)
   -- ---------------------------------------------------------------------
   DROP TABLE IF EXISTS `historias_clinicas`;
   CREATE TABLE `historias_clinicas` (
     `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
     `paciente_id` INT UNSIGNED NOT NULL,
     `fecha` DATE NOT NULL,
     `motivo_consulta` TEXT DEFAULT NULL,
     `datos_clinicos` JSON NOT NULL,
     `datos_esteticos` JSON NOT NULL,
     `analisis_estetico` JSON NOT NULL,
     `diagnostico` TEXT DEFAULT NULL,
     `protocolo` JSON NOT NULL,
     `procedimiento_autorizado` VARCHAR(255) DEFAULT NULL,
     `profesional_id` INT UNSIGNED DEFAULT NULL,
     `documento_firmado` VARCHAR(255) DEFAULT NULL,
     `creado_por_id` INT UNSIGNED DEFAULT NULL,
     `actualizado_por_id` INT UNSIGNED DEFAULT NULL,
     `created_at` DATETIME NOT NULL,
     `updated_at` DATETIME NOT NULL,
     PRIMARY KEY (`id`),
     KEY `historias_clinicas_paciente_id_fecha` (`paciente_id`, `fecha`),
     CONSTRAINT `historias_clinicas_paciente_id_fk` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`)
       ON UPDATE CASCADE ON DELETE CASCADE,
     CONSTRAINT `historias_clinicas_profesional_id_fk` FOREIGN KEY (`profesional_id`) REFERENCES `profesionales` (`id`)
       ON UPDATE CASCADE ON DELETE SET NULL,
     CONSTRAINT `historias_clinicas_creado_por_id_fk` FOREIGN KEY (`creado_por_id`) REFERENCES `usuarios` (`id`)
       ON UPDATE CASCADE ON DELETE SET NULL,
     CONSTRAINT `historias_clinicas_actualizado_por_id_fk` FOREIGN KEY (`actualizado_por_id`) REFERENCES `usuarios` (`id`)
       ON UPDATE CASCADE ON DELETE SET NULL
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   ```
4. En los `INSERT INTO \`roles\``, agregar `"historia_clinica"` al final de los arreglos de Admin y Profesional.

Verificar que el archivo carga. **Cuidado:** el script hace `CREATE DATABASE novaged` y `USE novaged`. Para probarlo, se carga una copia con esas dos líneas cambiadas, nunca el archivo tal cual:

```bash
sed 's/`novaged`/`tmp_prod_chk`/g' backend/sql/produccion.sql > "$SCRATCH/prod_chk.sql"
/c/xampp/mysql/bin/mysql -u root < "$SCRATCH/prod_chk.sql" && /c/xampp/mysql/bin/mysql -u root tmp_prod_chk -e "SHOW TABLES LIKE 'historias%'"
/c/xampp/mysql/bin/mysql -u root -e "DROP DATABASE tmp_prod_chk"
```

`$SCRATCH` es el directorio scratchpad de la sesión. `produccion.sql` está en `.gitignore`, así que no entra en el commit.

- [ ] **Step 11: Commit**

```bash
git add backend/src/migrations/20261014000000-historia-clinica.js backend/src/migrations/20261014000100-permiso-historia-clinica.js backend/src/models/historiaClinica.js backend/src/models/paciente.js backend/src/models/index.js backend/src/config/permisos.js backend/src/routes/staffPacientes.js backend/test/historiaClinica.test.js
git commit -m "feat(historia): tabla de evaluaciones, datos personales y permiso"
```

---

### Task 3: Rutas de evaluaciones (crear, copiar, ver, guardar, borrar)

**Files:**
- Create: `backend/src/routes/staffHistoriaClinica.js`
- Modify: `backend/src/app.js`
- Modify: `backend/src/services/historiaClinica.js` (`alertaAlergias`)
- Test: `backend/test/historiaClinica.test.js`

**Interfaces:**
- `GET /staff/historia-clinica/definicion` → `{ secciones: SECCIONES, columnasProtocolo: COLUMNAS_PROTOCOLO }`.
- `GET /staff/pacientes/:id/historias` → `{ historias: [{ id, fecha, autor, firmado }], alerta: { alergias: boolean, detalle: string | null } }`, con la evaluación más nueva primero.
- `POST /staff/pacientes/:id/historias` con el body `{ copiarDe?: number }` → 201 y la evaluación. La fecha es la de hoy.
- `GET /staff/historias/:id` → la evaluación, más `Paciente` (todos sus campos) y `Profesional`. Las filas de tratamiento se agregan en Task 4.
- `PUT /staff/historias/:id` → guarda `motivo_consulta`, `datos_clinicos`, `datos_esteticos`, `analisis_estetico`, `diagnostico`, `protocolo`, `procedimiento_autorizado`, `profesional_id` y `fecha`. Los campos que no vienen no se tocan.
- `DELETE /staff/historias/:id` → 204. Solo con `req.rolNombre === 'Admin'`; si no, 403.
- `alertaAlergias(historia)` → `{ alergias, detalle }`.

- [ ] **Step 1: Tests que fallan**

Agregar dentro del `describe('Historia clínica: API', ...)` de `backend/test/historiaClinica.test.js`:

```js
  test('Recepción no puede ver la historia clínica', async () => {
    expect((await request(app).get(`/staff/pacientes/${paciente.id}/historias`).set(auth(tokenRecepcion))).status).toBe(403);
    expect((await request(app).get('/staff/historia-clinica/definicion').set(auth(tokenRecepcion))).status).toBe(403);
  });

  test('entrega la definición del formulario', async () => {
    const res = await request(app).get('/staff/historia-clinica/definicion').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.secciones.map((s) => s.clave)).toEqual(['datos_clinicos', 'datos_esteticos', 'analisis_estetico']);
  });

  test('crear, guardar, listar con alerta de alergias y copiar una evaluación', async () => {
    let res = await request(app).post(`/staff/pacientes/${paciente.id}/historias`).set(auth()).send({});
    expect(res.status).toBe(201);
    const primera = res.body;
    expect(primera.datos_clinicos).toEqual({});

    res = await request(app).put(`/staff/historias/${primera.id}`).set(auth()).send({
      fecha: '2026-09-01',
      motivo_consulta: 'Manchas en mejillas',
      datos_clinicos: { alergias: true, especificar: 'Penicilina', desconocido: 1 },
      analisis_estetico: { fototipo: 'III' },
      diagnostico: 'Melasma',
      protocolo: [{ procedimiento: 'Peeling', sesiones: '4', comentario: '' }],
      profesional_id: profesional.id,
    });
    expect(res.status).toBe(200);
    expect(res.body.datos_clinicos).toEqual({ alergias: true, especificar: 'Penicilina' });
    expect(res.body.procedimiento_autorizado).toBe('Peeling');

    res = await request(app).get(`/staff/pacientes/${paciente.id}/historias`).set(auth());
    expect(res.body.historias).toHaveLength(1);
    expect(res.body.alerta).toEqual({ alergias: true, detalle: 'Penicilina' });

    res = await request(app).post(`/staff/pacientes/${paciente.id}/historias`).set(auth()).send({ copiarDe: primera.id });
    expect(res.status).toBe(201);
    expect(res.body.analisis_estetico).toEqual({ fototipo: 'III' });
    expect(res.body.diagnostico).toBe('Melasma');
    expect(res.body.motivo_consulta).toBeNull();
    expect(res.body.documento_firmado).toBeNull();
    expect(res.body.id).not.toBe(primera.id);
  });

  test('no se copia una evaluación de otra paciente, y un dato inválido responde 400', async () => {
    const ajena = await db.HistoriaClinica.create({ paciente_id: otraPaciente.id, fecha: '2026-09-01', datos_clinicos: {}, datos_esteticos: {}, analisis_estetico: {}, protocolo: [] });
    expect((await request(app).post(`/staff/pacientes/${paciente.id}/historias`).set(auth()).send({ copiarDe: ajena.id })).status).toBe(400);
    const res = await request(app).put(`/staff/historias/${ajena.id}`).set(auth()).send({ analisis_estetico: { fototipo: 'VII' } });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/fototipo/);
  });

  test('solo un Admin borra una evaluación', async () => {
    const h = await db.HistoriaClinica.create({ paciente_id: otraPaciente.id, fecha: '2026-09-02', datos_clinicos: {}, datos_esteticos: {}, analisis_estetico: {}, protocolo: [] });
    await crearUsuario({ email: 'prof@test.com', rolNombre: 'Profesional' });
    const tokenProf = await login('prof@test.com');
    expect((await request(app).delete(`/staff/historias/${h.id}`).set(auth(tokenProf))).status).toBe(403);
    expect((await request(app).delete(`/staff/historias/${h.id}`).set(auth())).status).toBe(204);
    expect(await db.HistoriaClinica.findByPk(h.id)).toBeNull();
  });
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `cd backend && npx jest test/historiaClinica.test.js --runInBand`
Expected: FAIL con 404 en las rutas nuevas.

- [ ] **Step 3: `alertaAlergias` en el servicio**

En `backend/src/services/historiaClinica.js`, agregar antes de `module.exports`:

```js
// Alerta para la ficha: si la evaluación más reciente marca Alergias.
function alertaAlergias(historia) {
  const datos = historia ? historia.datos_clinicos || {} : {};
  return { alergias: Boolean(datos.alergias), detalle: datos.alergias ? datos.especificar || null : null };
}
```

Y exportarla: `module.exports = { ErrorValidacion, validarSeccion, validarProtocolo, alertaAlergias, MAX_TEXTO, MAX_PARRAFO };`.

- [ ] **Step 4: Las rutas**

Crear `backend/src/routes/staffHistoriaClinica.js`:

```js
const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { SECCIONES, COLUMNAS_PROTOCOLO } = require('../config/historiaClinica');
const { ErrorValidacion, validarSeccion, validarProtocolo, alertaAlergias } = require('../services/historiaClinica');

const router = express.Router();
const onlyHistoria = requirePermiso('historia_clinica');

const CLAVES_SECCION = SECCIONES.map((s) => s.clave);
const ORDEN_RECIENTE = [['fecha', 'DESC'], ['id', 'DESC']];

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function textoOpcional(valor, max) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'string') throw new ErrorValidacion('texto', 'Valor de texto inválido');
  const limpio = valor.trim();
  if (limpio.length > max) throw new ErrorValidacion('texto', `Texto de hasta ${max} caracteres`);
  return limpio || null;
}

async function cargarCompleta(id) {
  return db.HistoriaClinica.findByPk(id, {
    include: [
      { model: db.Paciente },
      { model: db.Profesional, attributes: ['id', 'nombre'] },
      { model: db.Usuario, as: 'CreadoPor', attributes: ['id', 'nombre'] },
      { model: db.Usuario, as: 'ActualizadoPor', attributes: ['id', 'nombre'] },
    ],
  });
}

router.get('/staff/historia-clinica/definicion', onlyHistoria, (req, res) => {
  res.json({ secciones: SECCIONES, columnasProtocolo: COLUMNAS_PROTOCOLO });
});

router.get('/staff/pacientes/:id/historias', onlyHistoria, async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id, { attributes: ['id'] });
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
  const historias = await db.HistoriaClinica.findAll({
    where: { paciente_id: paciente.id },
    include: [
      { model: db.Usuario, as: 'CreadoPor', attributes: ['nombre'] },
      { model: db.Usuario, as: 'ActualizadoPor', attributes: ['nombre'] },
    ],
    order: ORDEN_RECIENTE,
  });
  res.json({
    historias: historias.map((h) => ({
      id: h.id,
      fecha: h.fecha,
      autor: (h.ActualizadoPor || h.CreadoPor || {}).nombre || null,
      actualizada: h.updated_at || h.updatedAt,
      firmado: Boolean(h.documento_firmado),
    })),
    alerta: alertaAlergias(historias[0]),
  });
});

// Nueva evaluación, vacía o copiada de otra de la MISMA paciente (secciones 2-5).
router.post('/staff/pacientes/:id/historias', onlyHistoria, async (req, res) => {
  const paciente = await db.Paciente.findByPk(req.params.id, { attributes: ['id'] });
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });

  let base = null;
  if (req.body.copiarDe !== undefined && req.body.copiarDe !== null) {
    base = await db.HistoriaClinica.findByPk(req.body.copiarDe);
    if (!base || base.paciente_id !== paciente.id) {
      return res.status(400).json({ error: 'La evaluación a copiar no pertenece a esta paciente' });
    }
  }

  const historia = await db.HistoriaClinica.create({
    paciente_id: paciente.id,
    fecha: hoyISO(),
    motivo_consulta: null,
    datos_clinicos: base ? base.datos_clinicos : {},
    datos_esteticos: base ? base.datos_esteticos : {},
    analisis_estetico: base ? base.analisis_estetico : {},
    diagnostico: base ? base.diagnostico : null,
    protocolo: base ? base.protocolo : [],
    procedimiento_autorizado: base ? base.procedimiento_autorizado : null,
    profesional_id: base ? base.profesional_id : null,
    creado_por_id: req.usuarioId,
    actualizado_por_id: req.usuarioId,
  });
  res.status(201).json(await cargarCompleta(historia.id));
});

router.get('/staff/historias/:id', onlyHistoria, async (req, res) => {
  const historia = await cargarCompleta(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  res.json(historia);
});

router.put('/staff/historias/:id', onlyHistoria, async (req, res) => {
  const historia = await db.HistoriaClinica.findByPk(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });

  try {
    for (const clave of CLAVES_SECCION) {
      if (req.body[clave] !== undefined) historia[clave] = validarSeccion(clave, req.body[clave]);
    }
    if (req.body.protocolo !== undefined) {
      historia.protocolo = validarProtocolo(req.body.protocolo);
    }
    if (req.body.motivo_consulta !== undefined) historia.motivo_consulta = textoOpcional(req.body.motivo_consulta, 4000);
    if (req.body.diagnostico !== undefined) historia.diagnostico = textoOpcional(req.body.diagnostico, 4000);
    if (req.body.procedimiento_autorizado !== undefined) {
      historia.procedimiento_autorizado = textoOpcional(req.body.procedimiento_autorizado, 255);
    }
  } catch (err) {
    if (err instanceof ErrorValidacion) return res.status(400).json({ error: err.message, campo: err.campo });
    throw err;
  }

  if (req.body.fecha !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(req.body.fecha))) return res.status(400).json({ error: 'fecha inválida' });
    historia.fecha = req.body.fecha;
  }
  if (req.body.profesional_id !== undefined) {
    if (req.body.profesional_id === null || req.body.profesional_id === '') {
      historia.profesional_id = null;
    } else {
      const profesional = await db.Profesional.findByPk(req.body.profesional_id);
      if (!profesional) return res.status(400).json({ error: 'Especialista no encontrado' });
      historia.profesional_id = profesional.id;
    }
  }
  // Por defecto el compromiso legal autoriza el primer procedimiento del protocolo.
  if (!historia.procedimiento_autorizado && historia.protocolo.length > 0) {
    historia.procedimiento_autorizado = historia.protocolo[0].procedimiento || null;
  }

  historia.actualizado_por_id = req.usuarioId;
  await historia.save();
  res.json(await cargarCompleta(historia.id));
});

router.delete('/staff/historias/:id', onlyHistoria, async (req, res) => {
  if (req.rolNombre !== 'Admin') return res.status(403).json({ error: 'Solo un administrador puede borrar una evaluación' });
  const historia = await db.HistoriaClinica.findByPk(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  await historia.destroy();
  res.status(204).end();
});

module.exports = router;
```

En `backend/src/app.js`:
- después de `const staffTarjetasRoutes = require('./routes/staffTarjetas');`, agregar `const staffHistoriaClinicaRoutes = require('./routes/staffHistoriaClinica');`;
- después de `app.use('/', staffTarjetasRoutes);`, agregar `app.use('/', staffHistoriaClinicaRoutes);`.

Revisar en `auth.middleware.js` que `requirePermiso` asigne `req.rolNombre`, porque el DELETE lo usa. Ya lo hace: `req.rolNombre = payload.rolNombre`. Verificar también que el login de staff ponga `rolNombre` en el token.

- [ ] **Step 5: Correr los tests**

Run: `cd backend && npx jest test/historiaClinica.test.js --runInBand`
Expected: PASS, 14 tests.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/staffHistoriaClinica.js backend/src/app.js backend/src/services/historiaClinica.js backend/test/historiaClinica.test.js
git commit -m "feat(historia): rutas para crear, copiar, guardar y borrar evaluaciones"
```

---

### Task 4: Tratamiento realizado (calculado) y nota de sesión por cita

**Files:**
- Modify: `backend/src/services/historiaClinica.js` (`calcularTratamientos`)
- Modify: `backend/src/routes/staffHistoriaClinica.js` (GET agrega `tratamientos`)
- Modify: `backend/src/routes/staffTratamientos.js` (POST acepta `citaId`)
- Test: `backend/test/historiaClinica.test.js`

**Interfaces:**
- `calcularTratamientos(historia)` → `Promise<{ desde, hasta, filas }>`.
  - `hasta` es la fecha de la evaluación siguiente, **excluida**, o `null` si no hay otra.
  - Cada fila es `{ tipo: 'cita' | 'manual', fecha, procedimiento, observacion, citaId, notaId, faltaObservacion }`, ordenadas por fecha ascendente.
- `GET /staff/historias/:id` agrega `tratamientos: { desde, hasta, filas }`.
- `POST /staff/pacientes/:id/tratamientos` acepta `citaId`:
  - si la cita no es de la paciente o no está `completada`, 400;
  - si ya tiene nota, 409;
  - toma `fecha` y `hora` de la cita y `profesional_id` de la cita;
  - **no** llama a `chocaConCita`.

- [ ] **Step 1: Tests que fallan**

Agregar dentro del `describe('Historia clínica: API', ...)`:

```js
  test('tratamiento realizado: citas completadas del rango, notas manuales y "falta observación"', async () => {
    const p = await db.Paciente.create({ nombre_completo: 'Caro', telefono: '59170000003', codigo_paciente: 'P-0003', carnet_identidad: '111', carnet_expedido: 'CB' });
    const base = { datos_clinicos: {}, datos_esteticos: {}, analisis_estetico: {}, protocolo: [] };
    const h1 = await db.HistoriaClinica.create({ ...base, paciente_id: p.id, fecha: '2026-08-01' });
    const h2 = await db.HistoriaClinica.create({ ...base, paciente_id: p.id, fecha: '2026-09-01' });
    const cita = (fecha, estado = 'completada', hora = '10:00:00') => db.Cita.create({
      paciente_id: p.id, profesional_id: profesional.id, servicio_id: servicio.id, fecha, hora_inicio: hora, hora_fin: '10:30:00', estado,
    });
    const c1 = await cita('2026-08-05');
    await db.NotaClinica.create({ paciente_id: p.id, cita_id: c1.id, fecha: '2026-08-05', titulo: 'Limpieza', notas: 'Buena respuesta' });
    await cita('2026-08-20');
    await cita('2026-08-21', 'cancelada');
    await cita('2026-09-01');
    await db.NotaClinica.create({ paciente_id: p.id, fecha: '2026-08-10', titulo: 'Peeling (antes del sistema)', notas: 'Sin complicaciones' });

    let res = await request(app).get(`/staff/historias/${h1.id}`).set(auth());
    expect(res.body.tratamientos.desde).toBe('2026-08-01');
    expect(res.body.tratamientos.hasta).toBe('2026-09-01');
    expect(res.body.tratamientos.filas.map((f) => [f.fecha, f.tipo, f.procedimiento, f.observacion, f.faltaObservacion])).toEqual([
      ['2026-08-05', 'cita', 'Limpieza facial', 'Buena respuesta', false],
      ['2026-08-10', 'manual', 'Peeling (antes del sistema)', 'Sin complicaciones', false],
      ['2026-08-20', 'cita', 'Limpieza facial', null, true],
    ]);

    res = await request(app).get(`/staff/historias/${h2.id}`).set(auth());
    expect(res.body.tratamientos.hasta).toBeNull();
    expect(res.body.tratamientos.filas.map((f) => f.fecha)).toEqual(['2026-09-01']);
  });

  test('crear la nota de sesión de una cita completada: sin chocar con la cita y sin duplicar', async () => {
    const c = await db.Cita.create({
      paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id, fecha: '2026-09-15', hora_inicio: '11:00:00', hora_fin: '11:30:00', estado: 'completada',
    });
    let res = await request(app).post(`/staff/pacientes/${paciente.id}/tratamientos`).set(auth()).send({ citaId: c.id, titulo: 'Limpieza facial', notas: 'Piel hidratada' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ cita_id: c.id, fecha: '2026-09-15', profesional_id: profesional.id });
    res = await request(app).post(`/staff/pacientes/${paciente.id}/tratamientos`).set(auth()).send({ citaId: c.id, titulo: 'x', notas: 'y' });
    expect(res.status).toBe(409);

    const pendiente = await db.Cita.create({
      paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id, fecha: '2026-09-16', hora_inicio: '11:00:00', hora_fin: '11:30:00', estado: 'confirmada',
    });
    expect((await request(app).post(`/staff/pacientes/${paciente.id}/tratamientos`).set(auth()).send({ citaId: pendiente.id, titulo: 'x', notas: 'y' })).status).toBe(400);
    expect((await request(app).post(`/staff/pacientes/${otraPaciente.id}/tratamientos`).set(auth()).send({ citaId: c.id, titulo: 'x', notas: 'y' })).status).toBe(400);
  });
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `cd backend && npx jest test/historiaClinica.test.js --runInBand`
Expected: FAIL. `res.body.tratamientos` es undefined, y el POST con `citaId` responde 409 por choque de horario o crea la nota sin `cita_id`.

- [ ] **Step 3: `calcularTratamientos`**

En `backend/src/services/historiaClinica.js`:
- agregar arriba `const { Op } = require('sequelize');` y `const db = require('../models');`;
- agregar antes de `module.exports` la función de abajo;
- exportar `calcularTratamientos`.

```js
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
```

**Ojo con la dependencia circular:** `services/historiaClinica.js` ahora requiere `../models`, y los modelos no requieren servicios, así que no hay ciclo.

- [ ] **Step 4: Agregar `tratamientos` al GET**

En `backend/src/routes/staffHistoriaClinica.js`:
- importar `calcularTratamientos` del servicio;
- reemplazar el cuerpo del `GET /staff/historias/:id` por:

```js
  const historia = await cargarCompleta(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  res.json({ ...historia.toJSON(), tratamientos: await calcularTratamientos(historia) });
```

**Atención:** `toJSON()` usa los getters de Sequelize, así que las columnas JSON siguen saliendo como objetos.

- [ ] **Step 5: POST de tratamientos con `citaId`**

En `backend/src/routes/staffTratamientos.js`, en `router.post('/staff/pacientes/:id/tratamientos', ...)`:
- después de validar `titulo` y `notas`, insertar el bloque de abajo;
- en la desestructuración inicial, agregar `citaId`: `const { titulo, notas, fecha, hora, profesionalId, citaId } = req.body;`.

```js
  // Nota de sesión de una cita atendida: toma fecha, hora y profesional de la
  // cita. No se revisa choque de horario: la única "cita" a esa hora es ella.
  if (citaId) {
    const cita = await db.Cita.findOne({ where: { id: citaId, paciente_id: paciente.id } });
    if (!cita || cita.estado !== 'completada') {
      return res.status(400).json({ error: 'La cita no es de esta paciente o no está completada' });
    }
    if (await db.NotaClinica.findOne({ where: { cita_id: cita.id } })) {
      return res.status(409).json({ error: 'Esa sesión ya tiene una observación' });
    }
    const nota = await db.NotaClinica.create({
      paciente_id: paciente.id,
      cita_id: cita.id,
      profesional_id: cita.profesional_id,
      fecha: cita.fecha,
      hora: cita.hora_inicio,
      titulo,
      notas,
    });
    return res.status(201).json(await db.NotaClinica.findByPk(nota.id, { include: [db.Profesional] }));
  }
```

- [ ] **Step 6: Correr los tests**

Run: `cd backend && npx jest test/historiaClinica.test.js --runInBand && npx jest test/staff.test.js --runInBand`
Expected: `historiaClinica` PASS (16 tests). `staff` solo con las 3 fallas previas de asistencia y búsqueda de notas, ninguna nueva.

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/historiaClinica.js backend/src/routes/staffHistoriaClinica.js backend/src/routes/staffTratamientos.js backend/test/historiaClinica.test.js
git commit -m "feat(historia): tratamiento realizado desde citas y notas, y nota de sesión por cita"
```

---

### Task 5: Documento firmado

**Files:**
- Modify: `backend/src/services/archivosPrivados.js` (carpeta `historias`)
- Modify: `backend/src/routes/staffHistoriaClinica.js`
- Modify: `backend/src/routes/staffPacientes.js` (DELETE borra los documentos)
- Test: `backend/test/historiaClinica.test.js`

**Interfaces:**
- `POST /staff/historias/:id/documento-firmado` (multipart, campo `archivo`) → 200 con la evaluación. Reemplaza el documento anterior, si había, y borra el archivo viejo.
- `GET /staff/historias/:id/documento-firmado` → el archivo (inline, `no-store`).
- `DELETE /staff/historias/:id/documento-firmado` → 200 con la evaluación.
- `DELETE /staff/historias/:id` y `DELETE /staff/pacientes/:id` borran los archivos del disco.

- [ ] **Step 1: Tests que fallan**

Al inicio de `backend/test/historiaClinica.test.js`, antes de cualquier `require` de la app, agregar:

```js
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.PRIVADO_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'privado-hc-'));
```

Y `const { pngFalso, exeFalso } = require('./helpers/archivos');`. Si `exeFalso` no se exporta, exportarlo desde `test/helpers/archivos.js`.

Dentro del `describe('Historia clínica: API', ...)`:

```js
  test('subir, ver, reemplazar y quitar el documento firmado', async () => {
    const h = await db.HistoriaClinica.create({ paciente_id: paciente.id, fecha: '2026-10-01', datos_clinicos: {}, datos_esteticos: {}, analisis_estetico: {}, protocolo: [] });
    const ruta = `/staff/historias/${h.id}/documento-firmado`;

    expect((await request(app).post(ruta).set(auth()).attach('archivo', exeFalso(), { filename: 'x.png', contentType: 'image/png' })).status).toBe(400);
    expect((await request(app).post(ruta).set(auth())).status).toBe(400);

    let res = await request(app).post(ruta).set(auth()).attach('archivo', pngFalso(), { filename: 'firmado.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    const primero = res.body.documento_firmado;
    expect(fs.existsSync(path.join(process.env.PRIVADO_DIR, 'historias', primero))).toBe(true);

    res = await request(app).get(ruta).set(auth());
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
    expect((await request(app).get(ruta).set(auth(tokenRecepcion))).status).toBe(403);

    res = await request(app).post(ruta).set(auth()).attach('archivo', pngFalso(), { filename: 'otra.png', contentType: 'image/png' });
    expect(fs.existsSync(path.join(process.env.PRIVADO_DIR, 'historias', primero))).toBe(false);

    res = await request(app).delete(ruta).set(auth());
    expect(res.body.documento_firmado).toBeNull();
    expect(fs.readdirSync(path.join(process.env.PRIVADO_DIR, 'historias'))).toHaveLength(0);
  });
```

Y en el `afterAll`, antes de cerrar la conexión: `fs.rmSync(process.env.PRIVADO_DIR, { recursive: true, force: true });`.

- [ ] **Step 2: Correr y verificar que falla**

Run: `cd backend && npx jest test/historiaClinica.test.js --runInBand`
Expected: FAIL con 404 en `documento-firmado`.

- [ ] **Step 3: Carpeta privada**

En `backend/src/services/archivosPrivados.js`, cambiar `const CARPETAS = ['comprobantes', 'justificaciones'];` por `const CARPETAS = ['comprobantes', 'justificaciones', 'historias'];`. Actualizar también el comentario de cabecera: "Comprobantes de pago, justificaciones e historias clínicas firmadas: ...".

- [ ] **Step 4: Rutas**

En `backend/src/routes/staffHistoriaClinica.js`, importar `const { recibirArchivo, guardarArchivoPrivado, borrarArchivoPrivado, enviarArchivoPrivado } = require('../services/archivosPrivados');` y agregar antes de `module.exports`:

```js
// Escaneo o foto del papel firmado (compromiso legal). Vive fuera de /uploads.
router.post('/staff/historias/:id/documento-firmado', onlyHistoria, recibirArchivo('archivo'), async (req, res) => {
  const historia = await db.HistoriaClinica.findByPk(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  if (!req.file) return res.status(400).json({ error: 'Adjunta el documento firmado (imagen o PDF)' });
  const anterior = historia.documento_firmado;
  historia.documento_firmado = await guardarArchivoPrivado('historias', req.file.buffer);
  historia.actualizado_por_id = req.usuarioId;
  await historia.save();
  await borrarArchivoPrivado('historias', anterior);
  res.json(await cargarCompleta(historia.id));
});

router.get('/staff/historias/:id/documento-firmado', onlyHistoria, async (req, res) => {
  const historia = await db.HistoriaClinica.findByPk(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  return enviarArchivoPrivado(res, 'historias', historia.documento_firmado);
});

router.delete('/staff/historias/:id/documento-firmado', onlyHistoria, async (req, res) => {
  const historia = await db.HistoriaClinica.findByPk(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  const anterior = historia.documento_firmado;
  historia.documento_firmado = null;
  historia.actualizado_por_id = req.usuarioId;
  await historia.save();
  await borrarArchivoPrivado('historias', anterior);
  res.json(await cargarCompleta(historia.id));
});
```

En el `DELETE /staff/historias/:id` ya existente, antes de `await historia.destroy();`, agregar `await borrarArchivoPrivado('historias', historia.documento_firmado);`.

En `backend/src/routes/staffPacientes.js`:
- importar `const { borrarArchivoPrivado } = require('../services/archivosPrivados');`;
- en el DELETE de paciente, antes de `await paciente.destroy();`, agregar:

```js
  // La FK borra las evaluaciones en cascada; los archivos firmados se borran a mano.
  const historias = await db.HistoriaClinica.findAll({ where: { paciente_id: paciente.id }, attributes: ['documento_firmado'] });
  for (const h of historias) await borrarArchivoPrivado('historias', h.documento_firmado);
```

- [ ] **Step 5: Correr los tests**

Run: `cd backend && npx jest test/historiaClinica.test.js --runInBand && npx jest test/archivosPrivados.test.js --runInBand`
Expected: ambos PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/archivosPrivados.js backend/src/routes/staffHistoriaClinica.js backend/src/routes/staffPacientes.js backend/test/historiaClinica.test.js backend/test/helpers/archivos.js
git commit -m "feat(historia): subir el documento firmado como archivo privado"
```

---

### Task 6: Armador de documento y PDF

**Files:**
- Create: `backend/src/services/historiaClinicaDocumento.js`
- Create: `backend/src/services/historiaClinicaPdf.js`
- Modify: `backend/src/routes/staffHistoriaClinica.js`
- Test: `backend/test/historiaClinica.test.js`

**Interfaces:**
- `armarDocumento({ config, paciente, historia, tratamientos, enBlanco })` → `{ fecha, numero, bloques }`. Los bloques son:

  | `tipo` | Campos |
  |---|---|
  | `seccion` | `titulo` |
  | `grupo` | `titulo`, `subtitulo?` |
  | `casillas` | `items: [{ etiqueta, marcado, detalles: [{ etiqueta, valor }] }]` |
  | `campo` | `etiqueta`, `valor` |
  | `parrafo` | `etiqueta`, `valor` |
  | `tabla` | `columnas: string[]`, `filas: string[][]` |
  | `compromiso` | `texto` |
  | `firmas` | `paciente`, `especialista` |

  `valor` es `''` cuando está vacío. Una `opcion` se convierte en un bloque `casillas` con una sola casilla marcada.
- `enviarHistoriaPdf(res, documento, config, nombreArchivo)` escribe el PDF en `res` y lo termina.
- `GET /staff/historias/:id/pdf` y `GET /staff/historia-clinica/en-blanco.pdf`.

- [ ] **Step 1: Tests que fallan**

Agregar arriba del archivo de tests:

```js
const { armarDocumento } = require('../src/services/historiaClinicaDocumento');

function binario(res, cb) {
  const partes = [];
  res.on('data', (c) => partes.push(c));
  res.on('end', () => cb(null, Buffer.concat(partes)));
}
```

Agregar dentro del `describe('Historia clínica: API', ...)`:

```js
  test('armarDocumento: datos personales, casillas con detalles, opciones y compromiso legal', () => {
    const doc = armarDocumento({
      config: { nombre_consultorio: 'Clinic NovagED' },
      paciente: { nombre_completo: 'Ana Pérez', codigo_paciente: 'P-0001', carnet_identidad: '1234567', carnet_complemento: null, carnet_expedido: 'CB', fecha_nacimiento: '1990-05-10', sexo: 'F', telefono: '591' },
      historia: {
        fecha: '2026-10-01', motivo_consulta: 'Manchas', datos_clinicos: { tabaco: true, tabaco_frecuencia: 'diario' }, datos_esteticos: {},
        analisis_estetico: { fototipo: 'III' }, diagnostico: 'Melasma', protocolo: [{ procedimiento: 'Peeling', sesiones: '4', comentario: '' }],
        procedimiento_autorizado: 'Peeling', Profesional: { nombre: 'Dra. Noemí' },
      },
      tratamientos: { filas: [{ fecha: '2026-10-05', procedimiento: 'Peeling', observacion: 'Bien' }] },
    });
    expect(doc.numero).toBe('P-0001');
    const campos = doc.bloques.filter((b) => b.tipo === 'campo');
    expect(campos).toEqual(expect.arrayContaining([
      { tipo: 'campo', etiqueta: 'Edad', valor: '36' },
      { tipo: 'campo', etiqueta: 'C.I.', valor: '1234567 CB' },
    ]));
    const tabaco = doc.bloques.flatMap((b) => (b.tipo === 'casillas' ? b.items : [])).find((i) => i.etiqueta === 'Tabaco');
    expect(tabaco).toEqual({ etiqueta: 'Tabaco', marcado: true, detalles: [{ etiqueta: 'Frecuencia', valor: 'diario' }] });
    const fototipo = doc.bloques.flatMap((b) => (b.tipo === 'casillas' ? b.items : [])).filter((i) => ['I', 'II', 'III'].includes(i.etiqueta));
    expect(fototipo.map((i) => i.marcado)).toEqual([false, false, true]);
    const compromiso = doc.bloques.find((b) => b.tipo === 'compromiso').texto;
    expect(compromiso).toContain('Ana Pérez');
    expect(compromiso).toContain('Dra. Noemí');
    expect(compromiso).toContain('Clinic NovagED');
    expect(doc.bloques.filter((b) => b.tipo === 'tabla').map((t) => t.filas)).toEqual([[['Peeling', '4', '']], [['05/10/2026', 'Peeling', 'Bien']]]);
  });

  test('armarDocumento en blanco: sin valores y con filas vacías para llenar a mano', () => {
    const doc = armarDocumento({ config: {}, enBlanco: true });
    expect(doc.bloques.filter((b) => b.tipo === 'campo').every((b) => b.valor === '')).toBe(true);
    expect(doc.bloques.flatMap((b) => (b.tipo === 'casillas' ? b.items : [])).some((i) => i.marcado)).toBe(false);
    expect(doc.bloques.filter((b) => b.tipo === 'tabla').every((t) => t.filas.length === 3)).toBe(true);
  });

  test('descarga el PDF de una evaluación llena al máximo y el formulario en blanco', async () => {
    const todo = {};
    const { SECCIONES: S } = require('../src/config/historiaClinica');
    const llenas = {};
    for (const s of S) {
      llenas[s.clave] = {};
      for (const g of s.grupos) for (const c of g.campos) {
        if (c.tipo === 'check') llenas[s.clave][c.clave] = true;
        if (c.tipo === 'opcion') llenas[s.clave][c.clave] = c.opciones[0].clave;
        if (c.tipo === 'texto') llenas[s.clave][c.clave] = 'x'.repeat(500);
        if (c.tipo === 'parrafo') llenas[s.clave][c.clave] = 'palabra '.repeat(500).trim();
        for (const d of c.detalles || []) llenas[s.clave][`${c.clave}_${d.clave}`] = 'y'.repeat(100);
      }
    }
    Object.assign(todo, llenas);
    const h = await db.HistoriaClinica.create({ paciente_id: paciente.id, fecha: '2026-10-02', ...todo, protocolo: [{ procedimiento: 'P', sesiones: '1', comentario: 'c'.repeat(500) }], diagnostico: 'd '.repeat(2000) });

    let res = await request(app).get(`/staff/historias/${h.id}/pdf`).set(auth()).buffer(true).parse(binario);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('historia-clinica-P-0001-2026-10-02.pdf');
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');

    res = await request(app).get('/staff/historia-clinica/en-blanco.pdf').set(auth()).buffer(true).parse(binario);
    expect(res.status).toBe(200);
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
    expect((await request(app).get(`/staff/historias/${h.id}/pdf`).set(auth(tokenRecepcion))).status).toBe(403);
  }, 30000);
```

**Nota:** el test "Edad 36" depende del día: 1990-05-10 cumple 36 en 2026-05-10, y la edad se calcula **a la fecha de la evaluación** (2026-10-01), así que el resultado es fijo.

- [ ] **Step 2: Correr y verificar que fallan**

Run: `cd backend && npx jest test/historiaClinica.test.js --runInBand`
Expected: FAIL con "Cannot find module '../src/services/historiaClinicaDocumento'".

- [ ] **Step 3: El armador**

Crear `backend/src/services/historiaClinicaDocumento.js`:

```js
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
```

**Ajuste al test:** el bloque `campo` de "Sexo" y de las opciones tiene valor `''`, porque las casillas van aparte. Por eso el test "en blanco" (todos los `campo` con `''`) se cumple también en una evaluación llena. El test del armador lleno usa `arrayContaining` solo con Edad y C.I.

- [ ] **Step 4: El PDF**

Crear `backend/src/services/historiaClinicaPdf.js`:

```js
const { crearReportePDF, COLOR } = require('./pdf');

// Dibuja los bloques de armarDocumento con pdfkit. Las casillas se dibujan
// como rectángulos: las fuentes estándar de PDF (Helvetica) no tienen ☐/☒.
const TAM = 9;
const CAJA = 8;

function enviarHistoriaPdf(res, documento, config, nombreArchivo) {
  const doc = crearReportePDF(res, config, { titulo: 'Historia clínica', nombreArchivo });
  const izq = doc.page.margins.left;
  const der = doc.page.width - doc.page.margins.right;
  const ancho = der - izq;
  const limite = () => doc.page.height - doc.page.margins.bottom - 20;
  const asegurar = (alto) => {
    if (doc.y + alto > limite()) doc.addPage();
  };

  doc.font('Helvetica').fontSize(TAM).fillColor(COLOR.ink);
  doc.text(`Fecha: ${documento.fecha || '____/____/______'}      N° de historia: ${documento.numero || '__________'}`, izq, doc.y);
  doc.moveDown(0.6);

  function casillas(items) {
    doc.font('Helvetica').fontSize(TAM);
    let x = izq;
    let y = doc.y;
    const altoLinea = TAM + 6;
    asegurar(altoLinea);
    y = doc.y;
    for (const item of items) {
      const detalles = item.detalles.map((d) => ` ${d.etiqueta}: ${d.valor || '__________'}`).join('');
      const texto = `${item.etiqueta}${detalles}`;
      const anchoTexto = Math.min(doc.widthOfString(texto), ancho - CAJA - 4);
      const anchoItem = CAJA + 4 + anchoTexto + 14;
      if (x + anchoItem > der && x > izq) {
        x = izq;
        y += altoLinea;
        if (y + altoLinea > limite()) {
          doc.addPage();
          y = doc.y;
        }
      }
      doc.lineWidth(0.7).strokeColor(COLOR.ink).rect(x, y + 1, CAJA, CAJA).stroke();
      if (item.marcado) {
        doc.moveTo(x + 1.5, y + 2.5).lineTo(x + CAJA - 1.5, y + CAJA - 0.5).moveTo(x + CAJA - 1.5, y + 2.5).lineTo(x + 1.5, y + CAJA - 0.5).stroke();
      }
      doc.fillColor(COLOR.ink).text(texto, x + CAJA + 4, y, { width: anchoTexto, lineBreak: false, ellipsis: true });
      x += anchoItem;
    }
    doc.y = y + altoLinea;
    doc.x = izq;
  }

  function tabla(columnas, filas) {
    const anchoCol = ancho / columnas.length;
    const fila = (valores, encabezado) => {
      doc.font(encabezado ? 'Helvetica-Bold' : 'Helvetica').fontSize(TAM);
      const alto = Math.max(18, ...valores.map((v) => doc.heightOfString(String(v || ' '), { width: anchoCol - 8 }) + 8));
      asegurar(alto);
      const y = doc.y;
      valores.forEach((v, i) => {
        doc.lineWidth(0.6).strokeColor(COLOR.manhattan).rect(izq + i * anchoCol, y, anchoCol, alto).stroke();
        doc.fillColor(COLOR.ink).text(String(v || ''), izq + i * anchoCol + 4, y + 4, { width: anchoCol - 8 });
      });
      doc.y = y + alto;
    };
    fila(columnas, true);
    filas.forEach((f) => fila(f, false));
    doc.moveDown(0.6);
    doc.x = izq;
  }

  for (const b of documento.bloques) {
    if (b.tipo === 'seccion') {
      asegurar(40);
      doc.moveDown(0.6);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(COLOR.ink).text(b.titulo, izq, doc.y);
      doc.moveDown(0.2);
    } else if (b.tipo === 'grupo') {
      asegurar(30);
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR.espresso).text(b.titulo, izq, doc.y);
      if (b.subtitulo) doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(COLOR.muted).text(b.subtitulo, izq, doc.y);
    } else if (b.tipo === 'casillas') {
      casillas(b.items);
    } else if (b.tipo === 'campo') {
      asegurar(TAM + 6);
      doc.font('Helvetica-Bold').fontSize(TAM).fillColor(COLOR.ink).text(`${b.etiqueta}: `, izq, doc.y, { continued: true });
      doc.font('Helvetica').text(b.valor || '______________________________', { width: ancho });
    } else if (b.tipo === 'parrafo') {
      asegurar(TAM * 3);
      doc.font('Helvetica-Bold').fontSize(TAM).fillColor(COLOR.ink).text(`${b.etiqueta}:`, izq, doc.y);
      if (b.valor) {
        doc.font('Helvetica').text(b.valor, izq, doc.y, { width: ancho });
      } else {
        for (let i = 0; i < 2; i += 1) {
          doc.moveDown(0.9);
          doc.moveTo(izq, doc.y).lineTo(der, doc.y).lineWidth(0.5).strokeColor(COLOR.mutedLight).stroke();
        }
        doc.moveDown(0.4);
      }
    } else if (b.tipo === 'tabla') {
      tabla(b.columnas, b.filas);
    } else if (b.tipo === 'compromiso') {
      doc.font('Helvetica').fontSize(TAM).fillColor(COLOR.ink).text(b.texto, izq, doc.y, { width: ancho, align: 'justify' });
    } else if (b.tipo === 'firmas') {
      asegurar(90);
      doc.moveDown(4);
      const y = doc.y;
      const mitad = ancho / 2;
      for (const [i, titulo] of ['Firma del paciente', 'Firma del especialista'].entries()) {
        const x = izq + i * mitad;
        doc.moveTo(x, y).lineTo(x + mitad - 40, y).lineWidth(0.7).strokeColor(COLOR.ink).stroke();
        doc.font('Helvetica').fontSize(TAM).text(titulo, x, y + 4, { width: mitad - 40 });
        doc.text('C.I.', x, doc.y, { width: mitad - 40 });
      }
    }
  }

  doc.end();
}

module.exports = { enviarHistoriaPdf };
```

- [ ] **Step 5: Rutas de descarga**

En `backend/src/routes/staffHistoriaClinica.js`, importar `armarDocumento` y `enviarHistoriaPdf`, y agregar:

```js
async function documentoDe(historia) {
  const [config, tratamientos] = await Promise.all([db.ConfiguracionClinica.obtenerConfig(), calcularTratamientos(historia)]);
  const documento = armarDocumento({ config, paciente: historia.Paciente, historia, tratamientos });
  return { config, documento, base: `historia-clinica-${historia.Paciente.codigo_paciente}-${historia.fecha}` };
}

router.get('/staff/historia-clinica/en-blanco.pdf', onlyHistoria, async (req, res) => {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  enviarHistoriaPdf(res, armarDocumento({ config, enBlanco: true }), config, 'historia-clinica-en-blanco.pdf');
});

router.get('/staff/historias/:id/pdf', onlyHistoria, async (req, res) => {
  const historia = await cargarCompleta(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  const { config, documento, base } = await documentoDe(historia);
  enviarHistoriaPdf(res, documento, config, `${base}.pdf`);
});
```

Verificar el nombre del método que lee la configuración. `staffConfiguracion.js` y `fidelizacion.js` usan `db.ConfiguracionClinica.obtenerConfig()`.

- [ ] **Step 6: Correr los tests**

Run: `cd backend && npx jest test/historiaClinica.test.js --runInBand`
Expected: PASS, 20 tests.

Abrir un PDF a mano para revisar el maquetado, guardándolo en el scratchpad:

```bash
cd backend && node -e "
require('dotenv').config({ quiet: true, path: '.env.test' });
const db = require('./src/models');
const fs = require('fs');
const { armarDocumento } = require('./src/services/historiaClinicaDocumento');
const { enviarHistoriaPdf } = require('./src/services/historiaClinicaPdf');
const out = fs.createWriteStream(process.argv[1]);
out.setHeader = () => {};
enviarHistoriaPdf(out, armarDocumento({ config: { nombre_consultorio: 'Clinic NovagED' }, enBlanco: true }), { nombre_consultorio: 'Clinic NovagED' }, 'x.pdf');
out.on('finish', () => db.sequelize.close());
" "$SCRATCH/en-blanco.pdf"
```

Se ejecuta desde un archivo temporal en el scratchpad, no dentro de `backend/`, para no reiniciar nodemon. El revisor visual lee el PDF: casillas alineadas, sin texto encimado, secciones en orden.

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/historiaClinicaDocumento.js backend/src/services/historiaClinicaPdf.js backend/src/routes/staffHistoriaClinica.js backend/test/historiaClinica.test.js
git commit -m "feat(historia): descarga en PDF con logo y formulario en blanco"
```

---

### Task 7: Word (.docx)

**Files:**
- Modify: `backend/package.json` (dependencia `docx`)
- Create: `backend/src/services/historiaClinicaWord.js`
- Modify: `backend/src/routes/staffHistoriaClinica.js`
- Test: `backend/test/historiaClinica.test.js`

**Interfaces:**
- `generarHistoriaWord(documento, config)` → `Promise<Buffer>`.
- `GET /staff/historias/:id/word` y `GET /staff/historia-clinica/en-blanco.docx`, con content-type `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

- [ ] **Step 1: Instalar `docx`**

```bash
cd backend && npm install docx@9
```

Expected: `docx` aparece en `dependencies` de `package.json`, con la versión 9.x exacta que se instaló.

- [ ] **Step 2: Test que falla**

Agregar dentro del `describe('Historia clínica: API', ...)`:

```js
  test('descarga el Word de una evaluación y el formulario en blanco', async () => {
    const h = await db.HistoriaClinica.create({ paciente_id: paciente.id, fecha: '2026-10-03', datos_clinicos: { tabaco: true }, datos_esteticos: {}, analisis_estetico: {}, protocolo: [] });
    let res = await request(app).get(`/staff/historias/${h.id}/word`).set(auth()).buffer(true).parse(binario);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(res.headers['content-disposition']).toContain('historia-clinica-P-0001-2026-10-03.docx');
    expect(res.body.subarray(0, 2).toString()).toBe('PK');
    res = await request(app).get('/staff/historia-clinica/en-blanco.docx').set(auth()).buffer(true).parse(binario);
    expect(res.status).toBe(200);
    expect(res.body.subarray(0, 2).toString()).toBe('PK');
  }, 30000);
```

- [ ] **Step 3: Correr y verificar que falla**

Run: `cd backend && npx jest test/historiaClinica.test.js -t "Word" --runInBand`
Expected: FAIL con 404.

- [ ] **Step 4: El generador**

Crear `backend/src/services/historiaClinicaWord.js`:

```js
const fs = require('fs');
const PDFDocument = require('pdfkit');
const {
  AlignmentType, BorderStyle, Document, Header, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
} = require('docx');
const { rutaLogoEmbebible } = require('./pdf');

// Mismo contenido que el PDF (bloques de armarDocumento), en Word editable.
const TAM = 18; // medios puntos: 9 pt
const MARCADA = '☒';
const VACIA = '☐';

function dimensionesImagen(ruta) {
  // pdfkit ya sabe leer PNG/JPEG: se usa solo para saber ancho y alto.
  const img = new PDFDocument({ autoFirstPage: false }).openImage(ruta);
  return { ancho: img.width, alto: img.height };
}

function encabezado(config) {
  const hijos = [];
  const ruta = rutaLogoEmbebible(config.logo_url);
  if (ruta) {
    try {
      const { ancho, alto } = dimensionesImagen(ruta);
      const altoObjetivo = 48;
      hijos.push(new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new ImageRun({
          type: /\.png$/i.test(ruta) ? 'png' : 'jpg',
          data: fs.readFileSync(ruta),
          transformation: { width: Math.round(altoObjetivo * (ancho / alto)), height: altoObjetivo },
        })],
      }));
    } catch {
      // Logo ilegible: el encabezado sigue sin imagen.
    }
  }
  hijos.push(new Paragraph({ children: [new TextRun({ text: config.nombre_consultorio || 'Clínica', bold: true, size: 28 })] }));
  const datos = [config.direccion, [config.ciudad, config.pais].filter(Boolean).join(', '), [config.telefono, config.email].filter(Boolean).join(' · ')]
    .filter(Boolean)
    .join('   ');
  if (datos) hijos.push(new Paragraph({ children: [new TextRun({ text: datos, size: 16, color: '5A5A5A' })] }));
  return new Header({ children: hijos });
}

function tabla(columnas, filas) {
  const borde = { style: BorderStyle.SINGLE, size: 4, color: 'B0B0B0' };
  const celda = (texto, negrita) => new TableCell({
    borders: { top: borde, bottom: borde, left: borde, right: borde },
    children: [new Paragraph({ children: [new TextRun({ text: texto || ' ', bold: negrita, size: TAM })] })],
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: columnas.map((c) => celda(c, true)) }),
      ...filas.map((f) => new TableRow({ children: f.map((v) => celda(String(v || ''), false)) })),
    ],
  });
}

async function generarHistoriaWord(documento, config) {
  const cuerpo = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'HISTORIA CLÍNICA', bold: true, size: 32 })] }),
    new Paragraph({ children: [new TextRun({ text: `Fecha: ${documento.fecha || '____/____/______'}      N° de historia: ${documento.numero || '__________'}`, size: TAM })] }),
  ];

  for (const b of documento.bloques) {
    if (b.tipo === 'seccion') {
      cuerpo.push(new Paragraph({ spacing: { before: 240, after: 80 }, children: [new TextRun({ text: b.titulo, bold: true, size: 24 })] }));
    } else if (b.tipo === 'grupo') {
      cuerpo.push(new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: b.titulo, bold: true, size: 20 })] }));
      if (b.subtitulo) cuerpo.push(new Paragraph({ children: [new TextRun({ text: b.subtitulo, italics: true, size: 16 })] }));
    } else if (b.tipo === 'casillas') {
      const runs = [];
      for (const item of b.items) {
        const detalles = item.detalles.map((d) => ` ${d.etiqueta}: ${d.valor || '__________'}`).join('');
        runs.push(new TextRun({ text: `${item.marcado ? MARCADA : VACIA} `, font: 'Segoe UI Symbol', size: TAM }));
        runs.push(new TextRun({ text: `${item.etiqueta}${detalles}     `, size: TAM }));
      }
      cuerpo.push(new Paragraph({ children: runs }));
    } else if (b.tipo === 'campo') {
      cuerpo.push(new Paragraph({
        children: [new TextRun({ text: `${b.etiqueta}: `, bold: true, size: TAM }), new TextRun({ text: b.valor || '______________________________', size: TAM })],
      }));
    } else if (b.tipo === 'parrafo') {
      cuerpo.push(new Paragraph({ children: [new TextRun({ text: `${b.etiqueta}:`, bold: true, size: TAM })] }));
      const lineas = b.valor ? b.valor.split('\n') : ['_'.repeat(90), '_'.repeat(90)];
      for (const linea of lineas) cuerpo.push(new Paragraph({ children: [new TextRun({ text: linea, size: TAM })] }));
    } else if (b.tipo === 'tabla') {
      cuerpo.push(tabla(b.columnas, b.filas));
      cuerpo.push(new Paragraph({ children: [] }));
    } else if (b.tipo === 'compromiso') {
      cuerpo.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: b.texto, size: TAM })] }));
    } else if (b.tipo === 'firmas') {
      cuerpo.push(new Paragraph({ spacing: { before: 1200 }, children: [] }));
      cuerpo.push(tabla(['Firma del paciente', 'Firma del especialista'], [['C.I.', 'C.I.']]));
    }
  }

  const doc = new Document({ sections: [{ headers: { default: encabezado(config) }, children: cuerpo }] });
  return Packer.toBuffer(doc);
}

module.exports = { generarHistoriaWord };
```

En `backend/src/services/pdf.js`, exportar también `rutaLogoEmbebible`. Cambiar la última línea a `module.exports = { crearReportePDF, dibujarTabla, formatoMoneda, formatoFecha, rutaLogoEmbebible, COLOR };`.

- [ ] **Step 5: Rutas**

En `backend/src/routes/staffHistoriaClinica.js`, importar `generarHistoriaWord` y agregar:

```js
const MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function enviarWord(res, buffer, nombreArchivo) {
  res.setHeader('Content-Type', MIME_DOCX);
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
  res.send(buffer);
}

router.get('/staff/historia-clinica/en-blanco.docx', onlyHistoria, async (req, res) => {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  enviarWord(res, await generarHistoriaWord(armarDocumento({ config, enBlanco: true }), config), 'historia-clinica-en-blanco.docx');
});

router.get('/staff/historias/:id/word', onlyHistoria, async (req, res) => {
  const historia = await cargarCompleta(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  const { config, documento, base } = await documentoDe(historia);
  enviarWord(res, await generarHistoriaWord(documento, config), `${base}.docx`);
});
```

- [ ] **Step 6: Correr los tests**

Run: `cd backend && npx jest test/historiaClinica.test.js --runInBand`
Expected: PASS, 21 tests.

Si `docx@9` cambió la API de `ImageRun` y el test falla por `type`, revisar `node_modules/docx/README.md` o los tipos en `node_modules/docx/dist/index.d.ts`, ajustar las opciones de `ImageRun` y anotarlo en el reporte.

- [ ] **Step 7: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/services/historiaClinicaWord.js backend/src/services/pdf.js backend/src/routes/staffHistoriaClinica.js backend/test/historiaClinica.test.js
git commit -m "feat(historia): descarga en Word con logo y formulario en blanco"
```

---

### Task 8: Panel — API, datos personales, alerta de alergias y lista de evaluaciones

**Files:**
- Modify: `staff/src/lib/api.js`
- Modify: `staff/src/app/pacientes/[id]/page.tsx`
- Create: `staff/src/app/pacientes/[id]/SeccionHistoria.tsx`

**Interfaces (api.js):**

| Método | Llama a |
|---|---|
| `getDefinicionHistoria()` | `GET /staff/historia-clinica/definicion` |
| `getHistoriasPaciente(pacienteId)` | `GET /staff/pacientes/:id/historias` |
| `crearHistoria(pacienteId, copiarDe)` | `POST /staff/pacientes/:id/historias` |
| `getHistoria(id)` | `GET /staff/historias/:id` |
| `guardarHistoria(id, datos)` | `PUT /staff/historias/:id` |
| `borrarHistoria(id)` | `DELETE /staff/historias/:id` |
| `subirDocumentoFirmado(id, archivo)` | `POST /staff/historias/:id/documento-firmado` (FormData, campo `archivo`) |
| `quitarDocumentoFirmado(id)` | `DELETE /staff/historias/:id/documento-firmado` |
| `descargarHistoriaPdf(id)` | `descargarPDF('/staff/historias/:id/pdf')` |
| `descargarHistoriaWord(id)` | `descargarPDF('/staff/historias/:id/word')` |
| `descargarHistoriaEnBlanco(formato)` | `descargarPDF('/staff/historia-clinica/en-blanco.' + formato)` |

`descargarPDF` sirve para cualquier binario: toma el nombre de `Content-Disposition`.

`crearTratamiento(pacienteId, datos)` ya existe y acepta `citaId` dentro de `datos`.

- [ ] **Step 1: api.js**

En `staff/src/lib/api.js`, después de `crearTratamiento`, agregar:

```js
  getDefinicionHistoria: () => apiFetch('/staff/historia-clinica/definicion'),
  getHistoriasPaciente: (pacienteId) => apiFetch(`/staff/pacientes/${pacienteId}/historias`),
  crearHistoria: (pacienteId, copiarDe) =>
    apiFetch(`/staff/pacientes/${pacienteId}/historias`, { method: 'POST', body: JSON.stringify(copiarDe ? { copiarDe } : {}) }),
  getHistoria: (id) => apiFetch(`/staff/historias/${id}`),
  guardarHistoria: (id, datos) => apiFetch(`/staff/historias/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),
  borrarHistoria: (id) => apiFetch(`/staff/historias/${id}`, { method: 'DELETE' }),
  subirDocumentoFirmado: (id, archivo) => {
    const datos = new FormData();
    datos.append('archivo', archivo);
    return apiFetch(`/staff/historias/${id}/documento-firmado`, { method: 'POST', body: datos });
  },
  quitarDocumentoFirmado: (id) => apiFetch(`/staff/historias/${id}/documento-firmado`, { method: 'DELETE' }),
  descargarHistoriaPdf: (id) => descargarPDF(`/staff/historias/${id}/pdf`),
  descargarHistoriaWord: (id) => descargarPDF(`/staff/historias/${id}/word`),
  descargarHistoriaEnBlanco: (formato) => descargarPDF(`/staff/historia-clinica/en-blanco.${formato}`),
```

- [ ] **Step 2: `SeccionHistoria.tsx`**

Crear `staff/src/app/pacientes/[id]/SeccionHistoria.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export type AlertaAlergias = { alergias: boolean; detalle: string | null };
type Evaluacion = { id: number; fecha: string; autor: string | null; firmado: boolean };

function fmtFecha(fecha: string) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

// Lista de evaluaciones de la historia clínica (solo con permiso historia_clinica).
export default function SeccionHistoria({ pacienteId, onAlerta }: { pacienteId: string; onAlerta: (a: AlertaAlergias) => void }) {
  const router = useRouter();
  const [historias, setHistorias] = useState<Evaluacion[] | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await api.getHistoriasPaciente(pacienteId);
      setHistorias(res.historias);
      onAlerta(res.alerta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la historia clínica');
    }
  }, [pacienteId, onAlerta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function nueva() {
    setOcupado(true);
    setError(null);
    try {
      const anterior = historias && historias.length > 0 ? historias[0].id : undefined;
      const creada = await api.crearHistoria(pacienteId, anterior);
      router.push(`/pacientes/${pacienteId}/historia/${creada.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la evaluación');
      setOcupado(false);
    }
  }

  async function descargar(accion: () => Promise<unknown>) {
    setError(null);
    try {
      await accion();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descargar');
    }
  }

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Historia clínica</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => descargar(() => api.descargarHistoriaEnBlanco('pdf'))} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft">
            Formulario en blanco (PDF)
          </button>
          <button onClick={() => descargar(() => api.descargarHistoriaEnBlanco('docx'))} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft">
            En blanco (Word)
          </button>
          <button onClick={nueva} disabled={ocupado} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50">
            {ocupado ? 'Creando…' : '+ Nueva evaluación'}
          </button>
        </div>
      </div>
      {error && <p className="mb-2 text-xs text-danger">{error}</p>}
      {historias && historias.length === 0 && (
        <p className="text-sm text-foreground/70">Sin evaluaciones. "Nueva evaluación" abre el formulario de historia clínica.</p>
      )}
      {historias && historias.length > 0 && (
        <p className="mb-2 text-xs text-muted-foreground">"Nueva evaluación" copia la más reciente para que solo corrijas lo que cambió.</p>
      )}
      <div className="flex flex-col gap-2">
        {(historias || []).map((h) => (
          <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-panel p-3 text-sm">
            <div>
              <p className="font-medium">Evaluación del {fmtFecha(h.fecha)}</p>
              <p className="text-xs text-muted-foreground">
                {h.autor ? `Última edición: ${h.autor}` : ''}
                {h.firmado ? ' · ✓ Firmada' : ' · Sin documento firmado'}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/pacientes/${pacienteId}/historia/${h.id}`} className="rounded border border-border px-2.5 py-1 text-xs hover:bg-accent-soft">
                Ver / editar
              </Link>
              <button onClick={() => descargar(() => api.descargarHistoriaPdf(h.id))} className="rounded border border-border px-2.5 py-1 text-xs hover:bg-accent-soft">PDF</button>
              <button onClick={() => descargar(() => api.descargarHistoriaWord(h.id))} className="rounded border border-border px-2.5 py-1 text-xs hover:bg-accent-soft">Word</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: La ficha de la paciente**

En `staff/src/app/pacientes/[id]/page.tsx`:

1. Importar: `import SeccionHistoria, { type AlertaAlergias } from './SeccionHistoria';`.
2. En `type Paciente`, agregar:
   ```ts
     sexo: 'F' | 'M' | null;
     estado_civil: 'S' | 'C' | 'D' | 'V' | null;
     grupo_sanguineo: string | null;
     direccion: string | null;
     ocupacion: string | null;
     email: string | null;
     contacto_emergencia: string | null;
     parentesco_emergencia: string | null;
   ```
3. Estado y callback, junto a los otros `useState`:
   ```ts
   const [alerta, setAlerta] = useState<AlertaAlergias | null>(null);
   const verHistoria = Boolean(usuario?.permisos?.includes('historia_clinica'));
   const alAlerta = useCallback((a: AlertaAlergias) => setAlerta(a), []);
   ```
   `useCallback` ya se importa en este archivo. Si no, agregarlo al import de React.
4. En `guardar`, agregar al objeto de `api.actualizarPaciente`:
   ```ts
           sexo: paciente.sexo ?? '',
           estado_civil: paciente.estado_civil ?? '',
           grupo_sanguineo: paciente.grupo_sanguineo ?? '',
           direccion: paciente.direccion ?? '',
           ocupacion: paciente.ocupacion ?? '',
           email: paciente.email ?? '',
           contacto_emergencia: paciente.contacto_emergencia ?? '',
           parentesco_emergencia: paciente.parentesco_emergencia ?? '',
   ```
5. En el formulario, después del `<label>` de "Fecha de nacimiento", agregar:
   ```tsx
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label>
                Sexo
                <select
                  value={paciente.sexo ?? ''}
                  onChange={(e) => setPaciente({ ...paciente, sexo: (e.target.value || null) as Paciente['sexo'] })}
                  className="mt-1 w-full rounded border border-border px-3 py-1.5"
                >
                  <option value="">—</option>
                  <option value="F">F</option>
                  <option value="M">M</option>
                </select>
              </label>
              <label>
                Estado civil
                <select
                  value={paciente.estado_civil ?? ''}
                  onChange={(e) => setPaciente({ ...paciente, estado_civil: (e.target.value || null) as Paciente['estado_civil'] })}
                  className="mt-1 w-full rounded border border-border px-3 py-1.5"
                >
                  <option value="">—</option>
                  <option value="S">Soltera/o</option>
                  <option value="C">Casada/o</option>
                  <option value="D">Divorciada/o</option>
                  <option value="V">Viuda/o</option>
                </select>
              </label>
              <label>
                Grupo sanguíneo
                <input
                  value={paciente.grupo_sanguineo ?? ''}
                  onChange={(e) => setPaciente({ ...paciente, grupo_sanguineo: e.target.value })}
                  maxLength={5}
                  className="mt-1 w-full rounded border border-border px-3 py-1.5"
                />
              </label>
            </div>
            {(
              [
                ['direccion', 'Dirección'],
                ['ocupacion', 'Ocupación'],
                ['email', 'E-mail'],
                ['contacto_emergencia', 'Contacto de emergencia'],
                ['parentesco_emergencia', 'Parentesco'],
              ] as const
            ).map(([campo, etiqueta]) => (
              <label key={campo}>
                {etiqueta}
                <input
                  type={campo === 'email' ? 'email' : 'text'}
                  value={paciente[campo] ?? ''}
                  onChange={(e) => setPaciente({ ...paciente, [campo]: e.target.value })}
                  className="mt-1 w-full rounded border border-border px-3 py-1.5"
                />
              </label>
            ))}
   ```
6. Alerta: justo después del `<div className="mb-4 flex flex-wrap items-start justify-between gap-3">…</div>` del encabezado, agregar:
   ```tsx
         {verHistoria && alerta?.alergias && (
           <p role="alert" className="mb-4 rounded-lg border border-danger bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
             ⚠ Alergias{alerta.detalle ? `: ${alerta.detalle}` : ' (ver historia clínica)'}
           </p>
         )}
   ```
7. Sección: justo antes de `<SeccionTarjeta pacienteId={params.id} />`, agregar `{verHistoria && <SeccionHistoria pacienteId={params.id} onAlerta={alAlerta} />}`.

- [ ] **Step 4: Verificar tipos y lint**

Run: `cd staff && npx tsc --noEmit && npx eslint "src/app/pacientes/[id]/SeccionHistoria.tsx"`
Expected: sin errores. `SeccionHistoria` tiene el mismo patrón de "cargar en useEffect" que `SeccionTarjeta`. Si el lint marca `react-hooks/set-state-in-effect` por `cargar()` en el efecto, se acepta igual que en los archivos vecinos.

- [ ] **Step 5: Commit**

```bash
git add staff/src/lib/api.js "staff/src/app/pacientes/[id]/page.tsx" "staff/src/app/pacientes/[id]/SeccionHistoria.tsx"
git commit -m "feat(panel): datos personales, alerta de alergias y lista de evaluaciones"
```

---

### Task 9: Panel — editor de la evaluación

**Files:**
- Create: `staff/src/app/pacientes/[id]/historia/[historiaId]/page.tsx`
- Create: `staff/src/app/pacientes/[id]/historia/[historiaId]/CampoHistoria.tsx`
- Create: `staff/src/app/pacientes/[id]/historia/[historiaId]/TablaTratamientos.tsx`

**Interfaces:**
- Consume la definición de `GET /staff/historia-clinica/definicion` (Task 3) y la evaluación con `tratamientos` (Task 4).
- `ArchivoPrivado` (`staff/src/app/agenda/ArchivoPrivado.tsx`, props `{ ruta, alt }`) muestra el documento firmado con `ruta = /staff/historias/:id/documento-firmado`.
- `api.getProfesionalesStaff()` lista a los especialistas (`{ id, nombre }[]`).

- [ ] **Step 1: `CampoHistoria.tsx`**

```tsx
'use client';

export type Opcion = { clave: string; etiqueta: string };
export type Campo = {
  clave: string;
  etiqueta: string;
  tipo: 'check' | 'texto' | 'parrafo' | 'opcion';
  opciones?: Opcion[];
  detalles?: Opcion[];
};
export type Grupo = { titulo: string; subtitulo?: string; campos: Campo[] };
export type Valores = Record<string, string | boolean>;

// Un grupo de la definición: casillas (con sus detalles cuando están marcadas),
// opciones como botones, y textos.
export default function CampoHistoria({ grupo, valores, onCambio }: { grupo: Grupo; valores: Valores; onCambio: (clave: string, valor: string | boolean) => void }) {
  const checks = grupo.campos.filter((c) => c.tipo === 'check');
  const otros = grupo.campos.filter((c) => c.tipo !== 'check');

  return (
    <fieldset className="mb-4">
      <legend className="mb-2 text-sm font-semibold">
        {grupo.titulo}
        {grupo.subtitulo && <span className="ml-1 font-normal text-muted-foreground">{grupo.subtitulo}</span>}
      </legend>

      {checks.length > 0 && (
        <div className="mb-2 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {checks.map((c) => {
            const marcado = valores[c.clave] === true;
            return (
              <div key={c.clave}>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={marcado} onChange={(e) => onCambio(c.clave, e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
                  {c.etiqueta}
                </label>
                {marcado && (c.detalles || []).map((d) => (
                  <input
                    key={d.clave}
                    value={String(valores[`${c.clave}_${d.clave}`] ?? '')}
                    onChange={(e) => onCambio(`${c.clave}_${d.clave}`, e.target.value)}
                    placeholder={d.etiqueta}
                    aria-label={`${c.etiqueta}: ${d.etiqueta}`}
                    maxLength={500}
                    className="ml-6 mt-1 block w-[calc(100%-1.5rem)] rounded border border-border px-2 py-1 text-xs"
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {otros.map((c) => {
        if (c.tipo === 'opcion') {
          const actual = valores[c.clave];
          return (
            <div key={c.clave} className="mb-2">
              <p className="mb-1 text-xs text-muted-foreground">{c.etiqueta}</p>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={c.etiqueta}>
                {(c.opciones || []).map((op) => (
                  <button
                    key={op.clave}
                    type="button"
                    role="radio"
                    aria-checked={actual === op.clave}
                    onClick={() => onCambio(c.clave, actual === op.clave ? '' : op.clave)}
                    className={`rounded-full border px-3 py-1 text-xs ${actual === op.clave ? 'border-accent bg-accent text-accent-foreground' : 'border-border hover:bg-accent-soft'}`}
                  >
                    {op.etiqueta}
                  </button>
                ))}
              </div>
            </div>
          );
        }
        const largo = c.tipo === 'parrafo';
        return (
          <label key={c.clave} className="mb-2 block text-xs text-muted-foreground">
            {c.etiqueta}
            {largo ? (
              <textarea
                value={String(valores[c.clave] ?? '')}
                onChange={(e) => onCambio(c.clave, e.target.value)}
                rows={2}
                maxLength={4000}
                className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground"
              />
            ) : (
              <input
                value={String(valores[c.clave] ?? '')}
                onChange={(e) => onCambio(c.clave, e.target.value)}
                maxLength={500}
                className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground"
              />
            )}
          </label>
        );
      })}
    </fieldset>
  );
}
```

- [ ] **Step 2: `TablaTratamientos.tsx`**

```tsx
'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

export type FilaTratamiento = {
  tipo: 'cita' | 'manual';
  fecha: string;
  procedimiento: string;
  observacion: string | null;
  citaId: number | null;
  notaId: number | null;
  faltaObservacion: boolean;
};

function fmtFecha(fecha: string) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

// "Tratamiento estético realizado": sesiones atendidas (con su observación) y
// filas manuales. Escribir una observación o agregar una fila guarda de inmediato.
export default function TablaTratamientos({ pacienteId, filas, desde, onCambio }: { pacienteId: string; filas: FilaTratamiento[]; desde: string; onCambio: () => void }) {
  const [observando, setObservando] = useState<number | null>(null);
  const [texto, setTexto] = useState('');
  const [manual, setManual] = useState<{ fecha: string; procedimiento: string; observacion: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function guardarObservacion(fila: FilaTratamiento, e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setError(null);
    try {
      await api.crearTratamiento(pacienteId, { citaId: fila.citaId, titulo: fila.procedimiento, notas: texto.trim() });
      setObservando(null);
      setTexto('');
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la observación');
    }
  }

  async function guardarManual(e: FormEvent) {
    e.preventDefault();
    if (!manual || !manual.procedimiento.trim() || !manual.observacion.trim()) return;
    setError(null);
    try {
      await api.crearTratamiento(pacienteId, { fecha: manual.fecha, titulo: manual.procedimiento.trim(), notas: manual.observacion.trim() });
      setManual(null);
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar la fila');
    }
  }

  return (
    <div>
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-background text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Procedimiento</th>
              <th className="px-3 py-2">Observación / evaluación</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr><td colSpan={3} className="px-3 py-3 text-muted-foreground">Sin sesiones desde esta evaluación.</td></tr>
            )}
            {filas.map((f) => (
              <tr key={`${f.tipo}-${f.citaId ?? f.notaId}`} className="border-t border-border align-top">
                <td className="whitespace-nowrap px-3 py-2">{fmtFecha(f.fecha)}</td>
                <td className="px-3 py-2">{f.procedimiento}{f.tipo === 'manual' && <span className="ml-1 text-xs text-muted-foreground">(manual)</span>}</td>
                <td className="px-3 py-2">
                  {!f.faltaObservacion && <span className="whitespace-pre-line">{f.observacion}</span>}
                  {f.faltaObservacion && observando !== f.citaId && (
                    <button type="button" onClick={() => { setObservando(f.citaId); setTexto(''); }} className="text-xs font-medium text-danger hover:underline">
                      Falta observación — escribir
                    </button>
                  )}
                  {f.faltaObservacion && observando === f.citaId && (
                    <form onSubmit={(e) => guardarObservacion(f, e)} className="flex flex-col gap-1.5">
                      <textarea autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} aria-label="Observación de la sesión" className="rounded border border-border px-2 py-1 text-sm" />
                      <div className="flex gap-2">
                        <button type="submit" className="rounded bg-accent px-2.5 py-1 text-xs text-accent-foreground">Guardar</button>
                        <button type="button" onClick={() => setObservando(null)} className="rounded border border-border px-2.5 py-1 text-xs">Cancelar</button>
                      </div>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {manual ? (
        <form onSubmit={guardarManual} className="mt-2 grid grid-cols-1 gap-2 rounded border border-accent p-3 sm:grid-cols-[140px_1fr_2fr_auto]">
          <input type="date" required value={manual.fecha} min={desde} onChange={(e) => setManual({ ...manual, fecha: e.target.value })} aria-label="Fecha" className="rounded border border-border px-2 py-1 text-sm" />
          <input required value={manual.procedimiento} onChange={(e) => setManual({ ...manual, procedimiento: e.target.value })} placeholder="Procedimiento" className="rounded border border-border px-2 py-1 text-sm" />
          <input required value={manual.observacion} onChange={(e) => setManual({ ...manual, observacion: e.target.value })} placeholder="Observación" className="rounded border border-border px-2 py-1 text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="rounded bg-accent px-2.5 py-1 text-xs text-accent-foreground">Agregar</button>
            <button type="button" onClick={() => setManual(null)} className="rounded border border-border px-2.5 py-1 text-xs">Cancelar</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setManual({ fecha: desde, procedimiento: '', observacion: '' })} className="mt-2 rounded border border-border px-3 py-1.5 text-xs hover:bg-accent-soft">
          + Agregar fila manual
        </button>
      )}
    </div>
  );
}
```

**Nota:** una fila manual con una fecha anterior a `desde` no aparecería en esta evaluación. Por eso el input tiene `min={desde}`.

- [ ] **Step 3: `page.tsx` del editor**

```tsx
'use client';

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { IconArrowLeft } from '@/components/icons';
import ArchivoPrivado from '@/app/agenda/ArchivoPrivado';
import CampoHistoria, { type Grupo, type Valores } from './CampoHistoria';
import TablaTratamientos, { type FilaTratamiento } from './TablaTratamientos';

type Seccion = { clave: 'datos_clinicos' | 'datos_esteticos' | 'analisis_estetico'; titulo: string; grupos: Grupo[] };
type FilaProtocolo = { procedimiento: string; sesiones: string; comentario: string };
type Historia = {
  id: number;
  fecha: string;
  motivo_consulta: string | null;
  datos_clinicos: Valores;
  datos_esteticos: Valores;
  analisis_estetico: Valores;
  diagnostico: string | null;
  protocolo: FilaProtocolo[];
  procedimiento_autorizado: string | null;
  profesional_id: number | null;
  documento_firmado: string | null;
  updated_at?: string;
  updatedAt?: string;
  ActualizadoPor?: { nombre: string } | null;
  Paciente: { nombre_completo: string; codigo_paciente: string; carnet_identidad: string; carnet_expedido: string; fecha_nacimiento: string | null; telefono: string };
  tratamientos: { desde: string; hasta: string | null; filas: FilaTratamiento[] };
};

const CAMPOS_GUARDABLES = ['fecha', 'motivo_consulta', 'datos_clinicos', 'datos_esteticos', 'analisis_estetico', 'diagnostico', 'protocolo', 'procedimiento_autorizado', 'profesional_id'] as const;

export default function EditorHistoria() {
  const params = useParams<{ id: string; historiaId: string }>();
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [historia, setHistoria] = useState<Historia | null>(null);
  const [profesionales, setProfesionales] = useState<{ id: number; nombre: string }[]>([]);
  const [sucio, setSucio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputFirmado = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    const [def, h, pros] = await Promise.all([api.getDefinicionHistoria(), api.getHistoria(params.historiaId), api.getProfesionalesStaff()]);
    setSecciones(def.secciones);
    setHistoria(h);
    setProfesionales(pros);
  }, [params.historiaId]);

  useEffect(() => {
    cargar().catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la evaluación'));
  }, [cargar]);

  // Recarga solo la tabla de tratamientos sin perder lo que se está editando.
  async function recargarTratamientos() {
    const h = await api.getHistoria(params.historiaId);
    setHistoria((actual) => (actual ? { ...actual, tratamientos: h.tratamientos } : h));
  }

  useEffect(() => {
    if (!sucio) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [sucio]);

  function cambiar<K extends keyof Historia>(campo: K, valor: Historia[K]) {
    setHistoria((h) => (h ? { ...h, [campo]: valor } : h));
    setSucio(true);
    setAviso(null);
  }

  function cambiarEnSeccion(seccion: Seccion['clave'], clave: string, valor: string | boolean) {
    setHistoria((h) => (h ? { ...h, [seccion]: { ...h[seccion], [clave]: valor } } : h));
    setSucio(true);
    setAviso(null);
  }

  async function guardar() {
    if (!historia) return;
    setGuardando(true);
    setError(null);
    try {
      const datos = Object.fromEntries(CAMPOS_GUARDABLES.map((c) => [c, historia[c]]));
      const guardada = await api.guardarHistoria(historia.id, datos);
      setHistoria((h) => (h ? { ...guardada, tratamientos: h.tratamientos } : guardada));
      setSucio(false);
      setAviso('Cambios guardados.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function subirFirmado(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo || !historia) return;
    setError(null);
    try {
      const h = await api.subirDocumentoFirmado(historia.id, archivo);
      setHistoria((actual) => (actual ? { ...actual, documento_firmado: h.documento_firmado } : actual));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el documento');
    } finally {
      if (inputFirmado.current) inputFirmado.current.value = '';
    }
  }

  async function quitarFirmado() {
    if (!historia || !window.confirm('¿Quitar el documento firmado de esta evaluación?')) return;
    const h = await api.quitarDocumentoFirmado(historia.id);
    setHistoria((actual) => (actual ? { ...actual, documento_firmado: h.documento_firmado } : actual));
  }

  function cambiarProtocolo(i: number, campo: keyof FilaProtocolo, valor: string) {
    if (!historia) return;
    cambiar('protocolo', historia.protocolo.map((f, j) => (j === i ? { ...f, [campo]: valor } : f)));
  }

  if (error && !historia) return <p className="text-sm text-danger">{error}</p>;
  if (!historia) return <p className="text-sm text-foreground/70">Cargando…</p>;

  const p = historia.Paciente;

  return (
    <div className="pb-10">
      <Link href={`/pacientes/${params.id}`} className="mb-3 inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground">
        <IconArrowLeft className="h-4 w-4" />
        Volver a la ficha
      </Link>

      <div className="sticky top-16 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-3 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:bg-panel">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Historia clínica · {p.nombre_completo}</p>
          <p className="text-xs text-muted-foreground">
            N° {p.codigo_paciente}
            {historia.ActualizadoPor ? ` · Última edición: ${historia.ActualizadoPor.nombre}` : ''}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {sucio && <span className="text-xs text-stat-amber">Tienes cambios sin guardar</span>}
          {aviso && !sucio && <span className="text-xs text-stat-green">{aviso}</span>}
          <button onClick={() => api.descargarHistoriaPdf(historia.id)} disabled={sucio} title={sucio ? 'Guarda primero' : undefined} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-50">PDF</button>
          <button onClick={() => api.descargarHistoriaWord(historia.id)} disabled={sucio} title={sucio ? 'Guarda primero' : undefined} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-50">Word</button>
          <button onClick={guardar} disabled={guardando || !sucio} className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-60">
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="flex flex-col gap-3">
        <details open className="rounded-lg border border-border bg-panel p-4">
          <summary className="cursor-pointer text-base font-semibold">1. Datos personales</summary>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <p><span className="text-muted-foreground">Nombre:</span> {p.nombre_completo}</p>
            <p><span className="text-muted-foreground">C.I.:</span> {p.carnet_identidad} {p.carnet_expedido}</p>
            <p><span className="text-muted-foreground">Teléfono:</span> {p.telefono}</p>
            <p><span className="text-muted-foreground">Nacimiento:</span> {p.fecha_nacimiento ?? '—'}</p>
          </div>
          <Link href={`/pacientes/${params.id}`} className="mt-2 inline-block text-xs text-accent hover:underline">Editar datos personales en la ficha</Link>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
            <label className="text-xs text-muted-foreground">
              Fecha de la evaluación
              <input type="date" value={historia.fecha} onChange={(e) => cambiar('fecha', e.target.value)} className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground" />
            </label>
            <label className="text-xs text-muted-foreground">
              Motivo de la consulta
              <textarea value={historia.motivo_consulta ?? ''} onChange={(e) => cambiar('motivo_consulta', e.target.value)} rows={2} maxLength={4000} className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground" />
            </label>
          </div>
        </details>

        {secciones.map((s) => (
          <details key={s.clave} className="rounded-lg border border-border bg-panel p-4">
            <summary className="cursor-pointer text-base font-semibold">{s.titulo}</summary>
            <div className="mt-3">
              {s.grupos.map((g) => (
                <CampoHistoria key={g.titulo} grupo={g} valores={historia[s.clave] || {}} onCambio={(clave, valor) => cambiarEnSeccion(s.clave, clave, valor)} />
              ))}
            </div>
          </details>
        ))}

        <details className="rounded-lg border border-border bg-panel p-4">
          <summary className="cursor-pointer text-base font-semibold">5. Diagnóstico y tratamiento estético</summary>
          <label className="mt-3 block text-xs text-muted-foreground">
            Diagnóstico
            <textarea value={historia.diagnostico ?? ''} onChange={(e) => cambiar('diagnostico', e.target.value)} rows={3} maxLength={4000} className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground" />
          </label>

          <p className="mb-1 mt-4 text-sm font-semibold">Protocolo estético seleccionado</p>
          <div className="flex flex-col gap-2">
            {historia.protocolo.map((f, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_100px_2fr_auto]">
                <input value={f.procedimiento} onChange={(e) => cambiarProtocolo(i, 'procedimiento', e.target.value)} placeholder="Procedimiento" aria-label="Procedimiento" maxLength={500} className="rounded border border-border px-2 py-1 text-sm" />
                <input value={f.sesiones} onChange={(e) => cambiarProtocolo(i, 'sesiones', e.target.value)} placeholder="Sesiones" aria-label="Sesiones" maxLength={500} className="rounded border border-border px-2 py-1 text-sm" />
                <input value={f.comentario} onChange={(e) => cambiarProtocolo(i, 'comentario', e.target.value)} placeholder="Comentario" aria-label="Comentario" maxLength={500} className="rounded border border-border px-2 py-1 text-sm" />
                <button type="button" onClick={() => cambiar('protocolo', historia.protocolo.filter((_, j) => j !== i))} aria-label="Quitar fila" className="rounded border border-border px-2 text-xs text-danger hover:bg-accent-soft">✕</button>
              </div>
            ))}
            {historia.protocolo.length < 20 && (
              <button type="button" onClick={() => cambiar('protocolo', [...historia.protocolo, { procedimiento: '', sesiones: '', comentario: '' }])} className="w-fit rounded border border-border px-3 py-1.5 text-xs hover:bg-accent-soft">
                + Agregar procedimiento
              </button>
            )}
          </div>

          <p className="mb-1 mt-4 text-sm font-semibold">Tratamiento estético realizado</p>
          <TablaTratamientos pacienteId={params.id} filas={historia.tratamientos.filas} desde={historia.tratamientos.desde} onCambio={recargarTratamientos} />
        </details>

        <details className="rounded-lg border border-border bg-panel p-4">
          <summary className="cursor-pointer text-base font-semibold">6. Compromiso legal</summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs text-muted-foreground">
              Especialista
              <select value={historia.profesional_id ?? ''} onChange={(e) => cambiar('profesional_id', e.target.value ? Number(e.target.value) : null)} className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground">
                <option value="">—</option>
                {profesionales.map((pr) => <option key={pr.id} value={pr.id}>{pr.nombre}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Procedimiento que se autoriza
              <input value={historia.procedimiento_autorizado ?? ''} onChange={(e) => cambiar('procedimiento_autorizado', e.target.value)} placeholder={historia.protocolo[0]?.procedimiento || ''} maxLength={255} className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground" />
            </label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Descarga el PDF o el Word, imprímelo y fírmenlo. Después sube aquí la foto o el escaneo firmado.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input ref={inputFirmado} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={subirFirmado} className="hidden" />
            <button type="button" onClick={() => inputFirmado.current?.click()} className="rounded border border-border px-3 py-1.5 text-xs hover:bg-accent-soft">
              {historia.documento_firmado ? 'Reemplazar documento firmado' : 'Subir documento firmado'}
            </button>
            {historia.documento_firmado && (
              <button type="button" onClick={quitarFirmado} className="rounded border border-border px-3 py-1.5 text-xs text-danger hover:bg-accent-soft">Quitar</button>
            )}
          </div>
          {historia.documento_firmado && (
            <div className="mt-3">
              <ArchivoPrivado key={historia.documento_firmado} ruta={`/staff/historias/${historia.id}/documento-firmado`} alt="Documento firmado" />
            </div>
          )}
        </details>
      </div>
    </div>
  );
}
```

`top-16` es el alto del `Topbar` (`h-16`). La barra de guardar queda pegada debajo de él.

- [ ] **Step 4: Verificar tipos y lint**

Run: `cd staff && npx tsc --noEmit && npx eslint "src/app/pacientes/[id]/historia"`
Expected: sin errores de tipos. En lint, a lo sumo el `set-state-in-effect` de los archivos vecinos.

- [ ] **Step 5: Prueba en el navegador**

Antes de la prueba:
- La base de desarrollo `bd_novaged` debe tener las migraciones de Task 2. Primero hacer un respaldo con `mysqldump -u root bd_novaged > $SCRATCH/bd_novaged-antes-historia.sql`, y después `cd backend && npx sequelize-cli db:migrate`.
- El usuario debe **volver a iniciar sesión**: el permiso nuevo va en el token.

Con el sistema encendido (API en 4000, panel en 3002), revisar en http://localhost:3002/pacientes/<id> de una paciente de prueba:
1. Llenar sexo y dirección, guardar y recargar: los datos siguen ahí.
2. "Nueva evaluación" abre el editor.
3. Marcar Alergias más Especificar, Tabaco más frecuencia, fototipo III y un protocolo de una fila. Guardar.
4. Volver a la ficha: aparece la alerta roja con el detalle.
5. Completar una cita de esa paciente. En la tabla de tratamientos aparece "Falta observación"; escribirla.
6. Agregar una fila manual.
7. Descargar el PDF y el Word, y abrirlos. Revisar el logo, las casillas marcadas, las tablas y el compromiso con nombre, C.I., especialista y clínica.
8. Subir una imagen como documento firmado: se ve y aparece "✓ Firmada" en la lista.
9. "Nueva evaluación" copia los datos clínicos. La tabla de tratamientos de la primera evaluación ya no incluye las sesiones desde hoy.
10. En un ancho de 390 px no hay desborde horizontal.

Al terminar, borrar la paciente de prueba y sus datos, y borrar los archivos de `.playwright-mcp/`.

- [ ] **Step 6: Commit**

```bash
git add "staff/src/app/pacientes/[id]/historia"
git commit -m "feat(panel): editor de la historia clínica con descargas y documento firmado"
```

---

## Notas para el despliegue (no son una tarea)

- Antes de `./deploy.sh`, hacer el respaldo de la base de producción, como siempre.
- Las migraciones `20261014000000` y `20261014000100` corren solas al arrancar el contenedor `api`.
- Después del deploy, **todo el personal debe cerrar sesión y volver a entrar** para recibir el permiso `historia_clinica`, que va en el token.
