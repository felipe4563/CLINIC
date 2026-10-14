# Historia clínica — ajustes de la clínica — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar al formulario de historia clínica los cambios pedidos por la doctora (antecedentes, fórmula obstétrica, alimentación, skin care, antecedentes estéticos, guías de rostro y cuerpo), agregar fotos de la paciente y consentimientos por procedimiento, en panel, PDF y Word.

**Architecture:** La definición única `backend/src/config/historiaClinica.js` gana dos tipos de campo (`numero`, `fecha`) y grupos con `imagen`; `armarDocumento` produce bloques nuevos (`imagen`, `fotos`, `consentimiento`) que dibujan los renderizadores PDF (pdfkit) y Word (docx). Fotos y consentimientos marcados son dos columnas JSON nuevas en `historias_clinicas`; las fotos son archivos privados en una carpeta nueva de `archivosPrivados`. El panel reduce cada foto en el navegador antes de subirla.

**Tech Stack:** Express 5 + Sequelize (MariaDB local / MySQL prod), Jest + supertest, pdfkit 0.20, docx 9, Next.js (panel staff) con TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-14-historia-clinica-ajustes-design.md` (base: `docs/superpowers/specs/2026-10-12-historia-clinica-design.md`).

## Global Constraints

- No hay historias reales en producción: claves que salen de la definición simplemente se ignoran (no hay migración de datos JSON).
- Migraciones con el patrón del repo; columnas JSON sin `DEFAULT` en la base (el modelo pone el valor). Toda migración se refleja a mano en `backend/sql/produccion.sql` (archivo git-ignorado; **nunca se ejecuta** ese archivo).
- Base local de desarrollo: `bd_novaged` (XAMPP). Tests: `novaged_test` (sync force). Nunca tocar otra base.
- No escribir archivos temporales dentro de `backend/` (nodemon reinicia): usar el scratchpad de la sesión.
- Fotos: solo JPEG o PNG por firma de bytes, ≤ 5 MB, máximo 10 por evaluación, nota ≤ 120 caracteres. Archivos privados, nunca bajo `/uploads`.
- Guías: `backend/assets/historia/guia-tipos-faciales.png` y `guia-grasa-corporal.png`, servidas sin sesión en `/assets/historia/<archivo>` (no tienen datos de pacientes).
- Textos de interfaz en español. Fecha "Emitido" en zona `America/La_Paz`.
- Sin dependencias nuevas.
- Rama `feat/historia-ajustes`; commits en la rama, **nunca push**. No ejecutar `backend/sql/produccion.sql`.

## Review Focus

1. **Foto de otra historia o nombre manipulado** (`GET /staff/historias/2/fotos/<archivo-de-la-1>`, `../../.env`): 404, nunca el archivo. Test en Task 3.
2. **Borrar evaluación o paciente con fotos**: los archivos desaparecen del disco. Test en Task 3.
3. **Copiar evaluación**: no copia fotos ni consentimientos (si copiara, borrar una evaluación borraría las fotos de la otra). Test en Task 2 y Task 3.
4. **Número o fecha inválidos desde el panel** (`gestas: "abc"`, `-1`, `100`, `fum: "2026-02-30"`): 400 con `campo`. Test en Task 1.
5. **Guía o foto que falta en disco al generar PDF/Word**: el documento se genera igual, sin esa imagen. Test en Task 5.

---

## Mapa de archivos

| Archivo | Cambio |
|---|---|
| `backend/assets/historia/*.png` | Guías de la clínica (nuevas) |
| `backend/src/app.js` | Servir `/assets/historia` |
| `backend/src/config/historiaClinica.js` | Formulario nuevo; tipos `numero`, `fecha`; grupos con `imagen` |
| `backend/src/config/consentimientos.js` | Nuevo: lista de consentimientos (hoy solo `general`) |
| `backend/src/services/historiaClinica.js` | Validación `numero`/`fecha`; `fechaValida`; `validarConsentimientos` |
| `backend/src/migrations/20261014000200-historia-fotos-consentimientos.js` | Columnas `fotos`, `consentimientos` |
| `backend/src/models/historiaClinica.js` | Campos `fotos`, `consentimientos` |
| `backend/src/services/archivosPrivados.js` | Carpeta `historias-fotos`; `recibirImagen` (solo JPEG/PNG) |
| `backend/src/routes/staffHistoriaClinica.js` | Consentimientos en PUT, copia sin fotos; rutas de fotos; borrar fotos al borrar |
| `backend/src/routes/staffPacientes.js` | Borrar fotos al borrar paciente |
| `backend/src/services/historiaClinicaDocumento.js` | Bloques nuevos, "Emitido", sección 5 y 6 |
| `backend/src/services/historiaClinicaPdf.js`, `historiaClinicaWord.js` | Dibujar `imagen`, `fotos`, `consentimiento`, encabezado con "Emitido" |
| `backend/test/helpers/archivos.js` | `pngReal()`, `jpgFalso()` |
| `backend/test/historiaClinica.test.js` | Tests nuevos y ajustados |
| `staff/src/lib/api.js` | Métodos de fotos |
| `staff/src/app/pacientes/[id]/historia/[historiaId]/CampoHistoria.tsx` | `numero`, `fecha`, imagen del grupo |
| `staff/src/app/pacientes/[id]/historia/[historiaId]/FotosHistoria.tsx` | Nuevo: subir/ver/nota/borrar fotos |
| `staff/src/app/pacientes/[id]/historia/[historiaId]/page.tsx` | Sección 5 "Diagnóstico" + fotos; sección 6 "Consentimiento" |

---

### Task 1: Formulario nuevo y tipos `numero` / `fecha`

**Files:**
- Create: `backend/assets/historia/guia-tipos-faciales.png`, `backend/assets/historia/guia-grasa-corporal.png`
- Modify: `backend/src/config/historiaClinica.js`, `backend/src/services/historiaClinica.js`, `backend/src/routes/staffHistoriaClinica.js` (solo importar `fechaValida` del servicio), `backend/src/app.js`
- Test: `backend/test/historiaClinica.test.js`

**Interfaces:**
- Produces: tipos de campo `'numero'` (se guarda como entero 0–99) y `'fecha'` (`YYYY-MM-DD`); grupos con propiedad opcional `imagen: string` (nombre de archivo en `backend/assets/historia/`); `fechaValida(texto): boolean` exportada por `services/historiaClinica.js`; constante `DIR_GUIAS` exportada por `config/historiaClinica.js` (ruta absoluta a `backend/assets/historia`); ruta pública `GET /assets/historia/<archivo>`.

- [ ] **Step 1: Rama y guías**

```bash
cd D:/TODO/SISTEMAS/SIS-CLINICA-NOVAGED
git checkout -b feat/historia-ajustes
mkdir -p backend/assets/historia
cp "C:/Users/ASUS/AppData/Local/Temp/claude/d--TODO-SISTEMAS-SIS-CLINICA-NOVAGED/61204f06-f7f7-46a6-b7bc-e12f7c5ace80/images/21.png" backend/assets/historia/guia-tipos-faciales.png
cp "C:/Users/ASUS/AppData/Local/Temp/claude/d--TODO-SISTEMAS-SIS-CLINICA-NOVAGED/61204f06-f7f7-46a6-b7bc-e12f7c5ace80/images/22.png" backend/assets/historia/guia-grasa-corporal.png
file backend/assets/historia/*.png
```
Esperado: dos "PNG image data". (`.dockerignore` no excluye `assets/`, así que entran en la imagen Docker.)

- [ ] **Step 2: Tests que fallan.** En `backend/test/historiaClinica.test.js`, dentro de `describe('Historia clínica: definición y validación'`:

  - En el primer test, cambiar la lista de tipos permitidos a `['check', 'texto', 'parrafo', 'opcion', 'numero', 'fecha']` y agregar al final del `for (const seccion …)`:

```js
      for (const grupo of seccion.grupos) {
        if (grupo.imagen) expect(fs.existsSync(path.join(DIR_GUIAS, grupo.imagen))).toBe(true);
      }
```
  y cambiar el import: `const { SECCIONES, COLUMNAS_PROTOCOLO, DIR_GUIAS } = require('../src/config/historiaClinica');`

  - Reemplazar el test 'descarta claves desconocidas y vacías, y recorta textos' por:

```js
  test('descarta claves desconocidas (incluidas las que se quitaron del formulario) y recorta textos', () => {
    const limpio = validarSeccion('datos_clinicos', {
      alergias: true,
      cardiovascular: false,
      tabaco: true,
      tabaco_frecuencia: '  diario  ',
      especificar: '',
      inventado: 'x',
      dieta: 'vegana',
      esterilizacion: true,
      menstruacion_dolorosa: true,
      agua: '  2 litros ',
    });
    expect(limpio).toEqual({ alergias: true, cardiovascular: false, tabaco: true, tabaco_frecuencia: 'diario', agua: '2 litros' });
  });

  test('números de la fórmula obstétrica: enteros 0–99, también si llegan como texto', () => {
    expect(validarSeccion('datos_clinicos', { gestas: 2, partos: '1', cesareas: '', abortos: 0 })).toEqual({ gestas: 2, partos: 1, abortos: 0 });
    for (const malo of ['abc', -1, 100, 1.5, true]) {
      try {
        validarSeccion('datos_clinicos', { gestas: malo });
        throw new Error(`aceptó ${malo}`);
      } catch (err) {
        expect(err).toBeInstanceOf(ErrorValidacion);
        expect(err.campo).toBe('gestas');
      }
    }
  });

  test('FUM: fecha YYYY-MM-DD real', () => {
    expect(validarSeccion('datos_clinicos', { fum: '2026-09-30' })).toEqual({ fum: '2026-09-30' });
    expect(validarSeccion('datos_clinicos', { fum: '' })).toEqual({});
    for (const malo of ['2026-02-30', '30/09/2026', 5]) {
      expect(() => validarSeccion('datos_clinicos', { fum: malo })).toThrow(ErrorValidacion);
    }
  });

  test('el formulario tiene los grupos pedidos por la clínica', () => {
    const titulos = (clave) => SECCIONES.find((s) => s.clave === clave).grupos.map((g) => g.titulo);
    expect(titulos('datos_clinicos')).toEqual([
      'Antecedentes personales patológicos',
      'Antecedentes personales no patológicos',
      'Antecedentes ginecológicos',
      'Fórmula obstétrica',
      'Hábitos de vida',
      'Alimentación',
    ]);
    expect(titulos('datos_esteticos')).toEqual(['Rutina facial (skin care)', 'Mascarillas y exfoliantes', 'Antecedentes estéticos']);
    expect(titulos('analisis_estetico').slice(-2)).toEqual(['Tipo facial', 'Ubicación de grasa corporal']);
  });
```
  Agregar `const fs = require('fs');` y `const path = require('path');` ya están arriba del archivo (verificar).

  - En el test de la API que guarda secciones (buscar `dieta` en el archivo con `grep -n "dieta\|diurna_\|nocturna_\|menstruacion_regular\|esterilizacion\|parto_natural" backend/test/historiaClinica.test.js`), cambiar cualquier clave quitada por una existente del formulario nuevo (`dieta: 'vegana'` → `agua: '2 litros'`; `diurna_limpiador` → `skin_limpiador`; etc.) para que los tests de API sigan probando lo mismo.

- [ ] **Step 3: Correr y ver fallar** — `cd backend && npx jest test/historiaClinica.test.js -t "definición y validación"`. Esperado: FAIL (`DIR_GUIAS` indefinido, grupos distintos, `numero`/`fecha` desconocidos).

- [ ] **Step 4: Definición.** En `backend/src/config/historiaClinica.js`:
  - Arriba: `const path = require('path');` y después de `opcion`:

```js
const numero = (clave, etiqueta) => ({ clave, etiqueta, tipo: 'numero' });
const fecha = (clave, etiqueta) => ({ clave, etiqueta, tipo: 'fecha' });
const TIPO_TIEMPO = [o('tipo', 'Tipo'), o('tiempo', 'Tiempo')];
// Guías de referencia que envió la clínica (sin datos de pacientes).
const DIR_GUIAS = path.join(__dirname, '..', '..', 'assets', 'historia');
```
  - Actualizar el comentario de tipos de campo agregando:

```js
//   numero  -> entero 0 a 99 (fórmula obstétrica)
//   fecha   -> YYYY-MM-DD
// Un grupo puede tener `imagen`: archivo de DIR_GUIAS que se muestra arriba
// de sus campos en el panel, el PDF y el Word.
```
  - Sección `datos_clinicos`: dejar el grupo 'Antecedentes personales patológicos' tal cual y reemplazar los grupos 'Antecedentes ginecológicos' y 'Hábitos de vida' por:

```js
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
```
  - Sección `datos_esteticos`: reemplazar sus grupos por:

```js
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
```
  - Sección `analisis_estetico`: al final de `grupos`, después de 'Acné', agregar:

```js
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
```
  - `module.exports = { SECCIONES, COLUMNAS_PROTOCOLO, DIR_GUIAS };`

- [ ] **Step 5: Validación.** En `backend/src/services/historiaClinica.js`:
  - `CAMPOS_POR_SECCION` no cambia (ya guarda `tipo`).
  - Agregar antes de `validarSeccion`:

```js
function fechaValida(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [a, m, d] = texto.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}
```
  - En `validarSeccion`, antes del `else { final = limpiarTexto(…) }`, agregar:

```js
    } else if (campo.tipo === 'numero') {
      if (valor === null || valor === undefined || valor === '') continue;
      const n = typeof valor === 'string' ? Number(valor.trim()) : valor;
      if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 99) {
        throw new ErrorValidacion(clave, `${clave} debe ser un número entero entre 0 y 99`);
      }
      final = n;
    } else if (campo.tipo === 'fecha') {
      if (valor === null || valor === undefined || valor === '') continue;
      if (!fechaValida(valor)) throw new ErrorValidacion(clave, `${clave} debe ser una fecha válida`);
      final = valor;
```
  - Exportar `fechaValida` en `module.exports`.
  - En `backend/src/routes/staffHistoriaClinica.js`: borrar la función local `fechaValida` e importarla del servicio (agregarla al `require('../services/historiaClinica')`). El uso `fechaValida(String(req.body.fecha))` queda igual.

- [ ] **Step 6: Servir las guías.** En `backend/src/app.js`, justo después de la línea `app.use('/uploads', express.static(…));`:

```js
// Guías de referencia de la historia clínica (sin datos de pacientes).
app.use('/assets/historia', express.static(path.join(__dirname, '..', 'assets', 'historia')));
```

- [ ] **Step 7: Correr** — `cd backend && npx jest test/historiaClinica.test.js`. Esperado: PASS todos (si algún test de API o de documento usaba claves quitadas, ajustarlo a las nuevas según Step 2). Luego `npm test` completo → PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/assets backend/src/config/historiaClinica.js backend/src/services/historiaClinica.js backend/src/routes/staffHistoriaClinica.js backend/src/app.js backend/test/historiaClinica.test.js docs/superpowers/specs/2026-10-14-historia-clinica-ajustes-design.md docs/superpowers/plans/2026-10-14-historia-clinica-ajustes.md
git commit -m "feat(historia): formulario según la clínica, números, FUM y guías de rostro y cuerpo"
```

---

### Task 2: Consentimientos y columnas nuevas

**Files:**
- Create: `backend/src/config/consentimientos.js`, `backend/src/migrations/20261014000200-historia-fotos-consentimientos.js`
- Modify: `backend/src/models/historiaClinica.js`, `backend/src/services/historiaClinica.js`, `backend/src/routes/staffHistoriaClinica.js`, `backend/sql/produccion.sql`
- Test: `backend/test/historiaClinica.test.js`

**Interfaces:**
- Consumes: `ErrorValidacion` (Task 1 sin cambios).
- Produces: `CONSENTIMIENTOS: { clave, titulo, texto }[]` (texto con marcadores `{paciente}`, `{ci}`, `{especialista}`, `{procedimiento}`, `{clinica}`); campos del modelo `fotos` (`[{ archivo: string, nota: string|null }]`) y `consentimientos` (`string[]`); `validarConsentimientos(valor): string[]`; `GET /staff/historia-clinica/definicion` devuelve también `consentimientos: [{ clave, titulo }]`.

- [ ] **Step 1: Tests que fallan.** En `describe('Historia clínica: API'`, agregar (usar los helpers y tokens que ya usan los demás tests del bloque; leer el `beforeAll` para sus nombres):

```js
  test('consentimientos: se guardan solo claves válidas, sin repetir', async () => {
    const h = await crearEvaluacion(); // usar el helper/patrón que ya crea evaluaciones en este describe
    const ok = await request(app).put(`/staff/historias/${h.id}`).set('Authorization', `Bearer ${tokenProfesional}`)
      .send({ consentimientos: ['general', 'general'] });
    expect(ok.status).toBe(200);
    expect(ok.body.consentimientos).toEqual(['general']);
    const malo = await request(app).put(`/staff/historias/${h.id}`).set('Authorization', `Bearer ${tokenProfesional}`)
      .send({ consentimientos: ['inventado'] });
    expect(malo.status).toBe(400);
    expect(malo.body.campo).toBe('consentimientos');
  });

  test('la definición incluye los consentimientos disponibles', async () => {
    const res = await request(app).get('/staff/historia-clinica/definicion').set('Authorization', `Bearer ${tokenProfesional}`);
    expect(res.body.consentimientos).toEqual([{ clave: 'general', titulo: 'Consentimiento general' }]);
  });

  test('copiar una evaluación no copia fotos ni consentimientos', async () => {
    const base = await crearEvaluacion();
    await base.reload();
    await db.HistoriaClinica.update({ fotos: [{ archivo: 'x.jpg', nota: null }], consentimientos: ['general'] }, { where: { id: base.id } });
    const res = await request(app).post(`/staff/pacientes/${base.paciente_id}/historias`).set('Authorization', `Bearer ${tokenProfesional}`)
      .send({ copiarDe: base.id });
    expect(res.status).toBe(201);
    expect(res.body.fotos).toEqual([]);
    expect(res.body.consentimientos).toEqual([]);
  });
```
  Si el bloque no tiene un helper `crearEvaluacion`, escribirlo arriba del primer test nuevo con el mismo `POST /staff/pacientes/:id/historias` que usan los tests existentes, devolviendo `db.HistoriaClinica.findByPk(res.body.id)`. Usar el nombre real de la variable de token del bloque (no inventar `tokenProfesional` si se llama distinto).

- [ ] **Step 2: Correr y ver fallar** — `npx jest test/historiaClinica.test.js -t "consentimientos|copiar"`. Esperado: FAIL.

- [ ] **Step 3: Configuración** — `backend/src/config/consentimientos.js`

```js
// Consentimientos que se imprimen en la sección 6 de la historia clínica.
// Para agregar los de cada procedimiento (los pasa la clínica) basta sumar
// entradas aquí. Marcadores: {paciente} {ci} {especialista} {procedimiento} {clinica}
// (vacíos -> línea para completar a mano).
const CONSENTIMIENTOS = [
  {
    clave: 'general',
    titulo: 'Consentimiento general',
    texto:
      'Yo {paciente} portador(a) de la C.I {ci} certifico que la información consignada en el presente documento es ' +
      'verdadera. Asimismo, autorizo al especialista {especialista} a realizar el siguiente procedimiento ' +
      '{procedimiento}. Conozco todos sus efectos y complicaciones, acepto las recomendaciones sugeridas y eximo de ' +
      'toda responsabilidad a {clinica} por cualquier alteración que se pueda presentar debido al tratamiento a realizar.',
  },
];

module.exports = { CONSENTIMIENTOS };
```

- [ ] **Step 4: Migración** — `backend/src/migrations/20261014000200-historia-fotos-consentimientos.js`

```js
'use strict';

// Fotos de la paciente (archivos privados) y consentimientos marcados de cada
// evaluación. JSON sin DEFAULT en la base (MySQL no lo permite): se agregan
// nulos, se rellenan y luego pasan a NOT NULL; el modelo pone [] al crear.
const COLUMNAS = ['fotos', 'consentimientos'];

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const columna of COLUMNAS) {
      await queryInterface.addColumn('historias_clinicas', columna, { type: Sequelize.JSON, allowNull: true });
      await queryInterface.sequelize.query(`UPDATE historias_clinicas SET \`${columna}\` = '[]' WHERE \`${columna}\` IS NULL`);
      await queryInterface.changeColumn('historias_clinicas', columna, { type: Sequelize.JSON, allowNull: false });
    }
  },

  async down(queryInterface) {
    for (const columna of COLUMNAS) await queryInterface.removeColumn('historias_clinicas', columna);
  },
};
```

- [ ] **Step 5: Modelo** — en `backend/src/models/historiaClinica.js`, después de `protocolo: jsonCampo('protocolo', []),`:

```js
  fotos: jsonCampo('fotos', []),
  consentimientos: jsonCampo('consentimientos', []),
```

- [ ] **Step 6: Validación** — en `backend/src/services/historiaClinica.js`: `const { CONSENTIMIENTOS } = require('../config/consentimientos');` y antes de `alertaAlergias`:

```js
function validarConsentimientos(valor) {
  if (valor === null || valor === undefined) return [];
  if (!Array.isArray(valor)) throw new ErrorValidacion('consentimientos', 'consentimientos debe ser una lista');
  const validas = new Set(CONSENTIMIENTOS.map((c) => c.clave));
  for (const clave of valor) {
    if (!validas.has(clave)) throw new ErrorValidacion('consentimientos', `Consentimiento desconocido: ${clave}`);
  }
  return [...new Set(valor)];
}
```
  Exportarla.

- [ ] **Step 7: Rutas** — en `backend/src/routes/staffHistoriaClinica.js`:
  - importar `validarConsentimientos` y `const { CONSENTIMIENTOS } = require('../config/consentimientos');`
  - definición: `res.json({ secciones: SECCIONES, columnasProtocolo: COLUMNAS_PROTOCOLO, consentimientos: CONSENTIMIENTOS.map(({ clave, titulo }) => ({ clave, titulo })) });`
  - en `POST /staff/pacientes/:id/historias` agregar a `create`: `fotos: [], consentimientos: [],` (explícito: la copia no los hereda).
  - en `PUT`, dentro del `try`, después del protocolo:

```js
    if (req.body.consentimientos !== undefined) historia.consentimientos = validarConsentimientos(req.body.consentimientos);
```

- [ ] **Step 8: Base local y produccion.sql**
  - `cd backend && npx sequelize-cli db:migrate` (usa `bd_novaged` del `.env`; confirmar en la salida que aplica `20261014000200-historia-fotos-consentimientos`).
  - `/c/xampp/mysql/bin/mysql.exe -uroot bd_novaged -e "describe historias_clinicas" | grep -E "fotos|consentimientos"` → dos filas `longtext … NO`.
  - En `backend/sql/produccion.sql`, en `CREATE TABLE historias_clinicas`, después de `` `protocolo` JSON NOT NULL, `` agregar `` `fotos` JSON NOT NULL, `` y `` `consentimientos` JSON NOT NULL, ``. No ejecutar ese archivo.

- [ ] **Step 9: Correr** — `npx jest test/historiaClinica.test.js` → PASS; `npm test` → PASS.

- [ ] **Step 10: Commit** (produccion.sql está git-ignorado: no aparece)

```bash
git add backend/src/config/consentimientos.js backend/src/migrations/20261014000200-historia-fotos-consentimientos.js backend/src/models/historiaClinica.js backend/src/services/historiaClinica.js backend/src/routes/staffHistoriaClinica.js backend/test/historiaClinica.test.js
git commit -m "feat(historia): consentimientos por procedimiento y columnas para fotos"
```

---

### Task 3: Fotos de la paciente (API)

**Files:**
- Modify: `backend/src/services/archivosPrivados.js`, `backend/src/routes/staffHistoriaClinica.js`, `backend/src/routes/staffPacientes.js`, `backend/test/helpers/archivos.js`
- Test: `backend/test/historiaClinica.test.js`

**Interfaces:**
- Consumes: columna `fotos` (Task 2).
- Produces: `recibirImagen(campo)` en `archivosPrivados` (como `recibirArchivo` pero solo JPEG/PNG); carpeta privada `'historias-fotos'`; rutas `POST/GET/PATCH/DELETE /staff/historias/:id/fotos[/:archivo]` que responden la historia completa (`cargarCompleta`) salvo `GET` (archivo); `borrarFotosDe(historias)` interno de la ruta; helpers de test `jpgFalso()`, `pngReal()`.

- [ ] **Step 1: Helpers de test** — en `backend/test/helpers/archivos.js` agregar y exportar:

```js
function jpgFalso() {
  return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]);
}

// PNG 1x1 válido: pdfkit y docx lo pueden decodificar (los "falsos" no).
function pngReal() {
  return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
}
```

- [ ] **Step 2: Tests que fallan** — en `describe('Historia clínica: API'`:

```js
  describe('fotos', () => {
    const subir = (id, buffer, nombre = 'f.jpg', nota) => {
      const r = request(app).post(`/staff/historias/${id}/fotos`).set('Authorization', `Bearer ${tokenProfesional}`).attach('archivo', buffer, nombre);
      return nota === undefined ? r : r.field('nota', nota);
    };
    const carpeta = path.join(process.env.PRIVADO_DIR, 'historias-fotos');

    test('sube, lista con nota, envía, cambia nota y borra', async () => {
      const h = await crearEvaluacion();
      const r1 = await subir(h.id, jpgFalso(), 'f.jpg', ' frente, antes ');
      expect(r1.status).toBe(200);
      expect(r1.body.fotos).toHaveLength(1);
      const { archivo, nota } = r1.body.fotos[0];
      expect(nota).toBe('frente, antes');
      expect(fs.existsSync(path.join(carpeta, archivo))).toBe(true);

      const ver = await request(app).get(`/staff/historias/${h.id}/fotos/${archivo}`).set('Authorization', `Bearer ${tokenProfesional}`);
      expect(ver.status).toBe(200);
      expect(ver.headers['content-type']).toMatch(/image\/jpeg/);

      const nueva = await request(app).patch(`/staff/historias/${h.id}/fotos/${archivo}`).set('Authorization', `Bearer ${tokenProfesional}`).send({ nota: 'perfil' });
      expect(nueva.body.fotos[0].nota).toBe('perfil');

      const borrada = await request(app).delete(`/staff/historias/${h.id}/fotos/${archivo}`).set('Authorization', `Bearer ${tokenProfesional}`);
      expect(borrada.body.fotos).toEqual([]);
      expect(fs.existsSync(path.join(carpeta, archivo))).toBe(false);
    });

    test('rechaza formatos que no son JPEG/PNG y más de 10 fotos', async () => {
      const h = await crearEvaluacion();
      expect((await subir(h.id, pdfFalso(), 'a.pdf')).status).toBe(400);
      expect((await subir(h.id, exeFalso(), 'a.jpg')).status).toBe(400);
      for (let i = 0; i < 10; i += 1) expect((await subir(h.id, pngFalso(), 'a.png')).status).toBe(200);
      expect((await subir(h.id, pngFalso(), 'a.png')).status).toBe(409);
    });

    test('no entrega fotos de otra evaluación ni nombres manipulados', async () => {
      const a = await crearEvaluacion();
      const b = await crearEvaluacion();
      const { archivo } = (await subir(a.id, jpgFalso())).body.fotos[0];
      for (const ruta of [`/staff/historias/${b.id}/fotos/${archivo}`, `/staff/historias/${a.id}/fotos/..%2F..%2F.env`, `/staff/historias/${a.id}/fotos/nada.jpg`]) {
        expect((await request(app).get(ruta).set('Authorization', `Bearer ${tokenProfesional}`)).status).toBe(404);
      }
      expect((await request(app).delete(`/staff/historias/${b.id}/fotos/${archivo}`).set('Authorization', `Bearer ${tokenProfesional}`)).status).toBe(404);
    });

    test('borrar la evaluación o la paciente borra sus fotos', async () => {
      const h = await crearEvaluacion();
      const { archivo } = (await subir(h.id, jpgFalso())).body.fotos[0];
      expect((await request(app).delete(`/staff/historias/${h.id}`).set('Authorization', `Bearer ${tokenAdmin}`)).status).toBe(204);
      expect(fs.existsSync(path.join(carpeta, archivo))).toBe(false);

      const h2 = await crearEvaluacion();
      const otra = (await subir(h2.id, jpgFalso())).body.fotos[0].archivo;
      // Borrar la paciente: usar la ruta y condiciones que ya prueba este archivo para borrar pacientes con historias.
      const res = await request(app).delete(`/staff/pacientes/${h2.paciente_id}`).set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(204);
      expect(fs.existsSync(path.join(carpeta, otra))).toBe(false);
    });
  });
```
  Importar `jpgFalso`, `pdfFalso`, `pngReal` del helper junto a los existentes. Si la paciente que crea `crearEvaluacion` tiene citas o notas que impiden borrarla (409), crear una paciente nueva sin ellas para ese caso, como hacen los tests existentes de borrado. Usar los nombres reales de los tokens del bloque.

- [ ] **Step 3: Correr y ver fallar** — `npx jest test/historiaClinica.test.js -t fotos` → FAIL (404 en las rutas).

- [ ] **Step 4: archivosPrivados** — en `backend/src/services/archivosPrivados.js`:
  - `const CARPETAS = ['comprobantes', 'justificaciones', 'historias', 'historias-fotos'];`
  - después de `recibirArchivo`, agregar:

```js
const MENSAJE_IMAGEN = 'Sube una foto JPG o PNG de hasta 5 MB';

// Como recibirArchivo, pero solo fotos (las fotos de la historia van dentro
// del PDF y del Word, que no leen WebP ni PDF).
function recibirImagen(campo) {
  const single = upload.single(campo);
  return (req, res, next) => {
    if (!req.is('multipart/form-data')) return next();
    single(req, res, (err) => {
      if (err) return res.status(400).json({ error: MENSAJE_IMAGEN });
      if (req.file) {
        const tipo = detectarTipo(req.file.buffer);
        if (!tipo || !['image/jpeg', 'image/png'].includes(tipo.mime)) return res.status(400).json({ error: MENSAJE_IMAGEN });
      }
      next();
    });
  };
}
```
  - exportar `recibirImagen` y también `rutaArchivo` (lo usan los renderizadores en Task 5).

- [ ] **Step 5: Rutas de fotos** — en `backend/src/routes/staffHistoriaClinica.js` (importar `recibirImagen`), antes de `async function documentoDe`:

```js
const MAX_FOTOS = 10;
const CARPETA_FOTOS = 'historias-fotos';

function notaDeFoto(valor) {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'string') throw new ErrorValidacion('nota', 'Nota inválida');
  const limpia = valor.trim();
  if (limpia.length > 120) throw new ErrorValidacion('nota', 'La nota admite hasta 120 caracteres');
  return limpia || null;
}

// La foto se busca en el JSON de ESA evaluación: un nombre de otra historia o
// manipulado nunca llega al disco.
async function historiaYFoto(req, res) {
  const historia = await db.HistoriaClinica.findByPk(req.params.id);
  if (!historia) {
    res.status(404).json({ error: 'Evaluación no encontrada' });
    return {};
  }
  const foto = historia.fotos.find((f) => f.archivo === req.params.archivo);
  if (!foto) {
    res.status(404).json({ error: 'Foto no encontrada' });
    return {};
  }
  return { historia, foto };
}

async function borrarFotosDe(historias) {
  for (const h of historias) {
    for (const f of h.fotos || []) await borrarArchivoPrivado(CARPETA_FOTOS, f.archivo);
  }
}

router.post('/staff/historias/:id/fotos', onlyHistoria, recibirImagen('archivo'), async (req, res) => {
  const historia = await db.HistoriaClinica.findByPk(req.params.id);
  if (!historia) return res.status(404).json({ error: 'Evaluación no encontrada' });
  if (!req.file) return res.status(400).json({ error: 'Adjunta una foto JPG o PNG' });
  if (historia.fotos.length >= MAX_FOTOS) return res.status(409).json({ error: `Máximo ${MAX_FOTOS} fotos por evaluación` });
  let nota;
  try {
    nota = notaDeFoto(req.body.nota);
  } catch (err) {
    return res.status(400).json({ error: err.message, campo: 'nota' });
  }
  const archivo = await guardarArchivoPrivado(CARPETA_FOTOS, req.file.buffer);
  historia.fotos = [...historia.fotos, { archivo, nota }];
  historia.actualizado_por_id = req.usuarioId;
  await historia.save();
  res.json(await cargarCompleta(historia.id));
});

router.get('/staff/historias/:id/fotos/:archivo', onlyHistoria, async (req, res) => {
  const { foto } = await historiaYFoto(req, res);
  if (!foto) return;
  return enviarArchivoPrivado(res, CARPETA_FOTOS, foto.archivo);
});

router.patch('/staff/historias/:id/fotos/:archivo', onlyHistoria, async (req, res) => {
  const { historia, foto } = await historiaYFoto(req, res);
  if (!foto) return;
  let nota;
  try {
    nota = notaDeFoto(req.body.nota);
  } catch (err) {
    return res.status(400).json({ error: err.message, campo: 'nota' });
  }
  historia.fotos = historia.fotos.map((f) => (f.archivo === foto.archivo ? { ...f, nota } : f));
  historia.actualizado_por_id = req.usuarioId;
  await historia.save();
  res.json(await cargarCompleta(historia.id));
});

router.delete('/staff/historias/:id/fotos/:archivo', onlyHistoria, async (req, res) => {
  const { historia, foto } = await historiaYFoto(req, res);
  if (!foto) return;
  historia.fotos = historia.fotos.filter((f) => f.archivo !== foto.archivo);
  historia.actualizado_por_id = req.usuarioId;
  await historia.save();
  await borrarArchivoPrivado(CARPETA_FOTOS, foto.archivo);
  res.json(await cargarCompleta(historia.id));
});
```
  - En `router.delete('/staff/historias/:id'…)`: después de `await borrarArchivoPrivado('historias', firmado);` agregar `await borrarFotosDe([historia]);` (la instancia en memoria conserva `fotos` tras `destroy`).
  - Exportar el helper para pacientes: `module.exports = router; module.exports.borrarFotosDe = borrarFotosDe;`

- [ ] **Step 6: Borrar paciente** — en `backend/src/routes/staffPacientes.js`, donde hoy se buscan las historias para borrar `documento_firmado` (línea ~124): pedir también `fotos` en `attributes: ['documento_firmado', 'fotos']` y, después del `for` que borra los firmados, agregar `await borrarFotosDe(historias);` con `const { borrarFotosDe } = require('./staffHistoriaClinica');` arriba.

- [ ] **Step 7: Correr** — `npx jest test/historiaClinica.test.js` → PASS; `npm test` → PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/services/archivosPrivados.js backend/src/routes/staffHistoriaClinica.js backend/src/routes/staffPacientes.js backend/test/helpers/archivos.js backend/test/historiaClinica.test.js
git commit -m "feat(historia): fotos privadas de la paciente por evaluación"
```

---

### Task 4: Documento (bloques neutros)

**Files:**
- Modify: `backend/src/services/historiaClinicaDocumento.js`
- Test: `backend/test/historiaClinica.test.js`

**Interfaces:**
- Consumes: `SECCIONES` con `numero`/`fecha`/`imagen` (Task 1); `CONSENTIMIENTOS` (Task 2); `historia.fotos`, `historia.consentimientos`.
- Produces: `armarDocumento(...)` devuelve `{ fecha, emitido, numero, bloques }` (`emitido` = dd/mm/aaaa de hoy en America/La_Paz). Bloques nuevos:
  - `{ tipo: 'imagen', archivo: '<ruta absoluta>' }` (antes de los campos de un grupo con `imagen`);
  - `{ tipo: 'fotos', fotos: [{ ruta: '<ruta absoluta>', nota: string }] }` (tras el protocolo; `fotos: []` en blanco o sin fotos);
  - `{ tipo: 'consentimiento', titulo, texto }` seguido de `{ tipo: 'firmas', paciente, especialista }` por cada consentimiento.
  - Bloque `campo` para `numero` (valor `String(n)`) y `fecha` (valor `formatoFecha`).
  - Se quita el bloque `compromiso`.
  - `parrafo` acepta `lineas` opcional (cuántas líneas en blanco dibujar): Diagnóstico usa `lineas: 6`.

- [ ] **Step 1: Tests que fallan** — en `describe('Historia clínica: definición y validación'` (usa `armarDocumento` ya importado):

```js
  test('documento: emitido, grupos nuevos, guías, fotos y consentimientos', () => {
    const historia = {
      fecha: '2026-10-01',
      datos_clinicos: { gestas: 2, fum: '2026-09-15', no_patologicos: 'Vive con su familia' },
      datos_esteticos: { antecedente_1: 'Toxina 2025' },
      analisis_estetico: { tipo_facial: 'mesofacial', grasa_muslos: true },
      protocolo: [],
      fotos: [{ archivo: 'a.jpg', nota: 'frente' }],
      consentimientos: ['general'],
      Profesional: { nombre: 'Dra. X' },
    };
    const doc = armarDocumento({ config: { nombre_consultorio: 'Clinic' }, paciente: { nombre_completo: 'Ana' }, historia });
    expect(doc.emitido).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    const campo = (etiqueta) => doc.bloques.find((b) => b.tipo === 'campo' && b.etiqueta === etiqueta);
    expect(campo('Gestas').valor).toBe('2');
    expect(campo('Fecha de última menstruación (FUM)').valor).toBe('15/09/2026');
    expect(campo('1.').valor).toBe('Toxina 2025');
    expect(doc.bloques.filter((b) => b.tipo === 'imagen').map((b) => path.basename(b.archivo))).toEqual(['guia-tipos-faciales.png', 'guia-grasa-corporal.png']);
    expect(doc.bloques.find((b) => b.tipo === 'parrafo' && b.etiqueta === 'Diagnóstico').lineas).toBe(6);
    const fotos = doc.bloques.find((b) => b.tipo === 'fotos');
    expect(fotos.fotos).toEqual([{ ruta: path.join(process.env.PRIVADO_DIR, 'historias-fotos', 'a.jpg'), nota: 'frente' }]);
    const titulos = doc.bloques.filter((b) => b.tipo === 'seccion').map((b) => b.titulo);
    expect(titulos).toContain('5. Diagnóstico');
    expect(titulos).toContain('6. Consentimiento');
    const consentimiento = doc.bloques.find((b) => b.tipo === 'consentimiento');
    expect(consentimiento.titulo).toBe('Consentimiento general');
    expect(consentimiento.texto).toContain('Yo Ana');
    expect(consentimiento.texto).toContain('Dra. X');
    expect(consentimiento.texto).not.toMatch(/\{\w+\}/);
    expect(doc.bloques.some((b) => b.tipo === 'compromiso')).toBe(false);
  });

  test('documento en blanco: consentimiento general, fotos vacías, emitido presente', () => {
    const doc = armarDocumento({ config: {}, enBlanco: true });
    expect(doc.emitido).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(doc.bloques.find((b) => b.tipo === 'fotos').fotos).toEqual([]);
    expect(doc.bloques.filter((b) => b.tipo === 'consentimiento').map((b) => b.titulo)).toEqual(['Consentimiento general']);
  });

  test('sin consentimientos marcados sale el general', () => {
    const doc = armarDocumento({ config: {}, paciente: {}, historia: { fecha: '2026-10-01', consentimientos: [] } });
    expect(doc.bloques.filter((b) => b.tipo === 'consentimiento')).toHaveLength(1);
  });
```
  Revisar con `grep -n "compromiso\|Compromiso\|5. Diagnóstico y tratamiento" backend/test/historiaClinica.test.js` los tests existentes que dependan del texto viejo y actualizarlos a "6. Consentimiento"/"5. Diagnóstico"/bloque `consentimiento` (mismo significado).

- [ ] **Step 2: Correr y ver fallar** — `npx jest test/historiaClinica.test.js -t documento` → FAIL.

- [ ] **Step 3: Implementar** — en `backend/src/services/historiaClinicaDocumento.js`:
  - imports:

```js
const path = require('path');
const { SECCIONES, COLUMNAS_PROTOCOLO, DIR_GUIAS } = require('../config/historiaClinica');
const { CONSENTIMIENTOS } = require('../config/consentimientos');
const { formatoFecha } = require('./pdf');
const { rutaArchivo } = require('./archivosPrivados');
```
  - helper de fecha de emisión:

```js
// Fecha de emisión del documento en Bolivia (no la de la evaluación).
function hoyEnBolivia() {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return formatoFecha(partes);
}
```
  - en `bloquesDeGrupo`, después de crear `bloques` con el título: `if (grupo.imagen) bloques.push({ tipo: 'imagen', archivo: path.join(DIR_GUIAS, grupo.imagen) });`
  - en `bloquesDeGrupo`, reemplazar el `else { bloques.push({ tipo: campo.tipo === 'parrafo' … }) }` por:

```js
    } else if (campo.tipo === 'numero') {
      const v = datos[campo.clave];
      bloques.push({ tipo: 'campo', etiqueta: campo.etiqueta, valor: v === undefined || v === null ? '' : String(v) });
    } else if (campo.tipo === 'fecha') {
      bloques.push({ tipo: 'campo', etiqueta: campo.etiqueta, valor: datos[campo.clave] ? formatoFecha(datos[campo.clave]) : '' });
    } else {
      bloques.push({ tipo: campo.tipo === 'parrafo' ? 'parrafo' : 'campo', etiqueta: campo.etiqueta, valor: datos[campo.clave] || '' });
    }
```
  - reemplazar el `bloques.push(` final (sección 5 y 6) por:

```js
  const fotos = enBlanco ? [] : (h.fotos || []).map((f) => ({ ruta: rutaArchivo('historias-fotos', f.archivo), nota: f.nota || '' }));
  const marcados = enBlanco ? [] : (h.consentimientos || []);
  const consentimientos = CONSENTIMIENTOS.filter((c) => marcados.includes(c.clave));
  const aImprimir = consentimientos.length ? consentimientos : CONSENTIMIENTOS.filter((c) => c.clave === 'general');
  const valores = {
    paciente: p.nombre_completo || LINEA,
    ci: carnet(p) || LINEA,
    especialista: especialista || LINEA,
    procedimiento: h.procedimiento_autorizado || LINEA,
    clinica: enBlanco ? LINEA : clinica,
  };
  const rellenar = (texto) => texto.replace(/\{(\w+)\}/g, (_, k) => valores[k] ?? LINEA);

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
    ...aImprimir.flatMap((c) => [
      { tipo: 'consentimiento', titulo: c.titulo, texto: rellenar(c.texto) },
      { tipo: 'firmas', paciente: p.nombre_completo || '', especialista },
    ])
  );

  return { fecha: h.fecha ? formatoFecha(h.fecha) : '', emitido: hoyEnBolivia(), numero: p.codigo_paciente || '', bloques };
```

- [ ] **Step 4: Correr** — `npx jest test/historiaClinica.test.js` → PASS; `npm test` → PASS. (Los renderizadores PDF/Word ignoran los tipos de bloque que no conocen, así que siguen generando archivos válidos hasta que la Task 5 dibuje los nuevos.)

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/historiaClinicaDocumento.js backend/test/historiaClinica.test.js
git commit -m "feat(historia): documento con emisión, guías, fotos y consentimientos"
```

---

### Task 5: PDF y Word

**Files:**
- Modify: `backend/src/services/historiaClinicaPdf.js`, `backend/src/services/historiaClinicaWord.js`
- Test: `backend/test/historiaClinica.test.js`

**Interfaces:**
- Consumes: documento de la Task 4 (`emitido`, bloques `imagen`, `fotos`, `consentimiento`, `parrafo.lineas`).

- [ ] **Step 1: Tests que fallan** — en `describe('Historia clínica: API'`, después de los tests de descarga existentes:

```js
  test('PDF y Word se generan con guías y fotos; una foto que falta en disco no rompe', async () => {
    const h = await crearEvaluacion();
    const subida = await request(app).post(`/staff/historias/${h.id}/fotos`).set('Authorization', `Bearer ${tokenProfesional}`).attach('archivo', pngReal(), 'f.png');
    expect(subida.status).toBe(200);
    // Una foto registrada cuyo archivo ya no existe:
    await db.HistoriaClinica.update({ fotos: [...subida.body.fotos, { archivo: 'no-existe.png', nota: 'x' }] }, { where: { id: h.id } });

    const pdf = await request(app).get(`/staff/historias/${h.id}/pdf`).set('Authorization', `Bearer ${tokenProfesional}`).buffer(true).parse(binario);
    expect(pdf.status).toBe(200);
    expect(pdf.body.subarray(0, 5).toString()).toBe('%PDF-');

    const word = await request(app).get(`/staff/historias/${h.id}/word`).set('Authorization', `Bearer ${tokenProfesional}`).buffer(true).parse(binario);
    expect(word.status).toBe(200);
    expect(word.body.subarray(0, 2).toString()).toBe('PK');

    for (const formato of ['pdf', 'docx']) {
      const blanco = await request(app).get(`/staff/historia-clinica/en-blanco.${formato}`).set('Authorization', `Bearer ${tokenProfesional}`).buffer(true).parse(binario);
      expect(blanco.status).toBe(200);
    }
  });
```

- [ ] **Step 2: Correr y ver fallar** — `npx jest test/historiaClinica.test.js -t "guías y fotos"`. Esperado: FAIL o PASS sin dibujar los bloques nuevos; en cualquier caso continuar (el test protege que no se rompa).

- [ ] **Step 3: PDF** — en `backend/src/services/historiaClinicaPdf.js`:
  - `const fs = require('fs');` arriba.
  - encabezado: `doc.text(\`Fecha: ${documento.fecha || '____/____/______'}      Emitido: ${documento.emitido}      N° de historia: ${documento.numero || '__________'}\`, izq, doc.y);`
  - helper dentro de `enviarHistoriaPdf`:

```js
  // Imagen ajustada al ancho dado sin pasar el alto máximo; si falta o no se
  // puede leer, se omite (el documento se genera igual).
  function imagen(ruta, x, anchoMax, altoMax) {
    if (!ruta || !fs.existsSync(ruta)) return 0;
    try {
      const img = doc.openImage(ruta);
      const escala = Math.min(anchoMax / img.width, altoMax / img.height, 1);
      const w = img.width * escala;
      const hImg = img.height * escala;
      doc.image(img, x, doc.y, { width: w, height: hImg });
      return hImg;
    } catch {
      return 0;
    }
  }
```
  - en el `for (const b of documento.bloques)`:
    - `seccion`: cambiar `b.titulo.includes('Compromiso') ? 230 : 40` por `b.titulo.includes('Consentimiento') ? 230 : 40`.
    - nuevo `imagen`:

```js
    } else if (b.tipo === 'imagen') {
      asegurar(170);
      const alto = imagen(b.archivo, izq, ancho, 170);
      doc.y += alto + 4;
      doc.x = izq;
```
    - nuevo `fotos`:

```js
    } else if (b.tipo === 'fotos') {
      if (!b.fotos.length) {
        asegurar(90);
        const y = doc.y + 2;
        doc.lineWidth(0.6).strokeColor(COLOR.manhattan).rect(izq, y, ancho, 80).stroke();
        doc.y = y + 86;
      } else {
        const col = (ancho - 12) / 2;
        const altoFoto = 200;
        for (let i = 0; i < b.fotos.length; i += 2) {
          asegurar(altoFoto + 24);
          const y = doc.y;
          let altoFila = 0;
          for (const [j, f] of b.fotos.slice(i, i + 2).entries()) {
            const x = izq + j * (col + 12);
            doc.y = y;
            const alto = imagen(f.ruta, x, col, altoFoto);
            if (f.nota) doc.font('Helvetica').fontSize(8).fillColor(COLOR.muted).text(f.nota, x, y + alto + 2, { width: col });
            altoFila = Math.max(altoFila, alto + (f.nota ? 14 : 0));
          }
          doc.y = y + altoFila + 8;
        }
      }
      doc.x = izq;
```
    - reemplazar la rama `compromiso` por:

```js
    } else if (b.tipo === 'consentimiento') {
      asegurar(200);
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR.espresso).text(b.titulo, izq, doc.y);
      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(TAM).fillColor(COLOR.ink).text(b.texto, izq, doc.y, { width: ancho, align: 'justify' });
```
    - `parrafo` vacío: cambiar `for (let i = 0; i < 2; i += 1)` por `for (let i = 0; i < (b.lineas || 2); i += 1)` y `asegurar(TAM * 3)` por `asegurar(TAM * (b.lineas || 2) + TAM)`.

- [ ] **Step 4: Word** — en `backend/src/services/historiaClinicaWord.js`:
  - encabezado del cuerpo: el párrafo `Fecha: …` pasa a `Fecha: ${documento.fecha || '____/____/______'}      Emitido: ${documento.emitido}      N° de historia: ${documento.numero || '__________'}`.
  - helper (debajo de `dimensionesImagen`):

```js
// Párrafo con una imagen ajustada a anchoMax×altoMax (en px de docx); null si
// falta o no se puede leer.
function parrafoImagen(ruta, anchoMax, altoMax) {
  if (!ruta || !fs.existsSync(ruta)) return null;
  try {
    const { ancho, alto } = dimensionesImagen(ruta);
    const escala = Math.min(anchoMax / ancho, altoMax / alto, 1);
    return new Paragraph({
      children: [new ImageRun({
        type: /\.png$/i.test(ruta) ? 'png' : 'jpg',
        data: fs.readFileSync(ruta),
        transformation: { width: Math.round(ancho * escala), height: Math.round(alto * escala) },
      })],
    });
  } catch {
    return null;
  }
}
```
  - en el `for (const b of documento.bloques)`:

```js
    } else if (b.tipo === 'imagen') {
      const p = parrafoImagen(b.archivo, 600, 220);
      if (p) cuerpo.push(p);
    } else if (b.tipo === 'fotos') {
      if (!b.fotos.length) {
        cuerpo.push(tabla([' '], [['\n\n\n\n']]));
      } else {
        for (const f of b.fotos) {
          const p = parrafoImagen(f.ruta, 300, 260);
          if (p) cuerpo.push(p);
          if (f.nota) cuerpo.push(new Paragraph({ children: [new TextRun({ text: f.nota, italics: true, size: 16 })] }));
        }
      }
    } else if (b.tipo === 'consentimiento') {
      cuerpo.push(new Paragraph({ spacing: { before: 160 }, children: [new TextRun({ text: b.titulo, bold: true, size: 20 })] }));
      cuerpo.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: b.texto, size: TAM })] }));
```
    y quitar la rama `compromiso`. En `parrafo` vacío: `const lineas = b.valor ? b.valor.split('\n') : Array(b.lineas || 2).fill('_'.repeat(90));`.

- [ ] **Step 5: Correr** — `npx jest test/historiaClinica.test.js` → PASS; `npm test` → PASS.

- [ ] **Step 6: Revisión visual** — generar los archivos con la base local (backend en 4000 corriendo, usuario con permiso): con un script en el scratchpad que haga login como admin leyendo credenciales del `.env` sin imprimirlas, descargar `/staff/historia-clinica/en-blanco.pdf` y `.docx` y uno de una evaluación con una foto subida; abrir el PDF con Read (pages "1-4") y confirmar: encabezado con "Emitido", guías visibles en la sección 4, recuadro de fotos, "6. Consentimiento" con su título. Borrar los archivos del scratchpad al terminar.

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/historiaClinicaPdf.js backend/src/services/historiaClinicaWord.js backend/test/historiaClinica.test.js
git commit -m "feat(historia): PDF y Word con guías, fotos y consentimientos"
```

---

### Task 6: Panel — campos nuevos, sección 5 y consentimientos

**Files:**
- Modify: `staff/src/app/pacientes/[id]/historia/[historiaId]/CampoHistoria.tsx`, `staff/src/app/pacientes/[id]/historia/[historiaId]/page.tsx`

**Interfaces:**
- Consumes: definición con `tipo: 'numero' | 'fecha'`, `grupo.imagen`, `consentimientos: {clave,titulo}[]` (Tasks 1–2); `NEXT_PUBLIC_API_URL` / `API_URL` de `staff/src/lib/api.js` para la URL de las guías.
- Produces: `Valores = Record<string, string | boolean | number>`; la historia del estado incluye `fotos` y `consentimientos`.

- [ ] **Step 1: CampoHistoria.**
  - Tipos:

```tsx
  tipo: 'check' | 'texto' | 'parrafo' | 'opcion' | 'numero' | 'fecha';
```
```tsx
export type Grupo = { titulo: string; subtitulo?: string; imagen?: string; campos: Campo[] };
export type Valores = Record<string, string | boolean | number>;
```
  - prop nueva `urlGuias: string` (base, ej. `http://localhost:4000/assets/historia`): `export default function CampoHistoria({ grupo, valores, onCambio, urlGuias }: { …; urlGuias: string })` y `onCambio: (clave: string, valor: string | boolean | number) => void`.
  - debajo del `<legend>`:

```tsx
      {grupo.imagen && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${urlGuias}/${grupo.imagen}`} alt={`Guía: ${grupo.titulo}`} className="mb-3 w-full rounded border border-border bg-white object-contain" />
      )}
```
  - en el `otros.map`, antes de `const largo = …`:

```tsx
        if (c.tipo === 'numero' || c.tipo === 'fecha') {
          const esNumero = c.tipo === 'numero';
          return (
            <label key={c.clave} className={`mb-2 text-xs text-muted-foreground ${esNumero ? 'mr-3 inline-block w-28 align-top' : 'block sm:w-64'}`}>
              {c.etiqueta}
              <input
                type={esNumero ? 'number' : 'date'}
                inputMode={esNumero ? 'numeric' : undefined}
                min={esNumero ? 0 : undefined}
                max={esNumero ? 99 : undefined}
                step={esNumero ? 1 : undefined}
                value={valores[c.clave] === undefined || valores[c.clave] === null ? '' : String(valores[c.clave])}
                onChange={(e) => onCambio(c.clave, esNumero && e.target.value !== '' ? Number(e.target.value) : e.target.value)}
                className="mt-1 block w-full rounded border border-border px-2.5 py-1.5 text-sm text-foreground"
              />
            </label>
          );
        }
```
- [ ] **Step 2: page.tsx.**
  - Tipos: en `Historia` agregar `fotos: { archivo: string; nota: string | null }[]; consentimientos: string[];`.
  - Leer cómo la página obtiene la definición (`api.getDefinicionHistoria()`): guardar también `consentimientos` de la respuesta en un estado `const [consentimientosDisponibles, setConsentimientosDisponibles] = useState<{ clave: string; titulo: string }[]>([]);`.
  - URL de guías: `const URL_GUIAS = \`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '')}/assets/historia\`;` — usar la MISMA expresión base que usa `staff/src/lib/api.js` para `API_URL` (leerla y copiarla; si `api.js` exporta `API_URL`, importarla).
  - Pasar `urlGuias={URL_GUIAS}` a cada `<CampoHistoria …>`.
  - `cambiarEnSeccion` debe aceptar `number` además de `string | boolean` (ajustar su firma).
  - Sección 5: `<summary …>5. Diagnóstico</summary>`, el textarea de Diagnóstico con `rows={6}`. Debajo de la tabla de protocolo dejar un comentario `{/* Fotos: Task 7 */}` NO; en su lugar dejar el lugar listo con `<p className="mb-1 mt-4 text-sm font-semibold">Fotos</p>` y nada más (la Task 7 agrega el componente justo debajo de ese título).
  - Sección 6: `<summary …>6. Consentimiento</summary>`; agregar arriba de "Especialista":

```tsx
          <p className="mt-3 text-xs text-muted-foreground">Consentimientos que se imprimen (si no marcas ninguno, sale el general)</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5">
            {consentimientosDisponibles.map((c) => (
              <label key={c.clave} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={historia.consentimientos.includes(c.clave)}
                  onChange={(e) =>
                    cambiar('consentimientos', e.target.checked ? [...historia.consentimientos, c.clave] : historia.consentimientos.filter((k) => k !== c.clave))
                  }
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                {c.titulo}
              </label>
            ))}
          </div>
