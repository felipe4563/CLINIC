# Reserva con QR fijo + comprobante y política de inasistencia

Fecha: 2026-10-12 · Estado: diseño aprobado en conversación, pendiente de
revisión escrita.

## 1. Objetivo

La clínica quiere un modo de reserva en el que el paciente paga escaneando
**el QR fijo de la clínica**, sube **la foto del comprobante** y su cita
queda **confirmada al instante**. El personal revisa el comprobante después.

Además, toda reserva con pago adelantado queda sujeta a una **política de
inasistencia**:

- si el paciente no viene, pierde el monto depositado;
- si justifica la ausencia, se le reprograma sin volver a pagar.

### Decisiones tomadas

| Tema | Decisión |
|---|---|
| Convivencia con el QR del banco | Conviven. Configuración elige el modo: sin pago online, QR del banco automático o QR fijo + comprobante |
| Estado al enviar con comprobante | Confirmada al instante. El personal puede anularla si el comprobante es inválido |
| Identificación del paciente | Igual que hoy: código por WhatsApp (OTP) |
| Porcentaje | Se mantiene la elección 50 % / 100 % en los dos modos con pago |
| Inasistencia justificada | Se reprograma la misma cita sin volver a pagar |
| Prueba de la justificación | El paciente la envía a la clínica (WhatsApp) y el personal la adjunta |
| Plazo para justificar | 48 h desde la hora de inicio de la cita (fijo en código) |
| Plazo para reprogramar | 30 días desde que se acepta la justificación (fijo en código) |
| Reprogramaciones gratis | Una por pago |
| Fuera de plazo | El sistema avisa, pero no bloquea: decide el personal |
| Cancelación con aviso previo | Fuera de alcance por ahora |
| Proveedor de WhatsApp | Se mantiene la API directa de Meta. Twilio no evita las plantillas |

### Fuera de alcance

- Reglas de cancelación anticipada (por ejemplo, reprogramar gratis avisando
  con 24 h).
- Reembolsos.
- Que el paciente suba la justificación por sí mismo desde la web.
- Plazos configurables desde el panel.
- Movimiento de caja automático por los adelantos. Hoy el QR del banco
  tampoco lo crea; se mantiene igual.

## 2. Enfoque

Se **extienden los modelos existentes** (`Pago`, `Cita`,
`ConfiguracionClinica`). No se crean tablas nuevas. Reprogramar mueve la misma
cita, así que caja, reportes, puntos y recordatorios siguen funcionando sin
cambios.

## 3. Modelo de datos

Hay una migración nueva y su espejo en `backend/sql/produccion.sql` (regla de
`backend/CLAUDE.md`). No se crean claves foráneas a tablas viejas, salvo
`comprobante_revisado_por_id`, que usa `tipoIdDe` (ver la memoria
`prod-fk-signed-ids`: en producción los ids son INT con signo).

### `configuracion_clinica`

| Columna | Tipo | Notas |
|---|---|---|
| `metodo_pago_online` | ENUM('ninguno','qr_banco','qr_fijo') NOT NULL DEFAULT 'qr_banco' | Reemplaza a `cobra_adelanto_online` |
| `qr_fijo_url` | VARCHAR(255) NULL | Imagen pública del QR (`/uploads/qr/...`) |
| `qr_fijo_datos` | VARCHAR(255) NULL | Texto opcional para el paciente, por ejemplo "Titular: … — Banco …" |
| `politica_inasistencia` | TEXT NULL | Si está vacía, se usa el texto por defecto (§7) |

**Migración de datos:**

- `cobra_adelanto_online = 1` pasa a `'qr_banco'`.
- `cobra_adelanto_online = 0` pasa a `'ninguno'`.

Después se **elimina** `cobra_adelanto_online` y se actualizan todos sus usos:
`citas.js`, `catalogo.js` (configuracion-publica), `staffConfiguracion.js`,
`staff/configuracion/page.tsx`, `StepConfirmar.tsx` y `public-site/lib/types.ts`.

El `down` de la migración recrea la columna con
`metodo_pago_online != 'ninguno'`.

### `pagos`

| Columna | Tipo | Notas |
|---|---|---|
| `metodo_adelanto` | ENUM('qr_banco','qr_fijo') NULL | NULL en citas sin pago online o creadas por el personal |
| `comprobante_archivo` | VARCHAR(255) NULL | Nombre del archivo en el directorio privado. Nunca es una URL pública |
| `comprobante_revision` | ENUM('sin_revisar','valido','invalido') NULL | Solo con `qr_fijo` |
| `comprobante_revisado_por_id` | INT (tipo según `tipoIdDe('usuarios')`) NULL, FK usuarios ON DELETE SET NULL | |
| `comprobante_revisado_en` | DATETIME NULL | |

