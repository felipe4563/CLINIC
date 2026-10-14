# Historia clínica — ajustes pedidos por la clínica — Diseño

Fecha: 2026-10-14 · Estado: aprobado en conversación, pendiente de revisión escrita
Base: `docs/superpowers/specs/2026-10-12-historia-clinica-design.md` (lo que no se menciona aquí no cambia).

## Origen

Audio de la doctora (transcrito por el usuario el 2026-10-14) con observaciones al formulario, más dos
guías de referencia que envió: "Guía de referencia de tipos faciales" (braquifacial, mesofacial,
dolicofacial; frontal y perfil) y "Guía de ubicación de grasa corporal" (abdominal, muslos,
cadera/cintura; frontal y perfil). No hay historias reales en producción, así que los campos se cambian
sin migrar datos: las claves que desaparecen de la definición quedan ignoradas en el JSON guardado.

## Decisiones

| Tema | Decisión |
|---|---|
| Guías de rostro y cuerpo | La imagen se muestra en el panel y en PDF/Word; debajo se marca tipo facial (una opción) y zonas de grasa (varias). |
| Fotos reales de la paciente | Se suben en el protocolo; salen en panel y en PDF/Word; archivos privados. |
| Consentimientos | Uno por procedimiento; la doctora marca cuáles aplican. Hasta que la clínica pase los textos, solo existe el general (texto actual de "Compromiso legal"). |
| "No patológicos" | Grupo propio con espacio libre (el audio no dice qué contiene; confirmar con la doctora). Hábitos de vida sigue como grupo aparte. |
| Menopausia | Se mantiene (el audio no la menciona). |

## Cambios al formulario (`backend/src/config/historiaClinica.js`)

Tipos de campo nuevos:
- `numero`: entero 0–99 (se guarda como número).
- `fecha`: `YYYY-MM-DD` válida (se muestra dd/mm/aaaa en documentos).

Grupo con imagen: un grupo puede tener `imagen: '<archivo>'` (en `backend/assets/historia/`); el panel y
los documentos la muestran arriba de los campos del grupo, a todo el ancho.

### Sección 2 · Datos clínicos
1. **Antecedentes personales patológicos** — igual que hoy.
2. **Antecedentes personales no patológicos** (nuevo) — `parrafo('no_patologicos', 'Especificar')`.
3. **Antecedentes ginecológicos** — queda:
   - `texto('menstruacion', 'Menstruación (¿cómo es?)')`
   - `fecha('fum', 'Fecha de última menstruación (FUM)')`
   - `texto('planificacion_familiar', 'Planificación familiar (método)')`
   - Fórmula obstétrica: `numero('gestas','Gestas')`, `numero('partos','Partos')`, `numero('cesareas','Cesáreas')`, `numero('abortos','Abortos')`
   - `check('menopausia', 'Menopausia')`
   - Se quitan: `menstruacion_regular`, `menstruacion_dolorosa`, `metodo_anticonceptivo`, `parto_natural`, `cesarea`, `perdidas`, `esterilizacion`.
4. **Hábitos de vida** — tabaco, alcohol, cafeína y toxicomanía con su frecuencia (igual);
   `check('actividad_fisica', 'Actividad física', [tipo, tiempo])` con detalle "Tiempo" (cuánto tiempo hace
   ejercicio); `texto('sueno', …)` igual; `texto('agua', 'Agua al día (litros)')` reemplaza la opción;
   se quita la opción `dieta`; `parrafo('observaciones')` se mantiene.
5. **Alimentación** (nuevo grupo) — `texto` para `desayuno`, `media_manana` (Media mañana), `almuerzo`,
   `media_tarde` (Media tarde), `cena`.

### Sección 3 · Datos estéticos
1. **Rutina facial (skin care)** — reemplaza las rutinas diurna y nocturna. Casillas con detalle
   "Frecuencia": `skin_limpiador`, `skin_desmaquillante`, `skin_tonico`, `skin_serum`, `skin_hidratante`,
   `skin_protector`, `skin_maquillaje`, `skin_otro`; `parrafo('skin_especifique', 'Especifique')`.
2. **Mascarillas y exfoliantes** — igual.
3. **Antecedentes estéticos** — reemplaza "Procedimientos estéticos anteriores": `texto('antecedente_1'…
   'antecedente_6')` con etiquetas "1." a "6.".

### Sección 4 · Análisis estético
Todo lo actual se mantiene; al final se agregan:
- **Tipo facial** — `imagen: 'guia-tipos-faciales.png'`; `opcion('tipo_facial', 'Tipo facial',
  [braquifacial, mesofacial, dolicofacial])`.
- **Ubicación de grasa corporal** — `imagen: 'guia-grasa-corporal.png'`; casillas `grasa_abdominal`
  (Abdominal), `grasa_muslos` (Muslos), `grasa_cadera_cintura` (Cadera/cintura).

### Sección 5 · Diagnóstico
- Título "5. Diagnóstico". "Diagnóstico" con espacio amplio (en el formulario en blanco, al menos 6 líneas).
- Debajo, sin cambios: "Protocolo estético seleccionado" (tabla), **Fotos** (nuevo, ver abajo),
  "Tratamiento estético realizado" (tabla automática + manual).
- `procedimiento_autorizado` se mantiene (lo usa el consentimiento general).

### Sección 6 · Consentimiento (antes "Compromiso legal")
Ver "Consentimientos".

