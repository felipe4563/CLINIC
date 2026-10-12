# Reserva con QR fijo + comprobante — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** agregar un tercer modo de pago para reservar ("QR fijo +
comprobante") y la política de inasistencia: aceptación al reservar,
justificación y reprogramación sin volver a pagar.

**Architecture:** se extienden los modelos `ConfiguracionClinica`, `Pago` y
`Cita` con una sola migración. Hay dos servicios nuevos sin estado:

- `politicaInasistencia.js`: plazos y texto por defecto;
- `archivosPrivados.js`: subida, validación por firma y lectura de archivos
  fuera de `/uploads`.

Las rutas nuevas del personal viven en `staffComprobantes.js` y
`staffInasistencias.js`. El sitio público agrega un paso de pago con
comprobante y la casilla de la política. El panel agrega modales en la Agenda
y el selector de modo en Configuración.

**Tech Stack:**
- Backend: Express 5, Sequelize 6 (MySQL / MariaDB), multer 2, jest + supertest.
- Frontends: Next.js 16 (App Router, componentes cliente) y Tailwind.

**Spec:** `docs/superpowers/specs/2026-10-12-reserva-qr-fijo-comprobante-design.md`

## Global Constraints

- **No hacer commit ni push sin autorización explícita del usuario.** Cada
  tarea termina con una revisión de `git status` y `git diff`, no con un
  commit.
- **Formatos de archivo:** JPG, PNG, WebP y PDF de hasta **5 MB**. El tipo se
  valida por la firma del contenido.
- **Mensaje de formato inválido**, exacto: `Sube una imagen (JPG, PNG o WebP) o un PDF de hasta 5 MB`.
- **Plazos:** 48 h desde la hora de inicio de la cita para justificar, y
  30 días desde que se registra la justificación para reprogramar. Son
  constantes en código.
- **Reprogramaciones:** una sola reprogramación gratis por cita.
- **Fuera de plazo:** el backend **no bloquea**. Solo informa
  (`justificacionFueraDePlazo`, `reprogramacionFueraDePlazo`).
- **Archivos privados:** nunca se sirven desde `/uploads`. Viven en
  `process.env.PRIVADO_DIR` o `backend/privado/`.
- **IDs de producción:** son INT con signo. Toda FK nueva hacia una tabla
  vieja usa `tipoIdDe` (memoria `prod-fk-signed-ids`).
- **`produccion.sql`:** cada cambio de esquema se refleja en
  `backend/sql/produccion.sql` en el mismo turno (`backend/CLAUDE.md`).
- **Horas:** se usa la hora local del servidor, igual que en
  `services/disponibilidad.js`.
- **Tests:** la suite completa del backend falla por un problema previo
  (`docs/pendientes.md` #4). Cada archivo de test se corre por separado con
  `npx jest test/<archivo> --runInBand`.
- **Plantillas de WhatsApp:**
  - `cita_confirmada [fecha, hora]` para confirmar y reprogramar.
  - `WHATSAPP_AVISO_TEMPLATE [nombre, "fecha hora", mensaje]` para la
    anulación. Si la variable no existe, el aviso no se envía y la respuesta
    trae `avisoWhatsApp: 'no_configurado'`.
- **Secretos:** nunca imprimir valores de `backend/.env`.

## Review Focus

1. **Doble clic en "Enviar reserva".** Se espera una sola cita, y que la
   segunda petición dé 409 sin dejar un archivo huérfano. Test en la tarea 5;
   el botón se deshabilita en la tarea 9.
2. **Archivo de más de 5 MB.** Se espera un 400 con el mensaje de formato, no
   un 500. Test en las tareas 3 y 5.
3. **Un `.exe` renombrado a `.jpg` y enviado como `image/jpeg`.** Se espera un
   400. Test en las tareas 3 y 5.
4. **Fallo del WhatsApp al confirmar.** Se espera que la reserva igual quede
   creada (201) con `avisoWhatsApp: 'error'`. Test en la tarea 5.
5. **Marcar "Inválido" sobre una cita ya completada.** Se espera un 400 y que
   la cita y el pago no cambien. Test en la tarea 6.

---

## Mapa de archivos

**Backend (crear)**

| Archivo | Para qué |
|---|---|
| `src/services/politicaInasistencia.js` | Constantes, texto por defecto, `plazos()` y `conPolitica()` |
| `src/services/archivosPrivados.js` | Multer en memoria, `detectarTipo`, guardar, borrar y enviar |
| `src/services/avisosCita.js` | `enviarConfirmacionCita` y `enviarAvisoCita`, que devuelven el estado del aviso |
| `src/migrations/20261012000000-reserva-qr-fijo-comprobante.js` | Migración |
| `src/routes/staffComprobantes.js` | Ver comprobante y revisarlo |
| `src/routes/staffInasistencias.js` | Justificación (registrar y ver) y reprogramación |
| `test/helpers/archivos.js` | Buffers falsos: PNG, PDF, EXE y PNG grande |
| `test/politicaInasistencia.test.js` | |
| `test/archivosPrivados.test.js` | |
| `test/avisosCita.test.js` | |
| `test/configuracionPago.test.js` | |
| `test/reservaComprobante.test.js` | |
| `test/comprobantes.test.js` | |
| `test/inasistencias.test.js` | |
| `test/reportesRetenidos.test.js` | |

**Backend (modificar)**

- `src/models/configuracionClinica.js`, `src/models/pago.js`,
  `src/models/cita.js` y `src/models/index.js`.
- `src/routes/citas.js`, `src/routes/catalogo.js`,
  `src/routes/staffConfiguracion.js`, `src/routes/staffAgenda.js`,
  `src/routes/staffDashboard.js` y `src/routes/staffReportes.js`.
- `src/app.js`.
- `test/citas.test.js` y `test/pagos.test.js`: agregar `aceptaPolitica: true`.
- `sql/produccion.sql` y `.dockerignore`.

**Raíz (modificar)**

- `.gitignore`.
- `docker-compose.yml`.
- `e2e/tests/public-site-booking.spec.js`.

**Sitio público**

- Crear:
  - `src/components/booking/PoliticaInasistencia.tsx`;
  - `src/components/booking/StepPagoComprobante.tsx`.
- Modificar:
  - `src/lib/types.ts`, `src/lib/api.js` y `src/lib/bookingContext.tsx`;
  - `src/components/booking/StepConfirmar.tsx`, `BookingModal.tsx` y
    `StepConfirmada.tsx`.

**Panel del personal**

- Crear:
  - `src/app/agenda/politica.ts`;
  - `src/app/agenda/ArchivoPrivado.tsx`;
  - `src/app/agenda/ComprobanteModal.tsx`;
  - `src/app/agenda/JustificacionModal.tsx`;
  - `src/app/agenda/ReprogramarModal.tsx`.
- Modificar:
  - `src/lib/api.js`;
  - `src/app/agenda/DayAgendaCards.tsx` y `src/app/agenda/page.tsx`;
  - `src/app/configuracion/page.tsx`;
  - `src/app/dashboard/page.tsx`;
  - `src/app/reportes/page.tsx`.

---

### Task 1: Servicio de política de inasistencia

**Files:**
- Create: `backend/src/services/politicaInasistencia.js`
- Test: `backend/test/politicaInasistencia.test.js`

**Interfaces:**
- Produces:
  - `HORAS_PARA_JUSTIFICAR: 48` y `DIAS_PARA_REPROGRAMAR: 30`.
  - `TEXTO_POR_DEFECTO: string`.
  - `plazos(cita: object, ahora?: Date)`, que devuelve:

    ```
    { conAdelanto, montoRetenido, puedeJustificar, puedeReprogramar,
      limiteJustificar: string ISO, justificacionFueraDePlazo: boolean,
      limiteReprogramar: string ISO | null, reprogramacionFueraDePlazo: boolean }
    ```

    `cita` es un objeto plano con `fecha`, `hora_inicio`, `estado`,
    `justificacion_estado`, `justificacion_registrada_en`,
    `reprogramacion_usada` y `Pago`; este último con `metodo_adelanto` y
    `estado`, o `null`.
  - `conPolitica(citaInstanciaOPlano)`: devuelve el JSON de la cita con
    `politica: plazos(...)`. Además quita `Pago.comprobante_archivo` y
    `justificacion_archivo`, y en su lugar agrega `Pago.tieneComprobante` y
    `tieneJustificacion` (booleanos).

- [ ] **Step 1: Write the failing test**

```js
// backend/test/politicaInasistencia.test.js
const {
  HORAS_PARA_JUSTIFICAR,
  DIAS_PARA_REPROGRAMAR,
  TEXTO_POR_DEFECTO,
  plazos,
  conPolitica,
} = require('../src/services/politicaInasistencia');

function cita(extra = {}) {
  return {
    fecha: '2026-10-19',
    hora_inicio: '10:30:00',
    estado: 'no_asistio',
    justificacion_estado: null,
    justificacion_registrada_en: null,
    reprogramacion_usada: false,
    Pago: { metodo_adelanto: 'qr_fijo', estado: 'pagado' },
    ...extra,
  };
}

describe('politicaInasistencia', () => {
  test('constantes y texto por defecto', () => {
    expect(HORAS_PARA_JUSTIFICAR).toBe(48);
    expect(DIAS_PARA_REPROGRAMAR).toBe(30);
    expect(TEXTO_POR_DEFECTO).toContain('pierdes el monto depositado');
    expect(TEXTO_POR_DEFECTO).toContain('48 horas');
    expect(TEXTO_POR_DEFECTO).toContain('30 días');
  });

  test('el límite para justificar es la hora de la cita + 48 h (hora local)', () => {
    const p = plazos(cita(), new Date(2026, 9, 20, 9, 0));
    expect(new Date(p.limiteJustificar).getTime()).toBe(new Date(2026, 9, 21, 10, 30).getTime());
    expect(p.justificacionFueraDePlazo).toBe(false);
    expect(p.puedeJustificar).toBe(true);
    expect(p.montoRetenido).toBe(true);
  });

  test('pasadas las 48 h queda fuera de plazo pero sigue pudiendo justificarse', () => {
    const p = plazos(cita(), new Date(2026, 9, 21, 10, 31));
    expect(p.justificacionFueraDePlazo).toBe(true);
    expect(p.puedeJustificar).toBe(true);
  });

  test('sin pago adelantado no hay monto retenido ni justificación', () => {
    const p = plazos(cita({ Pago: { metodo_adelanto: null, estado: 'pagado' } }));
    expect(p.conAdelanto).toBe(false);
    expect(p.montoRetenido).toBe(false);
    expect(p.puedeJustificar).toBe(false);
  });

  test('un pago fallido no cuenta como adelanto', () => {
    expect(plazos(cita({ Pago: { metodo_adelanto: 'qr_fijo', estado: 'fallido' } })).conAdelanto).toBe(false);
  });

  test('justificación aceptada: puede reprogramar durante 30 días, y ya no hay monto retenido', () => {
    const registrada = new Date(2026, 9, 20, 12, 0);
    const c = cita({ justificacion_estado: 'aceptada', justificacion_registrada_en: registrada.toISOString() });
    const dentro = plazos(c, new Date(2026, 10, 18, 12, 0));
    expect(dentro.puedeReprogramar).toBe(true);
    expect(dentro.puedeJustificar).toBe(false);
    expect(dentro.montoRetenido).toBe(false);
    expect(new Date(dentro.limiteReprogramar).getTime()).toBe(registrada.getTime() + 30 * 24 * 3600 * 1000);
    expect(dentro.reprogramacionFueraDePlazo).toBe(false);
    expect(plazos(c, new Date(2026, 10, 20, 12, 0)).reprogramacionFueraDePlazo).toBe(true);
  });

  test('justificación rechazada: el monto sigue retenido y no puede reprogramar', () => {
    const p = plazos(cita({ justificacion_estado: 'rechazada', justificacion_registrada_en: new Date().toISOString() }));
    expect(p.montoRetenido).toBe(true);
    expect(p.puedeReprogramar).toBe(false);
  });

  test('ya reprogramada una vez: no puede volver a reprogramar', () => {
    const p = plazos(cita({ justificacion_estado: 'aceptada', justificacion_registrada_en: new Date().toISOString(), reprogramacion_usada: true }));
    expect(p.puedeReprogramar).toBe(false);
  });

  test('conPolitica oculta los nombres de archivo y agrega banderas', () => {
    const json = conPolitica({
      ...cita({ justificacion_archivo: 'abc.pdf' }),
      Pago: { metodo_adelanto: 'qr_fijo', estado: 'pagado', comprobante_archivo: 'x.png' },
    });
    expect(json.Pago.comprobante_archivo).toBeUndefined();
    expect(json.Pago.tieneComprobante).toBe(true);
    expect(json.justificacion_archivo).toBeUndefined();
    expect(json.tieneJustificacion).toBe(true);
    expect(json.politica.montoRetenido).toBe(true);
  });

  test('conPolitica acepta una cita sin Pago', () => {
    const json = conPolitica({ ...cita(), Pago: null });
    expect(json.Pago).toBeNull();
    expect(json.politica.conAdelanto).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest test/politicaInasistencia.test.js --runInBand`
Expected: FAIL con `Cannot find module '../src/services/politicaInasistencia'`

- [ ] **Step 3: Write minimal implementation**

```js
// backend/src/services/politicaInasistencia.js
// Reglas de la política de inasistencia (ver
// docs/superpowers/specs/2026-10-12-reserva-qr-fijo-comprobante-design.md).
// Las horas se interpretan en la hora local del servidor, igual que
// services/disponibilidad.js.

const HORAS_PARA_JUSTIFICAR = 48;
const DIAS_PARA_REPROGRAMAR = 30;
const MS_HORA = 60 * 60 * 1000;

const TEXTO_POR_DEFECTO = [
  'Al reservar tu cita realizas un pago anticipado que asegura tu horario. Ese horario queda reservado exclusivamente para ti, y la clínica deja de ofrecerlo a otros pacientes.',
  'Si no asistes a tu cita, pierdes el monto depositado.',
  `Si no pudiste asistir por un motivo justificado (por ejemplo, enfermedad o emergencia), puedes enviar una prueba a la clínica por WhatsApp, como un certificado médico u otro documento, dentro de las ${HORAS_PARA_JUSTIFICAR} horas siguientes a la hora de tu cita. Si la clínica acepta la justificación, podrás reprogramar tu cita para otro día sin volver a pagar, dentro de los ${DIAS_PARA_REPROGRAMAR} días siguientes.`,
  'La reprogramación sin costo se concede una sola vez por pago. La clínica evalúa cada justificación y su decisión es final.',
].join('\n\n');

function inicioCita(cita) {
  return new Date(`${cita.fecha}T${String(cita.hora_inicio).slice(0, 8)}`);
}

function plazos(cita, ahora = new Date()) {
  const pago = cita.Pago || null;
  const conAdelanto = Boolean(pago && pago.metodo_adelanto && pago.estado === 'pagado');
  const noAsistio = cita.estado === 'no_asistio';
  const aceptada = cita.justificacion_estado === 'aceptada';

  const limiteJustificar = new Date(inicioCita(cita).getTime() + HORAS_PARA_JUSTIFICAR * MS_HORA);
  const limiteReprogramar = cita.justificacion_registrada_en
    ? new Date(new Date(cita.justificacion_registrada_en).getTime() + DIAS_PARA_REPROGRAMAR * 24 * MS_HORA)
    : null;

  return {
    conAdelanto,
    montoRetenido: conAdelanto && noAsistio && !aceptada,
    puedeJustificar: conAdelanto && noAsistio && !cita.justificacion_estado,
    puedeReprogramar: conAdelanto && noAsistio && aceptada && !cita.reprogramacion_usada,
    limiteJustificar: limiteJustificar.toISOString(),
    justificacionFueraDePlazo: ahora > limiteJustificar,
    limiteReprogramar: limiteReprogramar ? limiteReprogramar.toISOString() : null,
    reprogramacionFueraDePlazo: limiteReprogramar ? ahora > limiteReprogramar : false,
  };
}

// JSON de una cita para el panel: agrega `politica` y nunca expone los
// nombres de archivo privados, solo si existen.
function conPolitica(cita) {
  const json = typeof cita.toJSON === 'function' ? cita.toJSON() : { ...cita };
  if (json.Pago) {
    const { comprobante_archivo, ...pago } = json.Pago;
    json.Pago = { ...pago, tieneComprobante: Boolean(comprobante_archivo) };
  }
  const { justificacion_archivo, ...resto } = json;
  return { ...resto, tieneJustificacion: Boolean(justificacion_archivo), politica: plazos(json) };
}

module.exports = { HORAS_PARA_JUSTIFICAR, DIAS_PARA_REPROGRAMAR, TEXTO_POR_DEFECTO, plazos, conPolitica };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest test/politicaInasistencia.test.js --runInBand`
Expected: PASS (10 tests)

- [ ] **Step 5: Checkpoint**

Run: `git status --short`. Expected: los 2 archivos nuevos. No hacer commit.

---

### Task 2: Migración, modelos, `produccion.sql` y volumen privado

**Files:**
- Create: `backend/src/migrations/20261012000000-reserva-qr-fijo-comprobante.js`
- Modify: `backend/src/models/configuracionClinica.js:15`, `backend/src/models/pago.js:15`, `backend/src/models/cita.js:8-11`, `backend/src/models/index.js:55`
- Modify: `backend/sql/produccion.sql` (cabecera, `citas`, `pagos`, `configuracion_clinica`)
- Modify: `.gitignore`, `backend/.dockerignore`, `docker-compose.yml`
- Modify: `backend/src/routes/citas.js:33` (puente de una línea; ver el paso 2)

**Interfaces:**
- Produces (columnas):
  - `configuracion_clinica`: `metodo_pago_online`, con los valores `ninguno`,
    `qr_banco` (por defecto) y `qr_fijo`; `qr_fijo_url`; `qr_fijo_datos`;
    `politica_inasistencia`. **Se elimina** `cobra_adelanto_online`.
  - `pagos`: `metodo_adelanto` (`qr_banco` | `qr_fijo` | null),
    `comprobante_archivo`, `comprobante_revision` (`sin_revisar` | `valido` |
    `invalido` | null), `comprobante_revisado_por_id` y
    `comprobante_revisado_en`.
  - `citas`: `politica_aceptada_en`, `justificacion_estado` (`aceptada` |
    `rechazada` | null), `justificacion_archivo`, `justificacion_nota`,
    `justificacion_registrada_en`, `reprogramacion_usada` (bool, por defecto
    false), `fecha_original` y `hora_original`.
- Produces (asociación): `Pago.belongsTo(Usuario, { as: 'RevisadoPor', foreignKey: 'comprobante_revisado_por_id' })`.

- [ ] **Step 1: Crear la migración**

```js
// backend/src/migrations/20261012000000-reserva-qr-fijo-comprobante.js
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

const COLUMNAS_CITAS = [
  'politica_aceptada_en',
  'justificacion_estado',
  'justificacion_archivo',
  'justificacion_nota',
  'justificacion_registrada_en',
  'reprogramacion_usada',
  'fecha_original',
  'hora_original',
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const tipoUsuario = await tipoIdDe(queryInterface, Sequelize, 'usuarios');

    // configuracion_clinica: el interruptor pasa a ser una elección de tres modos.
    await queryInterface.addColumn('configuracion_clinica', 'metodo_pago_online', {
      type: Sequelize.ENUM('ninguno', 'qr_banco', 'qr_fijo'),
      allowNull: false,
      defaultValue: 'qr_banco',
    });
    await queryInterface.sequelize.query(
      "UPDATE configuracion_clinica SET metodo_pago_online = IF(cobra_adelanto_online = 1, 'qr_banco', 'ninguno')"
    );
    await queryInterface.removeColumn('configuracion_clinica', 'cobra_adelanto_online');
    await queryInterface.addColumn('configuracion_clinica', 'qr_fijo_url', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('configuracion_clinica', 'qr_fijo_datos', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('configuracion_clinica', 'politica_inasistencia', { type: Sequelize.TEXT, allowNull: true });

    // pagos
    await queryInterface.addColumn('pagos', 'metodo_adelanto', {
      type: Sequelize.ENUM('qr_banco', 'qr_fijo'),
      allowNull: true,
    });
    // Los adelantos ya cobrados por QR del banco quedan bajo la política.
    await queryInterface.sequelize.query(
      "UPDATE pagos SET metodo_adelanto = 'qr_banco' WHERE referencia_qr_banco IS NOT NULL"
    );
    await queryInterface.addColumn('pagos', 'comprobante_archivo', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('pagos', 'comprobante_revision', {
      type: Sequelize.ENUM('sin_revisar', 'valido', 'invalido'),
      allowNull: true,
    });
    await queryInterface.addColumn('pagos', 'comprobante_revisado_por_id', {
      type: tipoUsuario,
      allowNull: true,
      references: { model: 'usuarios', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addColumn('pagos', 'comprobante_revisado_en', { type: Sequelize.DATE, allowNull: true });

    // citas
    await queryInterface.addColumn('citas', 'politica_aceptada_en', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('citas', 'justificacion_estado', {
      type: Sequelize.ENUM('aceptada', 'rechazada'),
      allowNull: true,
    });
    await queryInterface.addColumn('citas', 'justificacion_archivo', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('citas', 'justificacion_nota', { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.addColumn('citas', 'justificacion_registrada_en', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('citas', 'reprogramacion_usada', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('citas', 'fecha_original', { type: Sequelize.DATEONLY, allowNull: true });
    await queryInterface.addColumn('citas', 'hora_original', { type: Sequelize.TIME, allowNull: true });
  },

  async down(queryInterface, Sequelize) {
    for (const columna of COLUMNAS_CITAS) {
      await queryInterface.removeColumn('citas', columna);
    }

    const [fks] = await queryInterface.sequelize.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pagos'
         AND COLUMN_NAME = 'comprobante_revisado_por_id' AND REFERENCED_TABLE_NAME IS NOT NULL`
    );
    for (const fk of fks) {
      await queryInterface.removeConstraint('pagos', fk.CONSTRAINT_NAME);
    }
    for (const columna of ['comprobante_revisado_en', 'comprobante_revisado_por_id', 'comprobante_revision', 'comprobante_archivo', 'metodo_adelanto']) {
      await queryInterface.removeColumn('pagos', columna);
    }

    await queryInterface.addColumn('configuracion_clinica', 'cobra_adelanto_online', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.sequelize.query(
      "UPDATE configuracion_clinica SET cobra_adelanto_online = (metodo_pago_online <> 'ninguno')"
    );
    for (const columna of ['politica_inasistencia', 'qr_fijo_datos', 'qr_fijo_url', 'metodo_pago_online']) {
      await queryInterface.removeColumn('configuracion_clinica', columna);
    }
  },
};
```

- [ ] **Step 2: Actualizar los modelos**

En `backend/src/models/configuracionClinica.js`, reemplazar la línea 15
(`cobra_adelanto_online: …`) por:

```js
  metodo_pago_online: {
    type: DataTypes.ENUM('ninguno', 'qr_banco', 'qr_fijo'),
    allowNull: false,
    defaultValue: 'qr_banco',
  },
  qr_fijo_url: { type: DataTypes.STRING, allowNull: true },
  qr_fijo_datos: { type: DataTypes.STRING, allowNull: true },
  politica_inasistencia: { type: DataTypes.TEXT, allowNull: true },