```
  - El texto de ayuda "Descarga el PDF o el Word, imprímelo y fírmenlo…" queda.
  - `guardar()`: incluir `consentimientos: historia.consentimientos` en el cuerpo del `api.guardarHistoria` junto a los demás campos (leer cómo arma el cuerpo y agregarlo igual). `cambiar` debe aceptar el tipo `string[]` para esa clave (ajustar el tipo genérico si hace falta).

- [ ] **Step 3: Verificar** — `cd staff && npx tsc --noEmit && npx eslint "src/app/pacientes/[id]/historia"`. Esperado: sin errores nuevos (el único error preexistente conocido es `react-hooks/set-state-in-effect` de la página; no agregar otros).

- [ ] **Step 4: Commit**

```bash
git add "staff/src/app/pacientes/[id]/historia/[historiaId]/CampoHistoria.tsx" "staff/src/app/pacientes/[id]/historia/[historiaId]/page.tsx"
git commit -m "feat(panel): campos nuevos de la historia, guías y consentimientos"
```

---

### Task 7: Panel — fotos de la paciente

**Files:**
- Create: `staff/src/app/pacientes/[id]/historia/[historiaId]/FotosHistoria.tsx`
- Modify: `staff/src/lib/api.js`, `staff/src/app/pacientes/[id]/historia/[historiaId]/page.tsx`

**Interfaces:**
- Consumes: rutas de fotos (Task 3), `api.obtenerArchivoPrivado(path)` existente, `ArchivoPrivado` (`@/app/agenda/ArchivoPrivado`).
- Produces: `api.subirFotoHistoria(id, blob, nota)`, `api.cambiarNotaFoto(id, archivo, nota)`, `api.borrarFotoHistoria(id, archivo)` (devuelven la historia completa); componente `FotosHistoria({ historiaId, fotos, onCambio })` donde `onCambio(historiaActualizada)`.

- [ ] **Step 1: api.js** — junto a `subirDocumentoFirmado`:

```js
  subirFotoHistoria: (id, archivo, nota) => {
    const datos = new FormData();
    datos.append('archivo', archivo, 'foto.jpg');
    if (nota) datos.append('nota', nota);
    return apiFetch(`/staff/historias/${id}/fotos`, { method: 'POST', body: datos });
  },
  cambiarNotaFoto: (id, archivo, nota) =>
    apiFetch(`/staff/historias/${id}/fotos/${encodeURIComponent(archivo)}`, { method: 'PATCH', body: JSON.stringify({ nota }) }),
  borrarFotoHistoria: (id, archivo) => apiFetch(`/staff/historias/${id}/fotos/${encodeURIComponent(archivo)}`, { method: 'DELETE' }),
