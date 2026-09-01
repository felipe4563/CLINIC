# Sitio Público (Fase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public marketing site for Clínica NovagED (`public-site/`, a new Next.js project) replicating the real site's content and boutique visual design, with the appointment-booking flow embedded inline (modal), consuming the existing Fase 1 backend API unchanged.

**Architecture:** A new, independent Next.js (App Router) + Tailwind CSS project, sibling to `frontend/` and `backend/`. Single scrolling page with anchor navigation. A booking modal component walks through the same steps as `frontend/src/app/reservar` + `login` + `mis-citas`'s QR step, but as one continuous in-page flow, calling the same backend REST API. No backend changes. No changes to `frontend/`.

**Tech Stack:** Next.js (App Router), Tailwind CSS, `next/font/google` (Playfair Display + Inter), Docker.

**Spec:** `docs/superpowers/specs/2026-09-01-sitio-publico-fase2-design.md`

## Global Constraints

- `backend/` is not modified — every endpoint used here already exists and is tested (24/24 backend tests passing as of Fase 1).
- `frontend/` is not modified in this plan.
- New project lives at `public-site/` (repo root, sibling to `frontend/` and `backend/`).
- Images are placeholders (Tailwind gradient/color blocks or `next/image` with a placeholder source) — never fabricate real photos. Mark every placeholder with a comment `{/* PLACEHOLDER: replace with real photo — <what> */}`.
- Color palette (approximate, from the user's screenshots): background cream `#F3EDE7`, deep brown `#2B1F16`, accent tan `#8B6F4E`, body text `#3A2E22`, muted text `#6B5D4F`. Define as Tailwind theme colors named `cream`, `espresso`, `tan`, `ink`, `muted` — every section uses these names, not raw hex, so a future palette tweak is a one-file change.
- Fonts: display/headings use Playfair Display (serif, has italic), nav/labels/body use Inter. Load both via `next/font/google` in the root layout.
- The booking flow's backend contract (request/response shapes) matches `frontend/src/lib/api.js` exactly — reuse those exact endpoint paths and payload shapes, do not invent new ones.
- The three accordion categories with no real copy yet (Rejuvenecimiento · Lifting, Tratamientos Corporales, Plasma Láser) get placeholder text in the same shape as the two real ones (title, one-sentence description, 3-5 example items), each wrapped in a comment noting it's placeholder copy pending the user.

---

## File Structure

```
public-site/
  package.json
  next.config.ts
  tailwind.config.ts
  Dockerfile
  .dockerignore
  src/
    app/
      layout.tsx              # fonts, metadata, global CSS import
      globals.css              # Tailwind directives + base tokens
      page.tsx                 # assembles all sections in order
    components/
      Nav.tsx                  # top nav + "RESERVAR CONSULTA" trigger
      FloatingCta.tsx           # persistent "AGENDA TU CITA" button
      Footer.tsx
      Hero.tsx
      EsenciaMarca.tsx
      Tratamientos.tsx          # accordion
      Silencio.tsx               # full-bleed interlude
      ArtePerfeccion.tsx
      Nosotros.tsx
      Ubicacion.tsx
      CtaFinal.tsx
      booking/
        BookingModal.tsx         # modal shell + step state machine
        StepServicio.tsx
        StepProfesional.tsx
        StepHorario.tsx
        StepLogin.tsx
        StepConfirmar.tsx
        StepPago.tsx
    lib/
      api.js                    # same shape as frontend/src/lib/api.js
      bookingContext.tsx          # React context: open/close modal, shared step state
```

---

## Task 1: Scaffold public-site project + Docker + nginx routing

**Files:**
- Create: `public-site/package.json` (via `create-next-app`)
- Create: `public-site/tailwind.config.ts`
- Create: `public-site/src/lib/api.js`
- Create: `public-site/Dockerfile`
- Create: `public-site/.dockerignore`
- Modify: `docker-compose.yml`
- Modify: `nginx/nginx.conf`

**Interfaces:**
- Produces: a running Next.js dev server at `localhost:3001` (to avoid colliding with `frontend/`'s 3000 during local dev); `public-site/src/lib/api.js` exporting the same `api` object shape as `frontend/src/lib/api.js`.

- [ ] **Step 1: Scaffold with create-next-app**

```bash
npx create-next-app@latest public-site --ts --app --eslint --tailwind --src-dir --import-alias "@/*" --yes
```

- [ ] **Step 2: Copy and adapt the API client from frontend/**

Read `frontend/src/lib/api.js` (already built in Fase 1) and copy it verbatim to `public-site/src/lib/api.js` — same functions (`getServicios`, `getProfesionales`, `getDisponibilidad`, `requestOtp`, `verifyOtp`, `crearCita`, `misCitas`, `generarQR`, `setToken`, `isLoggedIn`), same `localStorage` key `novaged_token`, same `NEXT_PUBLIC_API_URL` fallback pattern. This site is a second, independent consumer of the same backend contract — do not modify the shapes.

One addition: `requestOtp` must also accept and forward `carnet_identidad`, `carnet_complemento`, `carnet_expedido` (the backend's `/auth/otp/request` already accepts these per Fase 1's Task 8 hardening — `frontend/src/app/login/page.tsx` already sends them, mirror that call shape):

```javascript
requestOtp: (telefono, nombre_completo, carnet_identidad, carnet_complemento, carnet_expedido) =>
  apiFetch('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ telefono, nombre_completo, carnet_identidad, carnet_complemento, carnet_expedido }),
  }),
```

- [ ] **Step 3: Configure Tailwind theme colors and fonts**

`public-site/tailwind.config.ts` — extend the theme with the named palette:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F3EDE7",
        espresso: "#2B1F16",
        tan: "#8B6F4E",
        ink: "#3A2E22",
        muted: "#6B5D4F",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
};

export default config;
```

- [ ] **Step 4: Write Dockerfile (same pattern as frontend/Dockerfile)**

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

- [ ] **Step 5: Write .dockerignore (same pattern as frontend/.dockerignore)**

```
node_modules
.env
.env.*
!.env.example
.git
.next
```

- [ ] **Step 6: Add the public-site service to docker-compose.yml**

Modify `docker-compose.yml`, add a new service alongside `web`:

```yaml
  public-site:
    build: ./public-site
    restart: unless-stopped
    depends_on:
      - api
    ports:
      - "3001:3000"
```

- [ ] **Step 7: Add nginx routing by host**

Modify `nginx/nginx.conf` — split the existing single `server` block into two, one per hostname, both still proxying `/api/` to the backend (adjust hostnames to whatever the user's real DNS ends up being; use placeholders `clinicnovaged.com` and `portal.clinicnovaged.com` for now, noting in a comment that the user must confirm the real subdomain before production deploy):

```nginx
server {
    listen 80;
    server_name clinicnovaged.com www.clinicnovaged.com;

    location /api/ {
        proxy_pass http://api:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://public-site:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# NOTE: confirm the real subdomain for "el sistema" with the user before
# production deploy — placeholder used here per the Fase 2 spec.
server {
    listen 80;
    server_name portal.clinicnovaged.com;

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

- [ ] **Step 8: Verify locally**

Run: `cd public-site && npm run dev -- -p 3001`
Expected: `http://localhost:3001` serves the default create-next-app page with no build errors. Run `npx tsc --noEmit` — expect no errors.

- [ ] **Step 9: Commit**

```bash
git add public-site docker-compose.yml nginx/nginx.conf
git commit -m "chore: scaffold public-site project, docker-compose service, nginx routing"
```

---

## Task 2: Shared layout — fonts, Nav, FloatingCta, Footer

**Files:**
- Modify: `public-site/src/app/layout.tsx`
- Modify: `public-site/src/app/globals.css`
- Create: `public-site/src/components/Nav.tsx`
- Create: `public-site/src/components/FloatingCta.tsx`
- Create: `public-site/src/components/Footer.tsx`

**Interfaces:**
- Consumes: `BookingContext` from Task 8 (not yet built) — for Task 2, stub the "open booking modal" trigger as a no-op `console.log` or a local `useState` alert placeholder; Task 8/9 will wire it to the real modal via context. Note this explicitly in the component so Task 8's implementer knows where to connect it.
- Produces: `<Nav />`, `<FloatingCta />`, `<Footer />` used by `page.tsx` in Task 7.

- [ ] **Step 1: Configure fonts in layout.tsx**

```tsx
import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clinic NovagED — Salud, Belleza, Armonía",
  description: "Arquitectura facial y medicina estética avanzada en Cochabamba, Bolivia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${playfair.variable} ${inter.variable} font-sans bg-cream text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Write Nav.tsx**

```tsx
'use client';

export default function Nav({ onReservar }: { onReservar: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-cream/90 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-5">
        <a href="#top" className="font-serif text-xl text-espresso">
          Clinic <em className="italic">NovagED</em>
        </a>
        <nav className="hidden md:flex items-center gap-10 text-xs tracking-widest uppercase text-ink">
          <a href="#tratamientos">Tratamientos</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#ubicacion">Ubicación</a>
        </nav>
        <button
          onClick={onReservar}
          className="rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3 hover:bg-tan transition-colors"
        >
          Reservar Consulta
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Write FloatingCta.tsx**

```tsx
'use client';

export default function FloatingCta({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-4 shadow-lg hover:bg-tan transition-colors"
    >
      Agenda tu cita
    </button>
  );
}
```

- [ ] **Step 4: Write Footer.tsx**

```tsx
export default function Footer() {
  return (
    <footer className="bg-cream border-t border-tan/20 px-6 py-16">
      <div className="mx-auto max-w-7xl grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-serif text-xl text-tan mb-4">Clinic NovagED</p>
          <p className="text-sm text-muted max-w-xs">
            Un espacio profesional y confiable donde la ciencia y la estética se
            encuentran para revelar tu mejor versión.
          </p>
          <div className="flex gap-4 mt-6 text-muted">
            {/* PLACEHOLDER: replace with real Instagram/TikTok links */}
            <a href="#" aria-label="Instagram">IG</a>
            <a href="#" aria-label="TikTok">TT</a>
          </div>
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-muted mb-4">Navegación</p>
          <ul className="space-y-2 text-sm text-ink">
            <li><a href="#tratamientos">Tratamientos</a></li>
            <li><a href="#nosotros">Nosotros</a></li>
            <li><a href="#ubicacion">Ubicación</a></li>
          </ul>
        </div>
        <div className="text-sm text-muted md:text-right">
          <p>© 2026 Clinic NovagED. Todos los derechos reservados.</p>
          <p className="mt-1">Cochabamba · Bolivia</p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Run tsc and verify**

Run: `cd public-site && npx tsc --noEmit`
Expected: no errors (components aren't wired into `page.tsx` yet, that's fine — Task 7 does that).

- [ ] **Step 6: Commit**

```bash
git add public-site/src/app/layout.tsx public-site/src/app/globals.css public-site/src/components/Nav.tsx public-site/src/components/FloatingCta.tsx public-site/src/components/Footer.tsx
git commit -m "feat: add fonts, Nav, FloatingCta, Footer components"
```

---

## Task 3: Hero + EsenciaMarca sections

**Files:**
- Create: `public-site/src/components/Hero.tsx`
- Create: `public-site/src/components/EsenciaMarca.tsx`

**Interfaces:**
- Consumes: an `onReservar: () => void` prop (same pattern as Nav/FloatingCta — wired in Task 7/8).
- Produces: `<Hero onReservar={...} />`, `<EsenciaMarca />` used by `page.tsx`.

- [ ] **Step 1: Write Hero.tsx**

```tsx
export default function Hero({ onReservar }: { onReservar: () => void }) {
  return (
    <section id="top" className="relative min-h-screen flex items-end bg-espresso text-cream overflow-hidden">
      {/* PLACEHOLDER: replace with real background photo of Dra. Ponce / consultorio */}
      <div className="absolute inset-0 bg-gradient-to-b from-espresso/40 via-espresso/60 to-espresso" />

      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 pb-20 pt-40">
        <h1 className="font-serif text-6xl md:text-8xl leading-none">
          Esculpir la
          <br />
          <em className="italic">Esencia</em>
        </h1>
        <p className="mt-8 max-w-md text-cream/80">
          Arquitectura facial y medicina estética avanzada diseñada para revelar
          la belleza intrínseca que reside en el equilibrio.
        </p>
        <div className="mt-8 flex gap-4">
          <button
            onClick={onReservar}
            className="rounded-full bg-cream text-espresso text-xs tracking-widest uppercase px-8 py-4 hover:bg-tan hover:text-cream transition-colors"
          >
            Agenda tu consulta
          </button>
          <a
            href="#tratamientos"
            className="rounded-full border border-cream/40 text-cream text-xs tracking-widest uppercase px-8 py-4 hover:bg-cream/10 transition-colors"
          >
            Conocer más
          </a>
        </div>
        <div className="mt-16 flex items-center gap-4 text-cream/70">
          <span className="h-px w-10 bg-cream/40" />
          <em className="italic font-serif">Boutique Medical Excellence</em>
        </div>
        <a href="#esencia" className="mt-4 inline-block text-xs tracking-widest uppercase text-cream/70">
          Descubre tratamientos ↓
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write EsenciaMarca.tsx**

```tsx
const pilares = [
  { titulo: "Salud", texto: "La base de cada procedimiento, garantizando seguridad y respaldo médico." },
  { titulo: "Belleza", texto: "Una expresión natural y personalizada, lejos de estándares artificiales." },
  { titulo: "Armonía", texto: "El equilibrio entre cuerpo, mente y percepción personal." },
];

export default function EsenciaMarca() {
  return (
    <section id="esencia" className="bg-cream px-6 py-28 text-center">
      <p className="text-xs tracking-widest uppercase text-muted">Esencia de Marca</p>
      <h2 className="mt-4 font-serif text-4xl md:text-5xl text-espresso">
        Renovación y evolución
        <br />
        <em className="italic text-tan">constante</em>
      </h2>
      <p className="mx-auto mt-6 max-w-xl text-muted">
        Novaged nace para ofrecer una nueva etapa en el cuidado estético — donde
        la innovación médica se une a una visión artística del bienestar
        integral.
      </p>

      <div className="mx-auto mt-16 grid max-w-4xl divide-y divide-tan/20 border-t border-tan/20 md:grid-cols-3 md:divide-x md:divide-y-0">
        {pilares.map((p) => (
          <div key={p.titulo} className="px-6 py-8">
            <h3 className="font-serif italic text-2xl text-espresso">{p.titulo}</h3>
            <p className="mt-3 text-sm text-muted">{p.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Run tsc and verify**

Run: `cd public-site && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add public-site/src/components/Hero.tsx public-site/src/components/EsenciaMarca.tsx
git commit -m "feat: add Hero and EsenciaMarca sections"
```

---

## Task 4: Tratamientos section (accordion)

**Files:**
- Create: `public-site/src/components/Tratamientos.tsx`

**Interfaces:**
- Produces: `<Tratamientos />` used by `page.tsx`. Self-contained (own `useState` for which accordion item is open) — no external dependencies.

- [ ] **Step 1: Write Tratamientos.tsx with real + placeholder categories**

```tsx
'use client';
import { useState } from 'react';

const categorias = [
  {
    titulo: 'Tratamientos Faciales',
    descripcion:
      'Tratamientos orientados a mejorar la calidad, hidratación, luminosidad y regeneración de la piel mediante medicina estética avanzada.',
    columnaIzquierda: { titulo: 'Áreas de enfoque', items: ['Calidad de piel', 'Hidratación profunda', 'Despigmentación', 'Regeneración celular'] },
    columnaDerecha: { titulo: 'Tratamientos', items: ['Microneedling', 'PRP facial', 'PDRN / PN', 'Exosomas', 'Peelings médicos', 'Ácido hialurónico', 'Coctel de vitaminas', 'DMAE + silicio orgánico', 'Cóctel de aminoácidos'] },
  },
  {
    titulo: 'Armonización Facial',
    descripcion:
      'Tratamientos diseñados para equilibrar y resaltar los rasgos faciales manteniendo resultados naturales y armónicos.',
    columnaIzquierda: null,
    columnaDerecha: { titulo: 'Procedimientos', items: ['Ácido hialurónico (Fillers)', 'Toxina botulínica (Botox)', 'Perfilado de nariz', 'Relleno / perfilado de labios', 'Mentoplastia', 'Marcación mandibular', 'Levantamiento de pómulos'] },
  },
  {
    // PLACEHOLDER: contenido pendiente de confirmar con el usuario
    titulo: 'Rejuvenecimiento · Lifting',
    descripcion: 'Tratamientos enfocados en restaurar firmeza y frescura, redefiniendo el contorno facial de forma natural.',
    columnaIzquierda: null,
    columnaDerecha: { titulo: 'Procedimientos', items: ['Hilos tensores', 'Bioestimuladores de colágeno', 'Lifting no quirúrgico'] },
  },
  {
    // PLACEHOLDER: contenido pendiente de confirmar con el usuario
    titulo: 'Tratamientos Corporales',
    descripcion: 'Procedimientos orientados al cuidado, firmeza y bienestar integral del cuerpo.',
    columnaIzquierda: null,
    columnaDerecha: { titulo: 'Tratamientos', items: ['Reducción de medidas', 'Reafirmación corporal', 'Hidratación corporal profunda'] },
  },
  {
    // PLACEHOLDER: contenido pendiente de confirmar con el usuario
    titulo: 'Plasma Láser',
    descripcion: 'Tecnología de plasma para renovación y tensado de la piel con mínima invasión.',
    columnaIzquierda: null,
    columnaDerecha: { titulo: 'Aplicaciones', items: ['Plasma facial', 'Tensado de párpados', 'Renovación de textura'] },
  },
];

export default function Tratamientos() {
  const [abierto, setAbierto] = useState<number | null>(0);

  return (
    <section id="tratamientos" className="bg-cream px-6 py-28">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2">
        <div>
          {/* PLACEHOLDER: replace with real photo of the treatment room */}
          <div className="aspect-[4/5] w-full rounded-sm bg-espresso/10" />
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-muted">01</p>
          <h2 className="mt-2 font-serif text-4xl text-espresso">Medicina Estética</h2>
          <p className="mt-4 max-w-md text-muted">
            Tratamientos médico-estéticos avanzados orientados a la mejora
            visible, el rejuvenecimiento y el bienestar integral de la piel y el
            cuerpo.
          </p>

          <p className="mt-10 text-xs tracking-widest uppercase text-tan">Tratamientos Detalles</p>

          <div className="mt-4 divide-y divide-tan/20 border-t border-tan/20">
            {categorias.map((cat, i) => (
              <div key={cat.titulo}>
                <button
                  onClick={() => setAbierto(abierto === i ? null : i)}
                  className="flex w-full items-center justify-between py-5 text-left font-serif text-xl text-espresso"
                >
                  {cat.titulo}
                  <span className="text-tan">{abierto === i ? '−' : '+'}</span>
                </button>
                {abierto === i && (
                  <div className="pb-6">
                    <p className="text-sm text-muted">{cat.descripcion}</p>
                    <div className="mt-4 grid gap-6 sm:grid-cols-2">
                      {cat.columnaIzquierda && (
                        <div>
                          <p className="text-xs tracking-widest uppercase text-muted">{cat.columnaIzquierda.titulo}</p>
                          <ul className="mt-2 space-y-1 text-sm text-ink">
                            {cat.columnaIzquierda.items.map((it) => <li key={it}>• {it}</li>)}
                          </ul>
                        </div>
                      )}
                      <div>
                        <p className="text-xs tracking-widest uppercase text-muted">{cat.columnaDerecha.titulo}</p>
                        <ul className="mt-2 space-y-1 text-sm text-ink">
                          {cat.columnaDerecha.items.map((it) => <li key={it}>+ {it}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run tsc and verify**

Run: `cd public-site && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add public-site/src/components/Tratamientos.tsx
git commit -m "feat: add Tratamientos accordion section"
```

---

## Task 5: Silencio interlude + ArtePerfeccion sections

**Files:**
- Create: `public-site/src/components/Silencio.tsx`
- Create: `public-site/src/components/ArtePerfeccion.tsx`

**Interfaces:**
- Produces: `<Silencio />`, `<ArtePerfeccion />` used by `page.tsx`.

- [ ] **Step 1: Write Silencio.tsx**

```tsx
export default function Silencio() {
  return (
    <section className="relative flex h-[70vh] items-center justify-center bg-espresso text-cream text-center">
      {/* PLACEHOLDER: replace with real full-bleed photo of the treatment box */}
      <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/70 to-espresso/40" />
      <div className="relative z-10 px-6">
        <h2 className="font-serif text-6xl md:text-7xl">Silencio</h2>
        <p className="mt-4 text-cream/80">El primer tratamiento comienza antes de entrar al box</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write ArtePerfeccion.tsx**

```tsx
const puntos = [
  { n: '01', titulo: 'Resultados Naturales', texto: 'Evitamos el exceso, buscando siempre la elegancia de lo sutil.' },
  { n: '02', titulo: 'Trato Personalizado', texto: 'Cada rostro es único, por eso creamos planes a tu medida.' },
  { n: '03', titulo: 'Respaldo Médico', texto: 'Ciencia y tecnología de última generación a tu servicio.' },
  { n: '04', titulo: 'Acompañamiento', texto: 'Estamos contigo antes, durante y después del tratamiento.' },
];

export default function ArtePerfeccion() {
  return (
    <section className="bg-espresso text-cream px-6 py-28">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2">
        <div>
          <p className="text-xs tracking-widest uppercase text-cream/60">¿Por qué elegirnos?</p>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl">
            El Arte de la
            <br />
            <em className="italic text-tan">Perfección</em>
          </h2>

          <div className="mt-12 grid grid-cols-2 gap-x-10 gap-y-10">
            {puntos.map((p) => (
              <div key={p.n}>
                <p className="text-cream/40">{p.n}</p>
                <h3 className="mt-2 font-serif text-lg">{p.titulo}</h3>
                <p className="mt-2 text-sm text-cream/70">{p.texto}</p>
              </div>
            ))}
          </div>

          <a href="#nosotros" className="mt-12 inline-block text-xs tracking-widest uppercase border-b border-cream/40 pb-1">
            Iniciar Transformación
          </a>
        </div>

        <div className="relative flex items-center">
          {/* PLACEHOLDER: replace with real photo of the product shelving / interior */}
          <div className="aspect-[4/5] w-full rounded-sm bg-cream/5" />
          <blockquote className="absolute inset-x-6 bottom-10 rounded-lg bg-espresso/90 p-8 shadow-xl md:inset-x-auto md:right-[-2rem] md:w-80">
            <p className="font-serif italic text-xl text-cream">
              &ldquo;La verdadera belleza reside en la armonía, no en el cambio
              drástico.&rdquo;
            </p>
            <footer className="mt-4 text-xs tracking-widest uppercase text-cream/60">
              — Filosofía NovagED
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Run tsc and verify**

Run: `cd public-site && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add public-site/src/components/Silencio.tsx public-site/src/components/ArtePerfeccion.tsx
git commit -m "feat: add Silencio interlude and ArtePerfeccion sections"
```

---

## Task 6: Nosotros + Ubicacion sections

**Files:**
- Create: `public-site/src/components/Nosotros.tsx`
- Create: `public-site/src/components/Ubicacion.tsx`

**Interfaces:**
- Produces: `<Nosotros />`, `<Ubicacion />` used by `page.tsx`.

- [ ] **Step 1: Write Nosotros.tsx**

```tsx
export default function Nosotros() {
  return (
    <section id="nosotros" className="bg-cream px-6 py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
        <div className="mx-auto aspect-square w-full max-w-md overflow-hidden rounded-full bg-espresso/10">
          {/* PLACEHOLDER: replace with real photo of Dra. Maria Noemi Ponce Caisiri */}
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-muted">Dirección Médica</p>
          <p className="mt-4 font-serif italic text-tan">Clinic NovagED</p>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl text-espresso">
            Dra. Maria Noemi Ponce Caisiri
          </h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
            <p>
              Médico cirujano-ultrasonografista. Médico estético especialista en
              rejuvenecimiento y armonización facial y corporal, con técnicas
              avanzadas en armonización facial, antiedad, lifting,
              bioestimuladores de colágeno, fillers (ácido hialurónico), hilos,
              neuromodulación (toxina botulínica o Botox), enzimas
              recombinantes, enzimas lipolíticas y aparatología, con
              seguimiento médico especializado.
            </p>
            <p>
              En ClinicNovagED tu salud es nuestra prioridad. Brindamos
              tratamientos seguros y de alta calidad, asegurando resultados
              naturales y armónicos, con características únicas que realzan tu
              belleza natural mediante protocolos personalizados acordes a
              cada paciente, superando tus expectativas.
            </p>
            <p>
              ClinicNovagED tiene un enfoque integral donde cada paciente es
              único, integrando servicios de ginecología, ecografía y
              fisioterapia, con compromiso y profesionalismo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write Ubicacion.tsx**

```tsx
export default function Ubicacion() {
  const direccion = 'Edificio Vedra planta baja, calle Lanza No 670 entre Chuquisaca y Av. Salamanca, Cochabamba, Bolivia';
  const mapsQuery = encodeURIComponent(direccion);

  return (
    <section id="ubicacion" className="bg-cream px-6 py-28">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-5xl text-espresso">Consultorio</h2>

          <div className="mt-10 space-y-2 text-sm text-ink">
            <p>{direccion}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs tracking-widest uppercase text-tan"
            >
              Abrir en Google Maps
            </a>
          </div>

          <div className="mt-8 space-y-2 text-sm text-ink">
            <p>+591 65359810</p>
            <p>info@novaged.com</p>
          </div>

          <div className="mt-8 border-t border-tan/20 pt-6 text-sm text-muted">
            <p className="text-xs tracking-widest uppercase text-muted">Horarios de atención</p>
            <p className="mt-2">Lunes a viernes 09:00 - 13:00</p>
            <p>14:00 - 20:00</p>
            <p>Sábado 09:00 - 16:00</p>
          </div>
        </div>

        <div className="aspect-[4/3] w-full overflow-hidden rounded-sm">
          <iframe
            title="Ubicación Clinic NovagED"
            src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
            className="h-full w-full border-0"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Run tsc and verify**

Run: `cd public-site && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add public-site/src/components/Nosotros.tsx public-site/src/components/Ubicacion.tsx
git commit -m "feat: add Nosotros and Ubicacion sections"
```

---

## Task 7: CtaFinal section + assemble page.tsx

**Files:**
- Create: `public-site/src/components/CtaFinal.tsx`
- Modify: `public-site/src/app/page.tsx`

**Interfaces:**
- Consumes: `Nav`, `Hero`, `EsenciaMarca`, `Tratamientos`, `Silencio`, `ArtePerfeccion`, `Nosotros`, `Ubicacion`, `Footer`, `FloatingCta` (Tasks 2-6).
- Produces: the fully assembled single-page site at `/`, with a placeholder `onReservar` handler (local `useState` boolean + `alert`/console log) that Task 8/9 will replace with the real modal trigger via context.

- [ ] **Step 1: Write CtaFinal.tsx**

```tsx
export default function CtaFinal({ onReservar }: { onReservar: () => void }) {
  return (
    <section className="bg-espresso text-cream px-6 py-32 text-center">
      <p className="text-xs tracking-widest uppercase text-cream/60">Dé el primer paso</p>
      <h2 className="mt-6 font-serif text-5xl md:text-6xl">
        INICIE SU
        <br />
        <em className="italic text-tan">transformación</em>
      </h2>
      <p className="mx-auto mt-6 max-w-md text-cream/70">
        Agende una evaluación personalizada y descubra el tratamiento ideal
        para resaltar su belleza natural.
      </p>
      <button
        onClick={onReservar}
        className="mt-10 rounded-full border border-cream/40 px-10 py-4 text-xs tracking-widest uppercase hover:bg-cream/10 transition-colors"
      >
        Agenda tu cita
      </button>
    </section>
  );
}
```

- [ ] **Step 2: Assemble page.tsx**

```tsx
'use client';
import { useState } from 'react';
import Nav from '@/components/Nav';
import FloatingCta from '@/components/FloatingCta';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import EsenciaMarca from '@/components/EsenciaMarca';
import Tratamientos from '@/components/Tratamientos';
import Silencio from '@/components/Silencio';
import ArtePerfeccion from '@/components/ArtePerfeccion';
import Nosotros from '@/components/Nosotros';
import Ubicacion from '@/components/Ubicacion';
import CtaFinal from '@/components/CtaFinal';

export default function Home() {
  // TODO(Task 8/9): replace this with BookingContext's openModal() once the
  // booking modal exists. Every onReservar prop below wires to this same
  // handler, so Task 8/9 only needs to change this one function.
  const [modalOpenPlaceholder, setModalOpenPlaceholder] = useState(false);
  function onReservar() {
    setModalOpenPlaceholder(true);
  }

  return (
    <main>
      <Nav onReservar={onReservar} />
      <Hero onReservar={onReservar} />
      <EsenciaMarca />
      <Tratamientos />
      <Silencio />
      <ArtePerfeccion />
      <Nosotros />
      <Ubicacion />
      <CtaFinal onReservar={onReservar} />
      <Footer />
      <FloatingCta onClick={onReservar} />
      {modalOpenPlaceholder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 p-6">
          <div className="rounded bg-cream p-8 text-center">
            <p className="text-ink">Modal de reserva pendiente (Task 8/9).</p>
            <button onClick={() => setModalOpenPlaceholder(false)} className="mt-4 text-tan underline">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Verify full page renders**

Run: `cd public-site && npm run dev -- -p 3001`
Expected: `http://localhost:3001` renders every section top to bottom with no console errors, matching the section order and copy from the spec. Click "Reservar Consulta" — the placeholder modal opens and closes. Run `npx tsc --noEmit` and `npm run build` — both succeed.

- [ ] **Step 4: Commit**

```bash
git add public-site/src/components/CtaFinal.tsx public-site/src/app/page.tsx
git commit -m "feat: assemble full public-site landing page"
```

---

## Task 8: Booking modal — servicio, profesional, horario steps

**Files:**
- Create: `public-site/src/lib/bookingContext.tsx`
- Create: `public-site/src/components/booking/BookingModal.tsx`
- Create: `public-site/src/components/booking/StepServicio.tsx`
- Create: `public-site/src/components/booking/StepProfesional.tsx`
- Create: `public-site/src/components/booking/StepHorario.tsx`

**Interfaces:**
- Consumes: `api` from `public-site/src/lib/api.js` (Task 1) — `getServicios()`, `getProfesionales(servicioId)`, `getDisponibilidad(profesionalId, servicioId, fecha)`.
- Produces: `BookingProvider` (wraps the app), `useBooking()` hook exposing `{ isOpen, open, close, step, setStep, servicioId, setServicioId, profesionalId, setProfesionalId, fecha, setFecha, horaInicio, setHoraInicio }`. `<BookingModal />` renders the current step.

- [ ] **Step 1: Write bookingContext.tsx**

```tsx
'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type Step = 'servicio' | 'profesional' | 'horario' | 'login' | 'confirmar' | 'pago';

interface BookingState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  step: Step;
  setStep: (s: Step) => void;
  servicioId: number | null;
  setServicioId: (id: number | null) => void;
  profesionalId: number | null;
  setProfesionalId: (id: number | null) => void;
  fecha: string;
  setFecha: (f: string) => void;
  horaInicio: string | null;
  setHoraInicio: (h: string | null) => void;
  citaId: number | null;
  setCitaId: (id: number | null) => void;
}

const BookingContext = createContext<BookingState | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('servicio');
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [profesionalId, setProfesionalId] = useState<number | null>(null);
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState<string | null>(null);
  const [citaId, setCitaId] = useState<number | null>(null);

  function open() {
    setStep('servicio');
    setServicioId(null);
    setProfesionalId(null);
    setFecha('');
    setHoraInicio(null);
    setCitaId(null);
    setIsOpen(true);
  }
  function close() {
    setIsOpen(false);
  }

  return (
    <BookingContext.Provider
      value={{ isOpen, open, close, step, setStep, servicioId, setServicioId, profesionalId, setProfesionalId, fecha, setFecha, horaInicio, setHoraInicio, citaId, setCitaId }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}
```

- [ ] **Step 2: Write StepServicio.tsx**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepServicio() {
  const { setServicioId, setStep } = useBooking();
  const [servicios, setServicios] = useState<any[]>([]);

  useEffect(() => {
    api.getServicios().then(setServicios).catch(console.error);
  }, []);

  function elegir(id: number) {
    setServicioId(id);
    setStep('profesional');
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-espresso">Elige un servicio</h3>
      <ul className="mt-6 space-y-3">
        {servicios.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => elegir(s.id)}
              className="w-full rounded border border-tan/30 px-4 py-3 text-left hover:border-tan"
            >
              <span className="font-medium text-ink">{s.nombre}</span>
              <span className="ml-2 text-sm text-muted">Bs. {s.precio}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Write StepProfesional.tsx**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepProfesional() {
  const { servicioId, setProfesionalId, setStep } = useBooking();
  const [profesionales, setProfesionales] = useState<any[]>([]);

  useEffect(() => {
    if (servicioId) api.getProfesionales(servicioId).then(setProfesionales).catch(console.error);
  }, [servicioId]);

  function elegir(id: number) {
    setProfesionalId(id);
    setStep('horario');
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-espresso">Elige un profesional</h3>
      <ul className="mt-6 space-y-3">
        {profesionales.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => elegir(p.id)}
              className="w-full rounded border border-tan/30 px-4 py-3 text-left hover:border-tan"
            >
              {p.nombre}
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => setStep('servicio')} className="mt-6 text-xs uppercase tracking-widest text-muted">
        ← Volver
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Write StepHorario.tsx**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepHorario() {
  const { servicioId, profesionalId, fecha, setFecha, setHoraInicio, setStep } = useBooking();
  const [slots, setSlots] = useState<any[]>([]);
  const hoy = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (servicioId && profesionalId && fecha) {
      api.getDisponibilidad(profesionalId, servicioId, fecha).then(setSlots).catch(console.error);
    } else {
      setSlots([]);
    }
  }, [servicioId, profesionalId, fecha]);

  function elegir(hora: string) {
    setHoraInicio(hora);
    setStep('login');
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-espresso">Elige fecha y horario</h3>
      <input
        type="date"
        min={hoy}
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="mt-6 rounded border border-tan/30 px-4 py-2"
      />
      <ul className="mt-6 grid grid-cols-3 gap-2">
        {slots.map((s) => (
          <li key={s.hora_inicio}>
            <button
              onClick={() => elegir(s.hora_inicio)}
              className="w-full rounded border border-tan/30 px-3 py-2 text-sm hover:border-tan"
            >
              {s.hora_inicio}
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => setStep('profesional')} className="mt-6 text-xs uppercase tracking-widest text-muted">
        ← Volver
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Write BookingModal.tsx shell (routes to the 3 steps built so far; login/confirmar/pago are stubs replaced in Task 9)**

```tsx
'use client';
import { useBooking } from '@/lib/bookingContext';
import StepServicio from './StepServicio';
import StepProfesional from './StepProfesional';
import StepHorario from './StepHorario';

export default function BookingModal() {
  const { isOpen, close, step } = useBooking();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 p-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded bg-cream p-8">
        <div className="flex justify-end">
          <button onClick={close} className="text-muted hover:text-ink" aria-label="Cerrar">
            ✕
          </button>
        </div>
        {step === 'servicio' && <StepServicio />}
        {step === 'profesional' && <StepProfesional />}
        {step === 'horario' && <StepHorario />}
        {(step === 'login' || step === 'confirmar' || step === 'pago') && (
          <p className="text-ink">Paso &quot;{step}&quot; pendiente (Task 9).</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Wire BookingProvider and BookingModal into page.tsx, replacing the Task 7 placeholder**

Modify `public-site/src/app/page.tsx`: wrap the whole page in `<BookingProvider>`, replace `onReservar={onReservar}` (the local `useState` placeholder from Task 7) with `onReservar={open}` from `useBooking()`, render `<BookingModal />` instead of the placeholder `<div>`.

```tsx
'use client';
import { BookingProvider, useBooking } from '@/lib/bookingContext';
import BookingModal from '@/components/booking/BookingModal';
import Nav from '@/components/Nav';
import FloatingCta from '@/components/FloatingCta';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import EsenciaMarca from '@/components/EsenciaMarca';
import Tratamientos from '@/components/Tratamientos';
import Silencio from '@/components/Silencio';
import ArtePerfeccion from '@/components/ArtePerfeccion';
import Nosotros from '@/components/Nosotros';
import Ubicacion from '@/components/Ubicacion';
import CtaFinal from '@/components/CtaFinal';

function HomeContent() {
  const { open } = useBooking();

  return (
    <main>
      <Nav onReservar={open} />
      <Hero onReservar={open} />
      <EsenciaMarca />
      <Tratamientos />
      <Silencio />
      <ArtePerfeccion />
      <Nosotros />
      <Ubicacion />
      <CtaFinal onReservar={open} />
      <Footer />
      <FloatingCta onClick={open} />
      <BookingModal />
    </main>
  );
}

export default function Home() {
  return (
    <BookingProvider>
      <HomeContent />
    </BookingProvider>
  );
}
```

- [ ] **Step 7: Verify against the real backend**

Ensure the Fase 1 backend is running locally (`cd backend && npm run dev`, seeded per Fase 1's Task 3) and `public-site/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:4000`. Run `cd public-site && npm run dev -- -p 3001`. Click "Reservar Consulta" — confirm the modal opens on the Servicio step, lists the real seeded servicio, clicking it advances to Profesional (lists the real seeded profesional), clicking it advances to Horario (date picker + real slots from `/disponibilidad`), and clicking a slot advances to the "pendiente (Task 9)" stub. Run `npx tsc --noEmit` and `npm run build` — both succeed.

- [ ] **Step 8: Commit**

```bash
git add public-site/src/lib/bookingContext.tsx public-site/src/components/booking public-site/src/app/page.tsx
git commit -m "feat: add booking modal with servicio/profesional/horario steps"
```

---

## Task 9: Booking modal — login OTP, confirmar, pago steps

**Files:**
- Create: `public-site/src/components/booking/StepLogin.tsx`
- Create: `public-site/src/components/booking/StepConfirmar.tsx`
- Create: `public-site/src/components/booking/StepPago.tsx`
- Modify: `public-site/src/components/booking/BookingModal.tsx`

**Interfaces:**
- Consumes: `api.requestOtp`, `api.verifyOtp`, `api.setToken`, `api.crearCita`, `api.generarQR` from `public-site/src/lib/api.js` (Task 1); `useBooking()` from Task 8.
- Produces: the complete booking flow, login → confirm → QR payment, all within the modal.

- [ ] **Step 1: Write StepLogin.tsx**

```tsx
'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepLogin() {
  const { setStep } = useBooking();
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [carnet, setCarnet] = useState('');
  const [complemento, setComplemento] = useState('');
  const [expedido, setExpedido] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  async function enviarOtp() {
    setError('');
    try {
      await api.requestOtp(telefono, nombre, carnet, complemento, expedido);
      setEnviado(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function verificar() {
    setError('');
    try {
      const { token } = await api.verifyOtp(telefono, codigo);
      api.setToken(token);
      setStep('confirmar');
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-espresso">Ingresa tus datos</h3>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {!enviado ? (
        <div className="mt-6 space-y-3">
          <input placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" />
          <input placeholder="Teléfono (con código de país)" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" />
          <input placeholder="Carnet de identidad" value={carnet} onChange={(e) => setCarnet(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" required />
          <input placeholder="Complemento (opcional)" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" />
          <input placeholder="Expedido (ej. CB)" value={expedido} onChange={(e) => setExpedido(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" required />
          <button onClick={enviarOtp} className="w-full rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3">
            Enviar código por WhatsApp
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <input placeholder="Código recibido" value={codigo} onChange={(e) => setCodigo(e.target.value)} className="w-full rounded border border-tan/30 px-4 py-2" />
          <button onClick={verificar} className="w-full rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3">
            Verificar
          </button>
        </div>
      )}
      <button onClick={() => setStep('horario')} className="mt-6 text-xs uppercase tracking-widest text-muted">
        ← Volver
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write StepConfirmar.tsx**

```tsx
'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepConfirmar() {
  const { profesionalId, servicioId, fecha, horaInicio, setCitaId, setStep } = useBooking();
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function confirmar() {
    setError('');
    setCargando(true);
    try {
      const { cita } = await api.crearCita(profesionalId, servicioId, fecha, horaInicio);
      setCitaId(cita.id);
      setStep('pago');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h3 className="font-serif text-2xl text-espresso">Confirmar reserva</h3>
      <div className="mt-6 space-y-2 text-sm text-ink">
        <p>Fecha: {fecha}</p>
        <p>Hora: {horaInicio}</p>
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button
        onClick={confirmar}
        disabled={cargando}
        className="mt-8 w-full rounded-full bg-espresso text-cream text-xs tracking-widest uppercase px-6 py-3 disabled:opacity-50"
      >
        {cargando ? 'Confirmando…' : 'Confirmar reserva'}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Write StepPago.tsx**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBooking } from '@/lib/bookingContext';

export default function StepPago() {
  const { citaId, close } = useBooking();
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!citaId) return;
    api
      .generarQR(citaId)
      .then((res) => setQr(res.qrImageBase64))
      .catch((e) => setError(e.message));
  }, [citaId]);

  return (
    <div className="text-center">
      <h3 className="font-serif text-2xl text-espresso">Paga con QR</h3>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {qr && (
        <img src={`data:image/png;base64,${qr}`} alt="QR de pago" className="mx-auto mt-6 w-64" />
      )}
      <p className="mt-6 text-sm text-muted">
        Escanea el código con tu app bancaria. Tu cita se confirmará
        automáticamente al detectar el pago.
      </p>
      <button onClick={close} className="mt-8 text-xs uppercase tracking-widest text-tan">
        Cerrar
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Wire the 3 new steps into BookingModal.tsx**

Modify `public-site/src/components/booking/BookingModal.tsx`, replacing the stub block:

```tsx
import StepLogin from './StepLogin';
import StepConfirmar from './StepConfirmar';
import StepPago from './StepPago';

// ...inside the component, replace the stub conditional with:
{step === 'login' && <StepLogin />}
{step === 'confirmar' && <StepConfirmar />}
{step === 'pago' && <StepPago />}
```

- [ ] **Step 5: Run full end-to-end verification against the real backend**

With the backend running locally and seeded (per Fase 1), run `cd public-site && npm run dev -- -p 3001`. Walk the complete flow: Reservar → Servicio → Profesional → Horario → Login (fill name, phone, CI, request OTP — this will fail against a real WhatsApp send with the dev fake token, which is expected per Fase 1's known limitation; note this in the report rather than treating it as a bug) → (if a real WhatsApp OTP setup is available, complete verification) → Confirmar → Pago QR (will similarly depend on real Banco Económico credentials).

At minimum, verify without real credentials: the first three steps work end-to-end against real seeded data, the login form renders and calls `/auth/otp/request` (confirm via Network tab or a temporary `console.log` that the request fires with the correct payload shape, then remove the log), and `npm run build` succeeds with no type errors.

Run: `cd public-site && npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add public-site/src/components/booking/StepLogin.tsx public-site/src/components/booking/StepConfirmar.tsx public-site/src/components/booking/StepPago.tsx public-site/src/components/booking/BookingModal.tsx
git commit -m "feat: add login, confirmar and pago QR steps to booking modal"
```

---

## Task 10: End-to-end verification and cleanup

**Files:**
- None created — verification and any small fixes found.

**Interfaces:**
- Consumes: the complete `public-site/` app from Tasks 1-9.

- [ ] **Step 1: Full manual walkthrough**

With `backend/` running and seeded, and `public-site/` running on port 3001, visually walk through every section top to bottom (Hero, Esencia, Tratamientos accordion — open and close each category including the 3 placeholder ones, Silencio, Arte de la Perfección, Nosotros, Ubicación map, CTA final, Footer). Confirm every "Reservar"/"Agenda tu cita" trigger (Nav, Hero, Tratamientos area is not a trigger, ArtePerfeccion's "Iniciar Transformación" link, CtaFinal, FloatingCta) opens the same booking modal at the Servicio step.

- [ ] **Step 2: Responsive check**

Resize the browser to a mobile width (e.g. 375px) and confirm no horizontal scroll/overflow in any section, the Nav's desktop-only links collapse gracefully (they use `hidden md:flex`, so on mobile only the logo and "Reservar Consulta" button show — acceptable for this phase per YAGNI; a full mobile nav menu is out of scope unless the user asks).

- [ ] **Step 3: Verify docker-compose config validity**

Run: `docker compose config` (from repo root, with a root `.env` present per Fase 1's Task 11 pattern)
Expected: resolves with no errors, showing the new `public-site` service alongside `mysql`, `api`, `web`, `nginx`.

- [ ] **Step 4: Fix any issues found during Steps 1-3**

Commit fixes with accurate messages describing what was found and fixed.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: fix issues found during Fase 2 end-to-end verification" --allow-empty
```
(Use `--allow-empty` only if Steps 1-3 found nothing to fix — otherwise this step is redundant with Step 4's commits.)