### Sección 1 · Datos personales y encabezado
- Encabezado del PDF/Word: además de la fecha de la evaluación, **"Emitido: dd/mm/aaaa"** = fecha de
  generación del documento (zona horaria America/La_Paz).
- "Dirección" se muestra siempre (vacía → línea para completar a mano), igual que en el formulario en blanco.

## Fotos de la paciente

- Columna nueva `historias_clinicas.fotos` JSON (`[]` por defecto) con `[{ archivo, nota }]`, getter
  `jsonCampo` como las demás.
- Archivos privados en la carpeta nueva `historias-fotos` de `archivosPrivados` (se agrega a `CARPETAS`).
- Rutas (permiso `historia_clinica`):
  - `POST /staff/historias/:id/fotos` (multipart `archivo`, campo `nota` opcional ≤ 120) → agrega una;
    máximo 10 por evaluación (409 al pasar).
  - `GET /staff/historias/:id/fotos/:archivo` → envía el archivo (solo si pertenece a esa historia).
  - `PATCH /staff/historias/:id/fotos/:archivo` `{ nota }` → cambia la nota.
  - `DELETE /staff/historias/:id/fotos/:archivo` → quita del JSON y borra el archivo.
- Tamaño: el panel **reduce cada foto en el navegador** a 1600 px de lado mayor, JPEG calidad 0,82
  (canvas), antes de subirla; así se aceptan fotos de celular grandes y WEBP/PNG, y el PDF no pesa de más.
  El servidor solo acepta JPEG o PNG (firma de bytes) de hasta 5 MB.
- Borrar la evaluación o la paciente borra también sus fotos (mismo patrón que `documento_firmado`).
- "Nueva evaluación" copiando la anterior **no copia** fotos ni consentimientos marcados.
- PDF y Word: debajo del protocolo, cuadrícula de 2 columnas, cada foto con su nota; en el formulario
  en blanco, un recuadro "Fotos" vacío.
- Panel: botón "Agregar fotos" (acepta varias y `capture` en celular), miniaturas, ver en grande, editar
  nota, borrar. Las imágenes se cargan con el token (fetch → blob URL), nunca por URL pública.

## Consentimientos

- `backend/src/config/consentimientos.js`: `CONSENTIMIENTOS = [{ clave, titulo, texto }]`. El `texto` admite
  marcadores `{paciente}`, `{ci}`, `{especialista}`, `{procedimiento}`, `{clinica}` que el documento rellena
  (vacíos → línea). Hoy contiene solo `general` = el texto actual del compromiso legal.
- Columna nueva `historias_clinicas.consentimientos` JSON (`[]`) con las claves marcadas; validación:
  solo claves existentes, sin repetir.
- Panel, sección 6: casillas con los títulos; si hay uno solo (hoy), se muestra marcado y fijo.
- Documento: cada consentimiento marcado → título + texto + firmas (paciente/C.I. y profesional) +
  fecha; ninguno marcado → el `general`. Formulario en blanco → el `general`.
- Agregar los textos de la clínica = agregar entradas al archivo; nada más cambia.

## Guías (imágenes)

- `backend/assets/historia/guia-tipos-faciales.png` y `guia-grasa-corporal.png` (las enviadas por la
  clínica), servidas públicamente en `GET /assets/historia/<archivo>` (no tienen datos de pacientes)
  para que el panel las muestre con `<img>`; los renderizadores PDF/Word las leen del disco.
- Si un archivo de guía falta, el documento sigue sin la imagen (no falla).

## Base de datos

- Migración `20261014000200-historia-fotos-consentimientos.js`: agrega `fotos` y `consentimientos` como
  JSON NOT NULL, igual que las columnas JSON existentes de la tabla (mismo patrón que la migración
  `20261014000000-historia-clinica.js`): se agregan permitiendo NULL, `UPDATE … SET fotos='[]',
  consentimientos='[]'`, y luego se cambian a NOT NULL; el modelo pone `[]` por defecto. Reflejar en
  `backend/sql/produccion.sql` (no se ejecuta, solo se edita).

## Errores y casos borde

- `numero` fuera de 0–99 o no entero → 400 con mensaje por campo; `fecha` inválida → 400.
- Foto: formato no permitido, > 5 MB, más de 10, o historia inexistente → 400/409/404 con mensaje claro.
- Foto pedida de otra historia o nombre manipulado (`../`) → 404.
- Consentimiento con clave desconocida → 400.
- Guía faltante en disco → documento sin imagen.

## Pruebas

- `test/historiaClinica.test.js`: validación de `numero` y `fecha`; claves quitadas se ignoran;
  armarDocumento incluye "Emitido", "No patológicos", Fórmula obstétrica, Alimentación, Antecedentes
  estéticos 1–6, Tipo facial, grasa corporal, sección "6. Consentimiento" con los consentimientos
  marcados y el general por defecto; rutas de fotos (subir, límite 10, formato, ver, nota, borrar, borrar
  historia borra archivos, copia de evaluación no copia fotos); consentimientos inválidos → 400;
  PDF y Word se generan con fotos y guías.
- Panel: tsc y lint; verificación en navegador del formulario nuevo, subir/borrar foto, consentimiento,
  descargas PDF/Word, 390 px.

## Fuera de alcance

Textos de consentimiento por procedimiento (llegan después), marcar sobre la imagen con el dedo,
comparación lado a lado de fotos entre evaluaciones.
