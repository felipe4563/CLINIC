# Historia clínica — diseño

**Fecha:** 2026-10-12
**Estado:** aprobado en conversación; pendiente la revisión de este documento.
**Fuente:** el formulario en papel de la Dra. Noemí (6 secciones). Ver la definición de campos más abajo.

## Objetivo

Reemplazar la historia clínica en papel por una dentro del panel. Debe:

- guardar varias evaluaciones con fecha por paciente;
- conectarse con las citas atendidas;
- descargarse en **PDF y Word** con el logo y los datos de la clínica.

El papel firmado se sigue usando para el compromiso legal.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Alcance | Ficha completa del papel: datos personales, clínicos, estéticos, análisis, diagnóstico, protocolo, tratamientos y compromiso legal |
| Versiones | Cada reevaluación es una **evaluación nueva con fecha**, creada como copia de la anterior. Las anteriores quedan para consultar y descargar |
| Edición | Siempre editable, sin bloqueo ni historial de versiones. Se muestra la última edición (fecha y usuario) |
| Tratamiento realizado | Automático (citas completadas) **más** filas manuales |
| Productos usados | Solo se registran en el texto. **No** descuenta stock |
| Firmas | En papel. Opcionalmente se sube el escaneo o la foto firmada |
| Quién llena | Solo el personal, en el panel |
| Acceso | Permiso nuevo `historia_clinica`. Por defecto lo tienen Admin y Profesional; Recepción no |
| Descargas | PDF, Word (.docx) y formulario en blanco, todos con logo y datos de la clínica |

Fuera de alcance:

- firma en pantalla;
- formulario para que lo llene la paciente desde la web;
- fotos de antes y después;
- descuento de stock;
- búsquedas o reportes por campo clínico.

## Arquitectura

### Una sola definición del formulario

`backend/src/config/historiaClinica.js` describe las secciones, grupos y campos del papel. Cada campo tiene:

- `clave`;
- `etiqueta`;
- `tipo`;
- `opciones`, cuando corresponde;
- `ancho`, como ayuda para el maquetado.

Los tipos son:

| Tipo | Valor guardado |
|---|---|
| `check` | `true` o `false` |
| `checks` | Varias casillas, guardadas como un arreglo de claves marcadas |
| `opcion` | Una sola opción, guardada como clave |
| `texto` | Línea corta |
| `parrafo` | Texto largo |
| `tabla` | Filas con columnas fijas |

Una casilla puede tener campos de detalle asociados: por ejemplo, "Tabaco" con "Frecuencia", o "Rellenos dérmicos" con "Tipo" y "Frecuencia".

Esta definición la usan cuatro piezas:

1. **La validación del backend.** Descarta las claves desconocidas, valida tipos y opciones y limita el largo del texto: 500 caracteres en `texto` y 4000 en `parrafo`.
2. **El formulario del panel.** Lo obtiene por la API y lo dibuja desde la definición, así que no hay campos escritos a mano.
3. **El generador de PDF.**
4. **El generador de Word.**

Cambiar una casilla es cambiar solo este archivo, sin migraciones.

### Datos

**Paciente** (columnas nuevas, todas opcionales):

| Columna | Tipo |
|---|---|
| `sexo` | ENUM(`F`, `M`) |
| `estado_civil` | ENUM(`S`, `C`, `D`, `V`) |
| `grupo_sanguineo` | VARCHAR(5) |
| `direccion` | VARCHAR(255) |
| `ocupacion` | VARCHAR(120) |
| `email` | VARCHAR(160) |
| `contacto_emergencia` | VARCHAR(160) |
| `parentesco_emergencia` | VARCHAR(60) |

La edad se calcula con `fecha_nacimiento`, y el N° de historia es `codigo_paciente`.

**`historias_clinicas`** (una fila por evaluación):