```

En `backend/src/models/pago.js`, después de `referencia_qr_saldo` (línea 15):

```js
  metodo_adelanto: { type: DataTypes.ENUM('qr_banco', 'qr_fijo'), allowNull: true },
  comprobante_archivo: { type: DataTypes.STRING, allowNull: true },
  comprobante_revision: { type: DataTypes.ENUM('sin_revisar', 'valido', 'invalido'), allowNull: true },
  comprobante_revisado_en: { type: DataTypes.DATE, allowNull: true },
```

En `backend/src/models/cita.js`, después del bloque `estado` (líneas 8-11):

```js
  politica_aceptada_en: { type: DataTypes.DATE, allowNull: true },
  justificacion_estado: { type: DataTypes.ENUM('aceptada', 'rechazada'), allowNull: true },
  justificacion_archivo: { type: DataTypes.STRING, allowNull: true },
  justificacion_nota: { type: DataTypes.TEXT, allowNull: true },
  justificacion_registrada_en: { type: DataTypes.DATE, allowNull: true },
  reprogramacion_usada: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  fecha_original: { type: DataTypes.DATEONLY, allowNull: true },
  hora_original: { type: DataTypes.TIME, allowNull: true },
```

En `backend/src/models/index.js`, después de la línea 55
(`Pago.belongsTo(Cita, …)`):

```js
Pago.belongsTo(Usuario, { foreignKey: { name: 'comprobante_revisado_por_id', allowNull: true }, as: 'RevisadoPor' });
```

Puente hasta la tarea 5: en `backend/src/routes/citas.js:33`, cambiar
`const requierePago = config.cobra_adelanto_online;` por
`const requierePago = config.metodo_pago_online !== 'ninguno';`. Así las
reservas siguen funcionando igual mientras se hace el resto. La tarea 5
reescribe ese handler completo.

- [ ] **Step 3: Probar la migración en una base temporal (up, down y up)**

Run (Git Bash, desde `backend/`):

```bash
M=C:/xampp/mysql/bin/mysql.exe
$M -u root -e "DROP DATABASE IF EXISTS tmp_mig_qr; CREATE DATABASE tmp_mig_qr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
DB_NAME=tmp_mig_qr npx sequelize-cli db:migrate
$M -u root tmp_mig_qr -e "SHOW COLUMNS FROM configuracion_clinica LIKE 'metodo_pago_online'; SHOW COLUMNS FROM pagos LIKE 'comprobante%'; SHOW COLUMNS FROM citas LIKE 'justificacion%';"
DB_NAME=tmp_mig_qr npx sequelize-cli db:migrate:undo
$M -u root tmp_mig_qr -e "SHOW COLUMNS FROM configuracion_clinica LIKE 'cobra_adelanto_online';"
DB_NAME=tmp_mig_qr npx sequelize-cli db:migrate
$M -u root -e "DROP DATABASE tmp_mig_qr;"
```

Expected:
- tras el primer `migrate`: `metodo_pago_online enum(...) NO qr_banco`, 4
  columnas `comprobante_*` y 4 `justificacion_*`;
- tras el `undo`: vuelve `cobra_adelanto_online`;
- el segundo `migrate` pasa sin errores.

- [ ] **Step 4: Comprobar que los modelos sincronizan en la base de pruebas**

Run: `cd backend && npx jest test/models.test.js test/citas.test.js --runInBand`
Expected: PASS en los dos. Todavía nada exige `aceptaPolitica`, porque eso
llega en la tarea 5. Si aparece un error de `sync`
(`Foreign key constraint is incorrectly formed`), revisar la asociación del
paso 2.

- [ ] **Step 5: Reflejar el esquema en `backend/sql/produccion.sql`**

1. **Cabecera.** Cambiar `Actualizado a mano hasta la migración 20261006000000-add-paquetes-sesiones.`
   por `Actualizado a mano hasta la migración 20261012000000-reserva-qr-fijo-comprobante.`
   y agregar `-- 20261012000000-reserva-qr-fijo-comprobante.` al final de la
   lista "Incluye lo agregado por", reemplazando el `y` final.
2. **`citas`.** Después de la línea `` `paquete_sesiones_id` INT UNSIGNED DEFAULT NULL, `` agregar:

```sql
  `politica_aceptada_en` DATETIME DEFAULT NULL,
  `justificacion_estado` ENUM('aceptada', 'rechazada') DEFAULT NULL,
  `justificacion_archivo` VARCHAR(255) DEFAULT NULL COMMENT 'nombre en backend/privado/justificaciones',
  `justificacion_nota` TEXT,
  `justificacion_registrada_en` DATETIME DEFAULT NULL,
  `reprogramacion_usada` TINYINT(1) NOT NULL DEFAULT 0,
  `fecha_original` DATE DEFAULT NULL COMMENT 'fecha antes de reprogramar',
  `hora_original` TIME DEFAULT NULL,
```

3. **`pagos`.** Después de `` `referencia_qr_saldo` VARCHAR(255) DEFAULT NULL, `` agregar:

```sql
  `metodo_adelanto` ENUM('qr_banco', 'qr_fijo') DEFAULT NULL,
  `comprobante_archivo` VARCHAR(255) DEFAULT NULL COMMENT 'nombre en backend/privado/comprobantes',
  `comprobante_revision` ENUM('sin_revisar', 'valido', 'invalido') DEFAULT NULL,
  `comprobante_revisado_por_id` INT UNSIGNED DEFAULT NULL,
  `comprobante_revisado_en` DATETIME DEFAULT NULL,
```

   Después de `` UNIQUE KEY `pagos_cita_id_unique` (`cita_id`), `` agregar
   `` KEY `pagos_comprobante_revisado_por_id_idx` (`comprobante_revisado_por_id`), ``
   y después del `CONSTRAINT pagos_cita_id_fk …` (agregando una coma al final
   de ese constraint):

```sql
  CONSTRAINT `pagos_comprobante_revisado_por_id_fk` FOREIGN KEY (`comprobante_revisado_por_id`) REFERENCES `usuarios` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
```

4. **`configuracion_clinica`.** Reemplazar `` `cobra_adelanto_online` TINYINT(1) NOT NULL DEFAULT 1, `` por:

```sql
  `metodo_pago_online` ENUM('ninguno', 'qr_banco', 'qr_fijo') NOT NULL DEFAULT 'qr_banco',
  `qr_fijo_url` VARCHAR(255) DEFAULT NULL,
  `qr_fijo_datos` VARCHAR(255) DEFAULT NULL,
  `politica_inasistencia` TEXT,
```

Run (prueba de carga en una base temporal):

```bash
M=C:/xampp/mysql/bin/mysql.exe; S="$TMP/prod_qr.sql"
sed 's/`novaged`/`tmp_prod_qr`/g' backend/sql/produccion.sql > "$S"
$M -u root < "$S" && $M -u root tmp_prod_qr -e "SHOW COLUMNS FROM pagos LIKE 'comprobante%'; SHOW COLUMNS FROM configuracion_clinica LIKE 'metodo%';"
$M -u root -e "DROP DATABASE tmp_prod_qr;"; rm -f "$S"
```

Expected: carga sin errores; aparecen 4 columnas `comprobante_*` y `metodo_pago_online`.

- [ ] **Step 6: Directorio privado fuera de git, de la imagen y con volumen propio**

- En `.gitignore` (raíz), agregar una línea `**/privado/`.
- En `backend/.dockerignore`, agregar `privado` debajo de `uploads`.
- En `docker-compose.yml`, servicio `api`:

```yaml
    volumes:
      - uploads_data:/app/uploads
      # Comprobantes y justificaciones: privados, nunca bajo /uploads.
      - privado_data:/app/privado
```

  Y en `volumes:` al final, agregar `privado_data:`.

Run: `docker compose config --volumes`
Expected: `mysql_data`, `uploads_data` y `privado_data`.

- [ ] **Step 7: Checkpoint**

Run: `git status --short && git diff --stat`. No hacer commit.

---

### Task 3: Servicio de archivos privados

**Files:**
- Create: `backend/src/services/archivosPrivados.js`
- Create: `backend/test/helpers/archivos.js`
- Test: `backend/test/archivosPrivados.test.js`

**Interfaces:**
- Produces:
  - `MAX_BYTES` y `MENSAJE_FORMATO`.
  - `detectarTipo(buffer)`: devuelve `{ ext, mime }` o `null`.
  - `recibirArchivo(campo)`: middleware. Si la petición no es multipart, deja
    pasar sin hacer nada. Si es multipart, deja el archivo en
    `req.file.buffer`; si el archivo no es válido, responde 400 con
    `MENSAJE_FORMATO`.
  - `guardarArchivoPrivado(carpeta, buffer)`: devuelve `Promise<nombre>`.
  - `borrarArchivoPrivado(carpeta, nombre)`: devuelve `Promise<void>`.
  - `enviarArchivoPrivado(res, carpeta, nombre)`.
  - `carpeta` es `'comprobantes'` o `'justificaciones'`.
- Test helpers: `pngFalso()`, `pdfFalso()`, `exeFalso()` y `pngGrande()`
  (5 MB + 1 byte). Los cuatro devuelven un `Buffer`.

- [ ] **Step 1: Write the helpers and the failing test**

```js
// backend/test/helpers/archivos.js
// Buffers mínimos con la firma real de cada formato: detectarTipo solo mira
// los bytes iniciales.
const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function pngFalso() {
  return Buffer.concat([FIRMA_PNG, Buffer.alloc(32)]);
}

function pdfFalso() {
  return Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(32)]);
}

function exeFalso() {
  return Buffer.concat([Buffer.from('MZ'), Buffer.alloc(64)]);
}

function pngGrande() {
  return Buffer.concat([FIRMA_PNG, Buffer.alloc(5 * 1024 * 1024 + 1 - FIRMA_PNG.length)]);
}

module.exports = { pngFalso, pdfFalso, exeFalso, pngGrande };
```

```js
// backend/test/archivosPrivados.test.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

process.env.PRIVADO_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'privado-'));

const {
  MENSAJE_FORMATO,
  detectarTipo,
  recibirArchivo,
  guardarArchivoPrivado,
  borrarArchivoPrivado,
  enviarArchivoPrivado,
} = require('../src/services/archivosPrivados');
const { pngFalso, pdfFalso, exeFalso, pngGrande } = require('./helpers/archivos');

function appDePrueba() {
  const app = express();
  app.post('/subir', recibirArchivo('archivo'), (req, res) => {
    res.json({ recibido: Boolean(req.file), bytes: req.file ? req.file.size : 0 });
  });
  return app;
}

afterAll(() => {
  fs.rmSync(process.env.PRIVADO_DIR, { recursive: true, force: true });
});

describe('detectarTipo', () => {
  test('reconoce PNG, JPG, WebP y PDF por su firma', () => {
    expect(detectarTipo(pngFalso())).toEqual({ ext: '.png', mime: 'image/png' });
    expect(detectarTipo(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]))).toEqual({ ext: '.jpg', mime: 'image/jpeg' });
    expect(detectarTipo(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(8)]))).toEqual({ ext: '.webp', mime: 'image/webp' });
    expect(detectarTipo(pdfFalso())).toEqual({ ext: '.pdf', mime: 'application/pdf' });
  });

  test('rechaza un ejecutable, texto plano y buffers vacíos', () => {
    expect(detectarTipo(exeFalso())).toBeNull();
    expect(detectarTipo(Buffer.from('hola, no soy una imagen'))).toBeNull();
    expect(detectarTipo(Buffer.alloc(0))).toBeNull();
  });
});

