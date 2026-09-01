# Fase 2 — Sitio público (marketing) con reserva incrustada (diseño)

Fecha: 2026-09-01
Estado: aprobado por el usuario, listo para implementación

## Contexto

Fase 1 (portal de reservas + agenda) ya está implementada y mergeada en
`master`: backend Express/Sequelize/MySQL + un frontend Next.js
(`frontend/`) con login OTP por WhatsApp, catálogo, disponibilidad, citas y
pago QR Banco Económico. Esa app cumplía dos roles a la vez: reserva y
cuenta del paciente.

El usuario aclaró que en realidad necesita **dos superficies separadas**:

1. **Sitio público** (`clinicnovaged.com`): la cara de marketing/informativa
   de la clínica — replica el diseño y contenido real actual del sitio
   (capturas de pantalla provistas por el usuario), con la reserva de citas
   **incrustada ahí mismo** (no un enlace de salida a otra app).
2. **El "sistema"** (`frontend/` ya existente, en un subdominio propio, ej.
   `portal.clinicnovaged.com`): queda para cuando el paciente ya reservó y
   quiere ver su cuenta / "mis citas" / pagar una cita pendiente. No se
   modifica en esta fase.

Ambas superficies consumen el **mismo backend** (`backend/`, ya construido
y probado) — no se duplica lógica de servidor, solo se agrega un segundo
frontend.

## Contenido real del sitio (de las capturas del usuario)

**Identidad:** Clinic NovagED — "salud · belleza · armonía". Cochabamba,
Bolivia. Estética boutique: paleta crema/beige/marrón oscuro, tipografía
serif elegante con acentos en itálica para frases destacadas, fotografía a
sangre completa, mucho espacio en blanco.

**Nav:** logo "Clinic NovagED" (con isotipo) — TRATAMIENTOS, NOSOTROS,
UBICACIÓN — botón "RESERVAR CONSULTA". Botón flotante persistente "AGENDA
TU CITA" (esquina inferior derecha).

**Secciones (una sola página, scroll con anclas):**

1. **Hero**: título "Esculpir la Esencia" (segunda línea en itálica),
   subtítulo "Arquitectura facial y medicina estética avanzada diseñada
   para revelar la belleza intrínseca que reside en el equilibrio.",
   botones "AGENDA TU CONSULTA" (sólido) y "CONOCER MÁS" (outline),
   línea "Boutique Medical Excellence", indicador "DESCUBRE TRATAMIENTOS ↓".
2. **Esencia de marca**: eyebrow "ESENCIA DE MARCA", título "Renovación y
   evolución *constante*", párrafo de introducción, 3 columnas: Salud /
   Belleza / Armonía, cada una con una frase corta.
3. **Tratamientos** (`#tratamientos`): bloque "01 — Medicina Estética" con
   descripción y acordeón "TRATAMIENTOS DETALLES" con 5 categorías
   expandibles:
   - **Tratamientos Faciales** — Áreas de enfoque: Calidad de piel,
     Hidratación profunda, Despigmentación, Regeneración celular.
     Tratamientos: Microneedling, PRP facial, PDRN/PN, Exosomas, Peelings
     médicos, Ácido hialurónico, Coctel de vitaminas, DMAE + silicio
     orgánico, Cóctel de aminoácidos.
   - **Armonización Facial** — Procedimientos: Ácido hialurónico
     (Fillers), Toxina botulínica (Botox), Perfilado de nariz,
     Relleno/perfilado de labios, Mentoplastia, Marcación mandibular,
     Levantamiento de pómulos.
   - **Rejuvenecimiento · Lifting** (contenido a definir con el usuario en
     implementación — la captura no mostró el detalle expandido).
   - **Tratamientos Corporales** (ídem).
   - **Plasma Láser** (ídem).
4. **Sección "Silencio"** (interludio visual, imagen del box/consultorio a
   sangre completa): título "Silencio", subtítulo "El primer tratamiento
   comienza antes de entrar al box".
5. **"El Arte de la Perfección"** (`¿por qué elegirnos?`): 4 puntos —
   Resultados Naturales, Trato Personalizado, Respaldo Médico,
   Acompañamiento — cada uno con una frase corta; cita destacada: "La
   verdadera belleza reside en la armonía, no en el cambio drástico." —
   Filosofía NovagED.