```
  (Verificar que `apiFetch` no fija `Content-Type: application/json` cuando el cuerpo es `FormData`, como ya hace `subirDocumentoFirmado`; copiar su forma exacta.)

- [ ] **Step 2: Componente** — `FotosHistoria.tsx`

```tsx
'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { api } from '@/lib/api';
import ArchivoPrivado from '@/app/agenda/ArchivoPrivado';

type Foto = { archivo: string; nota: string | null };
const MAX_FOTOS = 10;
const LADO_MAX = 1600;

// Reduce la foto en el navegador (las del celular pesan varios MB) y la pasa
// a JPEG: el servidor solo acepta JPEG/PNG de hasta 5 MB y el PDF no engorda.
async function reducir(archivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(bitmap.width * escala);
  lienzo.height = Math.round(bitmap.height * escala);
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');
  ctx.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
  bitmap.close();
  return new Promise((resolver, rechazar) =>
    lienzo.toBlob((b) => (b ? resolver(b) : rechazar(new Error('No se pudo procesar la imagen'))), 'image/jpeg', 0.82)
  );
}

export default function FotosHistoria<H>({ historiaId, fotos, onCambio }: { historiaId: number; fotos: Foto[]; onCambio: (h: H) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [abierta, setAbierta] = useState<string | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});

  async function elegir(e: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files || []);
    e.target.value = '';
    if (!archivos.length) return;
    setError('');
    setSubiendo(true);
    try {
      let ultima: H | null = null;
      for (const archivo of archivos.slice(0, MAX_FOTOS - fotos.length)) {
        ultima = await api.subirFotoHistoria(historiaId, await reducir(archivo), '');
      }
      if (ultima) onCambio(ultima);
      if (archivos.length > MAX_FOTOS - fotos.length) setError(`Solo se admiten ${MAX_FOTOS} fotos por evaluación`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto');
    } finally {
      setSubiendo(false);
    }
  }

  async function guardarNota(archivo: string) {
    const nota = notas[archivo];
    if (nota === undefined) return;
    try {
      onCambio(await api.cambiarNotaFoto(historiaId, archivo, nota));
      setNotas(({ [archivo]: _, ...resto }) => resto);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la nota');
    }
  }

  async function borrar(archivo: string) {
    if (!window.confirm('¿Borrar esta foto?')) return;
    try {
      onCambio(await api.borrarFotoHistoria(historiaId, archivo));
      if (abierta === archivo) setAbierta(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar la foto');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={input} type="file" accept="image/*" multiple onChange={elegir} className="hidden" />
        {fotos.length < MAX_FOTOS && (
          <button type="button" disabled={subiendo} onClick={() => input.current?.click()} className="rounded border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-50">
            {subiendo ? 'Subiendo…' : '+ Agregar fotos'}
          </button>
        )}
        <span className="text-xs text-muted-foreground">{fotos.length}/{MAX_FOTOS} · se guardan de forma privada</span>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {fotos.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {fotos.map((f) => (
            <li key={f.archivo} className="rounded border border-border p-2">
              <button type="button" onClick={() => setAbierta(abierta === f.archivo ? null : f.archivo)} className="block w-full" aria-label="Ver foto en grande">
                <ArchivoPrivado ruta={`/staff/historias/${historiaId}/fotos/${encodeURIComponent(f.archivo)}`} alt={f.nota || 'Foto de la paciente'} />
              </button>
              <input
                value={notas[f.archivo] ?? f.nota ?? ''}
                onChange={(e) => setNotas((n) => ({ ...n, [f.archivo]: e.target.value }))}
                onBlur={() => guardarNota(f.archivo)}
                placeholder="Nota (ej. frente, antes)"
                aria-label="Nota de la foto"
                maxLength={120}
                className="mt-2 block w-full rounded border border-border px-2 py-1 text-xs"
              />
              <button type="button" onClick={() => borrar(f.archivo)} className="mt-1 text-xs text-danger hover:underline">Borrar</button>
            </li>
          ))}
        </ul>
      )}
      {abierta && (
        <div className="mt-3 rounded border border-border p-2">
          <ArchivoPrivado ruta={`/staff/historias/${historiaId}/fotos/${encodeURIComponent(abierta)}`} alt="Foto en grande" />
          <button type="button" onClick={() => setAbierta(null)} className="mt-2 text-xs hover:underline">Cerrar</button>
        </div>
      )}
    </div>
  );
}
```
  (Si eslint marca `_` como variable sin usar en `setNotas(({ [archivo]: _, ...resto }) => resto)`, reemplazarlo por una copia del objeto con `delete` de esa clave.)
  (Sin el atributo `capture`: en celular, `accept="image/*"` ya ofrece cámara o galería y permite elegir varias; `capture` limitaría a la cámara.)

- [ ] **Step 3: Usarlo en page.tsx** — debajo del título `Fotos` de la sección 5 (Task 6):

```tsx
          <FotosHistoria<Historia>
            historiaId={historia.id}
            fotos={historia.fotos}
            onCambio={(h) => setHistoria((actual) => (actual ? { ...actual, fotos: h.fotos, updated_at: h.updated_at, updatedAt: h.updatedAt, ActualizadoPor: h.ActualizadoPor } : h))}
          />