| Columna | Tipo | Nota |
|---|---|---|
| `id` | INT UNSIGNED PK | |
| `paciente_id` | FK pacientes, CASCADE | Usar `tipoIdDe`: en producción los id llevan signo |
| `fecha` | DATEONLY | Fecha de la evaluación |
| `motivo_consulta` | TEXT NULL | |
| `datos_clinicos` | JSON | Sección 2 |
| `datos_esteticos` | JSON | Sección 3 |
| `analisis_estetico` | JSON | Sección 4 |
| `diagnostico` | TEXT NULL | Sección 5 |
| `protocolo` | JSON | Filas `{procedimiento, sesiones, comentario}` |
| `procedimiento_autorizado` | VARCHAR(255) NULL | Se usa en el texto del compromiso legal. Por defecto, el primer procedimiento del protocolo |
| `profesional_id` | FK profesionales NULL | Especialista que firma |
| `documento_firmado` | VARCHAR NULL | Nombre del archivo privado (imagen o PDF) |
| `creado_por_id`, `actualizado_por_id` | FK usuarios | |
| `created_at`, `updated_at` | | |

**`notas_clinicas`** (existente): es la evolución por sesión. No cambia de estructura. Ya tiene `fecha`, `titulo`, `notas`, `profesional_id` y `cita_id`.

- Una fila **automática** de "Tratamiento realizado" es una cita `completada` de la paciente, con su nota clínica si la tiene.
- Una fila **manual** es una nota clínica sin `cita_id`.

### Tratamiento realizado (calculado, no se guarda)

Para una evaluación con fecha F, se toma el rango desde F hasta el día anterior a la evaluación siguiente, o hasta hoy si es la última. En ese rango:

- Cada cita `completada` es una fila con la fecha, el servicio como procedimiento y la observación de su nota clínica. Si no tiene nota, la fila muestra "Falta observación" y un botón que crea la nota ligada a la cita.
- Cada nota clínica sin cita es una fila manual con su fecha, título y notas.
- Las filas se ordenan por fecha.