describe('recibirArchivo', () => {
  test('acepta un PNG real', async () => {
    const res = await request(appDePrueba()).post('/subir').attach('archivo', pngFalso(), { filename: 'c.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.recibido).toBe(true);
  });

  test('rechaza un .exe disfrazado de .jpg', async () => {
    const res = await request(appDePrueba()).post('/subir').attach('archivo', exeFalso(), { filename: 'c.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(MENSAJE_FORMATO);
  });

  test('rechaza un tipo MIME no permitido', async () => {
    const res = await request(appDePrueba()).post('/subir').attach('archivo', Buffer.from('a,b'), { filename: 'c.csv', contentType: 'text/csv' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(MENSAJE_FORMATO);
  });

  test('rechaza más de 5 MB con 400, no 500', async () => {
    const res = await request(appDePrueba()).post('/subir').attach('archivo', pngGrande(), { filename: 'g.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(MENSAJE_FORMATO);
  });

  test('deja pasar una petición JSON sin archivo', async () => {
    const res = await request(appDePrueba()).post('/subir').send({ a: 1 });
    expect(res.status).toBe(200);
    expect(res.body.recibido).toBe(false);
  });
});

describe('guardar, enviar y borrar', () => {
  test('guarda con nombre aleatorio dentro de PRIVADO_DIR y lo sirve con cabeceras seguras', async () => {
    const nombre = await guardarArchivoPrivado('comprobantes', pngFalso());
    expect(nombre).toMatch(/^[0-9a-f-]{36}\.png$/);
    const ruta = path.join(process.env.PRIVADO_DIR, 'comprobantes', nombre);
    expect(fs.existsSync(ruta)).toBe(true);

    const app = express();
    app.get('/ver/:nombre', (req, res) => enviarArchivoPrivado(res, 'comprobantes', req.params.nombre));
    const res = await request(app).get(`/ver/${nombre}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['content-disposition']).toBe('inline');
    expect(res.headers['x-content-type-options']).toBe('nosniff');

    await borrarArchivoPrivado('comprobantes', nombre);
    expect(fs.existsSync(ruta)).toBe(false);
  });

  test('no sale de su carpeta con ../', async () => {
    const app = express();
    app.get('/ver', (req, res) => enviarArchivoPrivado(res, 'comprobantes', '../../etc/passwd'));
    const res = await request(app).get('/ver');
    expect(res.status).toBe(404);
  });

  test('rechaza carpetas desconocidas y contenido inválido', async () => {
    await expect(guardarArchivoPrivado('otra', pngFalso())).rejects.toThrow('Carpeta privada desconocida');
    await expect(guardarArchivoPrivado('comprobantes', exeFalso())).rejects.toThrow(MENSAJE_FORMATO);
  });

  test('borrar un nombre nulo no falla', async () => {
    await expect(borrarArchivoPrivado('comprobantes', null)).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest test/archivosPrivados.test.js --runInBand`
Expected: FAIL con `Cannot find module '../src/services/archivosPrivados'`

- [ ] **Step 3: Write minimal implementation**

```js
// backend/src/services/archivosPrivados.js
// Comprobantes de pago y justificaciones: tienen datos bancarios y
// personales, así que viven FUERA de /uploads (que es público) y solo se
// leen por rutas del personal con sesión.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const MAX_BYTES = 5 * 1024 * 1024;
const MENSAJE_FORMATO = 'Sube una imagen (JPG, PNG o WebP) o un PDF de hasta 5 MB';
const CARPETAS = ['comprobantes', 'justificaciones'];
const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MIME_POR_EXT = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf' };
const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function directorioBase() {
  return process.env.PRIVADO_DIR || path.join(__dirname, '..', '..', 'privado');
}

// El tipo MIME lo declara el navegador y se puede falsear: lo que manda es
// la firma (bytes iniciales) del contenido.
function detectarTipo(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { ext: '.jpg', mime: 'image/jpeg' };
  if (buffer.subarray(0, 8).equals(FIRMA_PNG)) return { ext: '.png', mime: 'image/png' };
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return { ext: '.webp', mime: 'image/webp' };
  if (buffer.toString('ascii', 0, 5) === '%PDF-') return { ext: '.pdf', mime: 'application/pdf' };
  return null;
}

// En memoria: el archivo se escribe a disco solo después de validar todo
// (formato, horario libre), así nunca quedan archivos huérfanos.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!MIME_PERMITIDOS.includes(file.mimetype)) return cb(new Error(MENSAJE_FORMATO));
    cb(null, true);
  },
});

function recibirArchivo(campo) {
  const single = upload.single(campo);
  return (req, res, next) => {
    if (!req.is('multipart/form-data')) return next();
    single(req, res, (err) => {
      if (err) return res.status(400).json({ error: MENSAJE_FORMATO });
      if (req.file && !detectarTipo(req.file.buffer)) return res.status(400).json({ error: MENSAJE_FORMATO });
      next();
    });
  };
}

function rutaArchivo(carpeta, nombre) {
  if (!CARPETAS.includes(carpeta)) throw new Error(`Carpeta privada desconocida: ${carpeta}`);
  return path.join(directorioBase(), carpeta, path.basename(String(nombre)));
}

async function guardarArchivoPrivado(carpeta, buffer) {
  rutaArchivo(carpeta, 'x');
  const tipo = detectarTipo(buffer);
  if (!tipo) throw new Error(MENSAJE_FORMATO);
  const dir = path.join(directorioBase(), carpeta);
  await fs.promises.mkdir(dir, { recursive: true });
  const nombre = `${crypto.randomUUID()}${tipo.ext}`;
  await fs.promises.writeFile(path.join(dir, nombre), buffer);
  return nombre;
}

async function borrarArchivoPrivado(carpeta, nombre) {
  if (!nombre) return;
  await fs.promises.unlink(rutaArchivo(carpeta, nombre)).catch(() => {});
}

function enviarArchivoPrivado(res, carpeta, nombre) {
  const ruta = nombre ? rutaArchivo(carpeta, nombre) : null;
  if (!ruta || !fs.existsSync(ruta)) return res.status(404).json({ error: 'Archivo no encontrado' });
  res.set('Content-Type', MIME_POR_EXT[path.extname(ruta)] || 'application/octet-stream');
  res.set('Content-Disposition', 'inline');
  res.set('Cache-Control', 'private, no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  return res.sendFile(ruta);
}

module.exports = {
  MAX_BYTES,
  MENSAJE_FORMATO,
  detectarTipo,
  recibirArchivo,
  guardarArchivoPrivado,
  borrarArchivoPrivado,
  enviarArchivoPrivado,
};
```

Nota: `res.set('Content-Type', 'image/png')` hace que Express responda
`image/png` sin `charset`. Si el test recibe `image/png; charset=...`,
cambiar la aserción a `toMatch(/^image\/png/)`; no cambiar la
implementación.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest test/archivosPrivados.test.js --runInBand`
Expected: PASS (11 tests)

- [ ] **Step 5: Checkpoint**

Run: `git status --short`. No hacer commit.

---

### Task 4: Avisos por WhatsApp y configuración de pagos (backend)

**Files:**
- Create: `backend/src/services/avisosCita.js`
- Modify: `backend/src/routes/staffConfiguracion.js`, `backend/src/routes/catalogo.js:22-26`
- Test: `backend/test/avisosCita.test.js`, `backend/test/configuracionPago.test.js`

**Interfaces:**
- Consumes: `TEXTO_POR_DEFECTO` (tarea 1).
- Produces:
  - `enviarConfirmacionCita(telefono, fecha, hora)`: devuelve
    `Promise<'enviado' | 'error'>`.
  - `enviarAvisoCita({ telefono, nombre, fecha, hora, mensaje })`: devuelve
    `Promise<'enviado' | 'no_configurado' | 'error'>`.
  - `PUT /staff/configuracion` acepta `metodo_pago_online`, `qr_fijo_datos`
    y `politica_inasistencia`.
  - `GET /staff/configuracion` y `PUT /staff/configuracion` devuelven además
    `politica_inasistencia_por_defecto`.
  - `POST /staff/configuracion/qr` (multipart, campo `qr`) y
    `DELETE /staff/configuracion/qr`.
  - `GET /configuracion-publica` devuelve `metodo_pago_online`,
    `qr_fijo_url`, `qr_fijo_datos` y `politica_inasistencia` (con el texto
    por defecto si está vacía). Ya no devuelve `cobra_adelanto_online`.

- [ ] **Step 1: Write the failing tests**

```js
// backend/test/avisosCita.test.js
jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn(),
}));

const { enviarPlantillaWhatsApp } = require('../src/services/whatsapp');
const { enviarConfirmacionCita, enviarAvisoCita } = require('../src/services/avisosCita');

describe('avisosCita', () => {
  const original = process.env.WHATSAPP_AVISO_TEMPLATE;
  afterEach(() => {
    enviarPlantillaWhatsApp.mockReset();
    if (original === undefined) delete process.env.WHATSAPP_AVISO_TEMPLATE;
    else process.env.WHATSAPP_AVISO_TEMPLATE = original;
  });

  test('confirmación: usa cita_confirmada con [fecha, hora]', async () => {
    enviarPlantillaWhatsApp.mockResolvedValue(undefined);
    expect(await enviarConfirmacionCita('59170000001', '2026-10-19', '10:30')).toBe('enviado');
    expect(enviarPlantillaWhatsApp).toHaveBeenCalledWith('59170000001', 'cita_confirmada', ['2026-10-19', '10:30']);
  });

  test('confirmación: si WhatsApp falla devuelve error y no lanza', async () => {
    enviarPlantillaWhatsApp.mockRejectedValue(new Error('caído'));
    expect(await enviarConfirmacionCita('59170000001', '2026-10-19', '10:30')).toBe('error');
  });

  test('aviso: sin plantilla configurada no envía', async () => {
    delete process.env.WHATSAPP_AVISO_TEMPLATE;
    expect(await enviarAvisoCita({ telefono: '1', nombre: 'Ana', fecha: '2026-10-19', hora: '10:30', mensaje: 'x' })).toBe('no_configurado');
    expect(enviarPlantillaWhatsApp).not.toHaveBeenCalled();
  });

  test('aviso: con plantilla envía [nombre, "fecha hora", mensaje]', async () => {
    process.env.WHATSAPP_AVISO_TEMPLATE = 'aviso_cita';
    enviarPlantillaWhatsApp.mockResolvedValue(undefined);
    expect(await enviarAvisoCita({ telefono: '1', nombre: 'Ana', fecha: '2026-10-19', hora: '10:30', mensaje: 'anulada' })).toBe('enviado');
    expect(enviarPlantillaWhatsApp).toHaveBeenCalledWith('1', 'aviso_cita', ['Ana', '2026-10-19 10:30', 'anulada']);
  });
});
```

```js
// backend/test/configuracionPago.test.js
jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');
const { TEXTO_POR_DEFECTO } = require('../src/services/politicaInasistencia');
const { pngFalso } = require('./helpers/archivos');

describe('Configuración de pagos', () => {
  let token;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const [rol] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Admin } });
    await db.Usuario.create({ nombre: 'Admin', email: 'admin@test.com', password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true });
    token = (await request(app).post('/staff/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;
  });

  afterAll(async () => {
    await request(app).put('/staff/configuracion').set(auth()).send({ metodo_pago_online: 'qr_banco' });
    await request(app).delete('/staff/configuracion/qr').set(auth());
    await db.sequelize.close();
  });

  test('por defecto el modo es qr_banco y la política pública es el texto por defecto', async () => {
    const res = await request(app).get('/configuracion-publica');
    expect(res.body.metodo_pago_online).toBe('qr_banco');
    expect(res.body.politica_inasistencia).toBe(TEXTO_POR_DEFECTO);
    expect(res.body).not.toHaveProperty('cobra_adelanto_online');
  });

  test('GET /staff/configuracion trae el texto por defecto para rellenar el formulario', async () => {
    const res = await request(app).get('/staff/configuracion').set(auth());
    expect(res.body.politica_inasistencia_por_defecto).toBe(TEXTO_POR_DEFECTO);
  });

  test('rechaza un modo desconocido', async () => {
    const res = await request(app).put('/staff/configuracion').set(auth()).send({ metodo_pago_online: 'efectivo' });
    expect(res.status).toBe(400);
  });

  test('no deja elegir qr_fijo sin imagen del QR', async () => {
    const res = await request(app).put('/staff/configuracion').set(auth()).send({ metodo_pago_online: 'qr_fijo' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Sube primero la imagen del QR');
  });

  test('sube el QR, elige qr_fijo y lo expone en la configuración pública', async () => {
    const subida = await request(app).post('/staff/configuracion/qr').set(auth()).attach('qr', pngFalso(), { filename: 'qr.png', contentType: 'image/png' });
    expect(subida.status).toBe(200);
    expect(subida.body.qr_fijo_url).toMatch(/^\/uploads\/qr\/qr-\d+\.png$/);

    const put = await request(app).put('/staff/configuracion').set(auth()).send({
      metodo_pago_online: 'qr_fijo',
      qr_fijo_datos: 'Titular: Clínica — Banco X',
      politica_inasistencia: 'Política propia',
    });
    expect(put.status).toBe(200);

    const pub = await request(app).get('/configuracion-publica');
    expect(pub.body.metodo_pago_online).toBe('qr_fijo');
    expect(pub.body.qr_fijo_url).toBe(subida.body.qr_fijo_url);
    expect(pub.body.qr_fijo_datos).toBe('Titular: Clínica — Banco X');
    expect(pub.body.politica_inasistencia).toBe('Política propia');
  });

  test('no deja quitar el QR mientras el modo es qr_fijo', async () => {
    const res = await request(app).delete('/staff/configuracion/qr').set(auth());
    expect(res.status).toBe(400);
  });

  test('una política vacía vuelve al texto por defecto en la web', async () => {
    await request(app).put('/staff/configuracion').set(auth()).send({ politica_inasistencia: '   ' });
    const pub = await request(app).get('/configuracion-publica');
    expect(pub.body.politica_inasistencia).toBe(TEXTO_POR_DEFECTO);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest test/avisosCita.test.js test/configuracionPago.test.js --runInBand`
Expected: FAIL. En `avisosCita` falta el módulo; en `configuracionPago`, el
primer test recibe `metodo_pago_online` undefined.

- [ ] **Step 3: Implementar `avisosCita.js`**

```js
// backend/src/services/avisosCita.js
// Envíos de WhatsApp de las reservas que nunca deben romper la operación:
// devuelven el resultado para que el panel avise al personal si no salió.
const { enviarPlantillaWhatsApp } = require('./whatsapp');

async function enviarConfirmacionCita(telefono, fecha, hora) {
  try {
    await enviarPlantillaWhatsApp(telefono, 'cita_confirmada', [fecha, hora]);
    return 'enviado';
  } catch (err) {
    console.error('No se pudo enviar la confirmación de cita por WhatsApp:', err.message);
    return 'error';
  }
}

// Plantilla general "aviso_cita" (Utilidad):
//   Hola {{1}}, te escribimos de Clinic NovagED sobre tu cita del {{2}}: {{3}}
// Su nombre viene de WHATSAPP_AVISO_TEMPLATE; sin aprobar en Meta no se envía.
async function enviarAvisoCita({ telefono, nombre, fecha, hora, mensaje }) {
  const plantilla = process.env.WHATSAPP_AVISO_TEMPLATE;
  if (!plantilla) {
    console.warn('WHATSAPP_AVISO_TEMPLATE no está configurada: aviso de cita no enviado');
    return 'no_configurado';
  }
  try {
    await enviarPlantillaWhatsApp(telefono, plantilla, [nombre, `${fecha} ${hora}`, mensaje]);
    return 'enviado';
  } catch (err) {
    console.error('No se pudo enviar el aviso de cita por WhatsApp:', err.message);
    return 'error';
  }
}

module.exports = { enviarConfirmacionCita, enviarAvisoCita };
```

- [ ] **Step 4: Implementar la configuración**

En `backend/src/routes/staffConfiguracion.js`:

1. En la cabecera, `const { TEXTO_POR_DEFECTO } = require('../services/politicaInasistencia');`.
2. Agregar `'qr_fijo_datos'` y `'politica_inasistencia'` al final de `CAMPOS_CONFIG`.
3. Debajo de `borrarArchivoLogo`, agregar:

```js
const METODOS_PAGO = ['ninguno', 'qr_banco', 'qr_fijo'];

// El QR fijo sí es público: el paciente tiene que verlo para pagar.
const QR_DIR = path.join(__dirname, '..', '..', 'uploads', 'qr');
fs.mkdirSync(QR_DIR, { recursive: true });
const EXT_QR = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };

const uploadQr = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, QR_DIR),
    filename: (req, file, cb) => cb(null, `qr-${Date.now()}${EXT_QR[file.mimetype]}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!EXT_QR[file.mimetype]) return cb(new Error('Formato no soportado. Usa PNG, JPG o WEBP.'));
    cb(null, true);
  },
});

function borrarArchivoQr(qrUrl) {
  if (!qrUrl || !qrUrl.startsWith('/uploads/qr/')) return;
  fs.unlink(path.join(QR_DIR, path.basename(qrUrl)), () => {});
}

function respuestaConfig(config) {
  return { ...config.toJSON(), politica_inasistencia_por_defecto: TEXTO_POR_DEFECTO };
}
```

4. En `GET /staff/configuracion` y en las cuatro respuestas que hoy hacen
   `res.json(config)`, cambiar a `res.json(respuestaConfig(config))`. Son
   PUT, POST logo, DELETE logo y las rutas QR nuevas.
5. En `PUT /staff/configuracion`, reemplazar el bloque
   `if (typeof req.body.cobra_adelanto_online === 'boolean') {...}` por:

```js
  if (req.body.metodo_pago_online !== undefined) {
    if (!METODOS_PAGO.includes(req.body.metodo_pago_online)) {
      return res.status(400).json({ error: 'metodo_pago_online debe ser ninguno, qr_banco o qr_fijo' });
    }
    if (req.body.metodo_pago_online === 'qr_fijo' && !config.qr_fijo_url) {
      return res.status(400).json({ error: 'Sube primero la imagen del QR' });
    }
    config.metodo_pago_online = req.body.metodo_pago_online;
  }
```

6. Antes de `module.exports`:

```js
router.post('/staff/configuracion/qr', onlyConfiguracion, (req, res) => {
  uploadQr.single('qr')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const config = await db.ConfiguracionClinica.obtenerConfig();
    borrarArchivoQr(config.qr_fijo_url);
    config.qr_fijo_url = `/uploads/qr/${req.file.filename}`;
    await config.save();
    res.json(respuestaConfig(config));
  });
});

router.delete('/staff/configuracion/qr', onlyConfiguracion, async (req, res) => {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  if (config.metodo_pago_online === 'qr_fijo') {
    return res.status(400).json({ error: 'Cambia primero el modo de pago: el modo "QR fijo + comprobante" necesita la imagen del QR' });
  }
  borrarArchivoQr(config.qr_fijo_url);
  config.qr_fijo_url = null;
  await config.save();
  res.json(respuestaConfig(config));
});
```

En `backend/src/routes/catalogo.js`, reemplazar la ruta
`/configuracion-publica` (líneas 22-26) por:

```js
router.get('/configuracion-publica', async (req, res) => {
  const config = await db.ConfiguracionClinica.obtenerConfig();
  const { nombre_consultorio, direccion, ciudad, pais, telefono, email, sitio_web, logo_url, metodo_pago_online, qr_fijo_url, qr_fijo_datos } = config;
  const politica = (config.politica_inasistencia || '').trim() || TEXTO_POR_DEFECTO;
  res.json({
    nombre_consultorio, direccion, ciudad, pais, telefono, email, sitio_web, logo_url,
    metodo_pago_online, qr_fijo_url, qr_fijo_datos, politica_inasistencia: politica,
  });
});
```

y agregar en la cabecera `const { TEXTO_POR_DEFECTO } = require('../services/politicaInasistencia');`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && npx jest test/avisosCita.test.js test/configuracionPago.test.js --runInBand`
Expected: PASS (4 + 7 tests)

- [ ] **Step 6: Checkpoint**

Run: `git status --short`. No hacer commit.

---

### Task 5: `POST /citas` con política y comprobante

**Files:**
- Modify: `backend/src/routes/citas.js:13-58`
- Modify: `backend/test/citas.test.js` y `backend/test/pagos.test.js` (agregar `aceptaPolitica: true`)
- Test: `backend/test/reservaComprobante.test.js`

**Interfaces:**
- Consumes: `recibirArchivo`, `guardarArchivoPrivado` y
  `borrarArchivoPrivado` (tarea 3); `enviarConfirmacionCita` (tarea 4).
- Produces:
  - `POST /citas` acepta JSON o `multipart/form-data`. Los campos son
    `profesionalId`, `servicioId`, `fecha`, `horaInicio`, `porcentajePago`,
    `aceptaPolitica` (`true` o `'true'`) y `comprobante` (archivo).
  - Respuesta `201 { cita, pago, requierePago, avisoWhatsApp? }`, donde
    `requierePago` es `true` solo en `qr_banco` (el front muestra el QR del
    banco). El `pago` no incluye `comprobante_archivo`.
  - Errores:
    - 400 `Debes aceptar la política de inasistencia`;
    - 400 `Sube el comprobante de pago`;
    - 400 `MENSAJE_FORMATO`;
    - 409 `Ese horario acaba de ocuparse, elige otro` (en `qr_fijo`) o
      409 `El horario ya no esta disponible` (en los otros modos).

- [ ] **Step 1: Write the failing test**

```js
// backend/test/reservaComprobante.test.js
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.PRIVADO_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'privado-'));

jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { enviarPlantillaWhatsApp } = require('../src/services/whatsapp');
const { proximoLunes } = require('./helpers/fechas');
const { pngFalso, exeFalso, pngGrande } = require('./helpers/archivos');

const DIR_COMPROBANTES = path.join(process.env.PRIVADO_DIR, 'comprobantes');
const archivosGuardados = () => (fs.existsSync(DIR_COMPROBANTES) ? fs.readdirSync(DIR_COMPROBANTES).length : 0);

async function loginPaciente(telefono) {
  await request(app).post('/auth/otp/request').send({ telefono, nombre_completo: 'Test' });
  const otp = await db.OtpCode.findOne({ where: { telefono }, order: [['id', 'DESC']] });
  return (await request(app).post('/auth/otp/verify').send({ telefono, codigo: otp.codigo })).body.token;
}

describe('POST /citas según el modo de pago', () => {
  let profesional, servicio, token;
  const lunes = proximoLunes(0);

  async function modo(metodo) {
    const config = await db.ConfiguracionClinica.obtenerConfig();
    config.metodo_pago_online = metodo;
    config.qr_fijo_url = '/uploads/qr/qr-1.png';
    await config.save();
  }

  function reservarConComprobante(hora, archivo = pngFalso(), contentType = 'image/png', extra = {}) {
    const req = request(app)
      .post('/citas')
      .set('Authorization', `Bearer ${token}`)
      .field('profesionalId', String(profesional.id))
      .field('servicioId', String(servicio.id))
      .field('fecha', lunes)
      .field('horaInicio', hora)
      .field('porcentajePago', '50')
      .field('aceptaPolitica', extra.aceptaPolitica ?? 'true');
    return archivo ? req.attach('comprobante', archivo, { filename: 'c.png', contentType }) : req;
  }

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100, activo: true });
    profesional = await db.Profesional.create({ nombre: 'Dra. Test', activo: true });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    await db.HorarioDisponible.create({ profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '12:00:00' });
    token = await loginPaciente('59170000030');
  });

  afterAll(async () => {
    fs.rmSync(process.env.PRIVADO_DIR, { recursive: true, force: true });
    await db.sequelize.close();
  });

  beforeEach(() => enviarPlantillaWhatsApp.mockClear());

  test('qr_banco: sin aceptar la política responde 400', async () => {
    await modo('qr_banco');
    const res = await request(app).post('/citas').set('Authorization', `Bearer ${token}`)
      .send({ profesionalId: profesional.id, servicioId: servicio.id, fecha: lunes, horaInicio: '09:00' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Debes aceptar la política de inasistencia');
  });

  test('qr_banco: aceptando queda pendiente de pago, con método y fecha de aceptación', async () => {
    const res = await request(app).post('/citas').set('Authorization', `Bearer ${token}`)
      .send({ profesionalId: profesional.id, servicioId: servicio.id, fecha: lunes, horaInicio: '09:00', aceptaPolitica: true });
    expect(res.status).toBe(201);
    expect(res.body.requierePago).toBe(true);
    expect(res.body.cita.estado).toBe('pendiente_pago');
    expect(res.body.cita.politica_aceptada_en).toBeTruthy();
    expect(res.body.pago.metodo_adelanto).toBe('qr_banco');
  });

  test('ninguno: no exige la política y confirma sin pago online', async () => {
    await modo('ninguno');
    const res = await request(app).post('/citas').set('Authorization', `Bearer ${token}`)
      .send({ profesionalId: profesional.id, servicioId: servicio.id, fecha: lunes, horaInicio: '09:30' });
    expect(res.status).toBe(201);
    expect(res.body.cita.estado).toBe('confirmada');
    expect(res.body.requierePago).toBe(false);
    expect(res.body.pago.metodo_adelanto).toBeNull();
  });

  test('qr_fijo: sin comprobante responde 400', async () => {
    await modo('qr_fijo');
    const res = await reservarConComprobante('10:00', null);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Sube el comprobante de pago');
  });

  test('qr_fijo: sin aceptar la política responde 400 y no guarda archivo', async () => {
    const antes = archivosGuardados();
    const res = await reservarConComprobante('10:00', pngFalso(), 'image/png', { aceptaPolitica: 'false' });
    expect(res.status).toBe(400);
    expect(archivosGuardados()).toBe(antes);
  });

  test('qr_fijo: un .exe disfrazado o un archivo de más de 5 MB responden 400', async () => {
    expect((await reservarConComprobante('10:00', exeFalso(), 'image/jpeg')).status).toBe(400);
    expect((await reservarConComprobante('10:00', pngGrande())).status).toBe(400);
  });

  test('qr_fijo: con comprobante queda confirmada, pagada y sin revisar, y avisa por WhatsApp', async () => {
    const antes = archivosGuardados();
    const res = await reservarConComprobante('10:00');
    expect(res.status).toBe(201);
    expect(res.body.requierePago).toBe(false);
    expect(res.body.cita.estado).toBe('confirmada');
    expect(res.body.pago.estado).toBe('pagado');
    expect(res.body.pago.metodo_adelanto).toBe('qr_fijo');
    expect(res.body.pago.comprobante_revision).toBe('sin_revisar');
    expect(res.body.pago).not.toHaveProperty('comprobante_archivo');
    expect(Number(res.body.pago.monto)).toBe(50);
    expect(res.body.avisoWhatsApp).toBe('enviado');
    expect(archivosGuardados()).toBe(antes + 1);
    expect(enviarPlantillaWhatsApp).toHaveBeenCalledWith('59170000030', 'cita_confirmada', [lunes, '10:00']);

    const pago = await db.Pago.findByPk(res.body.pago.id);
    expect(fs.existsSync(path.join(DIR_COMPROBANTES, pago.comprobante_archivo))).toBe(true);
  });

  test('qr_fijo: el mismo horario otra vez (doble clic) da 409 y no deja archivo huérfano', async () => {
    const antes = archivosGuardados();
    const res = await reservarConComprobante('10:00');
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Ese horario acaba de ocuparse, elige otro');
    expect(archivosGuardados()).toBe(antes);
  });

  test('qr_fijo: si WhatsApp falla, la reserva igual queda creada', async () => {
    enviarPlantillaWhatsApp.mockRejectedValueOnce(new Error('caído'));
    const res = await reservarConComprobante('10:30');
    expect(res.status).toBe(201);
    expect(res.body.avisoWhatsApp).toBe('error');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest test/reservaComprobante.test.js --runInBand`
Expected: FAIL. El primer test recibe 201 en lugar de 400.

- [ ] **Step 3: Implementar**

Reemplazar en `backend/src/routes/citas.js` las líneas 1-58 (imports y
`router.post('/citas', ...)`) por:

```js
const express = require('express');
const db = require('../models');
const { requirePaciente } = require('./auth.middleware');
const { getSlotsDisponibles } = require('../services/disponibilidad');
const { crearLimiter } = require('../middleware/rateLimiters');
const { recibirArchivo, guardarArchivoPrivado, borrarArchivoPrivado } = require('../services/archivosPrivados');
const { enviarConfirmacionCita } = require('../services/avisosCita');

const router = express.Router();

const PORCENTAJES_VALIDOS = [50, 100];

const crearCitaLimiter = crearLimiter(20, 'Demasiadas reservas seguidas, intenta de nuevo mas tarde');

// Con JSON llega como booleano; con multipart (modo qr_fijo), como texto.
function aceptoPolitica(valor) {
  return valor === true || valor === 'true';
}

router.post('/citas', crearCitaLimiter, requirePaciente, recibirArchivo('comprobante'), async (req, res) => {
  const { profesionalId, servicioId, fecha, horaInicio, porcentajePago, aceptaPolitica } = req.body;
  if (!profesionalId || !servicioId || !fecha || !horaInicio) {
    return res.status(400).json({ error: 'profesionalId, servicioId, fecha y horaInicio son requeridos' });
  }
  const porcentaje = porcentajePago ? Number(porcentajePago) : 100;
  if (!PORCENTAJES_VALIDOS.includes(porcentaje)) {
    return res.status(400).json({ error: 'porcentajePago debe ser 50 o 100' });
  }

  const config = await db.ConfiguracionClinica.obtenerConfig();
  const metodo = config.metodo_pago_online;
  const conPagoOnline = metodo !== 'ninguno';
  if (conPagoOnline && !aceptoPolitica(aceptaPolitica)) {
    return res.status(400).json({ error: 'Debes aceptar la política de inasistencia' });
  }
  if (metodo === 'qr_fijo' && !req.file) {
    return res.status(400).json({ error: 'Sube el comprobante de pago' });
  }

  const slots = await getSlotsDisponibles({
    profesionalId: Number(profesionalId), servicioId: Number(servicioId), fecha,
  });
  const slot = slots.find((s) => s.hora_inicio === horaInicio);
  if (!slot) {
    const error = metodo === 'qr_fijo' ? 'Ese horario acaba de ocuparse, elige otro' : 'El horario ya no esta disponible';
    return res.status(409).json({ error });
  }

  const servicio = await db.Servicio.findByPk(servicioId);
  const montoTotal = Number(servicio.precio);
  const porcentajeFinal = conPagoOnline ? porcentaje : 100;
  const monto = Math.round(montoTotal * (porcentajeFinal / 100) * 100) / 100;

  // El comprobante se escribe recién aquí: ya se validó todo lo demás.
  const archivo = metodo === 'qr_fijo' ? await guardarArchivoPrivado('comprobantes', req.file.buffer) : null;

  let cita;
  let pago;
  try {
    ({ cita, pago } = await db.sequelize.transaction(async (transaction) => {
      const nuevaCita = await db.Cita.create({
        paciente_id: req.pacienteId,
        profesional_id: Number(profesionalId),
        servicio_id: Number(servicioId),
        fecha,
        hora_inicio: `${slot.hora_inicio}:00`,
        hora_fin: `${slot.hora_fin}:00`,
        estado: metodo === 'qr_banco' ? 'pendiente_pago' : 'confirmada',
        politica_aceptada_en: conPagoOnline ? new Date() : null,
      }, { transaction });

      const nuevoPago = await db.Pago.create({
        cita_id: nuevaCita.id,
        monto,
        monto_total: montoTotal,
        porcentaje: porcentajeFinal,
        estado: metodo === 'qr_fijo' ? 'pagado' : 'pendiente',
        metodo_adelanto: conPagoOnline ? metodo : null,
        comprobante_archivo: archivo,
        comprobante_revision: metodo === 'qr_fijo' ? 'sin_revisar' : null,
      }, { transaction });

      return { cita: nuevaCita, pago: nuevoPago };
    }));
  } catch (err) {
    await borrarArchivoPrivado('comprobantes', archivo);
    throw err;
  }

  let avisoWhatsApp;
  if (metodo === 'qr_fijo') {
    const paciente = await db.Paciente.findByPk(req.pacienteId);
    avisoWhatsApp = await enviarConfirmacionCita(paciente.telefono, fecha, slot.hora_inicio);
  }

  const pagoJSON = pago.toJSON();
  delete pagoJSON.comprobante_archivo;
  res.status(201).json({ cita, pago: pagoJSON, requierePago: metodo === 'qr_banco', avisoWhatsApp });
});
```

- [ ] **Step 4: Actualizar los tests existentes que reservan**

En `backend/test/citas.test.js` y `backend/test/pagos.test.js`, en **cada**
`.post('/citas')…send({ … })` exitoso o de validación de porcentaje, agregar
`aceptaPolitica: true` al objeto. En `citas.test.js` son 4 llamadas (cerca de
las líneas 46, 57, 72 y 92) y en `pagos.test.js` son 3 (cerca de las líneas
41, 126 y 137). El test `rejects booking without auth` no necesita el campo.

Ejemplo:

```js
.send({ profesionalId: profesional.id, servicioId: servicio.id, fecha: lunes, horaInicio: '09:00', aceptaPolitica: true });
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && npx jest test/reservaComprobante.test.js test/citas.test.js test/pagos.test.js --runInBand`
Expected: PASS en los tres archivos (9 tests nuevos y los existentes sin cambios).

- [ ] **Step 6: Checkpoint**

Run: `git status --short`. No hacer commit.

---

### Task 6: Revisión de comprobantes (backend)

**Files:**
- Create: `backend/src/routes/staffComprobantes.js`
- Modify: `backend/src/app.js` (registrar la ruta), `backend/src/routes/staffAgenda.js:65-80` (`GET /staff/citas`), `backend/src/routes/staffDashboard.js`
- Test: `backend/test/comprobantes.test.js`

**Interfaces:**
- Consumes: `conPolitica` (tarea 1), `enviarArchivoPrivado` (tarea 3),
  `enviarAvisoCita` (tarea 4).
- Produces:
  - `GET /staff/citas` incluye `Pago`, y cada cita pasa por
    `conPolitica(cita)`. Con `?revision=sin_revisar` ignora la fecha y
    devuelve todas las citas no canceladas cuyo pago está `sin_revisar`.
  - `GET /staff/pagos/:id/comprobante`: el archivo (permiso `agenda`).
  - `PATCH /staff/pagos/:id/revision` con body `{ resultado: 'valido' | 'invalido' }`.
    Responde `{ cita, avisoWhatsApp? }`, con la cita pasada por `conPolitica`.
  - El dashboard agrega `comprobantesPorRevisar: number | null` (null si no
    tiene permiso `agenda`).

- [ ] **Step 1: Write the failing test**

```js
// backend/test/comprobantes.test.js
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.PRIVADO_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'privado-'));

jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');
const { proximoLunes } = require('./helpers/fechas');
const { pngFalso } = require('./helpers/archivos');

async function loginPaciente(telefono) {
  await request(app).post('/auth/otp/request').send({ telefono, nombre_completo: 'Paciente QR' });
  const otp = await db.OtpCode.findOne({ where: { telefono }, order: [['id', 'DESC']] });
  return (await request(app).post('/auth/otp/verify').send({ telefono, codigo: otp.codigo })).body.token;
}

async function loginStaff(email) {
  return (await request(app).post('/staff/login').send({ email, password: 'secret123' })).body.token;
}

describe('Revisión de comprobantes', () => {
  let profesional, servicio, tokenPaciente, admin, tokenAdmin, tokenCaja;
  const lunes = proximoLunes(0);
  const auth = (t) => ({ Authorization: `Bearer ${t}` });

  async function reservar(hora) {
    const res = await request(app).post('/citas').set(auth(tokenPaciente))
      .field('profesionalId', String(profesional.id)).field('servicioId', String(servicio.id))
      .field('fecha', lunes).field('horaInicio', hora).field('aceptaPolitica', 'true')
      .attach('comprobante', pngFalso(), { filename: 'c.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    return res.body;
  }

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const [rolAdmin] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Admin } });
    const rolCaja = await db.Rol.create({ nombre: 'SoloCaja', permisos: ['caja'] });
    const hash = await bcrypt.hash('secret123', 10);
    admin = await db.Usuario.create({ nombre: 'Admin', email: 'admin@test.com', password_hash: hash, rol_id: rolAdmin.id, activo: true });
    await db.Usuario.create({ nombre: 'Caja', email: 'caja@test.com', password_hash: hash, rol_id: rolCaja.id, activo: true });
    tokenAdmin = await loginStaff('admin@test.com');
    tokenCaja = await loginStaff('caja@test.com');

    servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100, activo: true });
    profesional = await db.Profesional.create({ nombre: 'Dra. Test', activo: true });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    await db.HorarioDisponible.create({ profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '12:00:00' });

    const config = await db.ConfiguracionClinica.obtenerConfig();
    config.metodo_pago_online = 'qr_fijo';
    config.qr_fijo_url = '/uploads/qr/qr-1.png';
    await config.save();

    tokenPaciente = await loginPaciente('59170000040');
  });

  afterAll(async () => {
    fs.rmSync(process.env.PRIVADO_DIR, { recursive: true, force: true });
    await db.sequelize.close();
  });

  test('la agenda trae el pago con su revisión y la política, sin el nombre del archivo', async () => {
    await reservar('09:00');
    const res = await request(app).get(`/staff/citas?fecha=${lunes}`).set(auth(tokenAdmin));
    expect(res.status).toBe(200);
    const cita = res.body[0];
    expect(cita.Pago.comprobante_revision).toBe('sin_revisar');
    expect(cita.Pago.tieneComprobante).toBe(true);
    expect(cita.Pago).not.toHaveProperty('comprobante_archivo');
    expect(cita.politica).toBeDefined();
  });

  test('?revision=sin_revisar lista las pendientes de cualquier fecha', async () => {
    const res = await request(app).get('/staff/citas?revision=sin_revisar').set(auth(tokenAdmin));
    expect(res.body).toHaveLength(1);
  });

  test('el comprobante exige sesión y permiso de agenda, y nunca sale por /uploads', async () => {
    const cita = (await request(app).get('/staff/citas?revision=sin_revisar').set(auth(tokenAdmin))).body[0];
    const ruta = `/staff/pagos/${cita.Pago.id}/comprobante`;
    expect((await request(app).get(ruta)).status).toBe(401);
    expect((await request(app).get(ruta).set(auth(tokenCaja))).status).toBe(403);
    const ok = await request(app).get(ruta).set(auth(tokenAdmin));
    expect(ok.status).toBe(200);
    expect(ok.headers['content-type']).toMatch(/^image\/png/);

    const pago = await db.Pago.findByPk(cita.Pago.id);
    expect((await request(app).get(`/uploads/comprobantes/${pago.comprobante_archivo}`)).status).toBe(404);
    expect((await request(app).get(`/uploads/../privado/comprobantes/${pago.comprobante_archivo}`)).status).toBe(404);
  });

  test('el dashboard cuenta los comprobantes por revisar', async () => {
    const res = await request(app).get('/staff/dashboard').set(auth(tokenAdmin));
    expect(res.body.comprobantesPorRevisar).toBe(1);
  });

  test('válido: guarda quién y cuándo revisó', async () => {
    const cita = (await request(app).get('/staff/citas?revision=sin_revisar').set(auth(tokenAdmin))).body[0];
    const res = await request(app).patch(`/staff/pagos/${cita.Pago.id}/revision`).set(auth(tokenAdmin)).send({ resultado: 'valido' });
    expect(res.status).toBe(200);
    expect(res.body.cita.Pago.comprobante_revision).toBe('valido');
    const pago = await db.Pago.findByPk(cita.Pago.id);
    expect(pago.comprobante_revisado_por_id).toBe(admin.id);
    expect(pago.comprobante_revisado_en).toBeTruthy();
  });

  test('inválido: cancela la cita, marca el pago fallido y libera el horario', async () => {
    const { pago } = await reservar('10:00');
    const res = await request(app).patch(`/staff/pagos/${pago.id}/revision`).set(auth(tokenAdmin)).send({ resultado: 'invalido' });
    expect(res.status).toBe(200);
    expect(res.body.cita.estado).toBe('cancelada');
    expect(res.body.cita.Pago.estado).toBe('fallido');
    expect(res.body.avisoWhatsApp).toBe('no_configurado');

    const slots = await request(app).get(`/disponibilidad?profesionalId=${profesional.id}&servicioId=${servicio.id}&fecha=${lunes}`);
    expect(slots.body.map((s) => s.hora_inicio)).toContain('10:00');
  });

  test('no se puede reactivar con "válido" un comprobante ya anulado', async () => {
    const cita = (await db.Pago.findOne({ where: { comprobante_revision: 'invalido' } }));
    const res = await request(app).patch(`/staff/pagos/${cita.id}/revision`).set(auth(tokenAdmin)).send({ resultado: 'valido' });
    expect(res.status).toBe(400);
  });

  test('inválido sobre una cita completada responde 400 y no cambia nada', async () => {
    const { cita, pago } = await reservar('11:00');
    await db.Cita.update({ estado: 'completada' }, { where: { id: cita.id } });
    const res = await request(app).patch(`/staff/pagos/${pago.id}/revision`).set(auth(tokenAdmin)).send({ resultado: 'invalido' });
    expect(res.status).toBe(400);
    expect((await db.Cita.findByPk(cita.id)).estado).toBe('completada');
    expect((await db.Pago.findByPk(pago.id)).estado).toBe('pagado');
  });

  test('un pago que no es qr_fijo o un resultado desconocido responden 400', async () => {
    const otraCita = await db.Cita.create({ paciente_id: 1, profesional_id: profesional.id, servicio_id: servicio.id, fecha: lunes, hora_inicio: '11:30:00', hora_fin: '12:00:00', estado: 'confirmada' });
    const pagoBanco = await db.Pago.create({ cita_id: otraCita.id, monto: 100, monto_total: 100, estado: 'pagado', metodo_adelanto: 'qr_banco' });
    expect((await request(app).patch(`/staff/pagos/${pagoBanco.id}/revision`).set(auth(tokenAdmin)).send({ resultado: 'valido' })).status).toBe(400);
    expect((await request(app).patch(`/staff/pagos/${pagoBanco.id}/revision`).set(auth(tokenAdmin)).send({ resultado: 'quizas' })).status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest test/comprobantes.test.js --runInBand`
Expected: FAIL. El primer test falla porque `cita.Pago` es undefined.

- [ ] **Step 3: Implementar `GET /staff/citas`**

En `backend/src/routes/staffAgenda.js`:

- Agregar en la cabecera `const { conPolitica } = require('../services/politicaInasistencia');`.
- Reemplazar el handler de `router.get('/staff/citas', ...)` (líneas 65-80)
  por:

```js
router.get('/staff/citas', requirePermiso('agenda'), async (req, res) => {
  const { fecha, desde, hasta, profesionalId, revision } = req.query;
  const where = {};
  const includePago = { model: db.Pago };

  if (revision === 'sin_revisar') {
    // Bandeja de "comprobantes por revisar": de cualquier fecha.
    where.estado = { [Op.ne]: 'cancelada' };
    includePago.where = { comprobante_revision: 'sin_revisar' };
    includePago.required = true;
  } else if (fecha) {
    where.fecha = fecha;
  } else if (desde && hasta) {
    where.fecha = { [Op.between]: [desde, hasta] };
  }
  if (profesionalId) where.profesional_id = profesionalId;

  const citas = await db.Cita.findAll({
    where,
    include: [db.Paciente, db.Profesional, db.Servicio, includePago],
    order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
  });
  res.json(citas.map(conPolitica));
});
```

- [ ] **Step 4: Crear `staffComprobantes.js` y registrarlo**

```js
// backend/src/routes/staffComprobantes.js
// Revisión de los comprobantes del modo "QR fijo + comprobante".
const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { enviarArchivoPrivado } = require('../services/archivosPrivados');
const { enviarAvisoCita } = require('../services/avisosCita');
const { conPolitica } = require('../services/politicaInasistencia');

const router = express.Router();
const onlyAgenda = requirePermiso('agenda');

const MENSAJE_ANULACION = 'tu reserva fue anulada porque no pudimos validar el comprobante de pago. Si crees que es un error, escríbenos por este medio.';

async function citaCompleta(id) {
  return db.Cita.findByPk(id, { include: [db.Paciente, db.Profesional, db.Servicio, db.Pago] });
}

router.get('/staff/pagos/:id/comprobante', onlyAgenda, async (req, res) => {
  const pago = await db.Pago.findByPk(req.params.id);
  if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
  return enviarArchivoPrivado(res, 'comprobantes', pago.comprobante_archivo);
});

router.patch('/staff/pagos/:id/revision', onlyAgenda, async (req, res) => {
  const { resultado } = req.body;
  if (!['valido', 'invalido'].includes(resultado)) {
    return res.status(400).json({ error: 'resultado debe ser valido o invalido' });
  }

  const pago = await db.Pago.findByPk(req.params.id, { include: [{ model: db.Cita, as: 'Cita', include: [db.Paciente] }] });
  if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
  if (pago.metodo_adelanto !== 'qr_fijo') {
    return res.status(400).json({ error: 'Este pago no tiene comprobante para revisar' });
  }
  if (pago.comprobante_revision === 'invalido') {
    return res.status(400).json({ error: 'Este comprobante ya se marcó como inválido y la cita fue anulada' });
  }

  const cita = pago.Cita;
  if (resultado === 'invalido' && ['completada', 'no_asistio'].includes(cita.estado)) {
    return res.status(400).json({ error: 'No se puede anular una cita que ya se atendió o se marcó como inasistencia' });
  }

  await db.sequelize.transaction(async (transaction) => {
    pago.comprobante_revision = resultado;
    pago.comprobante_revisado_por_id = req.usuarioId;
    pago.comprobante_revisado_en = new Date();
    if (resultado === 'invalido') {
      pago.estado = 'fallido';
      cita.estado = 'cancelada';
      await cita.save({ transaction });
    }
    await pago.save({ transaction });
  });

  let avisoWhatsApp;
  if (resultado === 'invalido') {
    avisoWhatsApp = await enviarAvisoCita({
      telefono: cita.Paciente.telefono,
      nombre: cita.Paciente.nombre_completo,
      fecha: cita.fecha,
      hora: String(cita.hora_inicio).slice(0, 5),
      mensaje: MENSAJE_ANULACION,
    });
  }

  res.json({ cita: conPolitica(await citaCompleta(cita.id)), avisoWhatsApp });
});

module.exports = router;
```

En `backend/src/app.js`:
- junto a los demás `require`, agregar `const staffComprobantesRoutes = require('./routes/staffComprobantes');`;
- después de `app.use('/', staffPaquetesRoutes);`, agregar `app.use('/', staffComprobantesRoutes);`.

- [ ] **Step 5: Contador en el dashboard**

En `backend/src/routes/staffDashboard.js`:

- Junto a `const puedeVerPacientes = …` (línea 37), agregar
  `const puedeVerAgenda = permisos.includes('agenda');`.
- Antes de `res.json({` (línea 167), agregar:

```js
  const comprobantesPorRevisar = puedeVerAgenda
    ? await db.Pago.count({
        where: { comprobante_revision: 'sin_revisar' },
        include: [{ model: db.Cita, as: 'Cita', where: { estado: { [Op.ne]: 'cancelada' } }, attributes: [] }],
      })
    : null;
```

- Dentro de `res.json({ ... })`, agregar `comprobantesPorRevisar,`.
- Si `Op` no está importado en el archivo, agregar
  `const { Op } = require('sequelize');` (revisar la cabecera primero).

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && npx jest test/comprobantes.test.js test/staff.test.js --runInBand`
Expected:
- `comprobantes`: PASS (9 tests).
- `staff`: los mismos 3 fallos preexistentes de `docs/pendientes.md` #4 y
  ninguno nuevo. Comparar con `git stash` si hay dudas.

- [ ] **Step 7: Checkpoint**

Run: `git status --short`. No hacer commit.

---

### Task 7: Justificación y reprogramación (backend)

**Files:**
- Create: `backend/src/routes/staffInasistencias.js`
- Modify: `backend/src/app.js`
- Test: `backend/test/inasistencias.test.js`

**Interfaces:**
- Consumes: `plazos` y `conPolitica` (tarea 1); `recibirArchivo`,
  `guardarArchivoPrivado`, `borrarArchivoPrivado` y `enviarArchivoPrivado`
  (tarea 3); `enviarConfirmacionCita` (tarea 4); `getSlotsDisponibles`.
- Produces:
  - `POST /staff/citas/:id/justificacion` (multipart). Campos `decision`
    (`aceptada` | `rechazada`), `nota` (obligatoria) y `archivo` (opcional).
    Responde con la cita pasada por `conPolitica`.
  - `GET /staff/citas/:id/justificacion`: el archivo.
  - `PATCH /staff/citas/:id/reprogramar` con body `{ fecha, horaInicio }`.
    Responde `{ cita, avisoWhatsApp }`.

- [ ] **Step 1: Write the failing test**

```js
// backend/test/inasistencias.test.js
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.PRIVADO_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'privado-'));

jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { enviarPlantillaWhatsApp } = require('../src/services/whatsapp');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');
const { proximoLunes } = require('./helpers/fechas');
const { pngFalso, pdfFalso } = require('./helpers/archivos');

describe('Inasistencia: justificación y reprogramación', () => {
  let profesional, servicio, paciente, token;
  const lunes = proximoLunes(0);
  const lunesSiguiente = proximoLunes(1);
  const auth = () => ({ Authorization: `Bearer ${token}` });

  async function citaConAdelanto(hora, { estado = 'no_asistio', metodo = 'qr_fijo', fecha = lunes } = {}) {
    const cita = await db.Cita.create({
      paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id,
      fecha, hora_inicio: `${hora}:00`, hora_fin: `${hora.slice(0, 3)}30:00`, estado,
    });
    await db.Pago.create({
      cita_id: cita.id, monto: 50, monto_total: 100, porcentaje: 50, estado: 'pagado',
      metodo_adelanto: metodo, comprobante_revision: metodo === 'qr_fijo' ? 'valido' : null,
    });
    return cita;
  }

  function justificar(citaId, campos, archivo) {
    const req = request(app).post(`/staff/citas/${citaId}/justificacion`).set(auth());
    for (const [k, v] of Object.entries(campos)) req.field(k, v);
    return archivo ? req.attach('archivo', archivo, { filename: 'certificado.pdf', contentType: 'application/pdf' }) : req;
  }

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const [rol] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Admin } });
    await db.Usuario.create({ nombre: 'Admin', email: 'admin@test.com', password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true });
    token = (await request(app).post('/staff/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;

    servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100, activo: true });
    profesional = await db.Profesional.create({ nombre: 'Dra. Test', activo: true });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    await db.HorarioDisponible.create({ profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '12:00:00' });
    paciente = await db.Paciente.create({ nombre_completo: 'Ana Paciente', telefono: '59170000050', codigo_paciente: 'P-0050' });
  });

  afterAll(async () => {
    fs.rmSync(process.env.PRIVADO_DIR, { recursive: true, force: true });
    await db.sequelize.close();
  });

  test('solo se justifica una cita en "No asistió"', async () => {
    const cita = await citaConAdelanto('09:00', { estado: 'confirmada' });
    const res = await justificar(cita.id, { decision: 'aceptada', nota: 'Certificado' });
    expect(res.status).toBe(400);
  });

  test('la nota es obligatoria y la decisión debe ser válida', async () => {
    const cita = await citaConAdelanto('09:30');
    expect((await justificar(cita.id, { decision: 'aceptada', nota: '  ' })).status).toBe(400);
    expect((await justificar(cita.id, { decision: 'quizas', nota: 'x' })).status).toBe(400);
  });

  test('una cita sin pago adelantado no se justifica', async () => {
    const cita = await db.Cita.create({ paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id, fecha: lunes, hora_inicio: '11:30:00', hora_fin: '12:00:00', estado: 'no_asistio' });
    await db.Pago.create({ cita_id: cita.id, monto: 100, monto_total: 100, estado: 'pagado' });
    const res = await justificar(cita.id, { decision: 'aceptada', nota: 'x' });
    expect(res.status).toBe(400);
  });

  let citaAceptada;
  test('aceptada con PDF: habilita reprogramar y guarda el archivo en privado', async () => {
    citaAceptada = await citaConAdelanto('10:00');
    const res = await justificar(citaAceptada.id, { decision: 'aceptada', nota: 'Certificado médico' }, pdfFalso());
    expect(res.status).toBe(200);
    expect(res.body.justificacion_estado).toBe('aceptada');
    expect(res.body.tieneJustificacion).toBe(true);
    expect(res.body.politica.puedeReprogramar).toBe(true);
    expect(res.body.politica.montoRetenido).toBe(false);

    const ver = await request(app).get(`/staff/citas/${citaAceptada.id}/justificacion`).set(auth());
    expect(ver.status).toBe(200);
    expect(ver.headers['content-type']).toMatch(/^application\/pdf/);
  });

  test('una segunda justificación responde 400', async () => {
    const res = await justificar(citaAceptada.id, { decision: 'rechazada', nota: 'otra' });
    expect(res.status).toBe(400);
  });

  test('reprogramar a un horario ocupado responde 409', async () => {
    await citaConAdelanto('09:00', { estado: 'confirmada', fecha: lunesSiguiente });
    const res = await request(app).patch(`/staff/citas/${citaAceptada.id}/reprogramar`).set(auth()).send({ fecha: lunesSiguiente, horaInicio: '09:00' });
    expect(res.status).toBe(409);
  });

  test('reprogramar mueve la misma cita, conserva su pago y avisa por WhatsApp', async () => {
    enviarPlantillaWhatsApp.mockClear();
    const res = await request(app).patch(`/staff/citas/${citaAceptada.id}/reprogramar`).set(auth()).send({ fecha: lunesSiguiente, horaInicio: '10:30' });
    expect(res.status).toBe(200);
    expect(res.body.cita.id).toBe(citaAceptada.id);
    expect(res.body.cita.fecha).toBe(lunesSiguiente);
    expect(res.body.cita.hora_inicio).toBe('10:30:00');
    expect(res.body.cita.hora_fin).toBe('11:00:00');
    expect(res.body.cita.estado).toBe('confirmada');
    expect(res.body.cita.fecha_original).toBe(lunes);
    expect(res.body.cita.hora_original).toBe('10:00:00');
    expect(res.body.cita.reprogramacion_usada).toBe(true);
    expect(res.body.cita.Pago.estado).toBe('pagado');
    expect(res.body.avisoWhatsApp).toBe('enviado');
    expect(enviarPlantillaWhatsApp).toHaveBeenCalledWith('59170000050', 'cita_confirmada', [lunesSiguiente, '10:30']);
  });

  test('una segunda reprogramación responde 400 "Ya se reprogramó una vez"', async () => {
    const res = await request(app).patch(`/staff/citas/${citaAceptada.id}/reprogramar`).set(auth()).send({ fecha: lunesSiguiente, horaInicio: '11:00' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Ya se reprogramó una vez');
  });

  test('rechazada: sigue en "No asistió" con el monto retenido y no puede reprogramar', async () => {
    const cita = await citaConAdelanto('11:00');
    const res = await justificar(cita.id, { decision: 'rechazada', nota: 'Sin pruebas' });
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('no_asistio');
    expect(res.body.politica.montoRetenido).toBe(true);
    const rep = await request(app).patch(`/staff/citas/${cita.id}/reprogramar`).set(auth()).send({ fecha: lunesSiguiente, horaInicio: '11:30' });
    expect(rep.status).toBe(400);
  });

  test('una justificación aceptada fuera de plazo igual se registra (decide el personal)', async () => {
    const cita = await citaConAdelanto('09:00', { fecha: '2020-01-06' });
    const res = await justificar(cita.id, { decision: 'aceptada', nota: 'Excepción de la doctora' }, pngFalso());
    expect(res.status).toBe(200);
    expect(res.body.politica.justificacionFueraDePlazo).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest test/inasistencias.test.js --runInBand`
Expected: FAIL; las rutas responden 404.

- [ ] **Step 3: Implementar**

```js
// backend/src/routes/staffInasistencias.js
// Política de inasistencia: el personal registra la justificación que el
// paciente envió por WhatsApp y, si la acepta, reprograma la MISMA cita
// conservando su pago (una sola vez).
const express = require('express');
const db = require('../models');
const { requirePermiso } = require('./auth.middleware');
const { getSlotsDisponibles } = require('../services/disponibilidad');
const { recibirArchivo, guardarArchivoPrivado, borrarArchivoPrivado, enviarArchivoPrivado } = require('../services/archivosPrivados');
const { enviarConfirmacionCita } = require('../services/avisosCita');
const { plazos, conPolitica } = require('../services/politicaInasistencia');

const router = express.Router();
const onlyAgenda = requirePermiso('agenda');

async function citaCompleta(id) {
  return db.Cita.findByPk(id, { include: [db.Paciente, db.Profesional, db.Servicio, db.Pago] });
}

router.post('/staff/citas/:id/justificacion', onlyAgenda, recibirArchivo('archivo'), async (req, res) => {
  const { decision } = req.body;
  const nota = String(req.body.nota || '').trim();
  if (!['aceptada', 'rechazada'].includes(decision)) {
    return res.status(400).json({ error: 'decision debe ser aceptada o rechazada' });
  }
  if (!nota) return res.status(400).json({ error: 'Escribe una nota con el motivo' });

  const cita = await citaCompleta(req.params.id);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  if (cita.estado !== 'no_asistio') {
    return res.status(400).json({ error: 'Solo se puede justificar una cita marcada como "No asistió"' });
  }
  if (cita.justificacion_estado) {
    return res.status(400).json({ error: 'Esta cita ya tiene una justificación registrada' });
  }
  if (!plazos(cita.toJSON()).conAdelanto) {
    return res.status(400).json({ error: 'Esta cita no tiene un pago adelantado retenido' });
  }

  const archivo = req.file ? await guardarArchivoPrivado('justificaciones', req.file.buffer) : null;
  try {
    cita.justificacion_estado = decision;
    cita.justificacion_nota = nota;
    cita.justificacion_archivo = archivo;
    cita.justificacion_registrada_en = new Date();
    await cita.save();
  } catch (err) {
    await borrarArchivoPrivado('justificaciones', archivo);
    throw err;
  }

  res.json(conPolitica(await citaCompleta(cita.id)));
});

router.get('/staff/citas/:id/justificacion', onlyAgenda, async (req, res) => {
  const cita = await db.Cita.findByPk(req.params.id);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  return enviarArchivoPrivado(res, 'justificaciones', cita.justificacion_archivo);
});

router.patch('/staff/citas/:id/reprogramar', onlyAgenda, async (req, res) => {
  const { fecha, horaInicio } = req.body;
  if (!fecha || !horaInicio) return res.status(400).json({ error: 'fecha y horaInicio son requeridos' });

  const cita = await citaCompleta(req.params.id);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  if (cita.reprogramacion_usada) return res.status(400).json({ error: 'Ya se reprogramó una vez' });
  // Fuera de los 30 días no se bloquea: el panel solo lo advierte.
  if (!plazos(cita.toJSON()).puedeReprogramar) {
    return res.status(400).json({ error: 'Solo se puede reprogramar una inasistencia con justificación aceptada' });
  }

  const slots = await getSlotsDisponibles({ profesionalId: cita.profesional_id, servicioId: cita.servicio_id, fecha });
  const slot = slots.find((s) => s.hora_inicio === horaInicio);
  if (!slot) return res.status(409).json({ error: 'Ese horario no está disponible' });

  cita.fecha_original = cita.fecha;
  cita.hora_original = cita.hora_inicio;
  cita.fecha = fecha;
  cita.hora_inicio = `${slot.hora_inicio}:00`;
  cita.hora_fin = `${slot.hora_fin}:00`;
  cita.estado = 'confirmada';
  cita.reprogramacion_usada = true;
  await cita.save();

  const avisoWhatsApp = await enviarConfirmacionCita(cita.Paciente.telefono, fecha, slot.hora_inicio);
  res.json({ cita: conPolitica(await citaCompleta(cita.id)), avisoWhatsApp });
});

module.exports = router;
```

En `backend/src/app.js`:
- agregar `const staffInasistenciasRoutes = require('./routes/staffInasistencias');`;
- después de `app.use('/', staffComprobantesRoutes);`, agregar `app.use('/', staffInasistenciasRoutes);`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest test/inasistencias.test.js --runInBand`
Expected: PASS (10 tests). Si `hora_fin` del helper `citaConAdelanto`
(`${hora.slice(0, 3)}30:00`) genera una hora inválida para `09:30`, cambiar
solo ese helper para sumar 30 minutos correctamente; no cambiar la ruta.

- [ ] **Step 5: Checkpoint**

Run: `git status --short`. No hacer commit.

---

### Task 8: Montos retenidos en el reporte de citas

**Files:**
- Modify: `backend/src/routes/staffReportes.js` (`datosCitas` y PDF de citas)
- Test: `backend/test/reportesRetenidos.test.js`

**Interfaces:**
- Consumes: `plazos` (tarea 1).
- Produces: `GET /staff/reportes/citas` agrega `montoRetenido: number`
  (2 decimales) y `citasConMontoRetenido: number`.

- [ ] **Step 1: Write the failing test**

```js
// backend/test/reportesRetenidos.test.js
jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { PERMISOS_POR_DEFECTO } = require('../src/config/permisos');

describe('Reporte de citas: montos retenidos por inasistencia', () => {
  let token;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const [rol] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' }, defaults: { permisos: PERMISOS_POR_DEFECTO.Admin } });
    await db.Usuario.create({ nombre: 'Admin', email: 'admin@test.com', password_hash: await bcrypt.hash('secret123', 10), rol_id: rol.id, activo: true });
    token = (await request(app).post('/staff/login').send({ email: 'admin@test.com', password: 'secret123' })).body.token;

    const servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100 });
    const profesional = await db.Profesional.create({ nombre: 'Dra. Test' });
    const paciente = await db.Paciente.create({ nombre_completo: 'Ana', telefono: '59170000060', codigo_paciente: 'P-0060' });

    async function cita(hora, extraCita, extraPago) {
      const c = await db.Cita.create({ paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id, fecha: '2026-10-05', hora_inicio: `${hora}:00`, hora_fin: `${hora}:30`, estado: 'no_asistio', ...extraCita });
      await db.Pago.create({ cita_id: c.id, monto: 50, monto_total: 100, porcentaje: 50, estado: 'pagado', metodo_adelanto: 'qr_fijo', ...extraPago });
    }
    await cita('09', {}, {});
    await cita('10', {}, { monto: 100, porcentaje: 100, metodo_adelanto: 'qr_banco' });
    await cita('11', { justificacion_estado: 'aceptada', justificacion_registrada_en: new Date() }, {});
    await cita('12', {}, { metodo_adelanto: null });
    await cita('13', { estado: 'completada' }, {});
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('suma solo las inasistencias con adelanto y sin justificación aceptada', async () => {
    const res = await request(app).get('/staff/reportes/citas?desde=2026-10-01&hasta=2026-10-31').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.montoRetenido).toBe(150);
    expect(res.body.citasConMontoRetenido).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest test/reportesRetenidos.test.js --runInBand`
Expected: FAIL; `montoRetenido` es undefined.

- [ ] **Step 3: Implementar**

En `backend/src/routes/staffReportes.js`:

- Cabecera: `const { plazos } = require('../services/politicaInasistencia');`.
- En `datosCitas`, cambiar `include: [db.Profesional, db.Servicio],` por
  `include: [db.Profesional, db.Servicio, db.Pago],`.
- Antes del `for (const c of citas)`, agregar:

```js
  let montoRetenido = 0;
  let citasConMontoRetenido = 0;
```

- Dentro del `for`, al final:

```js
    if (plazos(c.toJSON()).montoRetenido) {
      montoRetenido += Number(c.Pago.monto);
      citasConMontoRetenido += 1;
    }
```

- En el objeto que devuelve, después de `noShowRate,`:

```js
    montoRetenido: Math.round(montoRetenido * 100) / 100,
    citasConMontoRetenido,
```

- En el PDF de citas, después de la línea de "Tasa de inasistencia":

```js
  doc.font('Helvetica').fontSize(10).text(`Montos retenidos por inasistencia: Bs ${datos.montoRetenido.toFixed(2)} (${datos.citasConMontoRetenido} citas)`);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest test/reportesRetenidos.test.js test/reportes.test.js --runInBand`
Expected: PASS (1 test nuevo y los 4 existentes).

- [ ] **Step 5: Checkpoint**

Run: `git status --short`. No hacer commit.

---

### Task 9: Sitio público — política, pago con comprobante y confirmación

**Files:**
- Create: `public-site/src/components/booking/PoliticaInasistencia.tsx`, `public-site/src/components/booking/StepPagoComprobante.tsx`
- Modify: `public-site/src/lib/types.ts:18-25`, `public-site/src/lib/api.js`, `public-site/src/lib/bookingContext.tsx`, `public-site/src/components/booking/StepConfirmar.tsx`, `public-site/src/components/booking/BookingModal.tsx:59`, `public-site/src/components/booking/StepConfirmada.tsx`
- Modify: `e2e/tests/public-site-booking.spec.js`

**Interfaces:**
- Consumes: `GET /configuracion-publica` (tarea 4) y `POST /citas` (tarea 5).
- Produces (contexto de reserva):
  - `config: ConfiguracionPublica | null` y `setConfig`;
  - `porcentaje: 50 | 100` y `setPorcentaje`;
  - `aceptaPolitica: boolean` y `setAceptaPolitica`.
  - `api.crearCita(profesionalId, servicioId, fecha, horaInicio, porcentajePago, aceptaPolitica)`.
  - `api.crearCitaConComprobante({ profesionalId, servicioId, fecha, horaInicio, porcentajePago }, archivo)`.
  - Los errores de `apiFetch` traen `status`.

- [ ] **Step 1: Tipos, API y contexto**

`public-site/src/lib/types.ts`: reemplazar `cobra_adelanto_online?: boolean;`
por:

```ts
  metodo_pago_online?: 'ninguno' | 'qr_banco' | 'qr_fijo';
  qr_fijo_url?: string | null;
  qr_fijo_datos?: string | null;
  politica_inasistencia?: string;
```

`public-site/src/lib/api.js`: reemplazar `apiFetch` y `crearCita`, y agregar
`crearCitaConComprobante`:

```js
async function apiFetch(path, options = {}) {
  const token = getToken();
  const esFormData = options.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(esFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error || `Error ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}
```

```js
  crearCita: (profesionalId, servicioId, fecha, horaInicio, porcentajePago, aceptaPolitica) =>
    apiFetch('/citas', {
      method: 'POST',
      body: JSON.stringify({ profesionalId, servicioId, fecha, horaInicio, porcentajePago, aceptaPolitica }),
    }),
  crearCitaConComprobante: ({ profesionalId, servicioId, fecha, horaInicio, porcentajePago }, archivo) => {
    const datos = new FormData();
    datos.append('profesionalId', String(profesionalId));
    datos.append('servicioId', String(servicioId));
    datos.append('fecha', fecha);
    datos.append('horaInicio', horaInicio);
    datos.append('porcentajePago', String(porcentajePago));
    datos.append('aceptaPolitica', 'true');
    datos.append('comprobante', archivo);
    return apiFetch('/citas', { method: 'POST', body: datos });
  },
```

Además, en `types.ts`:

```ts
export function estadoHttp(e: unknown): number | undefined {
  return typeof e === 'object' && e !== null && 'status' in e ? Number((e as { status: unknown }).status) : undefined;
}
```

`public-site/src/lib/bookingContext.tsx`: agregar a `BookingState`, con sus
`useState`, el reinicio en `open()` y la inclusión en el `value`:

```ts
  config: ConfiguracionPublica | null;
  setConfig: (c: ConfiguracionPublica | null) => void;
  porcentaje: 50 | 100;
  setPorcentaje: (p: 50 | 100) => void;
  aceptaPolitica: boolean;
  setAceptaPolitica: (v: boolean) => void;
```

- Estados: `const [config, setConfig] = useState<ConfiguracionPublica | null>(null);`,
  `const [porcentaje, setPorcentaje] = useState<50 | 100>(100);` y
  `const [aceptaPolitica, setAceptaPolitica] = useState(false);`.
- En `open()`: `setPorcentaje(100); setAceptaPolitica(false);`. **No**
  reiniciar `config`: se vuelve a pedir en Confirmar.
- Importar `ConfiguracionPublica` desde `./types`.

- [ ] **Step 2: Componente de la política**

```tsx
// public-site/src/components/booking/PoliticaInasistencia.tsx
'use client';
import { useState } from 'react';

export default function PoliticaInasistencia({
  texto,
  aceptada,
  onChange,
}: {
  texto: string;
  aceptada: boolean;
  onChange: (v: boolean) => void;
}) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div className="mt-6 rounded border border-tan/30 p-4">
      <label className="flex items-start gap-3 text-sm text-ink">
        <input
          type="checkbox"
          checked={aceptada}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-espresso"
        />
        <span>Acepto la política de inasistencia</span>
      </label>
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className="mt-2 text-xs uppercase tracking-widest text-tan hover:text-espresso"
      >
        {abierta ? 'Ocultar política' : 'Ver política completa'}
      </button>
      {abierta && (
        <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
          {texto.split(/\n{2,}/).map((parrafo, i) => (
            <p key={i}>{parrafo}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: `StepConfirmar` con los tres modos**

Reemplazar el cuerpo de `StepConfirmar.tsx`:

- Usar del contexto `config`, `setConfig`, `porcentaje`, `setPorcentaje`,
  `aceptaPolitica` y `setAceptaPolitica`, en lugar del `useState` local de
  `porcentaje` y de `cobraAdelanto`.
- El `useEffect` hace `api.getConfiguracionPublica().then(setConfig).catch(() => setConfig({ metodo_pago_online: 'qr_banco' }))`.
- `const metodo = config?.metodo_pago_online ?? 'qr_banco'; const cobraAdelanto = metodo !== 'ninguno';`
- El bloque 50 % / 100 % se muestra con `cobraAdelanto && precio !== null`,
  igual que hoy, pero usando `setPorcentaje` del contexto.
- Debajo del bloque de porcentaje, si `cobraAdelanto`:

```tsx
        <PoliticaInasistencia
          texto={config?.politica_inasistencia ?? ''}
          aceptada={aceptaPolitica}
          onChange={setAceptaPolitica}
        />
```

- La función `confirmar()`:

```tsx
  async function confirmar() {
    setError('');
    if (metodo === 'qr_fijo') {
      setStep('pago');
      return;
    }
    setCargando(true);
    try {
      const { cita, pago, requierePago } = await api.crearCita(profesionalId, servicioId, fecha, horaInicio, porcentaje, aceptaPolitica);
      setCitaId(cita.id);
      setPago(pago);
      setStep(requierePago ? 'pago' : 'confirmada');
    } catch (e: unknown) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }
```

- El botón agrega `disabled={cargando || !config || (cobraAdelanto && !aceptaPolitica)}`.
  Su texto queda así:

```tsx
        {cargando
          ? 'Confirmando…'
          : metodo === 'qr_fijo' && montoAPagar !== null
            ? `Continuar al pago de Bs. ${montoAPagar}`
            : cobraAdelanto && montoAPagar !== null
              ? `Confirmar y pagar Bs. ${montoAPagar}`
              : 'Confirmar reserva'}
```

- Debajo del botón, si `cobraAdelanto && !aceptaPolitica`:
  `<p className="mt-2 text-center text-xs text-muted">Marca la casilla de la política para continuar.</p>`.

- [ ] **Step 4: Paso de pago con comprobante**

```tsx
// public-site/src/components/booking/StepPagoComprobante.tsx
'use client';
import { useEffect, useState, type ChangeEvent } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';
import { estadoHttp, mensajeError } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MENSAJE_FORMATO = 'Sube una imagen (JPG, PNG o WebP) o un PDF de hasta 5 MB';

export default function StepPagoComprobante() {
  const { config, servicio, profesionalId, servicioId, fecha, horaInicio, porcentaje, setHoraInicio, setCitaId, setPago, setStep } = useBooking();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [horarioOcupado, setHorarioOcupado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const precio = servicio?.precio ? Number(servicio.precio) : 0;
  const monto = Math.round(precio * (porcentaje / 100) * 100) / 100;
  const qrSrc = config?.qr_fijo_url ? `${API_URL}${config.qr_fijo_url}` : null;

  useEffect(() => {
    if (!archivo || !archivo.type.startsWith('image/')) {
      setVistaPrevia(null);
      return;
    }
    const url = URL.createObjectURL(archivo);
    setVistaPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  function elegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    setError('');
    const elegido = e.target.files?.[0] ?? null;
    if (elegido && (!TIPOS.includes(elegido.type) || elegido.size > MAX_BYTES)) {
      setArchivo(null);
      setError(MENSAJE_FORMATO);
      e.target.value = '';
      return;
    }
    setArchivo(elegido);
  }

  async function enviar() {
    if (!archivo || enviando) return;
    setEnviando(true);
    setError('');
    try {
      const { cita, pago } = await api.crearCitaConComprobante(
        { profesionalId, servicioId, fecha, horaInicio, porcentajePago: porcentaje },
        archivo,
      );
      setCitaId(cita.id);
      setPago(pago);
      setStep('confirmada');
    } catch (e: unknown) {
      setHorarioOcupado(estadoHttp(e) === 409);
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  }

  function elegirOtroHorario() {
    setHoraInicio(null);
    setStep('horario');
  }

  return (
    <div className="text-center">
      <h3 className="font-serif text-2xl text-espresso">Paga Bs. {monto} escaneando este QR</h3>
      {qrSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrSrc} alt="QR de pago de la clínica" className="mx-auto mt-6 w-64 rounded border border-tan/30" />
      ) : (
        <p className="mt-6 text-sm text-red-600">La clínica todavía no cargó su QR. Escríbenos por WhatsApp para reservar.</p>
      )}
      {config?.qr_fijo_datos && <p className="mt-3 text-sm text-muted">{config.qr_fijo_datos}</p>}
      {porcentaje === 50 && (
        <p className="mt-2 text-sm text-muted">Esto es tu seña del 50%. El saldo de Bs. {Math.round((precio - monto) * 100) / 100} se paga en la clínica el día de tu cita.</p>
      )}

      <label className="mt-6 block text-left text-sm text-ink">
        <span className="text-xs uppercase tracking-widest text-muted">Comprobante de pago</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={elegirArchivo}
          className="mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-espresso file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-widest file:text-cream"
        />
      </label>
      {vistaPrevia && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={vistaPrevia} alt="Vista previa del comprobante" className="mx-auto mt-4 max-h-48 rounded border border-tan/30" />
      )}
      {archivo && !vistaPrevia && <p className="mt-3 text-sm text-muted">{archivo.name}</p>}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {horarioOcupado ? (
        <button onClick={elegirOtroHorario} className="mt-6 w-full rounded-full bg-espresso px-6 py-3 text-xs uppercase tracking-widest text-cream">
          Elegir otro horario
        </button>
      ) : (
        <button
          onClick={enviar}
          disabled={!archivo || !qrSrc || enviando}
          className="mt-6 w-full rounded-full bg-espresso px-6 py-3 text-xs uppercase tracking-widest text-cream disabled:opacity-50"
        >
          {enviando ? 'Enviando…' : 'Enviar reserva'}
        </button>
      )}
    </div>
  );
}
```

`BookingModal.tsx` (línea 59): cambiar `{step === 'pago' && <StepPago />}` por

```tsx
        {step === 'pago' && (config?.metodo_pago_online === 'qr_fijo' ? <StepPagoComprobante /> : <StepPago />)}
```

Además, sumar `config` al `useBooking()` del modal e importar
`StepPagoComprobante`.

- [ ] **Step 5: Mensaje de confirmación correcto**

Reemplazar en `StepConfirmada.tsx` la línea
`<p className="mt-2 text-sm text-muted">Pagas el total en la clínica el día de tu cita.</p>` por:

```tsx
      <p className="mt-2 text-sm text-muted">{mensajePago}</p>
```

con, antes del `return`:

```tsx
  const { pago } = useBooking();
  const pagado = pago?.estado === 'pagado';
  const saldo = pago ? Math.round((Number(pago.monto_total) - Number(pago.monto)) * 100) / 100 : 0;
  const mensajePago = !pagado
    ? 'Pagas el total en la clínica el día de tu cita.'
    : saldo > 0
      ? `Recibimos tu comprobante. El saldo de Bs. ${saldo} se paga en la clínica el día de tu cita.`
      : 'Recibimos tu comprobante. Te enviamos la confirmación por WhatsApp.';
```

Agregar `pago` a la desestructuración existente de `useBooking()` en lugar de
llamarlo dos veces. Si `Pago` en `types.ts` no tiene `estado`, agregar
`estado?: 'pendiente' | 'pagado' | 'fallido';`.

- [ ] **Step 6: e2e**

En `e2e/tests/public-site-booking.spec.js`, antes de
`await dialog.getByRole('button', { name: /Confirmar/ }).click();`, agregar:

```js
  // Con pago online (modo por defecto) hay que aceptar la política.
  const politica = dialog.getByLabel('Acepto la política de inasistencia');
  if (await politica.isVisible()) await politica.check();
```

- [ ] **Step 7: Verificar tipos y lint**

Run: `cd public-site && npx tsc --noEmit -p . && npx eslint src/components/booking src/lib`
Expected: sin errores.

- [ ] **Step 8: Verificación manual en el navegador**

Levantar el backend (4000) y el sitio público (3001). Con Playwright o a mano:

1. **Modo `qr_banco`:**
   - El botón de Confirmar está deshabilitado hasta marcar la casilla.
   - "Ver política completa" muestra los 4 párrafos.
   - Al confirmar, pasa a la pantalla del QR del banco.
2. **Modo `ninguno`** (desde el panel o con SQL en `bd_novaged`): no hay
   casilla y se confirma directo.
3. **Modo `qr_fijo`** con un QR subido:
   - Confirmar lleva al paso de pago, que muestra el QR, el monto y los datos.
   - Subir un `.txt` muestra el mensaje de formato.
   - Subir un PNG muestra la vista previa.
   - "Enviar reserva" lleva a "¡Reserva confirmada!" con el texto del
     comprobante.
4. **Doble clic** rápido en "Enviar reserva": se crea una sola cita
   (comprobar en la base).
5. **Horario ocupado:** reservar el mismo horario desde otra pestaña antes de
   enviar. Debe aparecer "Ese horario acaba de ocuparse, elige otro" y el
   botón "Elegir otro horario" vuelve a Horario.
6. **Celular (390 px):** sin desborde horizontal y el QR se ve completo.

Volver la configuración a como estaba al terminar.

- [ ] **Step 9: Checkpoint**

Run: `git status --short`. No hacer commit.

---

### Task 10: Panel — Configuración de pagos

**Files:**
- Modify: `staff/src/app/configuracion/page.tsx`, `staff/src/lib/api.js:207-216`

**Interfaces:**
- Consumes: la API de configuración (tarea 4).
- Produces: `api.subirQrConfiguracion(archivo)` y `api.eliminarQrConfiguracion()`.

- [ ] **Step 1: API**

En `staff/src/lib/api.js`, después de `eliminarLogoConfiguracion`:

```js
  subirQrConfiguracion: (archivo) => {
    const formData = new FormData();
    formData.append('qr', archivo);
    return apiFetch('/staff/configuracion/qr', { method: 'POST', body: formData });
  },
  eliminarQrConfiguracion: () => apiFetch('/staff/configuracion/qr', { method: 'DELETE' }),
```

- [ ] **Step 2: Tipo y valores por defecto**

En `staff/src/app/configuracion/page.tsx`, reemplazar
`cobra_adelanto_online: boolean;` en `Config` por:

```ts
  metodo_pago_online: 'ninguno' | 'qr_banco' | 'qr_fijo';
  qr_fijo_url: string | null;
  qr_fijo_datos: string | null;
  politica_inasistencia: string | null;
  politica_inasistencia_por_defecto?: string;
```

Además:
- en `VACIO`, `cobra_adelanto_online: true` pasa a ser
  `metodo_pago_online: 'qr_banco', qr_fijo_url: null, qr_fijo_datos: '', politica_inasistencia: null`;
- en `CampoTexto`, reemplazar `'cobra_adelanto_online'` por
  `'metodo_pago_online' | 'qr_fijo_url' | 'qr_fijo_datos' | 'politica_inasistencia' | 'politica_inasistencia_por_defecto'`.

Al cargar (`setForm({ ...VACIO, ...c })`), si `c.politica_inasistencia` es
null, rellenar con el texto por defecto:

```ts
      .then((c: Config) => setForm({ ...VACIO, ...c, politica_inasistencia: c.politica_inasistencia ?? c.politica_inasistencia_por_defecto ?? '' }))
```

Hacer lo mismo en los `setForm` que reciben `actualizado` (guardar, subir
logo, quitar logo y las funciones QR nuevas). Para no repetirlo, extraer:

```ts
function aForm(c: Config): Config {
  return { ...VACIO, ...c, politica_inasistencia: c.politica_inasistencia ?? c.politica_inasistencia_por_defecto ?? '' };
}
```

y usar `setForm(aForm(...))` en todos.

- [ ] **Step 3: Funciones de subir y quitar el QR**

Junto a `subirLogo` y `quitarLogo`:

```ts
  const [subiendoQr, setSubiendoQr] = useState(false);
  const inputQrRef = useRef<HTMLInputElement>(null);

  async function subirQr(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoQr(true);
    setError(null);
    try {
      setForm(aForm(await api.subirQrConfiguracion(archivo)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el QR');
    } finally {
      setSubiendoQr(false);
      if (inputQrRef.current) inputQrRef.current.value = '';
    }
  }

  async function quitarQr() {
    setSubiendoQr(true);
    setError(null);
    try {
      setForm(aForm(await api.eliminarQrConfiguracion()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar el QR');
    } finally {
      setSubiendoQr(false);
    }
  }
```

Para `guardar()`: no enviar los campos que solo se leen. Cambiar
`api.actualizarConfiguracion(form)` por:

```ts
      const { qr_fijo_url: _qr, politica_inasistencia_por_defecto: _def, ...datos } = form;
      const actualizado = await api.actualizarConfiguracion(datos);
```

Si el lint marca `_qr` y `_def` como no usados, usar en su lugar
`const datos = { ...form }; delete datos.qr_fijo_url; delete datos.politica_inasistencia_por_defecto;`
con `datos` tipado como `Partial<Config>`.

- [ ] **Step 4: Reemplazar el interruptor por la sección de pagos**

Dentro de la `Seccion id="facturacion"`, reemplazar el `<label …>` del
checkbox "Cobrar adelanto en reservas online" (líneas ~314-329) por:

```tsx
            <fieldset className="flex flex-col gap-2 text-sm">
              <legend className="mb-1 font-medium">Pago al reservar desde la web</legend>
              {(
                [
                  ['ninguno', 'Sin pago online', 'La cita se confirma sin pagar; el paciente paga en la clínica.'],
                  ['qr_banco', 'QR del banco automático', 'Se genera un QR por el monto exacto y el banco confirma el pago solo.'],
                  ['qr_fijo', 'QR fijo + comprobante', 'El paciente paga con el QR de la clínica y sube su comprobante; la cita se confirma al instante y el personal lo revisa.'],
                ] as const
              ).map(([valor, titulo, ayuda]) => (
                <label key={valor} className="flex items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-accent">
                  <input
                    type="radio"
                    name="metodo_pago_online"
                    value={valor}
                    checked={form.metodo_pago_online === valor}
                    onChange={() => setForm({ ...form, metodo_pago_online: valor })}
                    disabled={valor === 'qr_fijo' && !form.qr_fijo_url}
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span>
                    <span className="block font-medium">{titulo}</span>
                    <span className="block text-xs text-muted-foreground">{ayuda}</span>
                    {valor === 'qr_fijo' && !form.qr_fijo_url && (
                      <span className="mt-1 block text-xs text-stat-amber">Sube primero la imagen del QR.</span>
                    )}
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="flex flex-col gap-2 text-sm">
              <span className="font-medium">QR de la clínica</span>
              <div className="flex items-center gap-3">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                  {form.qr_fijo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoSrc(form.qr_fijo_url)!} alt="QR de la clínica" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Sin QR</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input ref={inputQrRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={subirQr} className="hidden" />
                  <button type="button" onClick={() => inputQrRef.current?.click()} disabled={subiendoQr} className="rounded border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-50">
                    {subiendoQr ? 'Subiendo…' : form.qr_fijo_url ? 'Cambiar QR' : 'Subir QR'}
                  </button>
                  {form.qr_fijo_url && (
                    <button type="button" onClick={quitarQr} disabled={subiendoQr || form.metodo_pago_online === 'qr_fijo'} className="rounded border border-border px-3 py-1.5 text-xs hover:bg-accent-soft disabled:opacity-50" title={form.metodo_pago_online === 'qr_fijo' ? 'Cambia primero el modo de pago' : undefined}>
                      Quitar QR
                    </button>
                  )}
                </div>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Datos para el paciente (opcional)</span>
                <input
                  value={form.qr_fijo_datos ?? ''}
                  onChange={(e) => setForm({ ...form, qr_fijo_datos: e.target.value })}
                  placeholder="Titular: … — Banco …"
                  className="rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Política de inasistencia</span>
              <span className="text-xs text-muted-foreground">
                Se muestra al reservar con pago online y el paciente debe aceptarla. Los plazos (48 h para justificar, 30 días para reprogramar) son fijos en el sistema.
              </span>
              <textarea
                rows={8}
                value={form.politica_inasistencia ?? ''}
                onChange={(e) => setForm({ ...form, politica_inasistencia: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2"
              />
              {form.politica_inasistencia_por_defecto && form.politica_inasistencia !== form.politica_inasistencia_por_defecto && (
                <button type="button" onClick={() => setForm({ ...form, politica_inasistencia: form.politica_inasistencia_por_defecto ?? '' })} className="self-start text-xs text-accent hover:underline">
                  Restaurar el texto por defecto
                </button>
              )}
            </label>
```

- [ ] **Step 5: Verificar**

Run: `cd staff && npx tsc --noEmit -p . && npx eslint src/app/configuracion src/lib/api.js`
Expected: sin errores nuevos.

En el navegador (`/configuracion`):
- "QR fijo" está deshabilitado sin QR.
- Al subir el QR se habilita; se elige y se guarda.
- "Quitar QR" está deshabilitado en ese modo.
- La política viene rellenada y "Restaurar" funciona.
- En celular (390 px) no hay desborde.

Volver la configuración a como estaba.

- [ ] **Step 6: Checkpoint**

Run: `git status --short`. No hacer commit.

---

### Task 11: Panel — Agenda: comprobantes, justificación y reprogramación

**Files:**
- Create: `staff/src/app/agenda/politica.ts`, `staff/src/app/agenda/ArchivoPrivado.tsx`, `staff/src/app/agenda/ComprobanteModal.tsx`, `staff/src/app/agenda/JustificacionModal.tsx`, `staff/src/app/agenda/ReprogramarModal.tsx`
- Modify: `staff/src/lib/api.js`, `staff/src/app/agenda/DayAgendaCards.tsx`, `staff/src/app/agenda/page.tsx`, `staff/src/app/dashboard/page.tsx`, `staff/src/app/reportes/page.tsx`

**Interfaces:**
- Consumes: las tareas 6, 7 y 8.
- Produces (api):
  - `getCitasPorRevisar()`;
  - `obtenerArchivoPrivado(path)`: devuelve `{ url, tipo }` (blob URL);
  - `revisarComprobante(pagoId, resultado)`;
  - `registrarJustificacion(citaId, { decision, nota, archivo })`;
  - `reprogramarCita(citaId, fecha, horaInicio)`.
- Produces (tipo `Cita` en `DayAgendaCards.tsx`): agrega `Pago`,
  `politica`, `justificacion_estado`, `justificacion_nota`,
  `tieneJustificacion`, `reprogramacion_usada`, `fecha_original` y
  `hora_original`.

- [ ] **Step 1: API del panel**

En `staff/src/lib/api.js`, después de `crearCita` (línea 85):

```js
  getCitasPorRevisar: () => apiFetch('/staff/citas?revision=sin_revisar'),
  revisarComprobante: (pagoId, resultado) =>
    apiFetch(`/staff/pagos/${pagoId}/revision`, { method: 'PATCH', body: JSON.stringify({ resultado }) }),
  registrarJustificacion: (citaId, { decision, nota, archivo }) => {
    const datos = new FormData();
    datos.append('decision', decision);
    datos.append('nota', nota);
    if (archivo) datos.append('archivo', archivo);
    return apiFetch(`/staff/citas/${citaId}/justificacion`, { method: 'POST', body: datos });
  },
  reprogramarCita: (citaId, fecha, horaInicio) =>
    apiFetch(`/staff/citas/${citaId}/reprogramar`, { method: 'PATCH', body: JSON.stringify({ fecha, horaInicio }) }),
  // Comprobantes y justificaciones: se piden con la sesión del personal y se
  // muestran como blob, nunca por una URL pública.
  obtenerArchivoPrivado: async (path) => {
    const token = getToken();
    const res = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (res.status === 401) limpiarSesionYRedirigir();
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Error ${res.status}`);
    }
    const blob = await res.blob();
    return { url: URL.createObjectURL(blob), tipo: blob.type };
  },
```

- [ ] **Step 2: Tipos y utilidades**

En `DayAgendaCards.tsx`, ampliar el tipo `Cita`:

```ts
export type PagoCita = {
  id: number;
  monto: string;
  monto_total: string;
  porcentaje: number;
  estado: 'pendiente' | 'pagado' | 'fallido';
  metodo_adelanto: 'qr_banco' | 'qr_fijo' | null;
  comprobante_revision: 'sin_revisar' | 'valido' | 'invalido' | null;
  tieneComprobante: boolean;
};

export type PoliticaCita = {
  conAdelanto: boolean;
  montoRetenido: boolean;
  puedeJustificar: boolean;
  puedeReprogramar: boolean;
  limiteJustificar: string;
  justificacionFueraDePlazo: boolean;
  limiteReprogramar: string | null;
  reprogramacionFueraDePlazo: boolean;
};
```

y dentro de `Cita` agregar:

```ts
  Pago: PagoCita | null;
  politica: PoliticaCita;
  justificacion_estado: 'aceptada' | 'rechazada' | null;
  justificacion_nota: string | null;
  tieneJustificacion: boolean;
  reprogramacion_usada: boolean;
  fecha_original: string | null;
  hora_original: string | null;
```

```ts
// staff/src/app/agenda/politica.ts
import type { Cita } from './DayAgendaCards';

export function fmtFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export const REVISION_LABEL = {
  sin_revisar: 'Comprobante sin revisar',
  valido: 'Comprobante válido',
  invalido: 'Comprobante inválido',
} as const;

export const REVISION_COLOR = {
  sin_revisar: 'var(--stat-amber)',
  valido: 'var(--stat-green)',
  invalido: 'var(--stat-rose)',
} as const;

export function avisoWhatsAppTexto(estado?: string) {
  if (estado === 'no_configurado') return 'Avisa al paciente: la plantilla de WhatsApp no está configurada.';
  if (estado === 'error') return 'No se pudo enviar el WhatsApp al paciente: avísale por tu cuenta.';
  return null;
}

export function tieneRevisionPendiente(cita: Cita) {
  return cita.Pago?.comprobante_revision === 'sin_revisar' && cita.estado !== 'cancelada';
}
```

- [ ] **Step 3: Visor de archivo privado**

```tsx
// staff/src/app/agenda/ArchivoPrivado.tsx
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ArchivoPrivado({ ruta, alt }: { ruta: string; alt: string }) {
  const [archivo, setArchivo] = useState<{ url: string; tipo: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let url: string | null = null;
    let vigente = true;
    api
      .obtenerArchivoPrivado(ruta)
      .then((a: { url: string; tipo: string }) => {
        url = a.url;
        if (vigente) setArchivo(a);
        else URL.revokeObjectURL(a.url);
      })
      .catch((e: unknown) => vigente && setError(e instanceof Error ? e.message : 'No se pudo abrir el archivo'));
    return () => {
      vigente = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [ruta]);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!archivo) return <p className="text-sm text-muted-foreground">Cargando archivo…</p>;
  if (archivo.tipo === 'application/pdf') {
    return (
      <div className="flex flex-col gap-2">
        <iframe src={archivo.url} title={alt} className="h-[60dvh] w-full rounded-lg border border-border" />
        <a href={archivo.url} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">Abrir PDF en otra pestaña</a>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={archivo.url} alt={alt} className="max-h-[60dvh] w-full rounded-lg border border-border object-contain" />;
}
```

Este componente usa `setError` y `setArchivo` dentro de callbacks de
promesa, no de forma síncrona en el efecto, así que no dispara
`react-hooks/set-state-in-effect`.

- [ ] **Step 4: Modal de comprobante**

```tsx
// staff/src/app/agenda/ComprobanteModal.tsx
'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { Cita } from './DayAgendaCards';
import ArchivoPrivado from './ArchivoPrivado';
import { REVISION_LABEL, avisoWhatsAppTexto } from './politica';

export default function ComprobanteModal({ cita, onClose, onCambio }: { cita: Cita; onClose: () => void; onCambio: (aviso: string | null) => void }) {
  const pago = cita.Pago!;
  const [confirmandoInvalido, setConfirmandoInvalido] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function revisar(resultado: 'valido' | 'invalido') {
    setGuardando(true);
    setError('');
    try {
      const res = await api.revisarComprobante(pago.id, resultado);
      onCambio(avisoWhatsAppTexto(res.avisoWhatsApp));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la revisión');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Comprobante de pago" onClick={(e) => e.stopPropagation()} className="thin-scroll max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-panel p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Comprobante de pago</h2>
            <p className="text-sm text-muted-foreground">{cita.Paciente.nombre_completo} · {cita.fecha} {cita.hora_inicio.slice(0, 5)}</p>
          </div>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground" aria-label="Cerrar">✕</button>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg bg-background p-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Debe decir</p><p className="font-semibold">Bs {pago.monto}</p></div>
          <div><p className="text-xs text-muted-foreground">Porcentaje</p><p>{pago.porcentaje}%</p></div>
          <div><p className="text-xs text-muted-foreground">Total servicio</p><p>Bs {pago.monto_total}</p></div>
        </div>

        <ArchivoPrivado ruta={`/staff/pagos/${pago.id}/comprobante`} alt="Comprobante de pago" />

        <p className="mt-3 text-xs text-muted-foreground">Estado: {pago.comprobante_revision ? REVISION_LABEL[pago.comprobante_revision] : '—'}</p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        {pago.comprobante_revision !== 'invalido' && (
          confirmandoInvalido ? (
            <div className="mt-4 rounded-lg border border-danger p-3 text-sm">
              <p>Se cancelará la cita, se liberará el horario y se avisará al paciente. ¿Continuar?</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => revisar('invalido')} disabled={guardando} className="rounded border border-danger px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger hover:text-white disabled:opacity-50">Sí, anular</button>
                <button onClick={() => setConfirmandoInvalido(false)} className="rounded border border-border px-3 py-1.5 text-xs">No</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex gap-2">
              {pago.comprobante_revision !== 'valido' && (
                <button onClick={() => revisar('valido')} disabled={guardando} className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">Válido</button>
              )}
              <button onClick={() => setConfirmandoInvalido(true)} disabled={guardando} className="flex-1 rounded-lg border border-danger px-3 py-2 text-sm font-medium text-danger disabled:opacity-50">Inválido</button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Modal de justificación**

```tsx
// staff/src/app/agenda/JustificacionModal.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import type { Cita } from './DayAgendaCards';
import { fmtFechaHora } from './politica';

const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export default function JustificacionModal({ cita, onClose, onCambio }: { cita: Cita; onClose: () => void; onCambio: () => void }) {
  const [nota, setNota] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function registrar(decision: 'aceptada' | 'rechazada', e?: FormEvent) {
    e?.preventDefault();
    if (!nota.trim()) {
      setError('Escribe una nota con el motivo');
      return;
    }
    if (archivo && (!TIPOS.includes(archivo.type) || archivo.size > MAX_BYTES)) {
      setError('Sube una imagen (JPG, PNG o WebP) o un PDF de hasta 5 MB');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await api.registrarJustificacion(cita.id, { decision, nota: nota.trim(), archivo });
      onCambio();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la justificación');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form role="dialog" aria-modal="true" aria-label="Registrar justificación" onClick={(e) => e.stopPropagation()} onSubmit={(e) => registrar('aceptada', e)} className="thin-scroll max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-panel p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Registrar justificación</h2>
            <p className="text-sm text-muted-foreground">{cita.Paciente.nombre_completo} · {cita.fecha} {cita.hora_inicio.slice(0, 5)}</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground" aria-label="Cerrar">✕</button>
        </div>

        <p className={`mb-3 text-sm ${cita.politica.justificacionFueraDePlazo ? 'text-stat-amber' : 'text-muted-foreground'}`}>
          {cita.politica.justificacionFueraDePlazo
            ? `Fuera de plazo: el límite era el ${fmtFechaHora(cita.politica.limiteJustificar)}. Puedes registrarla igual si la clínica decide hacer una excepción.`
            : `Plazo para justificar: hasta el ${fmtFechaHora(cita.politica.limiteJustificar)}.`}
        </p>

        <label className="flex flex-col gap-1 text-sm">
          Nota (obligatoria)
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3} required placeholder="Ej. Certificado médico del 14/10 enviado por WhatsApp" className="rounded-lg border border-border bg-background px-3 py-2" />
        </label>

        <label className="mt-3 flex flex-col gap-1 text-sm">
          Prueba (opcional): imagen o PDF de hasta 5 MB
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} className="text-sm" />
        </label>

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={guardando} className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">Aceptar justificación</button>
          <button type="button" onClick={() => registrar('rechazada')} disabled={guardando} className="flex-1 rounded-lg border border-danger px-3 py-2 text-sm font-medium text-danger disabled:opacity-50">Rechazar</button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Modal de reprogramación**

```tsx
// staff/src/app/agenda/ReprogramarModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Cita } from './DayAgendaCards';
import { avisoWhatsAppTexto, fmtFechaHora } from './politica';

type Slot = { hora_inicio: string; hora_fin: string };

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReprogramarModal({ cita, onClose, onCambio }: { cita: Cita; onClose: () => void; onCambio: (aviso: string | null) => void }) {
  const [fecha, setFecha] = useState(hoy());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [horaInicio, setHoraInicio] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    api
      .getDisponibilidad(cita.Profesional.id, cita.Servicio.id, fecha)
      .then((lista: Slot[]) => {
        if (!vigente) return;
        setSlots(lista);
        setHoraInicio('');
      })
      .catch(() => vigente && setSlots([]));
    return () => {
      vigente = false;
    };
  }, [cita.Profesional.id, cita.Servicio.id, fecha]);

  async function guardar() {
    if (!horaInicio) return;
    setGuardando(true);
    setError('');
    try {
      const res = await api.reprogramarCita(cita.id, fecha, horaInicio);
      onCambio(avisoWhatsAppTexto(res.avisoWhatsApp));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo reprogramar');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Reprogramar cita" onClick={(e) => e.stopPropagation()} className="thin-scroll max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-panel p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Reprogramar sin volver a pagar</h2>
            <p className="text-sm text-muted-foreground">{cita.Paciente.nombre_completo} · {cita.Servicio.nombre}</p>
          </div>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground" aria-label="Cerrar">✕</button>
        </div>

        {cita.politica.limiteReprogramar && (
          <p className={`mb-3 text-sm ${cita.politica.reprogramacionFueraDePlazo ? 'text-stat-amber' : 'text-muted-foreground'}`}>
            {cita.politica.reprogramacionFueraDePlazo
              ? `Fuera de plazo: el límite era el ${fmtFechaHora(cita.politica.limiteReprogramar)}. Puedes reprogramar igual si la clínica lo decide.`
              : `Plazo para reprogramar: hasta el ${fmtFechaHora(cita.politica.limiteReprogramar)}.`}
          </p>
        )}

        <label className="text-sm">
          Nueva fecha
          <input type="date" min={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 w-full rounded border border-border px-2 py-1.5" />
        </label>
        <div className="mt-3 text-sm">
          Horario disponible
          <div className="mt-1 flex flex-wrap gap-2">
            {slots.length === 0 && <p className="text-xs text-muted-foreground">No hay horarios libres ese día.</p>}
            {slots.map((s) => (
              <button type="button" key={s.hora_inicio} onClick={() => setHoraInicio(s.hora_inicio)} className={`rounded-full border px-3 py-1 text-xs ${horaInicio === s.hora_inicio ? 'border-accent bg-accent text-accent-foreground' : 'border-border hover:bg-accent-soft'}`}>
                {s.hora_inicio}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <button onClick={guardar} disabled={!horaInicio || guardando} className="mt-4 w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
          {guardando ? 'Guardando…' : 'Reprogramar'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Tarjetas de la agenda**

En `DayAgendaCards.tsx`:

- Agregar a las props `onAccion: (cita: Cita, accion: 'comprobante' | 'justificar' | 'reprogramar' | 'verJustificacion') => void`.
- Importar `REVISION_LABEL`, `REVISION_COLOR` y `fmtFechaHora` desde
  `./politica`.
- En la columna derecha del encabezado de la tarjeta, debajo de la etiqueta
  de estado, agregar:

```tsx
                {cita.Pago?.comprobante_revision && cita.estado !== 'cancelada' && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${REVISION_COLOR[cita.Pago.comprobante_revision]}22`, color: REVISION_COLOR[cita.Pago.comprobante_revision] }}>
                    {REVISION_LABEL[cita.Pago.comprobante_revision]}
                  </span>
                )}
```

- Dentro del detalle desplegado, antes del `<select>` de estado, agregar:

```tsx
                  {cita.Pago?.tieneComprobante && (
                    <button type="button" onClick={() => onAccion(cita, 'comprobante')} className="self-start text-sm text-accent hover:underline">
                      Ver comprobante →
                    </button>
                  )}

                  {cita.estado === 'no_asistio' && cita.politica.conAdelanto && (
                    <div className="rounded-lg border border-border bg-background p-2 text-xs">
                      {cita.politica.montoRetenido && !cita.justificacion_estado && (
                        <p className={cita.politica.justificacionFueraDePlazo ? 'text-stat-amber' : 'text-muted-foreground'}>
                          Monto retenido (Bs {cita.Pago?.monto}) ·{' '}
                          {cita.politica.justificacionFueraDePlazo ? 'fuera de plazo' : `puede justificar hasta el ${fmtFechaHora(cita.politica.limiteJustificar)}`}
                        </p>
                      )}
                      {cita.justificacion_estado === 'rechazada' && <p className="text-danger">Justificación rechazada · monto retenido</p>}
                      {cita.justificacion_estado === 'aceptada' && <p className="text-stat-green">Justificación aceptada</p>}
                      {cita.justificacion_nota && <p className="mt-1 text-muted-foreground">“{cita.justificacion_nota}”</p>}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {cita.politica.puedeJustificar && (
                          <button type="button" onClick={() => onAccion(cita, 'justificar')} className="rounded border border-border px-2 py-1 hover:bg-accent-soft">Registrar justificación</button>
                        )}
                        {cita.politica.puedeReprogramar && (
                          <button type="button" onClick={() => onAccion(cita, 'reprogramar')} className="rounded border border-accent px-2 py-1 text-accent hover:bg-accent-soft">Reprogramar</button>
                        )}
                        {cita.tieneJustificacion && (
                          <button type="button" onClick={() => onAccion(cita, 'verJustificacion')} className="rounded border border-border px-2 py-1 hover:bg-accent-soft">Ver prueba</button>
                        )}
                      </div>
                    </div>
                  )}

                  {cita.reprogramacion_usada && cita.fecha_original && (
                    <p className="text-xs text-muted-foreground">
                      Reprogramada desde el {cita.fecha_original} {cita.hora_original?.slice(0, 5)} · ya se reprogramó una vez
                    </p>
                  )}
```

- [ ] **Step 8: Página de la agenda**

En `staff/src/app/agenda/page.tsx`:

```tsx
  const [porRevisar, setPorRevisar] = useState<Cita[]>([]);
  const [verPorRevisar, setVerPorRevisar] = useState(false);
  const [modal, setModal] = useState<{ cita: Cita; accion: 'comprobante' | 'justificar' | 'reprogramar' | 'verJustificacion' } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargarPorRevisar = useCallback(async () => {
    try {
      setPorRevisar(await api.getCitasPorRevisar());
    } catch {
      setPorRevisar([]);
    }
  }, []);

  useEffect(() => {
    cargarPorRevisar();
  }, [cargarPorRevisar]);

  function recargarTodo(textoAviso: string | null = null) {
    setAviso(textoAviso);
    cargarCitas();
    cargarPorRevisar();
  }
```

Si el lint marca `react-hooks/set-state-in-effect` en este `useEffect` (el
mismo caso preexistente de `cargar()` en otras páginas), dejarlo igual que
`cargarCitas`, que ya usa el mismo patrón en esta página. No introducir un
patrón distinto.

- Debajo de la barra superior, antes de las tarjetas:

```tsx
      {porRevisar.length > 0 && (
        <button type="button" onClick={() => setVerPorRevisar((v) => !v)} className="mb-4 flex w-full items-center justify-between rounded-xl border border-stat-amber bg-stat-amber-soft px-4 py-3 text-left text-sm text-stat-amber">
          <span className="font-medium">{porRevisar.length} {porRevisar.length === 1 ? 'comprobante por revisar' : 'comprobantes por revisar'}</span>
          <span className="text-xs">{verPorRevisar ? 'Volver a la agenda del día' : 'Ver todos'}</span>
        </button>
      )}
      {aviso && <p className="mb-4 rounded-lg border border-stat-amber px-3 py-2 text-sm text-stat-amber">{aviso}</p>}
```

- Reemplazar el uso de `<DayAgendaCards citas={citas} … />` para mostrar
  `porRevisar` cuando `verPorRevisar` está activo:

```tsx
        <DayAgendaCards
          citas={verPorRevisar ? porRevisar : citas}
          mostrarProfesional={!profesionalId}
          onEstadoChange={cambiarEstado}
          onAccion={(cita, accion) => setModal({ cita, accion })}
        />
```

  Con `verPorRevisar`, las tarjetas muestran la fecha además de la hora: en
  `DayAgendaCards`, agregar la prop opcional `mostrarFecha?: boolean` y,
  cuando sea true, anteponer `{cita.fecha} · ` a la hora. Pasar
  `mostrarFecha={verPorRevisar}`.

- `cambiarEstado` debe llamar `recargarTodo()` en vez de `cargarCitas()`.
- Al final del JSX:

```tsx
      {modal?.accion === 'comprobante' && <ComprobanteModal cita={modal.cita} onClose={() => setModal(null)} onCambio={recargarTodo} />}
      {modal?.accion === 'justificar' && <JustificacionModal cita={modal.cita} onClose={() => setModal(null)} onCambio={() => recargarTodo()} />}
      {modal?.accion === 'reprogramar' && <ReprogramarModal cita={modal.cita} onClose={() => setModal(null)} onCambio={recargarTodo} />}
      {modal?.accion === 'verJustificacion' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div role="dialog" aria-modal="true" aria-label="Prueba de la justificación" onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-xl border border-border bg-panel p-6">
            <div className="mb-3 flex justify-between"><h2 className="text-base font-semibold">Prueba de la justificación</h2><button onClick={() => setModal(null)} aria-label="Cerrar">✕</button></div>
            <ArchivoPrivado ruta={`/staff/citas/${modal.cita.id}/justificacion`} alt="Prueba de la justificación" />
          </div>
        </div>
      )}
```

  Hay que importar `ComprobanteModal`, `JustificacionModal`,
  `ReprogramarModal` y `ArchivoPrivado`.

- [ ] **Step 9: Inicio y reportes**

En `staff/src/app/dashboard/page.tsx`:
- agregar al tipo de datos `comprobantesPorRevisar: number | null;`;
- en la segunda grilla, la que tiene `saldosPendientes`, agregar:

```tsx
          {data.comprobantesPorRevisar !== null && data.comprobantesPorRevisar > 0 && (
            <StatCard
              icon={<IconAlertCircle />}
              label="Comprobantes por revisar"
              value={String(data.comprobantesPorRevisar)}
              color="amber"
              href="/agenda"
            />
          )}
```

En `staff/src/app/reportes/page.tsx`:
- agregar al tipo `Citas` `montoRetenido: number; citasConMontoRetenido: number;`;
- cambiar la grilla de 4 tarjetas (`sm:grid-cols-4`) a
  `sm:grid-cols-2 lg:grid-cols-5` y, después de "Tasa de inasistencia",
  agregar:

```tsx
            <Card label="Montos retenidos por inasistencia" valor={`${moneda(citas.montoRetenido)} · ${citas.citasConMontoRetenido}`} />
```

- [ ] **Step 10: Verificar**

Run: `cd staff && npx tsc --noEmit -p . && npx eslint src/app/agenda src/app/dashboard src/app/reportes src/lib/api.js`
Expected: sin errores nuevos. Se acepta solo el aviso preexistente de
`set-state-in-effect` con el mismo patrón de `cargar()`.

En el navegador, con el modo `qr_fijo` y una reserva hecha desde la web:

1. Aparece el aviso ámbar "1 comprobante por revisar" en la Agenda y la
   tarjeta del Inicio.
2. "Ver comprobante" muestra la imagen (o un PDF en iframe) y el monto
   esperado. "Válido" quita el aviso.
3. Con otra reserva, "Inválido" pide confirmación: la cita queda Cancelada,
   el horario aparece libre en "+ Nueva cita" y aparece el texto ámbar
   "Avisa al paciente…".
4. Al marcar una cita pagada como "No asistió" aparece "Monto retenido ·
   puede justificar hasta…". "Registrar justificación" sin nota muestra el
   error; con nota y PDF, "Aceptar" muestra "Reprogramar".
5. Reprogramar a otro día deja la cita Confirmada en la nueva fecha, con
   "Reprogramada desde…", y no aparece un segundo "Reprogramar".
6. En Reportes › Citas y Pacientes aparece "Montos retenidos por
   inasistencia".
7. En celular (390 px), los modales se ven completos y con scroll.

Al terminar, borrar las citas, los pagos y los archivos de prueba, y volver
la configuración a como estaba.

- [ ] **Step 11: Checkpoint**

Run: `git status --short`. No hacer commit.

---

### Task 12: Cierre — regresión, documentación y despliegue

**Files:**
- Modify: `docs/pendientes.md`

- [ ] **Step 1: Regresión del backend, archivo por archivo**

Run (desde `backend/`):

```bash
for f in politicaInasistencia archivosPrivados avisosCita configuracionPago reservaComprobante comprobantes inasistencias reportesRetenidos citas pagos reportes inventario catalogo disponibilidad auth models recordatorios staff; do
  echo "== $f"; npx jest test/$f.test.js --runInBand 2>&1 | grep -E "^Tests:"
done
```

Expected: todos PASS, salvo `staff.test.js` con sus 3 fallos preexistentes.
Cualquier fallo nuevo se arregla antes de seguir.

- [ ] **Step 2: Migrar la base de desarrollo**

Run: `cd backend && npx sequelize-cli db:migrate` (sobre `bd_novaged`). Luego
`C:/xampp/mysql/bin/mysql.exe -u root bd_novaged -e "SELECT metodo_pago_online FROM configuracion_clinica"`.
Expected: el valor coincide con el que tenía el interruptor.

- [ ] **Step 3: Build de los dos frontends**

Run: `cd staff && npx next build` y `cd public-site && npx next build`.
Expected: los dos compilan.

- [ ] **Step 4: Documentar lo que queda pendiente para el cliente**

Agregar a `docs/pendientes.md` una sección "5. Plantilla de WhatsApp `aviso_cita`" con:

- **Texto a registrar en Meta**, categoría Utilidad e idioma español:
  `Hola {{1}}, te escribimos de Clinic NovagED sobre tu cita del {{2}}: {{3}}`.
- **Después de aprobarla:** agregar `WHATSAPP_AVISO_TEMPLATE=aviso_cita` al
  `backend/.env` del VPS y reiniciar `api`.
- **Mientras no esté aprobada:** la anulación por comprobante inválido no
  avisa al paciente, y el panel lo indica.
- **Zona horaria:** los plazos usan la hora del servidor (igual que la
  agenda). Si el contenedor corre en UTC, conviene definir
  `TZ=America/La_Paz` en el servicio `api`. Esto se revisa aparte.

- [ ] **Step 5: Revisión final**

Run: `git status --short && git diff --stat`.

Repasar el spec sección por sección contra lo hecho. Informar al usuario:
- qué se probó y qué no;
- que nada tiene commit;
- que en el VPS hacen falta el volumen `privado_data` (ya en el compose) y,
  opcionalmente, `WHATSAPP_AVISO_TEMPLATE`.
