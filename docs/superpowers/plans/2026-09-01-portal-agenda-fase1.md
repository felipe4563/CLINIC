# Portal Paciente + Agenda (Fase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the patient-facing booking portal (Next.js) backed by a Node.js/Express + Sequelize/MySQL API, with WhatsApp OTP login, real-time availability, appointment booking, and Banco Económico QR payment.

**Architecture:** Two independent services in one repo — `backend/` (Express REST API + Sequelize/MySQL) and `frontend/` (Next.js App Router, calls the API over HTTP). Both run in Docker Compose alongside MySQL and an nginx reverse proxy on the user's VPS. No serverless/Vercel hosting for this project.

**Tech Stack:** Node.js, Express, Sequelize, MySQL, Next.js (App Router), Docker Compose, WhatsApp Cloud API (Meta), Banco Económico QR API.

**Spec:** `docs/superpowers/specs/2026-09-01-portal-agenda-fase1-design.md`

## Global Constraints

- Backend and frontend are separate services (not Next.js API routes) — user decision, do not merge them.
- ORM is Sequelize (not Prisma) — user decision.
- Patient login is phone + OTP over WhatsApp Cloud API — no passwords for patients.
- Staff (`Usuario`) accounts use email/password + fixed roles (Admin, Recepción, Profesional) — no permissions UI in this phase, roles are hardcoded checks.
- No staff panel UI in this phase — professional schedules are seeded directly via a seed script.
- Patient CI fields: `carnet_identidad`, `carnet_complemento`, `carnet_expedido` — all three required per spec.
- Availability is computed on query (recurring weekly schedule minus booked appointments) — no pre-generated slot table.
- MySQL only, via Docker Compose on the user's own VPS.

---

## File Structure

```
backend/
  package.json
  .env.example
  src/
    config/
      database.js         # Sequelize instance from env vars
    models/
      index.js            # loads + associates all models
      paciente.js
      otpCode.js
      usuario.js
      rol.js
      profesional.js
      servicio.js
      servicioProfesional.js
      horarioDisponible.js
      cita.js
      pago.js
    services/
      whatsapp.js          # WhatsApp Cloud API client (send template message)
      disponibilidad.js    # compute available slots for profesional+servicio+date range
      bancoEconomico.js    # QR generation client
    routes/
      auth.js              # POST /auth/otp/request, POST /auth/otp/verify
      catalogo.js           # GET /servicios, GET /profesionales
      disponibilidad.js    # GET /disponibilidad
      citas.js              # POST /citas, GET /citas/mias
      pagos.js               # POST /pagos/:citaId/qr, POST /pagos/webhook
      auth.middleware.js   # requirePaciente, requireUsuario(roles)
    app.js                 # express app, mounts routes
    server.js              # http listen
    seed.js                # seeds roles, admin usuario, sample profesional/servicio/horario
  test/
    disponibilidad.test.js
    auth.test.js
    citas.test.js
frontend/
  package.json
  next.config.js
  src/
    app/
      layout.tsx
      page.tsx                       # landing: lista de servicios
      profesionales/page.tsx
      reservar/page.tsx              # flujo de reserva (servicio->profesional->horario)
      login/page.tsx                 # telefono + OTP
      mis-citas/page.tsx
    lib/
      api.js                         # fetch wrapper to backend API
docker-compose.yml
nginx/
  nginx.conf
.env.example
```

---

## Task 1: Repo scaffolding + Docker Compose

**Files:**
- Create: `backend/package.json`
- Create: `backend/.env.example`
- Create: `frontend/package.json` (via `npx create-next-app`)
- Create: `docker-compose.yml`
- Create: `nginx/nginx.conf`
- Create: `.env.example`
- Create: `.gitignore`

**Interfaces:**
- Produces: running `docker compose up` brings up `mysql`, `api` (backend, port 4000), `web` (frontend, port 3000), `nginx` (port 80).

- [ ] **Step 1: Scaffold backend package.json**

```bash
mkdir -p backend/src/config backend/src/models backend/src/services backend/src/routes backend/test
cd backend
npm init -y
npm install express sequelize mysql2 dotenv cors jsonwebtoken bcryptjs axios
npm install -D nodemon jest supertest
```

Edit `backend/package.json` scripts:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --runInBand",
    "seed": "node src/seed.js"
  }
}
```

- [ ] **Step 2: Create backend/.env.example**

```
PORT=4000
DB_HOST=mysql
DB_PORT=3306
DB_NAME=novaged
DB_USER=novaged
DB_PASSWORD=change_me
JWT_SECRET=change_me
WHATSAPP_TOKEN=change_me
WHATSAPP_PHONE_NUMBER_ID=change_me
WHATSAPP_OTP_TEMPLATE=otp_login
BANCO_ECONOMICO_API_KEY=change_me
BANCO_ECONOMICO_BASE_URL=https://change-me.example.com
```

- [ ] **Step 3: Scaffold frontend with create-next-app**

```bash
npx create-next-app@latest frontend --ts --app --eslint --tailwind --src-dir --import-alias "@/*" --yes
```

- [ ] **Step 4: Write docker-compose.yml**

```yaml
services:
  mysql:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: novaged
      MYSQL_USER: novaged
      MYSQL_PASSWORD: ${DB_PASSWORD:-change_me}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-change_me}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  api:
    build: ./backend
    restart: unless-stopped
    env_file: ./backend/.env
    depends_on:
      - mysql
    ports:
      - "4000:4000"

  web:
    build: ./frontend
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000
    depends_on:
      - api
    ports:
      - "3000:3000"

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - web
      - api
    ports:
      - "80:80"

volumes:
  mysql_data:
```

- [ ] **Step 5: Write nginx/nginx.conf**

```nginx
server {
    listen 80;

    location /api/ {
        proxy_pass http://api:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://web:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

- [ ] **Step 6: Write root .gitignore**

```
node_modules/
.env
backend/.env
frontend/.env*.local
.next/
dist/
```

- [ ] **Step 7: Commit**

```bash
git add backend/package.json backend/.env.example frontend docker-compose.yml nginx/nginx.conf .gitignore
git commit -m "chore: scaffold backend, frontend, docker-compose"
```

---

## Task 2: Sequelize models and associations

**Files:**
- Create: `backend/src/config/database.js`
- Create: `backend/src/models/index.js`
- Create: `backend/src/models/paciente.js`
- Create: `backend/src/models/otpCode.js`
- Create: `backend/src/models/rol.js`
- Create: `backend/src/models/usuario.js`
- Create: `backend/src/models/profesional.js`
- Create: `backend/src/models/servicio.js`
- Create: `backend/src/models/servicioProfesional.js`
- Create: `backend/src/models/horarioDisponible.js`
- Create: `backend/src/models/cita.js`
- Create: `backend/src/models/pago.js`
- Test: `backend/test/models.test.js`

**Interfaces:**
- Produces: `const db = require('../src/models')` exposing `db.Paciente`, `db.OtpCode`, `db.Rol`, `db.Usuario`, `db.Profesional`, `db.Servicio`, `db.ServicioProfesional`, `db.HorarioDisponible`, `db.Cita`, `db.Pago`, `db.sequelize`.

- [ ] **Step 1: Write database config**

`backend/src/config/database.js`:
```javascript
require('dotenv').config();
const { Sequelize } = require('sequelize');

module.exports = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
  }
);
```

- [ ] **Step 2: Write each model file**

`backend/src/models/paciente.js`:
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paciente = sequelize.define('Paciente', {
  codigo_paciente: { type: DataTypes.STRING, unique: true, allowNull: false },
  nombre_completo: { type: DataTypes.STRING, allowNull: false },
  telefono: { type: DataTypes.STRING, unique: true, allowNull: false },
  carnet_identidad: { type: DataTypes.STRING, allowNull: false },
  carnet_complemento: { type: DataTypes.STRING, allowNull: true },
  carnet_expedido: { type: DataTypes.STRING, allowNull: false },
  fecha_nacimiento: { type: DataTypes.DATEONLY, allowNull: true },
}, { tableName: 'pacientes', underscored: true });

module.exports = Paciente;
```

`backend/src/models/otpCode.js`:
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OtpCode = sequelize.define('OtpCode', {
  telefono: { type: DataTypes.STRING, allowNull: false },
  codigo: { type: DataTypes.STRING, allowNull: false },
  expira_en: { type: DataTypes.DATE, allowNull: false },
  usado: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'otp_codes', underscored: true });

module.exports = OtpCode;
```

`backend/src/models/rol.js`:
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rol = sequelize.define('Rol', {
  nombre: { type: DataTypes.ENUM('Admin', 'Recepcion', 'Profesional'), allowNull: false, unique: true },
}, { tableName: 'roles', underscored: true });

module.exports = Rol;
```

`backend/src/models/usuario.js`:
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'usuarios', underscored: true });

module.exports = Usuario;
```

`backend/src/models/profesional.js`:
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Profesional = sequelize.define('Profesional', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  especialidad: { type: DataTypes.STRING, allowNull: true },
  foto_url: { type: DataTypes.STRING, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'profesionales', underscored: true });

module.exports = Profesional;
```

`backend/src/models/servicio.js`:
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Servicio = sequelize.define('Servicio', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  duracion_min: { type: DataTypes.INTEGER, allowNull: false },
  precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'servicios', underscored: true });

module.exports = Servicio;
```

`backend/src/models/servicioProfesional.js`:
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServicioProfesional = sequelize.define('ServicioProfesional', {
  duracion_min_override: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'servicio_profesional', underscored: true });

module.exports = ServicioProfesional;
```

`backend/src/models/horarioDisponible.js`:
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HorarioDisponible = sequelize.define('HorarioDisponible', {
  dia_semana: { type: DataTypes.INTEGER, allowNull: false }, // 0=domingo..6=sabado
  hora_inicio: { type: DataTypes.TIME, allowNull: false },
  hora_fin: { type: DataTypes.TIME, allowNull: false },
}, { tableName: 'horarios_disponibles', underscored: true });

module.exports = HorarioDisponible;
```

`backend/src/models/cita.js`:
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cita = sequelize.define('Cita', {
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  hora_inicio: { type: DataTypes.TIME, allowNull: false },
  hora_fin: { type: DataTypes.TIME, allowNull: false },
  estado: {
    type: DataTypes.ENUM('pendiente_pago', 'confirmada', 'cancelada'),
    defaultValue: 'pendiente_pago',
  },
}, { tableName: 'citas', underscored: true });

module.exports = Cita;
```

`backend/src/models/pago.js`:
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pago = sequelize.define('Pago', {
  monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  estado: {
    type: DataTypes.ENUM('pendiente', 'pagado', 'fallido'),
    defaultValue: 'pendiente',
  },
  referencia_qr_banco: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'pagos', underscored: true });

module.exports = Pago;
```

- [ ] **Step 3: Write models/index.js with associations**

```javascript
const sequelize = require('../config/database');
const Paciente = require('./paciente');
const OtpCode = require('./otpCode');
const Rol = require('./rol');
const Usuario = require('./usuario');
const Profesional = require('./profesional');
const Servicio = require('./servicio');
const ServicioProfesional = require('./servicioProfesional');
const HorarioDisponible = require('./horarioDisponible');
const Cita = require('./cita');
const Pago = require('./pago');

Rol.hasMany(Usuario, { foreignKey: 'rol_id' });
Usuario.belongsTo(Rol, { foreignKey: 'rol_id' });

Usuario.hasOne(Profesional, { foreignKey: 'usuario_id' });
Profesional.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Servicio.belongsToMany(Profesional, { through: ServicioProfesional, foreignKey: 'servicio_id' });
Profesional.belongsToMany(Servicio, { through: ServicioProfesional, foreignKey: 'profesional_id' });

Profesional.hasMany(HorarioDisponible, { foreignKey: 'profesional_id' });
HorarioDisponible.belongsTo(Profesional, { foreignKey: 'profesional_id' });

Paciente.hasMany(Cita, { foreignKey: 'paciente_id' });
Cita.belongsTo(Paciente, { foreignKey: 'paciente_id' });

Profesional.hasMany(Cita, { foreignKey: 'profesional_id' });
Cita.belongsTo(Profesional, { foreignKey: 'profesional_id' });

Servicio.hasMany(Cita, { foreignKey: 'servicio_id' });
Cita.belongsTo(Servicio, { foreignKey: 'servicio_id' });

Cita.hasOne(Pago, { foreignKey: 'cita_id' });
Pago.belongsTo(Cita, { foreignKey: 'cita_id' });

module.exports = {
  sequelize,
  Paciente,
  OtpCode,
  Rol,
  Usuario,
  Profesional,
  Servicio,
  ServicioProfesional,
  HorarioDisponible,
  Cita,
  Pago,
};
```

- [ ] **Step 4: Write model smoke test**

`backend/test/models.test.js`:
```javascript
const db = require('../src/models');

describe('models', () => {
  afterAll(async () => {
    await db.sequelize.close();
  });

  test('sequelize can authenticate and sync in test db', async () => {
    await db.sequelize.sync({ force: true });
    const rol = await db.Rol.create({ nombre: 'Admin' });
    expect(rol.id).toBeDefined();
  });

  test('Cita belongs to Paciente, Profesional, Servicio', async () => {
    const paciente = await db.Paciente.create({
      codigo_paciente: 'PAC-000001',
      nombre_completo: 'Test Paciente',
      telefono: '59170000001',
      carnet_identidad: '1234567',
      carnet_expedido: 'LP',
    });
    const profesional = await db.Profesional.create({ nombre: 'Dra. Test' });
    const servicio = await db.Servicio.create({
      nombre: 'Consulta', duracion_min: 30, precio: 100,
    });
    const cita = await db.Cita.create({
      paciente_id: paciente.id,
      profesional_id: profesional.id,
      servicio_id: servicio.id,
      fecha: '2026-09-10',
      hora_inicio: '10:00:00',
      hora_fin: '10:30:00',
    });
    expect(cita.estado).toBe('pendiente_pago');
  });
});
```

Note: requires a reachable test MySQL instance (`docker compose up -d mysql` before running `npm test`), using the same `DB_*` env vars pointed at a `novaged_test` database created ahead of time (`CREATE DATABASE novaged_test;`).

- [ ] **Step 5: Run tests, verify pass**

Run: `cd backend && npm test`
Expected: both tests in `models.test.js` PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/config backend/src/models backend/test/models.test.js
git commit -m "feat: add Sequelize models and associations"
```

---

## Task 3: Seed script (roles, admin, sample profesional/servicio/horario)

**Files:**
- Create: `backend/src/seed.js`

**Interfaces:**
- Consumes: `db` from Task 2 (`../src/models`).
- Produces: running `npm run seed` populates `roles`, one Admin `usuario`, one sample `profesional`, `servicio`, and weekly `horarios_disponibles`.

- [ ] **Step 1: Write seed.js**

```javascript
const bcrypt = require('bcryptjs');
const db = require('./models');

async function seed() {
  await db.sequelize.sync();

  const [adminRol] = await db.Rol.findOrCreate({ where: { nombre: 'Admin' } });
  await db.Rol.findOrCreate({ where: { nombre: 'Recepcion' } });
  await db.Rol.findOrCreate({ where: { nombre: 'Profesional' } });

  const passwordHash = await bcrypt.hash('changeme123', 10);
  await db.Usuario.findOrCreate({
    where: { email: 'admin@clinicnovaged.com' },
    defaults: { nombre: 'Admin', password_hash: passwordHash, rol_id: adminRol.id },
  });

  const [profesional] = await db.Profesional.findOrCreate({
    where: { nombre: 'Dra. Ejemplo' },
    defaults: { especialidad: 'Medicina General', activo: true },
  });

  const [servicio] = await db.Servicio.findOrCreate({
    where: { nombre: 'Consulta general' },
    defaults: { duracion_min: 30, precio: 100, activo: true },
  });

  await db.ServicioProfesional.findOrCreate({
    where: { servicio_id: servicio.id, profesional_id: profesional.id },
  });

  for (let dia = 1; dia <= 5; dia++) {
    await db.HorarioDisponible.findOrCreate({
      where: { profesional_id: profesional.id, dia_semana: dia },
      defaults: { hora_inicio: '09:00:00', hora_fin: '17:00:00' },
    });
  }

  console.log('Seed completo.');
  await db.sequelize.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run seed against dev DB and verify**

Run: `docker compose up -d mysql && cd backend && npm run seed`
Expected: prints `Seed completo.` with no errors; confirm via `SELECT * FROM roles;` in MySQL that 3 rows exist.

- [ ] **Step 3: Commit**

```bash
git add backend/src/seed.js
git commit -m "feat: add seed script for roles, admin, sample profesional/servicio/horario"
```

---

## Task 4: Disponibilidad service (core availability calculation)

**Files:**
- Create: `backend/src/services/disponibilidad.js`
- Test: `backend/test/disponibilidad.test.js`

**Interfaces:**
- Consumes: `db.HorarioDisponible`, `db.Cita`, `db.ServicioProfesional` from Task 2.
- Produces: `async function getSlotsDisponibles({ profesionalId, servicioId, fecha })` returning `[{ hora_inicio: 'HH:mm', hora_fin: 'HH:mm' }, ...]` for one calendar date (`fecha` as `'YYYY-MM-DD'`).

- [ ] **Step 1: Write failing test**

`backend/test/disponibilidad.test.js`:
```javascript
const db = require('../src/models');
const { getSlotsDisponibles } = require('../src/services/disponibilidad');

describe('getSlotsDisponibles', () => {
  let profesional, servicio;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    profesional = await db.Profesional.create({ nombre: 'Dra. Test' });
    servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100 });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    // 2026-09-14 is a Monday -> dia_semana 1
    await db.HorarioDisponible.create({
      profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '11:00:00',
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('returns all 30-min slots when no citas booked', async () => {
    const slots = await getSlotsDisponibles({
      profesionalId: profesional.id, servicioId: servicio.id, fecha: '2026-09-14',
    });
    expect(slots).toEqual([
      { hora_inicio: '09:00', hora_fin: '09:30' },
      { hora_inicio: '09:30', hora_fin: '10:00' },
      { hora_inicio: '10:00', hora_fin: '10:30' },
      { hora_inicio: '10:30', hora_fin: '11:00' },
    ]);
  });

  test('excludes slots already booked with a non-cancelled cita', async () => {
    const paciente = await db.Paciente.create({
      codigo_paciente: 'PAC-000002', nombre_completo: 'Paciente Test',
      telefono: '59170000002', carnet_identidad: '7654321', carnet_expedido: 'LP',
    });
    await db.Cita.create({
      paciente_id: paciente.id, profesional_id: profesional.id, servicio_id: servicio.id,
      fecha: '2026-09-14', hora_inicio: '09:30:00', hora_fin: '10:00:00', estado: 'confirmada',
    });

    const slots = await getSlotsDisponibles({
      profesionalId: profesional.id, servicioId: servicio.id, fecha: '2026-09-14',
    });
    expect(slots).toEqual([
      { hora_inicio: '09:00', hora_fin: '09:30' },
      { hora_inicio: '10:00', hora_fin: '10:30' },
      { hora_inicio: '10:30', hora_fin: '11:00' },
    ]);
  });

  test('returns empty array when day has no horario', async () => {
    // 2026-09-15 is a Tuesday, no horario seeded
    const slots = await getSlotsDisponibles({
      profesionalId: profesional.id, servicioId: servicio.id, fecha: '2026-09-15',
    });
    expect(slots).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd backend && npx jest test/disponibilidad.test.js`
Expected: FAIL — `Cannot find module '../src/services/disponibilidad'`.

- [ ] **Step 3: Implement disponibilidad.js**

```javascript
const { Op } = require('sequelize');
const db = require('../models');

function toMinutes(hhmmss) {
  const [h, m] = hhmmss.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(totalMinutes) {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const m = String(totalMinutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

async function getSlotsDisponibles({ profesionalId, servicioId, fecha }) {
  const servicioProfesional = await db.ServicioProfesional.findOne({
    where: { profesional_id: profesionalId, servicio_id: servicioId },
  });
  if (!servicioProfesional) return [];

  const servicio = await db.Servicio.findByPk(servicioId);
  const duracion = servicioProfesional.duracion_min_override || servicio.duracion_min;

  const diaSemana = new Date(`${fecha}T00:00:00`).getDay();
  const horario = await db.HorarioDisponible.findOne({
    where: { profesional_id: profesionalId, dia_semana: diaSemana },
  });
  if (!horario) return [];

  const citasDelDia = await db.Cita.findAll({
    where: {
      profesional_id: profesionalId,
      fecha,
      estado: { [Op.ne]: 'cancelada' },
    },
  });
  const ocupados = citasDelDia.map((c) => ({
    inicio: toMinutes(c.hora_inicio),
    fin: toMinutes(c.hora_fin),
  }));

  const inicioJornada = toMinutes(horario.hora_inicio);
  const finJornada = toMinutes(horario.hora_fin);

  const slots = [];
  for (let inicio = inicioJornada; inicio + duracion <= finJornada; inicio += duracion) {
    const fin = inicio + duracion;
    const solapa = ocupados.some((o) => inicio < o.fin && fin > o.inicio);
    if (!solapa) {
      slots.push({ hora_inicio: toHHMM(inicio), hora_fin: toHHMM(fin) });
    }
  }
  return slots;
}

module.exports = { getSlotsDisponibles };
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd backend && npx jest test/disponibilidad.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/disponibilidad.js backend/test/disponibilidad.test.js
git commit -m "feat: add disponibilidad calculation service"
```

---

## Task 5: WhatsApp Cloud API client + OTP auth endpoints

**Files:**
- Create: `backend/src/services/whatsapp.js`
- Create: `backend/src/routes/auth.js`
- Create: `backend/src/routes/auth.middleware.js`
- Modify: `backend/src/app.js`
- Test: `backend/test/auth.test.js`

**Interfaces:**
- Consumes: `db.Paciente`, `db.OtpCode` from Task 2.
- Produces: `POST /auth/otp/request { telefono }`, `POST /auth/otp/verify { telefono, codigo }` returning `{ token }` (JWT). `requirePaciente` middleware sets `req.pacienteId` from `Authorization: Bearer <token>`.

- [ ] **Step 1: Write whatsapp.js client**

```javascript
const axios = require('axios');

async function enviarPlantillaWhatsApp(telefono, templateName, parametros = []) {
  const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: telefono,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'es' },
      components: parametros.length
        ? [{ type: 'body', parameters: parametros.map((p) => ({ type: 'text', text: p })) }]
        : [],
    },
  };
  await axios.post(url, payload, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
  });
}

module.exports = { enviarPlantillaWhatsApp };
```

- [ ] **Step 2: Write failing auth test (mocking WhatsApp)**

`backend/test/auth.test.js`:
```javascript
jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');
const { enviarPlantillaWhatsApp } = require('../src/services/whatsapp');

describe('OTP auth flow', () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('request OTP creates paciente and sends WhatsApp code', async () => {
    const res = await request(app)
      .post('/auth/otp/request')
      .send({ telefono: '59170000009', nombre_completo: 'Nuevo Paciente' });
    expect(res.status).toBe(200);
    expect(enviarPlantillaWhatsApp).toHaveBeenCalled();

    const paciente = await db.Paciente.findOne({ where: { telefono: '59170000009' } });
    expect(paciente).not.toBeNull();
  });

  test('verify OTP with correct code returns a JWT', async () => {
    await request(app).post('/auth/otp/request').send({ telefono: '59170000010', nombre_completo: 'Otro' });
    const otp = await db.OtpCode.findOne({ where: { telefono: '59170000010' }, order: [['id', 'DESC']] });

    const res = await request(app)
      .post('/auth/otp/verify')
      .send({ telefono: '59170000010', codigo: otp.codigo });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('verify OTP with wrong code returns 401', async () => {
    await request(app).post('/auth/otp/request').send({ telefono: '59170000011', nombre_completo: 'Otro Mas' });
    const res = await request(app)
      .post('/auth/otp/verify')
      .send({ telefono: '59170000011', codigo: '000000' });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 3: Run test, verify it fails**

Run: `cd backend && npx jest test/auth.test.js`
Expected: FAIL — `Cannot find module '../src/app'`.

- [ ] **Step 4: Implement auth.middleware.js**

```javascript
const jwt = require('jsonwebtoken');

function requirePaciente(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.pacienteId = payload.pacienteId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido' });
  }
}

module.exports = { requirePaciente };
```

- [ ] **Step 5: Implement auth.js routes**

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { enviarPlantillaWhatsApp } = require('../services/whatsapp');

const router = express.Router();

function generarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generarCodigoPaciente(id) {
  return `PAC-${String(id).padStart(6, '0')}`;
}

router.post('/otp/request', async (req, res) => {
  const { telefono, nombre_completo, carnet_identidad, carnet_complemento, carnet_expedido } = req.body;
  if (!telefono) return res.status(400).json({ error: 'telefono es requerido' });

  let paciente = await db.Paciente.findOne({ where: { telefono } });
  if (!paciente) {
    paciente = await db.Paciente.create({
      codigo_paciente: `PAC-TMP-${Date.now()}`,
      nombre_completo: nombre_completo || 'Sin nombre',
      telefono,
      carnet_identidad: carnet_identidad || 'pendiente',
      carnet_complemento: carnet_complemento || null,
      carnet_expedido: carnet_expedido || 'pendiente',
    });
    paciente.codigo_paciente = generarCodigoPaciente(paciente.id);
    await paciente.save();
  }

  const codigo = generarCodigo();
  await db.OtpCode.create({
    telefono,
    codigo,
    expira_en: new Date(Date.now() + 5 * 60 * 1000),
    usado: false,
  });

  await enviarPlantillaWhatsApp(telefono, process.env.WHATSAPP_OTP_TEMPLATE, [codigo]);

  res.json({ ok: true });
});

router.post('/otp/verify', async (req, res) => {
  const { telefono, codigo } = req.body;
  const otp = await db.OtpCode.findOne({
    where: { telefono, codigo, usado: false },
    order: [['id', 'DESC']],
  });

  if (!otp || otp.expira_en < new Date()) {
    return res.status(401).json({ error: 'Codigo invalido o expirado' });
  }

  otp.usado = true;
  await otp.save();

  const paciente = await db.Paciente.findOne({ where: { telefono } });
  const token = jwt.sign({ pacienteId: paciente.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

  res.json({ token });
});

module.exports = router;
```

- [ ] **Step 6: Create app.js wiring routes**

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

module.exports = app;
```

- [ ] **Step 7: Run test, verify it passes**

Run: `cd backend && npx jest test/auth.test.js`
Expected: PASS (3 tests). Requires `.env` with `JWT_SECRET` set (test env can set `process.env.JWT_SECRET = 'test'` via a `backend/test/setup.js` loaded via `jest.config.js` `setupFiles`, or export it in the shell before running tests).

- [ ] **Step 8: Commit**

```bash
git add backend/src/services/whatsapp.js backend/src/routes/auth.js backend/src/routes/auth.middleware.js backend/src/app.js backend/test/auth.test.js
git commit -m "feat: add WhatsApp OTP auth flow"
```

---

## Task 6: Catálogo + disponibilidad HTTP routes

**Files:**
- Create: `backend/src/routes/catalogo.js`
- Create: `backend/src/routes/disponibilidad.js`
- Modify: `backend/src/app.js`
- Test: `backend/test/catalogo.test.js`

**Interfaces:**
- Consumes: `db.Servicio`, `db.Profesional` (Task 2), `getSlotsDisponibles` (Task 4).
- Produces: `GET /servicios`, `GET /profesionales?servicioId=`, `GET /disponibilidad?profesionalId=&servicioId=&fecha=`.

- [ ] **Step 1: Write failing test**

`backend/test/catalogo.test.js`:
```javascript
const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');

describe('catalogo + disponibilidad routes', () => {
  let profesional, servicio;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100, activo: true });
    profesional = await db.Profesional.create({ nombre: 'Dra. Test', activo: true });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    await db.HorarioDisponible.create({
      profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '10:00:00',
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('GET /servicios lists active servicios', async () => {
    const res = await request(app).get('/servicios');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].nombre).toBe('Consulta');
  });

  test('GET /profesionales?servicioId filters by servicio', async () => {
    const res = await request(app).get(`/profesionales?servicioId=${servicio.id}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].nombre).toBe('Dra. Test');
  });

  test('GET /disponibilidad returns slots', async () => {
    const res = await request(app).get(
      `/disponibilidad?profesionalId=${profesional.id}&servicioId=${servicio.id}&fecha=2026-09-14`
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { hora_inicio: '09:00', hora_fin: '09:30' },
      { hora_inicio: '09:30', hora_fin: '10:00' },
    ]);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd backend && npx jest test/catalogo.test.js`
Expected: FAIL — routes return 404.

- [ ] **Step 3: Implement catalogo.js**

```javascript
const express = require('express');
const db = require('../models');

const router = express.Router();

router.get('/servicios', async (req, res) => {
  const servicios = await db.Servicio.findAll({ where: { activo: true } });
  res.json(servicios);
});

router.get('/profesionales', async (req, res) => {
  const { servicioId } = req.query;
  const where = { activo: true };
  const include = [];
  if (servicioId) {
    include.push({ model: db.Servicio, where: { id: servicioId }, through: { attributes: [] } });
  }
  const profesionales = await db.Profesional.findAll({ where, include });
  res.json(profesionales);
});

module.exports = router;
```

- [ ] **Step 4: Implement disponibilidad.js route**

```javascript
const express = require('express');
const { getSlotsDisponibles } = require('../services/disponibilidad');

const router = express.Router();

router.get('/disponibilidad', async (req, res) => {
  const { profesionalId, servicioId, fecha } = req.query;
  if (!profesionalId || !servicioId || !fecha) {
    return res.status(400).json({ error: 'profesionalId, servicioId y fecha son requeridos' });
  }
  const slots = await getSlotsDisponibles({
    profesionalId: Number(profesionalId), servicioId: Number(servicioId), fecha,
  });
  res.json(slots);
});

module.exports = router;
```

- [ ] **Step 5: Wire into app.js**

Modify `backend/src/app.js`, after the `auth` mount:
```javascript
const catalogoRoutes = require('./routes/catalogo');
const disponibilidadRoutes = require('./routes/disponibilidad');

app.use('/', catalogoRoutes);
app.use('/', disponibilidadRoutes);
```

- [ ] **Step 6: Run test, verify it passes**

Run: `cd backend && npx jest test/catalogo.test.js`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add backend/src/routes/catalogo.js backend/src/routes/disponibilidad.js backend/src/app.js backend/test/catalogo.test.js
git commit -m "feat: add catalogo and disponibilidad HTTP routes"
```

---

## Task 7: Citas (booking) endpoints

**Files:**
- Create: `backend/src/routes/citas.js`
- Modify: `backend/src/app.js`
- Test: `backend/test/citas.test.js`

**Interfaces:**
- Consumes: `requirePaciente` (Task 5), `getSlotsDisponibles` (Task 4), `db.Cita`, `db.Pago` (Task 2).
- Produces: `POST /citas` (auth required) → creates `Cita` (estado `pendiente_pago`) + `Pago` (estado `pendiente`), returns `{ cita, pago }`. `GET /citas/mias` (auth required) → list of the authenticated patient's citas.

- [ ] **Step 1: Write failing test**

`backend/test/citas.test.js`:
```javascript
jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');

async function loginPaciente(telefono) {
  await request(app).post('/auth/otp/request').send({ telefono, nombre_completo: 'Test' });
  const otp = await db.OtpCode.findOne({ where: { telefono }, order: [['id', 'DESC']] });
  const res = await request(app).post('/auth/otp/verify').send({ telefono, codigo: otp.codigo });
  return res.body.token;
}

describe('citas routes', () => {
  let profesional, servicio, token;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100, activo: true });
    profesional = await db.Profesional.create({ nombre: 'Dra. Test', activo: true });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    await db.HorarioDisponible.create({
      profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '10:00:00',
    });
    token = await loginPaciente('59170000020');
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('rejects booking without auth', async () => {
    const res = await request(app).post('/citas').send({
      profesionalId: profesional.id, servicioId: servicio.id, fecha: '2026-09-14', horaInicio: '09:00',
    });
    expect(res.status).toBe(401);
  });

  test('books an available slot and creates a pending pago', async () => {
    const res = await request(app)
      .post('/citas')
      .set('Authorization', `Bearer ${token}`)
      .send({ profesionalId: profesional.id, servicioId: servicio.id, fecha: '2026-09-14', horaInicio: '09:00' });

    expect(res.status).toBe(201);
    expect(res.body.cita.estado).toBe('pendiente_pago');
    expect(res.body.pago.estado).toBe('pendiente');
    expect(Number(res.body.pago.monto)).toBe(100);
  });

  test('rejects double-booking the same slot', async () => {
    const res = await request(app)
      .post('/citas')
      .set('Authorization', `Bearer ${token}`)
      .send({ profesionalId: profesional.id, servicioId: servicio.id, fecha: '2026-09-14', horaInicio: '09:00' });
    expect(res.status).toBe(409);
  });

  test('GET /citas/mias returns only the authenticated patient citas', async () => {
    const res = await request(app).get('/citas/mias').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd backend && npx jest test/citas.test.js`
Expected: FAIL — `POST /citas` returns 404.

- [ ] **Step 3: Implement citas.js**

```javascript
const express = require('express');
const db = require('../models');
const { requirePaciente } = require('./auth.middleware');
const { getSlotsDisponibles } = require('../services/disponibilidad');

const router = express.Router();

router.post('/citas', requirePaciente, async (req, res) => {
  const { profesionalId, servicioId, fecha, horaInicio } = req.body;
  if (!profesionalId || !servicioId || !fecha || !horaInicio) {
    return res.status(400).json({ error: 'profesionalId, servicioId, fecha y horaInicio son requeridos' });
  }

  const slots = await getSlotsDisponibles({
    profesionalId: Number(profesionalId), servicioId: Number(servicioId), fecha,
  });
  const slot = slots.find((s) => s.hora_inicio === horaInicio);
  if (!slot) {
    return res.status(409).json({ error: 'El horario ya no esta disponible' });
  }

  const servicio = await db.Servicio.findByPk(servicioId);

  const cita = await db.Cita.create({
    paciente_id: req.pacienteId,
    profesional_id: profesionalId,
    servicio_id: servicioId,
    fecha,
    hora_inicio: `${slot.hora_inicio}:00`,
    hora_fin: `${slot.hora_fin}:00`,
    estado: 'pendiente_pago',
  });

  const pago = await db.Pago.create({
    cita_id: cita.id,
    monto: servicio.precio,
    estado: 'pendiente',
  });

  res.status(201).json({ cita, pago });
});

router.get('/citas/mias', requirePaciente, async (req, res) => {
  const citas = await db.Cita.findAll({
    where: { paciente_id: req.pacienteId },
    include: [db.Profesional, db.Servicio, db.Pago],
    order: [['fecha', 'DESC'], ['hora_inicio', 'DESC']],
  });
  res.json(citas);
});

module.exports = router;
```

- [ ] **Step 4: Wire into app.js**

Modify `backend/src/app.js`:
```javascript
const citasRoutes = require('./routes/citas');
app.use('/', citasRoutes);
```

- [ ] **Step 5: Run test, verify it passes**

Run: `cd backend && npx jest test/citas.test.js`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/citas.js backend/src/app.js backend/test/citas.test.js
git commit -m "feat: add citas booking endpoints with double-booking guard"
```

---

## Task 8: Banco Económico QR payment endpoints

**Files:**
- Create: `backend/src/services/bancoEconomico.js`
- Create: `backend/src/routes/pagos.js`
- Modify: `backend/src/app.js`
- Test: `backend/test/pagos.test.js`

**Interfaces:**
- Consumes: `db.Cita`, `db.Pago` (Task 2), `requirePaciente` (Task 5).
- Produces: `POST /pagos/:citaId/qr` (auth required) → `{ qrImageBase64, referencia }`. `POST /pagos/webhook` (no auth, called by the bank) → marks matching `Pago` as `pagado` and its `Cita` as `confirmada`.

> The exact Banco Económico request/response shape depends on the API documentation the user already has. This task stubs the HTTP client behind `bancoEconomico.js` so the rest of the app never depends on the bank's exact payload — when the real docs are available, only this one file needs updating.

- [ ] **Step 1: Write bancoEconomico.js (stubbed client, isolates the real integration)**

```javascript
const axios = require('axios');

async function generarQR({ monto, referencia }) {
  const res = await axios.post(
    `${process.env.BANCO_ECONOMICO_BASE_URL}/qr/generar`,
    { monto, referencia, moneda: 'BOB' },
    { headers: { Authorization: `Bearer ${process.env.BANCO_ECONOMICO_API_KEY}` } }
  );
  return { qrImageBase64: res.data.qrImageBase64, referencia: res.data.referencia };
}

function validarWebhook(payload) {
  // TODO once the bank's webhook signature scheme is confirmed from the docs:
  // verify signature/HMAC header before trusting payload.referencia / payload.estado.
  return payload && payload.referencia && payload.estado;
}

module.exports = { generarQR, validarWebhook };
```

- [ ] **Step 2: Write failing test (mocking bancoEconomico)**

`backend/test/pagos.test.js`:
```javascript
jest.mock('../src/services/whatsapp', () => ({
  enviarPlantillaWhatsApp: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/services/bancoEconomico', () => ({
  generarQR: jest.fn().mockResolvedValue({ qrImageBase64: 'FAKE_BASE64', referencia: 'REF-123' }),
  validarWebhook: jest.fn().mockReturnValue(true),
}));

const request = require('supertest');
const db = require('../src/models');
const app = require('../src/app');

async function loginPaciente(telefono) {
  await request(app).post('/auth/otp/request').send({ telefono, nombre_completo: 'Test' });
  const otp = await db.OtpCode.findOne({ where: { telefono }, order: [['id', 'DESC']] });
  const res = await request(app).post('/auth/otp/verify').send({ telefono, codigo: otp.codigo });
  return res.body.token;
}

describe('pagos routes', () => {
  let cita, token;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    const servicio = await db.Servicio.create({ nombre: 'Consulta', duracion_min: 30, precio: 100, activo: true });
    const profesional = await db.Profesional.create({ nombre: 'Dra. Test', activo: true });
    await db.ServicioProfesional.create({ servicio_id: servicio.id, profesional_id: profesional.id });
    await db.HorarioDisponible.create({
      profesional_id: profesional.id, dia_semana: 1, hora_inicio: '09:00:00', hora_fin: '10:00:00',
    });
    token = await loginPaciente('59170000030');

    const bookRes = await request(app)
      .post('/citas')
      .set('Authorization', `Bearer ${token}`)
      .send({ profesionalId: profesional.id, servicioId: servicio.id, fecha: '2026-09-14', horaInicio: '09:00' });
    cita = bookRes.body.cita;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('POST /pagos/:citaId/qr returns a QR and stores the referencia', async () => {
    const res = await request(app)
      .post(`/pagos/${cita.id}/qr`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.qrImageBase64).toBe('FAKE_BASE64');

    const pago = await db.Pago.findOne({ where: { cita_id: cita.id } });
    expect(pago.referencia_qr_banco).toBe('REF-123');
  });

  test('POST /pagos/webhook marks pago as pagado and cita as confirmada', async () => {
    const res = await request(app)
      .post('/pagos/webhook')
      .send({ referencia: 'REF-123', estado: 'pagado' });
    expect(res.status).toBe(200);

    const pago = await db.Pago.findOne({ where: { cita_id: cita.id } });
    expect(pago.estado).toBe('pagado');

    const citaActualizada = await db.Cita.findByPk(cita.id);
    expect(citaActualizada.estado).toBe('confirmada');
  });
});
```

- [ ] **Step 3: Run test, verify it fails**

Run: `cd backend && npx jest test/pagos.test.js`
Expected: FAIL — `POST /pagos/:citaId/qr` returns 404.

- [ ] **Step 4: Implement pagos.js**

```javascript
const express = require('express');
const db = require('../models');
const { requirePaciente } = require('./auth.middleware');
const { generarQR, validarWebhook } = require('../services/bancoEconomico');
const { enviarPlantillaWhatsApp } = require('../services/whatsapp');

const router = express.Router();

router.post('/pagos/:citaId/qr', requirePaciente, async (req, res) => {
  const cita = await db.Cita.findOne({
    where: { id: req.params.citaId, paciente_id: req.pacienteId },
    include: [db.Pago],
  });
  if (!cita || !cita.Pago) return res.status(404).json({ error: 'Cita o pago no encontrado' });

  const { qrImageBase64, referencia } = await generarQR({
    monto: cita.Pago.monto,
    referencia: `CITA-${cita.id}`,
  });

  cita.Pago.referencia_qr_banco = referencia;
  await cita.Pago.save();

  res.json({ qrImageBase64, referencia });
});

router.post('/pagos/webhook', async (req, res) => {
  if (!validarWebhook(req.body)) return res.status(400).json({ error: 'Payload invalido' });

  const { referencia, estado } = req.body;
  const pago = await db.Pago.findOne({ where: { referencia_qr_banco: referencia }, include: [db.Cita] });
  if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

  if (estado === 'pagado') {
    pago.estado = 'pagado';
    await pago.save();
    pago.Cita.estado = 'confirmada';
    await pago.Cita.save();

    const paciente = await db.Paciente.findByPk(pago.Cita.paciente_id);
    await enviarPlantillaWhatsApp(paciente.telefono, 'cita_confirmada', [pago.Cita.fecha, pago.Cita.hora_inicio]);
  } else {
    pago.estado = 'fallido';
    await pago.save();
  }

  res.json({ ok: true });
});

module.exports = router;
```

- [ ] **Step 5: Wire into app.js**

Modify `backend/src/app.js`:
```javascript
const pagosRoutes = require('./routes/pagos');
app.use('/', pagosRoutes);
```

- [ ] **Step 6: Run test, verify it passes**

Run: `cd backend && npx jest test/pagos.test.js`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/bancoEconomico.js backend/src/routes/pagos.js backend/src/app.js backend/test/pagos.test.js
git commit -m "feat: add Banco Economico QR payment endpoints"
```

- [ ] **Step 8: Note for later** — once the real Banco Económico API docs are on hand, update `generarQR`'s request/response mapping and implement real signature validation in `validarWebhook`; nothing else in the codebase needs to change since both are isolated in this one file.

---

## Task 9: server.js entrypoint + Dockerfile for backend

**Files:**
- Create: `backend/src/server.js`
- Create: `backend/Dockerfile`

**Interfaces:**
- Produces: `node src/server.js` starts the API listening on `process.env.PORT`.

- [ ] **Step 1: Write server.js**

```javascript
require('dotenv').config();
const app = require('./app');
const db = require('./models');

const PORT = process.env.PORT || 4000;

db.sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`API escuchando en puerto ${PORT}`));
});
```

- [ ] **Step 2: Write Dockerfile**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 4000
CMD ["node", "src/server.js"]
```

- [ ] **Step 3: Verify locally**

Run: `docker compose up -d mysql && cd backend && npm run seed && npm run dev`
Expected: logs `API escuchando en puerto 4000`; `curl http://localhost:4000/health` returns `{"ok":true}`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/server.js backend/Dockerfile
git commit -m "feat: add backend server entrypoint and Dockerfile"
```

---

## Task 10: Frontend — API client + booking flow pages

**Files:**
- Create: `frontend/src/lib/api.js`
- Modify: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/profesionales/page.tsx`
- Create: `frontend/src/app/reservar/page.tsx`
- Create: `frontend/src/app/login/page.tsx`
- Create: `frontend/src/app/mis-citas/page.tsx`
- Create: `frontend/Dockerfile`

**Interfaces:**
- Consumes: backend routes from Tasks 5-8 (`/servicios`, `/profesionales`, `/disponibilidad`, `/auth/otp/*`, `/citas`, `/citas/mias`, `/pagos/:citaId/qr`).
- Produces: patient-facing pages wired to the API; `localStorage` stores the JWT under key `novaged_token`.

- [ ] **Step 1: Write lib/api.js**

```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('novaged_token');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  getServicios: () => apiFetch('/servicios'),
  getProfesionales: (servicioId) => apiFetch(`/profesionales?servicioId=${servicioId}`),
  getDisponibilidad: (profesionalId, servicioId, fecha) =>
    apiFetch(`/disponibilidad?profesionalId=${profesionalId}&servicioId=${servicioId}&fecha=${fecha}`),
  requestOtp: (telefono, nombre_completo) =>
    apiFetch('/auth/otp/request', { method: 'POST', body: JSON.stringify({ telefono, nombre_completo }) }),
  verifyOtp: (telefono, codigo) =>
    apiFetch('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ telefono, codigo }) }),
  crearCita: (profesionalId, servicioId, fecha, horaInicio) =>
    apiFetch('/citas', { method: 'POST', body: JSON.stringify({ profesionalId, servicioId, fecha, horaInicio }) }),
  misCitas: () => apiFetch('/citas/mias'),
  generarQR: (citaId) => apiFetch(`/pagos/${citaId}/qr`, { method: 'POST' }),
  setToken: (token) => localStorage.setItem('novaged_token', token),
  isLoggedIn: () => Boolean(getToken()),
};
```

- [ ] **Step 2: Write landing page listing servicios**

`frontend/src/app/page.tsx`:
```tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function Home() {
  const [servicios, setServicios] = useState<any[]>([]);

  useEffect(() => {
    api.getServicios().then(setServicios).catch(console.error);
  }, []);

  return (
    <main>
      <h1>Servicios</h1>
      <ul>
        {servicios.map((s) => (
          <li key={s.id}>
            {s.nombre} — Bs. {s.precio}
            <Link href={`/reservar?servicioId=${s.id}`}> Reservar</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: Write reservar page (servicio -> profesional -> horario -> confirmar)**

`frontend/src/app/reservar/page.tsx`:
```tsx
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Reservar() {
  const params = useSearchParams();
  const router = useRouter();
  const servicioId = params.get('servicioId');

  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [profesionalId, setProfesionalId] = useState<string | null>(null);
  const [fecha, setFecha] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (servicioId) api.getProfesionales(servicioId).then(setProfesionales);
  }, [servicioId]);

  useEffect(() => {
    if (profesionalId && servicioId && fecha) {
      api.getDisponibilidad(profesionalId, servicioId, fecha).then(setSlots).catch(console.error);
    }
  }, [profesionalId, servicioId, fecha]);

  async function reservar(horaInicio: string) {
    if (!api.isLoggedIn()) {
      router.push(`/login?next=/reservar?servicioId=${servicioId}`);
      return;
    }
    try {
      const { cita } = await api.crearCita(profesionalId, servicioId, fecha, horaInicio);
      router.push(`/mis-citas?citaId=${cita.id}`);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <main>
      <h1>Reservar cita</h1>
      <select onChange={(e) => setProfesionalId(e.target.value)} defaultValue="">
        <option value="" disabled>Elige un profesional</option>
        {profesionales.map((p) => (
          <option key={p.id} value={p.id}>{p.nombre}</option>
        ))}
      </select>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {slots.map((s) => (
          <li key={s.hora_inicio}>
            {s.hora_inicio} - {s.hora_fin}
            <button onClick={() => reservar(s.hora_inicio)}>Reservar</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 4: Write login page (telefono + OTP)**

`frontend/src/app/login/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/mis-citas';
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  async function enviarOtp() {
    try {
      await api.requestOtp(telefono, nombre);
      setEnviado(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function verificar() {
    try {
      const { token } = await api.verifyOtp(telefono, codigo);
      api.setToken(token);
      router.push(next);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <main>
      <h1>Ingresar</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!enviado ? (
        <>
          <input placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <input placeholder="Telefono (con codigo de pais)" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          <button onClick={enviarOtp}>Enviar codigo por WhatsApp</button>
        </>
      ) : (
        <>
          <input placeholder="Codigo recibido" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          <button onClick={verificar}>Verificar</button>
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 5: Write mis-citas page**

`frontend/src/app/mis-citas/page.tsx`:
```tsx
'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function MisCitas() {
  const [citas, setCitas] = useState<any[]>([]);
  const [qrPorCita, setQrPorCita] = useState<Record<number, string>>({});

  useEffect(() => {
    api.misCitas().then(setCitas).catch(console.error);
  }, []);

  async function pagar(citaId: number) {
    const { qrImageBase64 } = await api.generarQR(citaId);
    setQrPorCita((prev) => ({ ...prev, [citaId]: qrImageBase64 }));
  }

  return (
    <main>
      <h1>Mis citas</h1>
      <ul>
        {citas.map((c) => (
          <li key={c.id}>
            {c.fecha} {c.hora_inicio} — {c.estado}
            {c.estado === 'pendiente_pago' && (
              <button onClick={() => pagar(c.id)}>Pagar con QR</button>
            )}
            {qrPorCita[c.id] && <img src={`data:image/png;base64,${qrPorCita[c.id]}`} alt="QR de pago" />}
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 6: Write frontend Dockerfile**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]
```

- [ ] **Step 7: Verify locally**

Run: `cd frontend && npm run dev` (with backend running on port 4000)
Expected: visiting `http://localhost:3000` lists the seeded "Consulta general" servicio; clicking through Reservar → login (OTP) → pick slot → Mis citas → Pagar con QR completes without console errors.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/lib/api.js frontend/src/app/page.tsx frontend/src/app/profesionales frontend/src/app/reservar frontend/src/app/login frontend/src/app/mis-citas frontend/Dockerfile
git commit -m "feat: add patient booking flow pages (servicios, reservar, login OTP, mis citas)"
```

---

## Task 11: End-to-end verification via Docker Compose

**Files:**
- Modify: `backend/.env` (created from `.env.example`, not committed)
- Modify: `frontend/.env.local` (created manually, not committed)

**Interfaces:**
- Consumes: all previous tasks.
- Produces: a running stack reachable at `http://localhost` (via nginx) with a full booking flow working against real MySQL in Docker.

- [ ] **Step 1: Create real .env files from the examples**

```bash
cp backend/.env.example backend/.env
# edit backend/.env: set DB_PASSWORD, JWT_SECRET, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
# WHATSAPP_OTP_TEMPLATE, BANCO_ECONOMICO_API_KEY, BANCO_ECONOMICO_BASE_URL
```

- [ ] **Step 2: Bring up the full stack**

Run: `docker compose up -d --build`
Expected: `docker compose ps` shows `mysql`, `api`, `web`, `nginx` all `Up`.

- [ ] **Step 3: Run the seed inside the api container**

Run: `docker compose exec api npm run seed`
Expected: prints `Seed completo.`.

- [ ] **Step 4: Manual smoke test through nginx**

Open `http://localhost/` in a browser:
1. See "Consulta general" listed.
2. Click Reservar → redirected to login (not authenticated yet).
3. Enter name + a real WhatsApp-registered phone number, request OTP, receive it on WhatsApp, verify.
4. Back on reservar, pick a profesional, a date matching a seeded weekday (Mon-Fri), pick a slot, book it.
5. Go to Mis citas, see the cita `pendiente_pago`, click "Pagar con QR", confirm a QR image renders (using real Banco Económico credentials).

Expected: no errors in `docker compose logs api` or `docker compose logs web` during the flow.

- [ ] **Step 5: Commit any fixes found during manual verification**

If step 4 surfaces bugs, fix them in the relevant task's files and commit with a message describing the fix (e.g. `fix: correct disponibilidad timezone handling`).