### API (todas con `requirePermiso('historia_clinica')`)

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/staff/historia-clinica/definicion` | La definición del formulario |
| GET | `/staff/pacientes/:id/historias` | Lista de evaluaciones: id, fecha, autor y si tiene documento firmado |
| POST | `/staff/pacientes/:id/historias` | Crea una evaluación. Con `{copiarDe: id}` copia las secciones 2–5 de esa evaluación; la fecha es la de hoy |
| GET | `/staff/historias/:id` | La evaluación completa más sus filas de tratamiento calculadas |
| PUT | `/staff/historias/:id` | Guarda la evaluación, validada contra la definición |
| DELETE | `/staff/historias/:id` | Borra una evaluación creada por error. Solo Admin |
| POST / GET / DELETE | `/staff/historias/:id/documento-firmado` | Sube, ve o quita el escaneo firmado. Usa `archivosPrivados`, carpeta `historias` |
| GET | `/staff/historias/:id/pdf` | Descarga el PDF |
| GET | `/staff/historias/:id/word` | Descarga el Word |
| GET | `/staff/historia-clinica/en-blanco.pdf` y `.docx` | Formulario vacío |
| PATCH | `/staff/pacientes/:id` (existente) | Acepta los campos personales nuevos |

Los datos personales nuevos se editan con el formulario de paciente que ya existe, que gana esos campos.

### Descargas

- **PDF:** con `pdfkit`, que ya se usa (`services/pdf.js`, `rutaLogoEmbebible`).
  - Encabezado: logo, nombre de la clínica, dirección y teléfono.
  - Título "HISTORIA CLÍNICA", fecha y N° de historia.
  - Las secciones en el orden del papel. Las casillas se dibujan como ☒ / ☐ y los textos sobre líneas.
  - Las tablas de protocolo y tratamiento realizado.
  - El compromiso legal relleno, con dos líneas de firma y C.I.
  - Número de página en el pie.
- **Word:** con el paquete npm **`docx`**, que es una **dependencia nueva** del backend. Lleva la misma estructura, con el logo como imagen en el encabezado y tablas reales.
- **En blanco:** el mismo generador sin valores. Las líneas quedan vacías y todas las casillas en ☐.
- Nombres de archivo: `historia-clinica-<codigo>-<fecha>.pdf` y `.docx`.

### Panel

- **Ficha de la paciente:**
  - **Alerta roja** "Alergias: …" arriba, si la última evaluación marca Alergias. Se muestra el detalle de "Especificar".
  - Sección **"Historia clínica"**, solo con el permiso. Muestra la lista de evaluaciones con fecha, autor y ✓ firmado, y los botones **Nueva evaluación**, **Ver/editar**, **PDF**, **Word** y **Formulario en blanco**.
- **Editor de evaluación** (página `/pacientes/[id]/historia/[historiaId]`):
  - Las secciones 1 a 6 en bloques plegables. La sección 1 muestra los datos personales con un enlace para editarlos.
  - Un botón **Guardar** fijo arriba, igual que en Configuración, más el aviso "Tienes cambios sin guardar".
  - Las tablas de protocolo y tratamiento realizado, con las filas manuales.
  - La subida del documento firmado.
  - En tablet se usa en una sola columna.
- **Roles:** el permiso nuevo aparece en Usuarios y roles. Hay que agregarlo a `PERMISOS_POR_DEFECTO` de Admin y Profesional, y una migración agrega `historia_clinica` a los roles Admin y Profesional que ya existen.

## Errores y casos límite

| Caso | Comportamiento |
|---|---|
| Claves desconocidas o tipo inválido en un PUT | Se ignoran las desconocidas; un tipo inválido responde 400 indicando el campo |
| Copiar de una evaluación de otra paciente | 400 |
| Paciente sin fecha de nacimiento | Edad "—" |
| Clínica sin logo | El encabezado va sin imagen |
| Logo en formato no embebible (por ejemplo, webp) | Se omite el logo, sin error. Así lo hace hoy `rutaLogoEmbebible` |
| Documento firmado con formato inválido o más de 5 MB | 400, con la misma validación de firma de archivo que los comprobantes |
| Usuario sin permiso | 403. El panel oculta la sección y la alerta de alergias |
| Borrar a la paciente | CASCADE de sus evaluaciones; los documentos firmados se borran del disco |

## Pruebas

**Backend (Jest):**

- la definición es válida: claves únicas y tipos conocidos;
- crear, copiar de una anterior, editar y validar (descartar desconocidos, 400 por opción inválida, límite de largo);
- las filas de tratamiento: rango entre evaluaciones, cita sin nota marcada "falta", nota manual incluida, orden;
- permiso: 403 para Recepción;
- subir, ver y borrar el documento firmado;
- el PDF y el Word responden 200 con su content-type, y el archivo no está vacío; la versión en blanco también;
- los campos personales nuevos en PATCH de paciente.

**Navegador:** llenar una evaluación, guardar, copiarla, descargar el PDF y el Word y abrirlos para revisar el logo, las casillas y las tablas. Ver la alerta de alergias.

## Despliegue

- Hay dos migraciones nuevas: los campos de paciente más la tabla `historias_clinicas`, y el permiso en los roles. Corren solas con `deploy.sh`. Se reflejan en `backend/sql/produccion.sql`.
- `npm install docx` en el backend; va dentro de la imagen.
- Los documentos firmados van en el volumen `privado_data`, que ya existe.

## Anexo: campos del formulario (transcritos del papel)

`[ ]` es una casilla y `→` marca los campos de detalle de esa casilla. La redacción final de las etiquetas sale de este listado.

**Encabezado:** fecha (la de la evaluación) y N° de historia (`codigo_paciente`).

**1. Datos personales** (en la paciente):

- nombres y apellidos, fecha de nacimiento, edad (calculada), sexo F/M;
- C.I., estado civil S/C/D/V, grupo sanguíneo;
- dirección, ocupación, e-mail, teléfono;
- contacto de emergencia y parentesco.

En la evaluación: **motivo de la consulta** (párrafo).

**2. Datos clínicos**

- **Antecedentes personales patológicos** (checks): cardiovascular, pulmonar, renal, gastrointestinal, hematológica, endocrina, inmunológica, dermatológica, oftalmológica, neurológica, reumática, mental, sexual, odontológica y alergias. Además:
  - especificar (párrafo);
  - marcapasos [ ];
  - uso de prótesis: dentales, ortopédicas, mamarias [ ], y otras (texto);
  - procedimientos quirúrgicos (párrafo);
  - tratamiento médico actual (párrafo).
- **Antecedentes ginecológicos:**
  - menstruación regular [ ], dolorosa [ ];
  - método anticonceptivo (texto);
  - embarazos: parto natural [ ], cesárea [ ], pérdidas [ ];
  - menopausia [ ], esterilización [ ].
- **Hábitos de vida:**
  - tabaco [ ] → frecuencia;
  - alcohol [ ] → frecuencia;
  - cafeína [ ] → frecuencia;
  - toxicomanía [ ] → frecuencia;
  - horas y calidad de sueño (texto);
  - actividad física [ ] → tipo, frecuencia;
  - dieta (opción): balanceada / desequilibrada / vegana / vegetariana;
  - observaciones (párrafo);
  - agua al día (opción): muy poca / poca / adecuada / mucha.

**3. Datos estéticos**

- **Rutina facial diurna** (checks): limpiador facial, tónico, sérum, hidratante/humectante, protector solar, maquillaje, otro. Más especifique (párrafo).
- **Rutina facial nocturna** (checks): desmaquillante, limpiador facial, tónico, sérum, hidratante/humectante, otro. Más especifique (párrafo).
- Uso de mascarillas [ ] → tipo, frecuencia.
- Uso de exfoliantes [ ] → tipo, frecuencia.
- **Procedimientos estéticos anteriores:**
  - toxina botulínica [ ] → frecuencia;
  - rellenos dérmicos [ ] → tipo, frecuencia;
  - hilos tensores [ ] → frecuencia;
  - PRP [ ] → frecuencia;
  - peeling químico [ ] → frecuencia;
  - micropunción dérmica [ ] → frecuencia;
  - limpieza facial profunda [ ] → frecuencia;
  - terapia láser [ ] → tipo, frecuencia;
  - otros (párrafo).

**4. Análisis estético**

- **Fototipo** (opción): I, II, III, IV, V, VI.
- **Tipología** (checks): normal, seca, mixta, sensible, grasa (subtipos seborreica, deshidratada, asfíctica) y desvitalizada.
- **Grado de deshidratación** (opción): leve / medio / alto.
- **Grosor de piel** (opción): levemente, medianamente o muy gruesa; levemente, medianamente o muy fina.
- **Hipercromías** (checks): mácula, mancha, melasma, nevos, efélides, lentigos. Más tiempo de aparición, causa, localización y observación.
- **Hipocromías** (checks): micosis solar, vitíligo, otros. Más especifique y localización.
- **Cicatrices** (checks): normotrófica, atrófica, hipertrófica, queloide. Más tiempo de aparición, causa y localización.
- **Flacidez:** grado (opción I/II/III) y localización.
- **Arrugas** (checks): dinámicas, estáticas, mixtas, superficiales, profundas. Más localización.
- **Líneas de expresión:** localización.
- **Patologías cutáneas** (checks): eritema, vesículas, costras, queratosis, pápulas, pústulas, cuperosis, eczema, quistes, milliums, xantelasmas, telangiectasias, rosácea, poros visibles. Más otros y localización.
- **Acné:** grado (opción I/II/III/IV), localización y observación.

**5. Diagnóstico y tratamiento estético**

- diagnóstico (párrafo);
- protocolo (tabla: procedimiento / sesiones / comentario);
- tratamiento realizado (calculado: fecha / procedimiento / observación).

**6. Compromiso legal** (texto fijo, relleno con los datos):

> Yo **{nombre}** portador(a) de la C.I **{CI}** certifico que la información consignada en el presente documento es verdadera. Asimismo, autorizo al especialista **{profesional}** a realizar el siguiente procedimiento **{procedimiento_autorizado}**. Conozco todos sus efectos y complicaciones, acepto las recomendaciones sugeridas y eximo de toda responsabilidad a **{nombre de la clínica}** por cualquier alteración que se pueda presentar debido al tratamiento a realizar.

Abajo van las líneas "Firma del paciente / C.I." y "Firma del especialista / C.I.".