6. **Nosotros** (`#nosotros`): eyebrow "DIRECCIÓN MÉDICA", foto + nombre
   "Dra. Maria Noemi Ponce Caisiri", bio completa (médico
   cirujano-ultrasonografista, especialista en rejuvenecimiento y
   armonización facial y corporal, etc. — texto provisto en las capturas).
7. **Ubicación** (`#ubicacion`): título "CONSULTORIO", dirección
   ("Edificio Vedra planta baja, calle Lanza No 670 entre Chuquisaca y Av.
   Salamanca, Cochabamba, Bolivia"), enlace "Abrir en Google Maps",
   teléfono "+591 65359810", email "info@novaged.com", horarios (Lunes a
   viernes 09:00-13:00 / 14:00-20:00, Sábado 09:00-16:00), mapa embebido.
8. **CTA final**: "DÉ EL PRIMER PASO" / "INICIE SU transformación", texto
   de invitación, botón "AGENDA TU CITA".
9. **Footer**: logo, frase de marca, columna "NAVEGACIÓN" (Tratamientos,
   Nosotros, Ubicación), copyright "© 2026 Clinic NovagED. Todos los
   derechos reservados.", "Cochabamba · Bolivia", iconos de Instagram y
   TikTok.

## Reserva incrustada

Los botones "RESERVAR CONSULTA" / "AGENDA TU CONSULTA" / "AGENDA TU CITA"
abren un modal/drawer con el mismo flujo de Fase 1, adaptado al estilo
visual del sitio:

1. Elegir servicio (de la lista real del backend, `GET /servicios` —
   inicialmente mapeado a como corresponda dentro de las categorías del
   acordeón de tratamientos, o como selección simple si no hay mapeo 1:1
   todavía).
2. Elegir profesional (`GET /profesionales?servicioId=`).
3. Elegir fecha y horario (`GET /disponibilidad`).
4. Login del paciente: teléfono + CI (carnet, complemento, expedido) +
   nombre → OTP por WhatsApp (mismos endpoints `POST /auth/otp/request` y
   `POST /auth/otp/verify` de Fase 1).
5. Confirmar reserva (`POST /citas`).
6. Pago QR (`POST /pagos/:citaId/qr`), mostrando el QR real de Banco
   Económico dentro del mismo modal.

No se crean endpoints nuevos en el backend — todo ya existe y está
probado (24/24 tests pasando). Este es un frontend nuevo consumiendo la
misma API.

## Stack técnico

- **Nuevo proyecto**: `public-site/` — Next.js (App Router) + Tailwind CSS,
  mismo patrón que `frontend/` (proyecto independiente, no fusionar con el
  backend).
- Llama al backend vía `NEXT_PUBLIC_API_URL` (mismo patrón que
  `frontend/src/lib/api.js`).
- **Despliegue**: nuevo servicio Docker (`public-site`) en
  `docker-compose.yml`, con su propio Dockerfile (mismo patrón que
  `frontend/Dockerfile`). Nginx enruta por dominio:
  - `clinicnovaged.com` → `public-site` (puerto interno propio, ej. 3001)
  - `portal.clinicnovaged.com` (a definir el subdominio exacto con el
    usuario en el despliegue real) → `frontend` (el sistema actual)
  - `/api/` (en ambos dominios) → `api` (backend), como ya está configurado.
- **Imágenes**: placeholders (bloques de color / imágenes de stock
  libres de derechos con la paleta correcta) por ahora — el usuario
  reemplazará por las fotos reales después. Cada placeholder debe quedar
  claramente identificable en el código (nombre de archivo o comentario)
  para facilitar el reemplazo.

## Fuera de alcance (explícito)

- No se modifica `backend/` (ningún endpoint nuevo).
- No se modifica `frontend/` (el sistema actual queda intacto).
- No se define en esta fase el detalle de contenido de "Rejuvenecimiento ·
  Lifting", "Tratamientos Corporales" y "Plasma Láser" del acordeón — se
  usa texto placeholder genérico y coherente con el estilo de las otras
  dos categorías (título, descripción breve, 3-5 ítems de ejemplo),
  marcado en el código para que el usuario lo reemplace por el contenido
  real después.
- No se configura DNS/dominio real ni certificados TLS — eso ocurre en el
  despliegue real en el VPS del usuario.
- No se integra un sistema de CMS — el contenido vive como código/config
  en el proyecto (edición vía código, no panel de administración).
