# Fase 1 — Portal web del paciente + Agenda (diseño)

Fecha: 2026-09-01
Estado: aprobado por el usuario, listo para implementación

## Contexto

Clínica NovaGed (clinicnovaged.com), sede única, <10 personas de staff, hoy
100% manual (papel/Excel/WhatsApp manual, sin sistema digital). El proyecto
completo tiene 12 módulos (usuarios/roles, pacientes, agenda, portal web,
WhatsApp, tratamientos, caja, inventario, dashboard, reportes, fidelización,
automatización IA). Es demasiado grande para una sola fase — se decidió
descomponer en sub-proyectos, cada uno con su propio ciclo diseño → spec →
plan → implementación.

**Fase 1 = Portal web del paciente + Agenda inteligente (disponibilidad y
reservas)**, con la base de Usuarios/Roles ya lista para fases futuras.
Explícitamente fuera de esta fase: panel de staff con UI (fase 2), ficha
clínica 360°, WhatsApp más allá de OTP/confirmación, caja/inventario,
dashboards, fidelización, IA.

## Alcance funcional

- Paciente entra al portal público, ve servicios, profesionales y
  disponibilidad en tiempo real.
- Login del paciente sin contraseña: teléfono + código OTP enviado por
  WhatsApp (WhatsApp Cloud API oficial de Meta).
- Reserva de cita: elige servicio → profesional → horario disponible.
- Pago QR vía Banco Económico (Bolivia) — el usuario ya cuenta con la
  documentación de la API del banco.
- Confirmación de cita (pantalla + WhatsApp).
- Área privada "Mis citas": historial de citas del paciente logueado.
- Sin panel de staff con UI todavía: horarios de profesionales se cargan por
  seed/migración directa a la base de datos.
- Modelo de Usuario/Rol interno ya definido (Admin, Recepción, Profesional)
  aunque el panel de administración llegue en fase 2 — para no rediseñar el
  esquema de auth después.

## Stack técnico (decidido por el usuario)

- **Backend**: Node.js + Express + Sequelize (MySQL). API REST independiente
  del frontend.
- **Frontend**: Next.js (App Router).
- **Base de datos**: MySQL.
- **Despliegue**: Docker Compose en VPS propio (servicios: mysql, api, web,
  nginx como reverse proxy). No se usa Vercel/hosting gestionado para este
  proyecto.
- **WhatsApp**: WhatsApp Cloud API (Meta) llamada directo desde el backend,
  para envío de OTP y confirmación de citas.
- **Pagos**: API de QR de Banco Económico (Bolivia), documentación ya en
  poder del usuario.

## Modelo de datos

**Paciente**
- id (PK interno)
- codigo_paciente (autogenerado, único, visible para staff — ej. `PAC-000123`)
- nombre_completo
- telefono (único, canal de OTP)
- carnet_identidad (CI)
- carnet_complemento (ej. "1B")
- carnet_expedido (departamento emisor: LP, CB, SC, ...)
- fecha_nacimiento
- creado_en

**OtpCode**
- telefono
- codigo
- expira_en
- usado (bool)

**Usuario** (staff interno)
- id
- nombre
- telefono o email (a definir en implementación)
- password_hash
- rol_id (FK)
- activo

**Rol**
- id
- nombre (Admin | Recepción | Profesional)
- (permisos por rol se mantienen simples/fijos en fase 1, sin UI de
  permisos granulares — eso es parte del módulo 01 completo, futuro)

**Profesional**
- id
- nombre
- especialidad
- foto
- activo
- (opcionalmente vinculado a un Usuario con rol Profesional)

**Servicio**
- id
- nombre
- descripcion
- duracion_min
- precio
- activo

**ServicioProfesional** (tabla puente, N:M)
- servicio_id
- profesional_id
- duracion_min (override opcional si el servicio dura distinto según
  profesional)

**HorarioDisponible**
- profesional_id
- dia_semana
- hora_inicio
- hora_fin

**Cita**
- id
- paciente_id
- profesional_id
- servicio_id
- fecha
- hora_inicio
- hora_fin
- estado (pendiente_pago | confirmada | cancelada)
- creado_en

**Pago**
- id
- cita_id
- monto
- estado (pendiente | pagado | fallido)
- referencia_qr_banco
- creado_en

La disponibilidad se calcula en consulta (horario recurrente del
profesional menos citas ya ocupadas ese día), sin tabla de slots
pre-generada — el volumen no lo justifica.

## Fuera de alcance (explícito)

- Panel de staff con interfaz (fase 2).
- Permisos granulares configurables por UI (solo roles fijos por ahora).
- Ficha clínica 360°, evoluciones, tratamientos.
- Caja, inventario, dashboards, reportes, fidelización, automatización IA.
- Multi-sede.