En el modo `qr_fijo`, el pago se crea con `estado = 'pagado'`. El paciente
declara haber pagado y la revisión puede revertirlo: si es inválido, pasa a
`'fallido'`.

### `citas`

| Columna | Tipo | Notas |
|---|---|---|
| `politica_aceptada_en` | DATETIME NULL | Momento en que el paciente marcó "Acepto" |
| `justificacion_estado` | ENUM('aceptada','rechazada') NULL | |
| `justificacion_archivo` | VARCHAR(255) NULL | Directorio privado |
| `justificacion_nota` | TEXT NULL | |
| `justificacion_registrada_en` | DATETIME NULL | Desde aquí corren los 30 días para reprogramar |
| `reprogramacion_usada` | BOOLEAN NOT NULL DEFAULT 0 | |
| `fecha_original` | DATEONLY NULL | Fecha antes de reprogramar, para el historial |
| `hora_original` | TIME NULL | |

## 4. Archivos privados

Hoy `app.js` sirve todo `uploads/` por URL pública, sin sesión. Los
comprobantes y las justificaciones tienen datos bancarios y personales, así
que van **fuera** de esa carpeta:

- Directorio `backend/privado/`, con las subcarpetas `comprobantes/` y
  `justificaciones/`. Se agrega `**/privado/` al `.gitignore` y `privado` a
  `backend/.dockerignore`.
- En `docker-compose.yml`, un volumen nuevo `privado_data:/app/privado`.
- Nombres de archivo aleatorios (`crypto.randomUUID()` + extensión). Nunca el
  nombre original.
- Se admiten JPG, PNG, WebP y PDF de hasta 5 MB. `multer` limita el tamaño y
  el tipo MIME declarado, como en las subidas que ya existen. Además, un
  helper nuevo comprueba la firma del archivo (bytes iniciales), porque el
  tipo MIME lo declara el navegador y se puede falsear.
- Lectura **solo** desde:
  - `GET /staff/pagos/:id/comprobante`
  - `GET /staff/citas/:id/justificacion`

  Las dos requieren el permiso `agenda` y responden con `Content-Type` y
  `Content-Disposition: inline`. El panel las abre con `fetch` autenticado y
  muestra un `blob:` (imagen o PDF).

## 5. Flujo del paciente (sitio público)

```
Servicio → Profesional → Horario → Login WhatsApp → Confirmar (50% / 100%)
  → Pago (según el modo)
  → Confirmada
```

### Paso Confirmar

- Muestra la política de inasistencia, con un enlace "ver política
  completa" que la despliega, y la casilla **"Acepto la política de
  inasistencia"** en los modos `qr_banco` y `qr_fijo`.
- En el modo `ninguno` no aparece la política ni la casilla.
- En `qr_banco`, el botón sigue creando la cita como hoy. Ahora además exige
  la casilla y envía `aceptaPolitica: true`.
- En `qr_fijo`, el botón **no crea la cita**: lleva al paso de pago.

### Paso Pago, modo `qr_fijo`