```
  Importante: el `onCambio` solo actualiza `fotos` (y los datos de "última edición"), NO pisa el resto de la historia, para no perder cambios sin guardar del formulario. Leer cómo la página guarda la info de "última edición" y copiar esos mismos campos. `import FotosHistoria from './FotosHistoria';`.

- [ ] **Step 4: Verificar** — `cd staff && npx tsc --noEmit && npx eslint "src/app/pacientes/[id]/historia" src/lib/api.js` → sin errores nuevos.

- [ ] **Step 5: Commit**

```bash
git add staff/src/lib/api.js "staff/src/app/pacientes/[id]/historia/[historiaId]/FotosHistoria.tsx" "staff/src/app/pacientes/[id]/historia/[historiaId]/page.tsx"
git commit -m "feat(panel): fotos de la paciente en el protocolo"
```

---

### Task 8: Verificación final en el navegador

**Files:** ninguno nuevo (solo si aparece un defecto, se corrige en el archivo correspondiente con su test).

- [ ] **Step 1: Suites** — `cd backend && npm test` → PASS; `cd staff && npx tsc --noEmit && npx eslint src` → solo el error preexistente conocido.
- [ ] **Step 2: Servidores** — backend 4000, staff 3002 corriendo (no reiniciar si ya están; nodemon recarga el backend). La migración ya se aplicó en la Task 2.
- [ ] **Step 3: Navegador** (Playwright MCP; archivos solo en `D:/TODO/SISTEMAS/SIS-CLINICA-NOVAGED/.playwright-mcp/`, borrar al terminar; token del admin con un script en el scratchpad que lee el `.env` sin imprimir secretos y lo deja en `localStorage` `novaged_staff_token` / `novaged_staff_usuario`):
  - Abrir una paciente de prueba (`NOVA-DEMO1`) → nueva evaluación.
  - Sección 2: aparecen "no patológicos", ginecológicos nuevos (menstruación, FUM fecha, planificación, menopausia), Fórmula obstétrica con 4 números, Hábitos con agua en litros, Alimentación con 5 comidas. Escribir valores, incluido `gestas = 2` y una FUM.
  - Sección 3: "Rutina facial (skin care)" con frecuencias; Antecedentes estéticos 1.–6.
  - Sección 4: se ven las dos guías; elegir "Mesofacial" y marcar "Muslos".
  - Sección 5: título "5. Diagnóstico"; subir 2 fotos (usar `backend/assets/historia/guia-grasa-corporal.png` como archivo de prueba); escribir una nota; borrar una.
  - Sección 6: "6. Consentimiento" con "Consentimiento general".
  - Guardar → recargar → todo persiste (gestas sigue en 2, FUM, fotos y nota).
  - Probar gestas = 150 → el guardado muestra el error del campo.
  - Descargar PDF y Word (deben bajar sin error).
  - 390 px: `document.documentElement.scrollWidth <= 390` en la página de la evaluación.
  - Consola sin errores.
- [ ] **Step 4: Limpieza** — borrar la evaluación de prueba (Admin) y confirmar que sus fotos ya no están en `backend/privado/historias-fotos/` (la carpeta puede quedar vacía).
- [ ] **Step 5: Commit** — solo si hubo correcciones: `git commit -m "fix(historia): <qué>"` con sus archivos.