- Muestra la imagen del QR de la clínica, el monto ("Paga Bs 425.00
  escaneando este QR") y `qr_fijo_datos`, si existe.
- Tiene un campo para subir el comprobante, con vista previa en el caso de
  las imágenes.
- El botón **"Enviar reserva"** se habilita solo cuando hay un comprobante.
  La casilla de la política ya quedó marcada en el paso anterior.
- Envía `POST /citas` como `multipart/form-data`, con los mismos campos que
  hoy más `aceptaPolitica` y `comprobante`.

### Backend `POST /citas` (cambios)

1. Lee `metodo_pago_online`.
2. Si el modo es `qr_banco` o `qr_fijo`, exige `aceptaPolitica === true`
   (400 si falta) y guarda `politica_aceptada_en`.
3. Si el modo es `qr_fijo`:
   - exige el archivo (400 si falta);
   - **vuelve a comprobar el horario** y, si se ocupó, responde 409 "Ese
     horario acaba de ocuparse, elige otro" y **borra el archivo subido**;
   - crea la cita `confirmada` y el pago `pagado`, con
     `metodo_adelanto = 'qr_fijo'` y `comprobante_revision = 'sin_revisar'`;
   - envía el WhatsApp `cita_confirmada` (igual que `confirmarPago`).
4. Si el modo es `qr_banco`, todo sigue como hoy y se agrega
   `metodo_adelanto = 'qr_banco'`.
5. Si el modo es `ninguno`, todo sigue como hoy.
6. Si falla cualquier paso después de guardar el archivo, se borra el archivo
   y se revierte la transacción.

No existe ninguna ruta para que el paciente vuelva a ver su comprobante:
solo lo lee el personal (§4).

## 6. Panel del personal

### Agenda: revisión de comprobantes

- Las tarjetas de cita con `metodo_adelanto = 'qr_fijo'` muestran una
  etiqueta: 🟡 Comprobante sin revisar, 🟢 Válido o 🔴 Inválido.
- Al tocarla se abre un modal con:
  - el comprobante;
  - el monto esperado, el porcentaje y el total del servicio;
  - los botones **Válido** e **Inválido**.
- `PATCH /staff/pagos/:id/revision` con el body `{ resultado: 'valido' | 'invalido' }`:
  - **Válido:** guarda la revisión, quién la hizo y cuándo.
  - **Inválido:** pide confirmación en la interfaz ("Se cancelará la cita y
    se liberará el horario"). Pone el pago en `fallido` y la cita en
    `cancelada`, y envía el aviso de anulación por WhatsApp (§8).
  - Se puede cambiar una revisión ya hecha solo de `valido` a `invalido`. No
    se puede reactivar una cita cancelada desde aquí.
- Aviso **"N comprobantes por revisar"** en la Agenda, que filtra esas citas,
  y en el Inicio (contador desde `staffDashboard`).

### Agenda: inasistencia, justificación y reprogramación

Cuando una cita con pago adelantado (`metodo_adelanto` no nulo) está en
`no_asistio`, la tarjeta muestra:

- **"Monto retenido · puede justificar hasta DD/MM HH:MM"**, es decir la
  fecha y hora de la cita más 48 h. Pasado ese momento, muestra "Fuera de
  plazo" en ámbar.
- El botón **"Registrar justificación"** abre un modal para:
  - subir el archivo, que es opcional (puede justificarse solo con la nota);
  - escribir la nota, que es obligatoria;
  - elegir **Aceptar** o **Rechazar**.
- `POST /staff/citas/:id/justificacion` (multipart) recibe
  `{ decision: 'aceptada' | 'rechazada', nota, archivo? }`. Responde 400 si la
  cita no está en `no_asistio` o si ya tiene una justificación.
- Si la justificación se aceptó, la cita no usó su reprogramación y no
  pasaron 30 días, aparece **"Reprogramar"**:
  - abre el mismo selector de fecha y hora del alta de citas;
  - `PATCH /staff/citas/:id/reprogramar` con `{ fecha, horaInicio }`:
    - comprueba el horario con `getSlotsDisponibles` (409 si está ocupado);
    - guarda `fecha_original` y `hora_original`;
    - mueve la cita, la pone en `confirmada` y marca
      `reprogramacion_usada = 1`;
    - envía el WhatsApp `cita_confirmada` con la nueva fecha;
  - pasados los 30 días, el botón sigue visible con el aviso "Fuera de
    plazo", y el backend lo permite (decide el personal).
  - si `reprogramacion_usada = 1`, el botón no aparece y se muestra
    "Ya se reprogramó una vez".
- El personal puede ver el archivo de la justificación desde la tarjeta.

### Reportes

En el reporte de citas se agrega una fila o columna **"Montos retenidos por
inasistencia"**: la suma de `pagos.monto` de las citas en `no_asistio`, con
pago `pagado` y sin justificación aceptada, dentro del rango. También va en
el PDF.

## 7. Configuración

En Configuración → Pagos, el interruptor "Cobrar adelanto online" pasa a
ser un grupo de tres opciones:

- Sin pago online
- QR del banco automático
- QR fijo + comprobante

Además:

- **Imagen del QR:** se sube y se reemplaza igual que el logo
  (`/uploads/qr/`, pública), con vista previa.
- **Datos para el paciente:** un campo de texto opcional.
- No se puede guardar `qr_fijo` sin `qr_fijo_url`: el backend responde 400 y
  la interfaz muestra el aviso "Sube primero la imagen del QR".
- **Política de inasistencia:** un área de texto. Si está vacía, se muestra el
  texto por defecto, que también se usa para llenarla la primera vez.
- `GET /configuracion-publica` devuelve `metodo_pago_online`, `qr_fijo_url`,
  `qr_fijo_datos` y `politica_inasistencia` (o el texto por defecto). Deja
  de devolver `cobra_adelanto_online`.

### Texto por defecto de la política

> Al reservar tu cita realizas un pago anticipado que asegura tu horario.
> Ese horario queda reservado exclusivamente para ti, y la clínica deja de
> ofrecerlo a otros pacientes.
>
> **Si no asistes a tu cita, pierdes el monto depositado.**
>
> Si no pudiste asistir por un motivo justificado (por ejemplo, enfermedad o
> emergencia), puedes enviar una prueba a la clínica por WhatsApp, como un
> certificado médico u otro documento, **dentro de las 48 horas siguientes** a
> la hora de tu cita. Si la clínica acepta la justificación, **podrás
> reprogramar tu cita para otro día sin volver a pagar**, dentro de los
> **30 días** siguientes.
>
> La reprogramación sin costo se concede **una sola vez por pago**. La clínica
> evalúa cada justificación y su decisión es final.

Los plazos de 48 h y 30 días son constantes en un único módulo del backend
(`src/services/politicaInasistencia.js`), que exporta el texto por defecto, los
plazos y una función `plazos(cita)`. Esa función devuelve `limiteJustificar`,
`limiteReprogramar`, `puedeReprogramar` y `fueraDePlazo`. La usan las rutas
y la lista de citas del panel, que recibe esos campos ya calculados.

## 8. WhatsApp

- Se mantiene la API directa de Meta (`services/whatsapp.js`).
- **Confirmación** del modo `qr_fijo` y **reprogramación**: plantilla
  existente `cita_confirmada` con `[fecha, hora]`.
- **Anulación por comprobante inválido**: plantilla nueva, general y
  reutilizable, `aviso_cita` (categoría Utilidad):

  > Hola {{1}}, te escribimos de Clinic NovagED sobre tu cita del {{2}}: {{3}}

  Su nombre sale de `WHATSAPP_AVISO_TEMPLATE` (igual que
  `WHATSAPP_OTP_TEMPLATE`). **Si la variable no está definida, el aviso no se
  envía**: se registra en el log y la interfaz le avisa al personal "Avisa al
  paciente: la plantilla de WhatsApp no está configurada". La anulación no
  falla por esto.
- Un error al enviar el WhatsApp nunca revierte la operación. Se registra y
  se avisa en la respuesta (`avisoWhatsApp: 'enviado' | 'no_configurado' |
  'error'`).

## 9. Errores y casos límite

| Caso | Comportamiento |
|---|---|
| El horario se ocupa mientras el paciente sube el comprobante | 409 y archivo borrado. El paso de pago vuelve a Horario conservando el servicio y el profesional |
| Archivo de tipo o tamaño no admitido | 400 con mensaje claro. La interfaz valida antes de enviar |
| Se cambia de `qr_fijo` a otro modo con citas sin revisar | Se permite. Las citas existentes conservan su revisión pendiente |
| Se borra o reemplaza el QR | Reemplazar es posible. Si se intenta borrar mientras el modo es `qr_fijo`, responde 400 |
| Justificar una cita que no está en `no_asistio` | 400 |
| Reprogramar dos veces | 400 "Ya se reprogramó una vez" |
| Revisar un pago que no es `qr_fijo` | 400 |
| Usuario sin permiso `agenda` | 403 en todas las rutas nuevas del personal |

## 10. Pruebas

En el backend, con jest + supertest y `novaged_test`:

**`POST /citas`**
- en `qr_fijo` sin archivo responde 400;
- sin `aceptaPolitica` responde 400;
- con archivo válido crea la cita `confirmada` y el pago `pagado` y
  `sin_revisar`, y el archivo queda en el directorio privado;
- con el horario ocupado responde 409 y no deja archivo;
- en `ninguno` no exige la política.

**Archivos**
- `/uploads/...` no expone comprobantes;
- `GET /staff/pagos/:id/comprobante` responde 401 sin sesión, 403 sin
  permiso y 200 con permiso.

**Revisión**
- `valido` guarda quién revisó;
- `invalido` cancela la cita, pone el pago en `fallido` y libera el horario
  (aparece en `getSlotsDisponibles`).

**Justificación y reprogramación**
- `aceptada` habilita la reprogramación;
- reprogramar mueve la cita y guarda la fecha original;
- un segundo intento responde 400;
- un horario ocupado responde 409.

**Política**
- `plazos(cita)`: límites correctos y `fueraDePlazo` antes y después.

**Configuración**
- no deja guardar `qr_fijo` sin QR;
- la migración traduce correctamente `cobra_adelanto_online`.

**Reportes**
- suma de montos retenidos.

En el frontend: comprobar en el navegador los tres modos de punta a punta en
la web pública, y la revisión, la justificación y la reprogramación en el
panel, en escritorio y en celular.

## 11. Despliegue

- Es una sola migración. El contenedor `api` la corre al arrancar.
- Hay que agregar el volumen `privado_data` en `docker-compose.yml`.
- Opcional en el `.env` del VPS: `WHATSAPP_AVISO_TEMPLATE`, después de que
  Meta apruebe `aviso_cita`.
- Se actualiza `backend/sql/produccion.sql` y se prueba cargándolo (regla de
  `backend/CLAUDE.md`).
