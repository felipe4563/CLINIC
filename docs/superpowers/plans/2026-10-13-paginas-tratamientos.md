# Páginas de detalle por tratamiento — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada uno de los 54 tratamientos de la web pública tiene su página estática `/tratamientos/<slug>` con información investigada en fuentes médicas verificadas, foto con licencia libre y botón que abre la reserva con ese servicio ya elegido.

**Architecture:** El catálogo de la web sale del código `Tratamientos.tsx` a `public-site/src/lib/tratamientos/` (tipos, categorías, un archivo de contenido por grupo, créditos de fotos, índice). Una ruta dinámica de Next 16 con `generateStaticParams` + `dynamicParams = false` genera las 54 páginas en build. El contexto de reserva gana `open(nombreServicio)`, que busca el servicio activo por nombre normalizado en el catálogo público.

**Tech Stack:** Next.js 16.3.4 (App Router, Turbopack), React 19, Tailwind 4 (tokens en `globals.css`), `node --test` de Node 24 (type stripping; sin dependencias nuevas), `sharp` (ya instalado con Next).

**Spec:** `docs/superpowers/specs/2026-10-13-paginas-tratamientos-design.md`

## Global Constraints

- Solo se toca `public-site/` (y este plan). Nada de backend ni staff.
- Sin dependencias nuevas en `package.json` (solo se agrega el script `"test"`).
- Next 16 tiene cambios incompatibles: antes de escribir código de rutas, leer `public-site/node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md`, `.../generate-metadata.md` y `.../03-file-conventions/dynamic-routes.md`. `params` es una `Promise`.
- Los archivos de `src/lib/tratamientos/` (salvo `index.ts`) y `src/lib/servicios.ts` solo pueden usar `import type` hacia otros archivos del proyecto: los tests los importan con `node --test` (type stripping), que no resuelve el alias `@/` ni imports sin extensión. Solo sintaxis TypeScript borrable (sin `enum`, sin `namespace`, sin parameter properties).
- Textos de la interfaz en español; mismos tokens de color (`cream`, `pearl`, `neutral-cream`, `espresso`, `tan`, `manhattan`, `ink`, `muted`) y `font-serif` (Bodoni) en títulos.
- Fuentes del contenido: solo dominios de la lista `DOMINIOS_FUENTES` (Task 1). Redacción propia, parafraseada, sin promesas ni cifras que no estén en la fuente. Si la evidencia es limitada o reciente, decirlo.
- Fotos: solo Unsplash License, Pexels License o Wikimedia Commons CC0 / CC BY / CC BY-SA. Tono cálido y claro, adultos, nada gráfico (sin sangre, heridas ni agujas clavadas en primer plano), sin marcas ni logos visibles.
- Trabajar en la rama `feat/paginas-tratamientos`. Commits en la rama sí; **nunca push**.
- Ruling del plan sobre la spec: la spec pone `imagen?: string` dentro de `Tratamiento`; aquí la imagen se deriva de `CREDITOS[slug]` (si hay crédito, `/tratamientos/<slug>.jpg`; si no, la foto de la categoría). Mismo comportamiento, un solo lugar donde registrar foto + licencia.

## Review Focus

1. **El botón del Nav o el flotante pasan un `MouseEvent` a `open`** (hoy `onClick={onReservar}`): debe abrir la reserva normal, nunca intentar buscar un servicio. Test: guarda `typeof nombreServicio === 'string'` (Task 2) y verificación en navegador (Task 11).
2. **Servicio renombrado o desactivado en el panel**: el botón de la página abre en "Elige un servicio" sin error. Test unitario de `buscarServicioPorNombre` → `null` (Task 2) y navegador (Task 11).
3. **Nombres largos a 390 px** ("Ácido hialurónico (hidratación facial)", "Relleno / perfilado de labios"): el título y las píldoras de "Otros tratamientos" hacen salto de línea sin scroll horizontal. Verificación en navegador (Task 4 y Task 11).
4. **Fuentes fuera de la lista o URL rota**: test de dominios permitidos y `https://` (Task 1) + comprobación HTTP de cada URL en cada tarea de contenido + muestreo final (Task 11).
5. **Slug inexistente o con mayúsculas** (`/tratamientos/Microneedling`, `/tratamientos/xyz`): 404. Verificación en navegador (Task 11).

---

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `public-site/src/lib/tratamientos/tipos.ts` | Tipos `Tratamiento`, `Fuente`, `Pregunta`, `Credito`, `Categoria`, `Grupo`, `Columna`, `Item`, `Icono` |
| `public-site/src/lib/tratamientos/categorias.ts` | Las 5 categorías (antes dentro de `Tratamientos.tsx`) con `slug` en los 54 ítems-tratamiento; `ubicarTratamiento(slug)` |
| `public-site/src/lib/tratamientos/contenido/*.ts` | Contenido investigado, un archivo por grupo (9 archivos) |
| `public-site/src/lib/tratamientos/creditos.ts` | Créditos y licencia de cada foto, por slug |
| `public-site/src/lib/tratamientos/index.ts` | Une todo: `TRATAMIENTOS`, `buscarTratamiento(slug)` |
| `public-site/src/lib/tratamientos/tratamientos.test.mjs` | Validación del contenido, fuentes y fotos |
| `public-site/src/lib/servicios.ts` (+ `.test.mjs`) | `normalizarNombre`, `buscarServicioPorNombre` |
| `public-site/src/lib/bookingContext.tsx` | `open(nombreServicio?)` |
| `public-site/src/components/Chevron.tsx` | Chevron compartido (portada y preguntas) |
| `public-site/src/components/Tratamientos.tsx` | Portada: lee `CATEGORIAS`; enlaces a las páginas (Task 11) |
| `public-site/src/components/Nav.tsx`, `Footer.tsx` | Enlaces absolutos `/#…`; Nav con `solido` |
| `public-site/src/app/tratamientos/[slug]/page.tsx` | Página estática de detalle |
| `public-site/src/components/tratamiento/{MarcoTratamiento,BotonReservar,PreguntasFrecuentes}.tsx` | Partes cliente de la página |
| `public-site/scripts/optimizar-imagen.mjs` | Redimensiona/comprime una foto a `public/tratamientos/<slug>.jpg` |
| `public-site/public/tratamientos/*.jpg` | Fotos |

---

### Task 1: Base de datos del catálogo, tests y portada leyendo de ella

**Files:**
- Create: `public-site/src/lib/tratamientos/tipos.ts`
- Create: `public-site/src/lib/tratamientos/categorias.ts`
- Create: `public-site/src/lib/tratamientos/contenido/{faciales,armonizacion,rejuvenecimiento,corporales,plasma,ginecologia,ecografia,fisioterapia,enfermeria}.ts`
- Create: `public-site/src/lib/tratamientos/creditos.ts`
- Create: `public-site/src/lib/tratamientos/index.ts`
- Create: `public-site/src/lib/tratamientos/tratamientos.test.mjs`
- Create: `public-site/src/components/Chevron.tsx`
- Modify: `public-site/src/components/Tratamientos.tsx` (quitar tipos, `RESPALDO_MEDICO`, `categorias` y `Chevron`; leer de `CATEGORIAS`)
- Modify: `public-site/package.json` (script `test`)

**Interfaces:**
- Produces: tipos de `tipos.ts`; `CATEGORIAS: Categoria[]`; `ubicarTratamiento(slug: string): { categoria: Categoria; contexto: string; vecinos: Enlace[] } | null` (`Enlace = { slug: string; nombre: string }`); en cada `contenido/<archivo>.ts` una constante exportada con el mismo nombre del archivo (`export const faciales: Tratamiento[]`, …); `CREDITOS: Record<string, Credito>`; en `index.ts`: `TRATAMIENTOS: Tratamiento[]`, `buscarTratamiento(slug: string): InfoTratamiento | null`; `Chevron({ abierto }: { abierto: boolean })` default export. `npm test` corre todos los `src/**/*.test.mjs`.

- [ ] **Step 1: Crear la rama**

```bash
cd D:/TODO/SISTEMAS/SIS-CLINICA-NOVAGED
git checkout -b feat/paginas-tratamientos
```

- [ ] **Step 2: Tipos** — `public-site/src/lib/tratamientos/tipos.ts`

```ts
export type Fuente = { sitio: string; titulo: string; url: string };
export type Pregunta = { pregunta: string; respuesta: string };

export type Tratamiento = {
  slug: string; // único, minúsculas, sin acentos: 'prp-facial'
  nombre: string; // igual al nombre del servicio en la base: 'PRP facial'
  resumen: string; // una frase, ≤ 160 caracteres (encabezado y meta description)
  queEs: string[]; // 1–3 párrafos
  beneficios: string[]; // 3–6
  antes: string[]; // cuidados previos, 2–6
  despues: string[]; // cuidados posteriores, 2–6
  contraindicaciones: string[]; // 2–8
  preguntas: Pregunta[]; // 3–5
  fuentes: Fuente[]; // 1–4
};

export type Credito = { autor: string; sitio: string; url: string; licencia: string };

export type Item = { nombre: string; slug?: string };
export type Columna = { titulo: string; items: Item[] };
export type Grupo = { titulo: string; descripcion: string; slug?: string; columnas?: Columna[] };
export type Icono = 'pulso' | 'onda' | 'movimiento' | 'cruz';
export type Categoria = {
  numero: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  grupos: Grupo[];
  icono?: Icono;
  respaldo?: string;
};
export type Enlace = { slug: string; nombre: string };
```

- [ ] **Step 3: Categorías** — `public-site/src/lib/tratamientos/categorias.ts`. Mismos textos que hoy en `Tratamientos.tsx`; los ítems que son servicios llevan `slug`; en las categorías 02–05 el `slug` va en el grupo.

```ts
import type { Categoria, Enlace } from './tipos';

const RESPALDO_MEDICO = 'Parte del enfoque integral de ClinicNovagED, con seguimiento médico especializado.';

export const CATEGORIAS: Categoria[] = [
  {
    numero: '01',
    titulo: 'Medicina Estética',
    descripcion:
      'Tratamientos médico-estéticos avanzados orientados a la mejora visible, el rejuvenecimiento y el bienestar integral de la piel y el cuerpo.',
    imagen: '/novaged-assets/medicinaEstetica-DQhnxto0.png',
    grupos: [
      {
        titulo: 'Tratamientos Faciales',
        descripcion:
          'Tratamientos orientados a mejorar la calidad, hidratación, luminosidad y regeneración de la piel mediante medicina estética avanzada.',
        columnas: [
          {
            titulo: 'Áreas de enfoque',
            items: [{ nombre: 'Calidad de piel' }, { nombre: 'Hidratación profunda' }, { nombre: 'Despigmentación' }, { nombre: 'Regeneración celular' }],
          },
          {
            titulo: 'Tratamientos',
            items: [
              { nombre: 'Microneedling', slug: 'microneedling' },
              { nombre: 'PRP facial', slug: 'prp-facial' },
              { nombre: 'PDRN / PN', slug: 'pdrn-pn' },
              { nombre: 'Exosomas', slug: 'exosomas' },
              { nombre: 'Peelings médicos', slug: 'peelings-medicos' },
              { nombre: 'Ácido hialurónico', slug: 'acido-hialuronico-hidratacion' },
              { nombre: 'Cóctel de vitaminas', slug: 'coctel-de-vitaminas' },
              { nombre: 'DMAE + silicio orgánico', slug: 'dmae-silicio-organico' },
              { nombre: 'Cóctel de aminoácidos', slug: 'coctel-de-aminoacidos' },
            ],
          },
        ],
      },
      {
        titulo: 'Armonización Facial',
        descripcion: 'Tratamientos diseñados para equilibrar y resaltar los rasgos faciales manteniendo resultados naturales y armónicos.',
        columnas: [
          {
            titulo: 'Procedimientos',
            items: [
              { nombre: 'Ácido hialurónico (Fillers)', slug: 'acido-hialuronico-fillers' },
              { nombre: 'Toxina botulínica (Botox)', slug: 'toxina-botulinica' },
              { nombre: 'Perfilado de nariz', slug: 'perfilado-de-nariz' },
              { nombre: 'Relleno / perfilado de labios', slug: 'relleno-de-labios' },
              { nombre: 'Mentoplastia', slug: 'mentoplastia' },
              { nombre: 'Marcación mandibular', slug: 'marcacion-mandibular' },
              { nombre: 'Levantamiento de pómulos', slug: 'levantamiento-de-pomulos' },
            ],
          },
        ],
      },
      {
        titulo: 'Rejuvenecimiento · Lifting',
        descripcion: 'Protocolos regenerativos orientados a combatir flacidez y signos de envejecimiento facial.',
        columnas: [
          { titulo: 'Indicados para', items: [{ nombre: 'Flacidez facial' }, { nombre: 'Envejecimiento' }, { nombre: 'Grasa localizada' }] },
          {
            titulo: 'Tratamiento con bioestimuladores de colágeno',
            items: [
              { nombre: 'Hidroxiapatita de calcio', slug: 'hidroxiapatita-de-calcio' },
              { nombre: 'Ácido poliláctico', slug: 'acido-polilactico' },
              { nombre: 'Hilos tensores', slug: 'hilos-tensores' },
              { nombre: 'Bioestimuladores de colágeno', slug: 'bioestimuladores-de-colageno' },
              { nombre: 'Adipoestructuración', slug: 'adipoestructuracion' },
            ],
          },
        ],
      },
      {
        titulo: 'Tratamientos Corporales',
        descripcion: 'Tratamientos orientados a mejorar contorno corporal, firmeza y reducción de grasa localizada.',
        columnas: [
          {
            titulo: 'Tratamientos disponibles',
            items: [
              { nombre: 'Lipólisis química', slug: 'lipolisis-quimica' },
              { nombre: 'Enzimas recombinantes', slug: 'enzimas-recombinantes' },
              { nombre: 'Enzimas lipolíticas', slug: 'enzimas-lipoliticas' },
              { nombre: 'Ondas rusas', slug: 'ondas-rusas' },
              { nombre: 'Radiofrecuencia', slug: 'radiofrecuencia' },
              { nombre: 'Drenaje linfático', slug: 'drenaje-linfatico' },
              { nombre: 'Masajes reductores', slug: 'masajes-reductores' },
            ],
          },
        ],
      },
      {
        titulo: 'Plasma Láser',
        descripcion: 'Tecnología orientada al rejuvenecimiento y corrección de imperfecciones cutáneas.',
        columnas: [
          {
            titulo: 'Indicados para',
            items: [
              { nombre: 'Blefaroplastia sin cirugía', slug: 'blefaroplastia-sin-cirugia' },
              { nombre: 'Lifting facial sin cirugía', slug: 'lifting-facial-sin-cirugia' },
              { nombre: 'Eliminación de lunares', slug: 'eliminacion-de-lunares' },
              { nombre: 'Eliminación de acrocordones', slug: 'eliminacion-de-acrocordones' },
              { nombre: 'Eliminación de verrugas', slug: 'eliminacion-de-verrugas' },
            ],
          },
        ],
      },
    ],
  },
  {
    numero: '02',
    titulo: 'Ginecología y Obstetricia',
    descripcion: 'Atención integral femenina con enfoque preventivo, diagnóstico y seguimiento especializado.',
    imagen: '/novaged-assets/ginecologia-BjPYN0D4.png',
    icono: 'pulso',
    respaldo: RESPALDO_MEDICO,
    grupos: [
      { titulo: 'Consulta ginecológica', slug: 'consulta-ginecologica', descripcion: 'Evaluación ginecológica completa con historial clínico y examen físico.' },
      { titulo: 'Obstetricia', slug: 'obstetricia', descripcion: 'Seguimiento especializado del embarazo, parto y puerperio.' },
      { titulo: 'Planificación familiar', slug: 'planificacion-familiar', descripcion: 'Orientación y prescripción de métodos anticonceptivos adecuados.' },
      { titulo: 'Control prenatal', slug: 'control-prenatal', descripcion: 'Monitoreo periódico del desarrollo del embarazo y bienestar materno-fetal.' },
      { titulo: 'Papanicolau', slug: 'papanicolau', descripcion: 'Citología cervical para detección temprana de alteraciones celulares.' },
      { titulo: 'Colposcopía', slug: 'colposcopia', descripcion: 'Examen visual del cuello uterino para evaluación y diagnóstico especializado.' },
    ],
  },
  {
    numero: '03',
    titulo: 'Ecografía',
    descripcion: 'Servicios de diagnóstico por imagen orientados a evaluación médica precisa y especializada.',
    imagen: '/novaged-assets/ecografia-De6bdoYN.png',
    icono: 'onda',
    respaldo: RESPALDO_MEDICO,
    grupos: [
      { titulo: 'Ecografía abdominal', slug: 'ecografia-abdominal', descripcion: 'Evaluación de órganos y estructuras abdominales mediante ultrasonido.' },
      { titulo: 'Ecografía ginecológica', slug: 'ecografia-ginecologica', descripcion: 'Diagnóstico de estructuras pélvicas y reproductivas femeninas.' },
      { titulo: 'Ecografía de partes blandas', slug: 'ecografia-partes-blandas', descripcion: 'Valoración de tejidos blandos superficiales y ganglios.' },
      { titulo: 'Ecografía musculoesquelética', slug: 'ecografia-musculoesqueletica', descripcion: 'Diagnóstico de tendones, músculos, ligamentos y articulaciones.' },
    ],
  },
  {
    numero: '04',
    titulo: 'Fisioterapia',
    descripcion: 'Tratamientos terapéuticos orientados a rehabilitación, bienestar físico y recuperación funcional.',
    imagen: '/novaged-assets/fisioterapia-Dya6snx4.png',
    icono: 'movimiento',
    respaldo: RESPALDO_MEDICO,
    grupos: [
      { titulo: 'Terapia manual', slug: 'terapia-manual', descripcion: 'Técnicas manuales especializadas para alivio del dolor y recuperación funcional.' },
      { titulo: 'Masajes relajantes', slug: 'masajes-relajantes', descripcion: 'Sesiones orientadas a reducir tensión muscular y promover bienestar general.' },
      { titulo: 'Masajes descontracturantes', slug: 'masajes-descontracturantes', descripcion: 'Trabajo profundo sobre contracturas y tensiones musculares acumuladas.' },
      { titulo: 'Rehabilitación', slug: 'rehabilitacion', descripcion: 'Protocolos personalizados para recuperación funcional post-lesión o cirugía.' },
      { titulo: 'Aparatología', slug: 'aparatologia', descripcion: 'Tratamientos con equipos especializados de fisioterapia según indicación médica.' },
    ],
  },
  {
    numero: '05',
    titulo: 'Enfermería',
    descripcion: 'Servicios básicos de apoyo clínico y control médico.',
    imagen: '/novaged-assets/enfermeria-BQQNcDdH.png',
    icono: 'cruz',
    respaldo: RESPALDO_MEDICO,
    grupos: [
      { titulo: 'Curaciones', slug: 'curaciones', descripcion: 'Tratamiento y seguimiento de heridas y lesiones cutáneas.' },
      { titulo: 'Control de presión arterial', slug: 'control-presion-arterial', descripcion: 'Medición y registro de valores de tensión arterial.' },
      { titulo: 'Control de peso y talla', slug: 'control-peso-talla', descripcion: 'Evaluación antropométrica básica.' },
      { titulo: 'Glicemia capilar', slug: 'glicemia-capilar', descripcion: 'Medición de glucosa en sangre capilar con glucómetro calibrado.' },
      { titulo: 'Sueros', slug: 'sueros', descripcion: 'Administración de soluciones intravenosas según prescripción médica.' },
      { titulo: 'Inyectables', slug: 'inyectables', descripcion: 'Aplicación de medicamentos por vía intramuscular o endovenosa.' },
    ],
  },
];

// Dónde vive un tratamiento: su categoría, el título que lo agrupa (el grupo en
// Medicina Estética, la categoría en las demás) y sus vecinos para "Otros tratamientos".
export function ubicarTratamiento(slug: string): { categoria: Categoria; contexto: string; vecinos: Enlace[] } | null {
  for (const categoria of CATEGORIAS) {
    for (const grupo of categoria.grupos) {
      if (grupo.slug === slug) {
        const vecinos = categoria.grupos.flatMap((g) => (g.slug ? [{ slug: g.slug, nombre: g.titulo }] : []));
        return { categoria, contexto: categoria.titulo, vecinos };
      }
      const items = (grupo.columnas ?? []).flatMap((c) => c.items);
      if (items.some((i) => i.slug === slug)) {
        const vecinos = items.flatMap((i) => (i.slug ? [{ slug: i.slug, nombre: i.nombre }] : []));
        return { categoria, contexto: grupo.titulo, vecinos };
      }
    }
  }
  return null;
}
```

- [ ] **Step 4: Archivos de contenido vacíos y créditos.** Crear los 9 archivos de `contenido/`, cada uno con esta forma (cambiando el nombre de la constante al del archivo: `faciales`, `armonizacion`, `rejuvenecimiento`, `corporales`, `plasma`, `ginecologia`, `ecografia`, `fisioterapia`, `enfermeria`). Las tareas 3 y 5–9 los llenan.

```ts
import type { Tratamiento } from '../tipos';

export const faciales: Tratamiento[] = [];
```

`public-site/src/lib/tratamientos/creditos.ts` (lo llena la Task 10):

```ts
import type { Credito } from './tipos';

// Foto de cada página, por slug. El archivo es public/tratamientos/<slug>.jpg.
// Solo Unsplash License, Pexels License o Wikimedia Commons (CC0 / CC BY / CC BY-SA).
export const CREDITOS: Record<string, Credito> = {};
```

- [ ] **Step 5: Índice** — `public-site/src/lib/tratamientos/index.ts` (lo usa Next; aquí sí van imports de valores sin extensión)

```ts
import type { Categoria, Credito, Enlace, Tratamiento } from './tipos';
import { ubicarTratamiento } from './categorias';
import { CREDITOS } from './creditos';
import { faciales } from './contenido/faciales';
import { armonizacion } from './contenido/armonizacion';
import { rejuvenecimiento } from './contenido/rejuvenecimiento';
import { corporales } from './contenido/corporales';
import { plasma } from './contenido/plasma';
import { ginecologia } from './contenido/ginecologia';
import { ecografia } from './contenido/ecografia';
import { fisioterapia } from './contenido/fisioterapia';
import { enfermeria } from './contenido/enfermeria';

export { CATEGORIAS } from './categorias';

export const TRATAMIENTOS: Tratamiento[] = [
  ...faciales,
  ...armonizacion,
  ...rejuvenecimiento,
  ...corporales,
  ...plasma,
  ...ginecologia,
  ...ecografia,
  ...fisioterapia,
  ...enfermeria,
];

const POR_SLUG = new Map(TRATAMIENTOS.map((t) => [t.slug, t]));

export type InfoTratamiento = {
  tratamiento: Tratamiento;
  categoria: Categoria;
  contexto: string;
  hermanos: Enlace[];
  imagen: string;
  credito?: Credito;
};

export function buscarTratamiento(slug: string): InfoTratamiento | null {
  const tratamiento = POR_SLUG.get(slug);
  const lugar = ubicarTratamiento(slug);
  if (!tratamiento || !lugar) return null;
  const credito = CREDITOS[slug];
  return {
    tratamiento,
    categoria: lugar.categoria,
    contexto: lugar.contexto,
    hermanos: lugar.vecinos.filter((v) => v.slug !== slug && POR_SLUG.has(v.slug)),
    imagen: credito ? `/tratamientos/${slug}.jpg` : lugar.categoria.imagen,
    credito,
  };
}
```

- [ ] **Step 6: Escribir el test** — `public-site/src/lib/tratamientos/tratamientos.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { CATEGORIAS, ubicarTratamiento } from './categorias.ts';
import { CREDITOS } from './creditos.ts';
import { faciales } from './contenido/faciales.ts';
import { armonizacion } from './contenido/armonizacion.ts';
import { rejuvenecimiento } from './contenido/rejuvenecimiento.ts';
import { corporales } from './contenido/corporales.ts';
import { plasma } from './contenido/plasma.ts';
import { ginecologia } from './contenido/ginecologia.ts';
import { ecografia } from './contenido/ecografia.ts';
import { fisioterapia } from './contenido/fisioterapia.ts';
import { enfermeria } from './contenido/enfermeria.ts';

const TODOS = [...faciales, ...armonizacion, ...rejuvenecimiento, ...corporales, ...plasma, ...ginecologia, ...ecografia, ...fisioterapia, ...enfermeria];

// Nombres exactos de la tabla `servicios`: el botón de reservar busca por nombre.
const NOMBRES_SERVICIOS = [
  'Microneedling', 'PRP facial', 'PDRN / PN', 'Exosomas', 'Peelings médicos', 'Ácido hialurónico (hidratación facial)',
  'Cóctel de vitaminas', 'DMAE + silicio orgánico', 'Cóctel de aminoácidos', 'Ácido hialurónico (Fillers)',
  'Toxina botulínica (Botox)', 'Perfilado de nariz', 'Relleno / perfilado de labios', 'Mentoplastia', 'Marcación mandibular',
  'Levantamiento de pómulos', 'Hidroxiapatita de calcio', 'Ácido poliláctico', 'Hilos tensores', 'Bioestimuladores de colágeno',
  'Adipoestructuración', 'Lipólisis química', 'Enzimas recombinantes', 'Enzimas lipolíticas', 'Ondas rusas', 'Radiofrecuencia',
  'Drenaje linfático', 'Masajes reductores', 'Blefaroplastia sin cirugía', 'Lifting facial sin cirugía', 'Eliminación de lunares',
  'Eliminación de acrocordones', 'Eliminación de verrugas', 'Consulta ginecológica', 'Obstetricia', 'Planificación familiar',
  'Control prenatal', 'Papanicolau', 'Colposcopía', 'Ecografía abdominal', 'Ecografía ginecológica', 'Ecografía de partes blandas',
  'Ecografía musculoesquelética', 'Terapia manual', 'Masajes relajantes', 'Masajes descontracturantes', 'Rehabilitación',
  'Aparatología', 'Curaciones', 'Control de presión arterial', 'Control de peso y talla', 'Glicemia capilar', 'Sueros', 'Inyectables',
];

// Fuentes médicas permitidas (spec, "Fuentes y reglas de redacción"). Se acepta el dominio y sus subdominios.
export const DOMINIOS_FUENTES = [
  'medlineplus.gov', 'nih.gov', 'cancer.gov', 'cdc.gov', 'fda.gov', 'mayoclinic.org', 'clevelandclinic.org', 'nhs.uk',
  'aad.org', 'asds.net', 'plasticsurgery.org', 'acog.org', 'who.int', 'paho.org', 'cochranelibrary.com', 'choosept.com',
];
const DOMINIOS_FOTOS = ['unsplash.com', 'pexels.com', 'commons.wikimedia.org'];
const LICENCIAS = /^(Unsplash License|Pexels License|CC0 1\.0|CC BY [234]\.0|CC BY-SA [234]\.0)$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CARPETA_FOTOS = new URL('../../../public/tratamientos/', import.meta.url);

const dominioPermitido = (url, dominios) => {
  const { protocol, hostname } = new URL(url);
  return protocol === 'https:' && dominios.some((d) => hostname === d || hostname.endsWith(`.${d}`));
};
const textoLleno = (s) => typeof s === 'string' && s.trim().length > 0 && s === s.trim();

function slugsDeCategorias() {
  return CATEGORIAS.flatMap((c) =>
    c.grupos.flatMap((g) => [...(g.slug ? [g.slug] : []), ...(g.columnas ?? []).flatMap((col) => col.items.flatMap((i) => (i.slug ? [i.slug] : [])))])
  );
}

test('las categorías tienen 54 slugs únicos y válidos', () => {
  const slugs = slugsDeCategorias();
  assert.equal(slugs.length, 54);
  assert.equal(new Set(slugs).size, 54);
  for (const s of slugs) assert.match(s, SLUG);
});

test('ubicarTratamiento da contexto y vecinos', () => {
  const prp = ubicarTratamiento('prp-facial');
  assert.equal(prp.categoria.numero, '01');
  assert.equal(prp.contexto, 'Tratamientos Faciales');
  assert.equal(prp.vecinos.length, 9);
  const papa = ubicarTratamiento('papanicolau');
  assert.equal(papa.contexto, 'Ginecología y Obstetricia');
  assert.equal(papa.vecinos.length, 6);
  assert.equal(ubicarTratamiento('no-existe'), null);
});

test('cada tratamiento escrito está en las categorías, una sola vez, con el nombre del servicio', () => {
  const enCategorias = new Set(slugsDeCategorias());
  const vistos = new Set();
  for (const t of TODOS) {
    assert.ok(enCategorias.has(t.slug), `${t.slug} no está en categorias.ts`);
    assert.ok(!vistos.has(t.slug), `${t.slug} repetido`);
    vistos.add(t.slug);
    assert.ok(NOMBRES_SERVICIOS.includes(t.nombre), `${t.slug}: "${t.nombre}" no coincide con ningún servicio`);
  }
});

test('cada tratamiento tiene todas sus secciones dentro de los límites', () => {
  const rango = (t, campo, min, max) => {
    const lista = t[campo];
    assert.ok(Array.isArray(lista) && lista.length >= min && lista.length <= max, `${t.slug}.${campo}: ${lista?.length} (debe ser ${min}–${max})`);
  };
  for (const t of TODOS) {
    assert.ok(textoLleno(t.resumen) && t.resumen.length <= 160, `${t.slug}.resumen vacío o > 160`);
    rango(t, 'queEs', 1, 3);
    rango(t, 'beneficios', 3, 6);
    rango(t, 'antes', 2, 6);
    rango(t, 'despues', 2, 6);
    rango(t, 'contraindicaciones', 2, 8);
    rango(t, 'preguntas', 3, 5);
    rango(t, 'fuentes', 1, 4);
    for (const campo of ['queEs', 'beneficios', 'antes', 'despues', 'contraindicaciones']) {
      for (const s of t[campo]) assert.ok(textoLleno(s), `${t.slug}.${campo} tiene un texto vacío o con espacios`);
    }
    for (const p of t.preguntas) assert.ok(textoLleno(p.pregunta) && textoLleno(p.respuesta), `${t.slug}: pregunta incompleta`);
  }
});

test('las fuentes son https y de dominios médicos permitidos', () => {
  for (const t of TODOS) {
    for (const f of t.fuentes) {
      assert.ok(textoLleno(f.sitio) && textoLleno(f.titulo), `${t.slug}: fuente sin sitio o título`);
      assert.ok(dominioPermitido(f.url, DOMINIOS_FUENTES), `${t.slug}: fuente no permitida ${f.url}`);
    }
  }
});

test('cada foto registrada existe, pesa ≤ 350 KB y tiene licencia válida', () => {
  const enCategorias = new Set(slugsDeCategorias());
  for (const [slug, c] of Object.entries(CREDITOS)) {
    assert.ok(enCategorias.has(slug), `crédito de un slug inexistente: ${slug}`);
    assert.ok(textoLleno(c.autor) && textoLleno(c.sitio), `${slug}: crédito sin autor o sitio`);
    assert.match(c.licencia, LICENCIAS, `${slug}: licencia no permitida`);
    assert.ok(dominioPermitido(c.url, DOMINIOS_FOTOS), `${slug}: foto de un sitio no permitido ${c.url}`);
    const archivo = new URL(`${slug}.jpg`, CARPETA_FOTOS);
    assert.ok(existsSync(archivo), `falta public/tratamientos/${slug}.jpg`);
    assert.ok(statSync(archivo).size <= 350 * 1024, `${slug}.jpg pesa más de 350 KB`);
  }
});
```

- [ ] **Step 7: Script de test** — en `public-site/package.json`, dentro de `"scripts"`, agregar después de `"lint": "eslint"`:

```json
    "lint": "eslint",
    "test": "node --test \"src/**/*.test.mjs\""
```

- [ ] **Step 8: Correr el test** — `cd public-site && npm test`. Esperado: 6 pass (con contenido vacío las validaciones por tratamiento no tienen nada que revisar). Si Node avisa de "module type" con un warning, no es un fallo.

- [ ] **Step 9: Chevron compartido** — `public-site/src/components/Chevron.tsx` (el mismo SVG que hoy está dentro de `Tratamientos.tsx`):

```tsx
export default function Chevron({ abierto }: { abierto: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 text-tan transition-transform duration-300 ${abierto ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
```

- [ ] **Step 10: Portada leyendo `CATEGORIAS`.** En `public-site/src/components/Tratamientos.tsx`:
  - borrar los `type` locales (`Columna`, `Grupo`, `Icono`, `Categoria`), `RESPALDO_MEDICO`, el arreglo `categorias` y la función `Chevron`;
  - agregar imports:

```tsx
import Chevron from './Chevron';
import { CATEGORIAS } from '@/lib/tratamientos/categorias';
import type { Icono } from '@/lib/tratamientos/tipos';
```

  - cambiar `categorias.map(` por `CATEGORIAS.map(`;
  - los ítems ahora son objetos: cambiar

```tsx
                                      {col.items.map((it) => (
                                        <li key={it}>✦ {it}</li>
                                      ))}
```

  por

```tsx
                                      {col.items.map((it) => (
                                        <li key={it.nombre}>✦ {it.nombre}</li>
                                      ))}
```

  (Se importa `categorias.ts` directo y no el índice, para no meter los 54 textos en el JavaScript de la portada.)

- [ ] **Step 11: Verificar** — `cd public-site && npx tsc --noEmit && npx eslint src && npm test`. Esperado: sin errores. Abrir http://localhost:3001 (el dev server ya corre en 3001): la sección Tratamientos se ve igual que antes, con sus acordeones.

- [ ] **Step 12: Commit**

```bash
git add public-site/package.json public-site/src/lib/tratamientos public-site/src/components/Chevron.tsx public-site/src/components/Tratamientos.tsx docs/superpowers/plans/2026-10-13-paginas-tratamientos.md docs/superpowers/specs/2026-10-13-paginas-tratamientos-design.md
git commit -m "feat(web): catálogo de tratamientos como datos, con tests"
```

---

### Task 2: Reserva con el servicio ya elegido

**Files:**
- Create: `public-site/src/lib/servicios.ts`
- Create: `public-site/src/lib/servicios.test.mjs`
- Modify: `public-site/src/lib/bookingContext.tsx`

**Interfaces:**
- Consumes: `Servicio` de `public-site/src/lib/types.ts` (`{ id: number; nombre: string; precio: number | string }`), `api.getServicios()` de `src/lib/api.js` (devuelve solo servicios activos).
- Produces: `normalizarNombre(texto: string): string`; `buscarServicioPorNombre<T extends { nombre: string }>(servicios: T[], nombre: string): T | null`; en el contexto, `open: (nombreServicio?: string) => void`.

- [ ] **Step 1: Test que falla** — `public-site/src/lib/servicios.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizarNombre, buscarServicioPorNombre } from './servicios.ts';

const servicios = [
  { id: 6, nombre: 'Ácido hialurónico (hidratación facial)' },
  { id: 10, nombre: 'Ácido hialurónico (Fillers)' },
  { id: 2, nombre: 'PRP facial' },
];

test('normalizarNombre quita acentos, mayúsculas y espacios de más', () => {
  assert.equal(normalizarNombre('  Ácido   HIALURÓNICO (Fillers) '), 'acido hialuronico (fillers)');
});

test('encuentra el servicio aunque cambien acentos, mayúsculas o espacios', () => {
  assert.equal(buscarServicioPorNombre(servicios, 'PRP facial').id, 2);
  assert.equal(buscarServicioPorNombre(servicios, ' acido hialuronico  (HIDRATACION facial)').id, 6);
});

test('no confunde servicios con nombres parecidos', () => {
  assert.equal(buscarServicioPorNombre(servicios, 'Ácido hialurónico'), null);
});

test('sin coincidencia o con nombre vacío devuelve null', () => {
  assert.equal(buscarServicioPorNombre(servicios, 'Exosomas'), null);
  assert.equal(buscarServicioPorNombre(servicios, '   '), null);
  assert.equal(buscarServicioPorNombre([], 'PRP facial'), null);
});
```

- [ ] **Step 2: Correr** — `cd public-site && npm test`. Esperado: FAIL (no existe `servicios.ts`).

- [ ] **Step 3: Implementar** — `public-site/src/lib/servicios.ts`

```ts
// Las páginas de tratamiento buscan su servicio por nombre y no por id, porque los
// ids cambian entre la base local y la de producción.
export function normalizarNombre(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function buscarServicioPorNombre<T extends { nombre: string }>(servicios: T[], nombre: string): T | null {
  const buscado = normalizarNombre(nombre);
  if (!buscado) return null;
  return servicios.find((s) => normalizarNombre(s.nombre) === buscado) ?? null;
}
```

- [ ] **Step 4: Correr** — `npm test`. Esperado: PASS.

- [ ] **Step 5: `open(nombreServicio?)` en el contexto.** En `public-site/src/lib/bookingContext.tsx`:
  - imports: `import { createContext, useContext, useRef, useState, ReactNode } from 'react';`, `import { api } from './api';`, `import { buscarServicioPorNombre } from './servicios';`
  - en `interface BookingState`: `open: (nombreServicio?: string) => void;`
  - dentro de `BookingProvider`, antes de `function open()`: `const aperturaRef = useRef(0);`
  - reemplazar `function open() { … }` y `function close() { … }` por:

```tsx
  // `nombreServicio` llega como texto desde las páginas de tratamiento. El Nav y el
  // botón flotante pasan `open` directo a onClick, así que ahí llega un evento: se ignora.
  function open(nombreServicio?: unknown) {
    setStep('servicio');
    setServicioId(null);
    setServicio(null);
    setProfesionalId(null);
    setProfesional(null);
    setFecha('');
    setHoraInicio(null);
    setCitaId(null);
    setPago(null);
    setPorcentaje(100);
    setAceptaPolitica(false);
    setIsOpen(true);
    const apertura = ++aperturaRef.current;
    if (typeof nombreServicio !== 'string') return;
    api
      .getServicios()
      .then((servicios: Servicio[]) => {
        if (apertura !== aperturaRef.current) return; // se cerró o se volvió a abrir
        const encontrado = buscarServicioPorNombre(servicios, nombreServicio);
        if (!encontrado) return; // renombrado o inactivo: queda en "Elige un servicio"
        setServicioId(encontrado.id);
        setServicio(encontrado);
        setStep('profesional');
      })
      .catch(() => {}); // StepServicio ya muestra su propio error de carga
  }
  function close() {
    aperturaRef.current++;
    setIsOpen(false);
  }
```

- [ ] **Step 6: Verificar** — `npx tsc --noEmit && npx eslint src && npm test`. Esperado: limpio. En http://localhost:3001, "Reservar consulta" del Nav sigue abriendo en "Elige un servicio".

- [ ] **Step 7: Commit**

```bash
git add public-site/src/lib/servicios.ts public-site/src/lib/servicios.test.mjs public-site/src/lib/bookingContext.tsx
git commit -m "feat(web): abrir la reserva con un servicio ya elegido por nombre"
```

---

### Task 3: Contenido — Tratamientos Faciales (9)

Tarea de investigación y redacción. Las Tasks 5–9 siguen exactamente este mismo procedimiento con otros tratamientos.

**Files:**
- Modify: `public-site/src/lib/tratamientos/contenido/faciales.ts`

**Interfaces:**
- Consumes: tipo `Tratamiento` (Task 1); `slug` y `nombre` exactos de la tabla de abajo.
- Produces: `export const faciales: Tratamiento[]` con 9 entradas.

| slug | nombre (exacto) |
|---|---|
| microneedling | Microneedling |
| prp-facial | PRP facial |
| pdrn-pn | PDRN / PN |
| exosomas | Exosomas |
| peelings-medicos | Peelings médicos |
| acido-hialuronico-hidratacion | Ácido hialurónico (hidratación facial) |
| coctel-de-vitaminas | Cóctel de vitaminas |
| dmae-silicio-organico | DMAE + silicio orgánico |
| coctel-de-aminoacidos | Cóctel de aminoácidos |

**Procedimiento por tratamiento (igual en Tasks 5–9):**

1. Buscar con WebSearch en las fuentes permitidas (`DOMINIOS_FUENTES` del test): primero MedlinePlus en español, Mayo Clinic, Cleveland Clinic, NHS, AAD/ASDS/ASPS, ACOG (gineco-obstetricia), OMS/OPS; si no hay ficha (PDRN, exosomas, DMAE, cócteles de mesoterapia, enzimas, plasma, ondas rusas…), un artículo de revisión en PubMed/PMC (`pubmed.ncbi.nlm.nih.gov` o `pmc.ncbi.nlm.nih.gov`).
2. Leer la página con WebFetch y anotar: qué es, para qué sirve, preparación, cuidados posteriores, contraindicaciones, preguntas típicas.
3. Comprobar cada URL: `curl -sIL -o /dev/null -w "%{http_code}" -A "Mozilla/5.0" <url>` → 200. Si el sitio bloquea curl (403 en Mayo Clinic, por ejemplo), basta con que WebFetch haya leído la página.
4. Redactar en español neutro con palabras propias (nunca copiar frases enteras de la fuente), tono cálido y sobrio de la web, segunda persona de "tú" como en el resto del sitio. Prohibido prometer ("elimina", "garantiza", "para siempre"), dar cifras que no estén en la fuente, o dar dosis. Si la evidencia es limitada o el tratamiento es reciente, decirlo en `queEs` ("es un tratamiento reciente; la evidencia científica todavía está en desarrollo"). Recomendar valoración médica donde corresponda.
5. Respetar los límites del tipo: `resumen` ≤ 160 caracteres; `queEs` 1–3 párrafos; `beneficios` 3–6; `antes` 2–6; `despues` 2–6; `contraindicaciones` 2–8; `preguntas` 3–5; `fuentes` 1–4 (idealmente 2).
6. `fuentes[].sitio` = nombre del sitio ("MedlinePlus", "Mayo Clinic", "PubMed"…), `titulo` = título de la página o artículo tal como aparece.

**Ejemplo de forma** (los textos reales salen de la investigación, no de este ejemplo):

```ts
import type { Tratamiento } from '../tipos';

export const faciales: Tratamiento[] = [
  {
    slug: 'microneedling',
    nombre: 'Microneedling',
    resumen: 'Microperforaciones controladas que estimulan la producción natural de colágeno para mejorar textura, poros y cicatrices.',
    queEs: ['…', '…'],
    beneficios: ['…', '…', '…'],
    antes: ['…', '…'],
    despues: ['…', '…'],
    contraindicaciones: ['…', '…'],
    preguntas: [
      { pregunta: '¿Duele?', respuesta: '…' },
      { pregunta: '…', respuesta: '…' },
      { pregunta: '…', respuesta: '…' },
    ],
    fuentes: [
      { sitio: 'American Academy of Dermatology', titulo: 'Microneedling: …', url: 'https://www.aad.org/…' },
      { sitio: 'PubMed', titulo: '…', url: 'https://pubmed.ncbi.nlm.nih.gov/…/' },
    ],
  },
  // … los 8 restantes, en el orden de la tabla
];
```

- [ ] **Step 1:** Investigar y escribir los 9 tratamientos en `contenido/faciales.ts`, en el orden de la tabla.
- [ ] **Step 2:** `cd public-site && npm test` → PASS (las validaciones ahora revisan los 9). Corregir lo que falle.
- [ ] **Step 3:** `npx tsc --noEmit && npx eslint src` → limpio.
- [ ] **Step 4:** En el informe, listar por tratamiento las URL usadas y su código HTTP (o "verificada con WebFetch").
- [ ] **Step 5: Commit**

```bash
git add public-site/src/lib/tratamientos/contenido/faciales.ts
git commit -m "content(web): tratamientos faciales con fuentes verificadas"
```

---

### Task 4: Página de detalle, Nav y Footer

**Files:**
- Create: `public-site/src/app/tratamientos/[slug]/page.tsx`
- Create: `public-site/src/components/tratamiento/MarcoTratamiento.tsx`
- Create: `public-site/src/components/tratamiento/BotonReservar.tsx`
- Create: `public-site/src/components/tratamiento/PreguntasFrecuentes.tsx`
- Modify: `public-site/src/components/Nav.tsx`
- Modify: `public-site/src/components/Footer.tsx`

**Interfaces:**
- Consumes: `TRATAMIENTOS`, `buscarTratamiento`, `InfoTratamiento` (Task 1, `@/lib/tratamientos`); `open(nombreServicio?)` (Task 2); `Chevron` (Task 1); `Pregunta` (Task 1).
- Produces: ruta `/tratamientos/[slug]`; `Nav` acepta `solido?: boolean`; `BotonReservar({ nombreServicio, className })`.

- [ ] **Step 1: Leer la documentación de Next 16** indicada en Global Constraints (generateStaticParams, generateMetadata, dynamic-routes, dynamicParams).

- [ ] **Step 2: Nav con enlaces absolutos y `solido`.** En `public-site/src/components/Nav.tsx`:
  - firma: `export default function Nav({ onReservar, solido = false }: { onReservar: () => void; solido?: boolean }) {`
  - `const solid = solido || scrolled || menuOpen;`
  - `href="#top"` → `href="/#top"`; `href="#tratamientos"` → `href="/#tratamientos"`; `href="#nosotros"` → `href="/#nosotros"`; `href="#ubicacion"` → `href="/#ubicacion"` (en el menú de escritorio y en el móvil).

- [ ] **Step 3: Footer.** En `public-site/src/components/Footer.tsx`, los tres enlaces de "Navegación": `#tratamientos` → `/#tratamientos`, `#nosotros` → `/#nosotros`, `#ubicacion` → `/#ubicacion`. (Los `href="#"` de Instagram/TikTok no se tocan.)

- [ ] **Step 4: Marco cliente** — `public-site/src/components/tratamiento/MarcoTratamiento.tsx`

```tsx
'use client';
import type { ReactNode } from 'react';
import { BookingProvider, useBooking } from '@/lib/bookingContext';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import FloatingCta from '@/components/FloatingCta';
import BookingModal from '@/components/booking/BookingModal';

function Contenido({ children }: { children: ReactNode }) {
  const { open } = useBooking();
  return (
    <main>
      <Nav onReservar={open} solido />
      {children}
      <Footer />
      <FloatingCta onClick={open} />
      <BookingModal />
    </main>
  );
}

export default function MarcoTratamiento({ children }: { children: ReactNode }) {
  return (
    <BookingProvider>
      <Contenido>{children}</Contenido>
    </BookingProvider>
  );
}
```

- [ ] **Step 5: Botón reservar** — `public-site/src/components/tratamiento/BotonReservar.tsx`

```tsx
'use client';
import { useBooking } from '@/lib/bookingContext';

export default function BotonReservar({ nombreServicio, className = '' }: { nombreServicio: string; className?: string }) {
  const { open } = useBooking();
  return (
    <button
      type="button"
      onClick={() => open(nombreServicio)}
      className={`rounded-full bg-espresso px-7 py-3 text-xs uppercase tracking-[0.2em] text-cream transition-colors hover:bg-tan ${className}`}
    >
      Reservar este tratamiento
    </button>
  );
}
```

- [ ] **Step 6: Preguntas frecuentes** — `public-site/src/components/tratamiento/PreguntasFrecuentes.tsx`

```tsx
'use client';
import { useState } from 'react';
import Chevron from '@/components/Chevron';
import type { Pregunta } from '@/lib/tratamientos/tipos';

export default function PreguntasFrecuentes({ preguntas }: { preguntas: Pregunta[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  return (
    <div className="mt-6 divide-y divide-manhattan/40 border-y border-manhattan/40">
      {preguntas.map((p, i) => {
        const estaAbierta = abierta === i;
        return (
          <div key={p.pregunta}>
            <button
              type="button"
              onClick={() => setAbierta(estaAbierta ? null : i)}
              aria-expanded={estaAbierta}
              className="flex w-full items-center justify-between gap-4 py-5 text-left font-serif text-lg text-espresso"
            >
              {p.pregunta}
              <Chevron abierto={estaAbierta} />
            </button>
            {estaAbierta && <p className="pb-6 leading-relaxed text-ink">{p.respuesta}</p>}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 7: Página** — `public-site/src/app/tratamientos/[slug]/page.tsx`

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TRATAMIENTOS, buscarTratamiento } from '@/lib/tratamientos';
import MarcoTratamiento from '@/components/tratamiento/MarcoTratamiento';
import BotonReservar from '@/components/tratamiento/BotonReservar';
import PreguntasFrecuentes from '@/components/tratamiento/PreguntasFrecuentes';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return TRATAMIENTOS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const info = buscarTratamiento(slug);
  if (!info) return {};
  return { title: `${info.tratamiento.nombre} — Clinic NovagED`, description: info.tratamiento.resumen };
}

function Titulo({ children }: { children: ReactNode }) {
  return <h2 className="font-serif text-2xl text-espresso md:text-3xl">{children}</h2>;
}

function Lista({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <section>
      <Titulo>{titulo}</Titulo>
      <ul className="mt-5 space-y-3 text-ink">
        {items.map((item) => (
          <li key={item} className="flex gap-3 leading-relaxed">
            <span aria-hidden="true" className="text-tan">✦</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function PaginaTratamiento({ params }: Props) {
  const { slug } = await params;
  const info = buscarTratamiento(slug);
  if (!info) notFound();
  const { tratamiento: t, categoria, contexto, hermanos, imagen, credito } = info;

  return (
    <MarcoTratamiento>
      <article className="pt-[88px] md:pt-24">
        <header className="md:flex md:min-h-[70vh]">
          <div className="relative h-[45vh] md:h-auto md:w-1/2">
            <Image src={imagen} alt={t.nombre} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="flex items-center px-6 py-12 md:w-1/2 md:px-16">
            <div className="max-w-md">
              <nav aria-label="Ubicación en el sitio" className="text-xs uppercase tracking-widest text-muted">
                <Link href="/#tratamientos" className="hover:opacity-70">Tratamientos</Link>
                <span className="mx-2" aria-hidden="true">/</span>
                <span>{categoria.titulo}</span>
              </nav>
              <h1 className="mt-4 break-words font-serif text-4xl leading-[1.05] text-espresso md:text-[52px]">{t.nombre}</h1>
              <p className="mt-6 text-muted">{t.resumen}</p>
              <BotonReservar nombreServicio={t.nombre} className="mt-10" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl space-y-16 px-6 py-16 md:py-24">
          <section>
            <Titulo>Qué es</Titulo>
            {t.queEs.map((parrafo) => (
              <p key={parrafo} className="mt-5 leading-relaxed text-ink">{parrafo}</p>
            ))}
          </section>

          <Lista titulo="Beneficios" items={t.beneficios} />

          <div className="grid gap-16 md:grid-cols-2 md:gap-12">
            <Lista titulo="Antes del tratamiento" items={t.antes} />
            <Lista titulo="Después del tratamiento" items={t.despues} />
          </div>

          <Lista titulo="Contraindicaciones" items={t.contraindicaciones} />

          <section>
            <Titulo>Preguntas frecuentes</Titulo>
            <PreguntasFrecuentes preguntas={t.preguntas} />
          </section>

          <section className="rounded-2xl bg-neutral-cream px-6 py-10 text-center">
            <p className="font-serif text-2xl text-espresso">¿Te interesa este tratamiento?</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              En la consulta evaluamos tu caso y te recomendamos el protocolo adecuado para ti.
            </p>
            <BotonReservar nombreServicio={t.nombre} className="mt-8" />
          </section>

          {hermanos.length > 0 && (
            <section>
              <Titulo>Otros tratamientos de {contexto}</Titulo>
              <ul className="mt-6 flex flex-wrap gap-3">
                {hermanos.map((h) => (
                  <li key={h.slug} className="max-w-full">
                    <Link
                      href={`/tratamientos/${h.slug}`}
                      className="inline-block max-w-full rounded-full border border-tan/30 px-4 py-2 text-sm text-ink transition-colors hover:border-tan"
                    >
                      {h.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="border-t border-manhattan/40 pt-8 text-xs text-muted">
            <p>Información orientativa. No reemplaza la valoración médica personalizada.</p>
            <p className="mt-6 uppercase tracking-widest">Fuentes</p>
            <ul className="mt-3 space-y-2">
              {t.fuentes.map((f) => (
                <li key={f.url} className="break-words">
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="underline decoration-manhattan underline-offset-2 hover:text-espresso">
                    {f.sitio} — {f.titulo}
                  </a>
                </li>
              ))}
            </ul>
            {credito && (
              <p className="mt-6 break-words">
                Foto:{' '}
                <a href={credito.url} target="_blank" rel="noopener noreferrer" className="underline decoration-manhattan underline-offset-2 hover:text-espresso">
                  {credito.autor} · {credito.sitio}
                </a>{' '}
                ({credito.licencia})
              </p>
            )}
          </footer>
        </div>
      </article>
    </MarcoTratamiento>
  );
}
```

- [ ] **Step 8: Verificar tipos y lint** — `cd public-site && npx tsc --noEmit && npx eslint src` → limpio.

- [ ] **Step 9: Verificar en el navegador** (dev server en 3001; con Playwright MCP, archivos en `D:/TODO/SISTEMAS/SIS-CLINICA-NOVAGED/.playwright-mcp`):
  - `http://localhost:3001/tratamientos/microneedling`: se ven encabezado con foto de la categoría, todas las secciones, fuentes; las preguntas abren y cierran.
  - "Reservar este tratamiento" abre el modal en el paso de profesional (título del paso de profesional, no "Elige un servicio") para Microneedling.
  - "Reservar consulta" del Nav y "Agenda tu cita" abren en "Elige un servicio".
  - "Tratamientos" del Nav vuelve a `/#tratamientos` de la portada.
  - `http://localhost:3001/tratamientos/acido-hialuronico-hidratacion` a 390 px de ancho: `document.documentElement.scrollWidth <= 390`.
  - `http://localhost:3001/tratamientos/no-existe` → 404.
  - Portada: el Nav sigue transparente arriba y sólido al bajar (no cambió).

- [ ] **Step 10: Commit**

```bash
git add public-site/src/app/tratamientos public-site/src/components/tratamiento public-site/src/components/Nav.tsx public-site/src/components/Footer.tsx
git commit -m "feat(web): página de detalle de cada tratamiento"
```

---

### Task 5: Contenido — Armonización Facial (7)

Mismo procedimiento, reglas y verificación que la Task 3.

**Files:** Modify `public-site/src/lib/tratamientos/contenido/armonizacion.ts` (`export const armonizacion: Tratamiento[]`).

| slug | nombre (exacto) |
|---|---|
| acido-hialuronico-fillers | Ácido hialurónico (Fillers) |
| toxina-botulinica | Toxina botulínica (Botox) |
| perfilado-de-nariz | Perfilado de nariz |
| relleno-de-labios | Relleno / perfilado de labios |
| mentoplastia | Mentoplastia |
| marcacion-mandibular | Marcación mandibular |
| levantamiento-de-pomulos | Levantamiento de pómulos |

Nota: en esta clínica "perfilado de nariz", "mentoplastia", "marcación mandibular" y "levantamiento de pómulos" son procedimientos **no quirúrgicos con rellenos** (rinomodelación, mentón y mandíbula con ácido hialurónico o hidroxiapatita). Redactarlos así y dejarlo claro en `queEs`; las fuentes de rellenos dérmicos (FDA, ASPS, AAD, revisiones en PubMed) aplican.

- [ ] **Step 1:** Investigar y escribir los 7. **Step 2:** `npm test` → PASS. **Step 3:** `npx tsc --noEmit && npx eslint src`. **Step 4:** URLs y códigos HTTP en el informe.
- [ ] **Step 5:** `git add public-site/src/lib/tratamientos/contenido/armonizacion.ts && git commit -m "content(web): armonización facial con fuentes verificadas"`

---

### Task 6: Contenido — Rejuvenecimiento (5) y Plasma Láser (5)

Mismo procedimiento que la Task 3. Dos archivos.

**Files:** Modify `contenido/rejuvenecimiento.ts` (`export const rejuvenecimiento`) y `contenido/plasma.ts` (`export const plasma`).

| archivo | slug | nombre (exacto) |
|---|---|---|
| rejuvenecimiento | hidroxiapatita-de-calcio | Hidroxiapatita de calcio |
| rejuvenecimiento | acido-polilactico | Ácido poliláctico |
| rejuvenecimiento | hilos-tensores | Hilos tensores |
| rejuvenecimiento | bioestimuladores-de-colageno | Bioestimuladores de colágeno |
| rejuvenecimiento | adipoestructuracion | Adipoestructuración |
| plasma | blefaroplastia-sin-cirugia | Blefaroplastia sin cirugía |
| plasma | lifting-facial-sin-cirugia | Lifting facial sin cirugía |
| plasma | eliminacion-de-lunares | Eliminación de lunares |
| plasma | eliminacion-de-acrocordones | Eliminación de acrocordones |
| plasma | eliminacion-de-verrugas | Eliminación de verrugas |

Notas: "Adipoestructuración" = injerto/transferencia de grasa autóloga facial (lipotransferencia). Los cinco de plasma se hacen con **plasma (fibroblast / plasma pen)**; para lunares, acrocordones y verrugas incluir en `antes` o `contraindicaciones` que un lunar con cambios debe ser evaluado por un médico antes de retirarlo (AAD "ABCDEs of melanoma" es fuente válida).

- [ ] **Step 1:** Investigar y escribir los 10. **Step 2:** `npm test` → PASS. **Step 3:** tsc + eslint. **Step 4:** URLs en el informe.
- [ ] **Step 5:** `git add public-site/src/lib/tratamientos/contenido/rejuvenecimiento.ts public-site/src/lib/tratamientos/contenido/plasma.ts && git commit -m "content(web): rejuvenecimiento y plasma con fuentes verificadas"`

---

### Task 7: Contenido — Tratamientos Corporales (7)

Mismo procedimiento que la Task 3.

**Files:** Modify `contenido/corporales.ts` (`export const corporales`).

| slug | nombre (exacto) |
|---|---|
| lipolisis-quimica | Lipólisis química |
| enzimas-recombinantes | Enzimas recombinantes |
| enzimas-lipoliticas | Enzimas lipolíticas |
| ondas-rusas | Ondas rusas |
| radiofrecuencia | Radiofrecuencia |
| drenaje-linfatico | Drenaje linfático |
| masajes-reductores | Masajes reductores |

Notas: lipólisis química = inyección de desoxicolato/fosfatidilcolina (FDA/ASDS para desoxicolato submentoniano). "Ondas rusas" = electroestimulación muscular (corriente rusa / NMES). Si la evidencia para reducción de medidas es limitada (enzimas, masajes reductores), decirlo con claridad.

- [ ] **Step 1–4** como en la Task 3. **Step 5:** `git add public-site/src/lib/tratamientos/contenido/corporales.ts && git commit -m "content(web): tratamientos corporales con fuentes verificadas"`

---

### Task 8: Contenido — Ginecología y Obstetricia (6) y Ecografía (4)

Mismo procedimiento que la Task 3. Fuentes preferidas: ACOG, MedlinePlus, OMS/OPS, NHS, Mayo Clinic, cancer.gov (Papanicolau, colposcopía).

**Files:** Modify `contenido/ginecologia.ts` (`export const ginecologia`) y `contenido/ecografia.ts` (`export const ecografia`).

| archivo | slug | nombre (exacto) |
|---|---|---|
| ginecologia | consulta-ginecologica | Consulta ginecológica |
| ginecologia | obstetricia | Obstetricia |
| ginecologia | planificacion-familiar | Planificación familiar |
| ginecologia | control-prenatal | Control prenatal |
| ginecologia | papanicolau | Papanicolau |
| ginecologia | colposcopia | Colposcopía |
| ecografia | ecografia-abdominal | Ecografía abdominal |
| ecografia | ecografia-ginecologica | Ecografía ginecológica |
| ecografia | ecografia-partes-blandas | Ecografía de partes blandas |
| ecografia | ecografia-musculoesqueletica | Ecografía musculoesquelética |

Nota: en servicios de consulta o diagnóstico, `beneficios` es "para qué sirve", `antes` es la preparación (ayuno, vejiga llena, días del ciclo…), `despues` qué esperar tras el estudio y `contraindicaciones` "cuándo no se hace o conviene reprogramar". Si de verdad no hay contraindicaciones, poner las situaciones en que se pospone o se adapta (mínimo 2 ítems, todos ciertos según la fuente).

- [ ] **Step 1–4** como en la Task 3. **Step 5:** `git add public-site/src/lib/tratamientos/contenido/ginecologia.ts public-site/src/lib/tratamientos/contenido/ecografia.ts && git commit -m "content(web): ginecología y ecografía con fuentes verificadas"`

---

### Task 9: Contenido — Fisioterapia (5) y Enfermería (6)

Mismo procedimiento que la Task 3 y la misma nota de la Task 8 para servicios que no son procedimientos estéticos. Fuentes preferidas: MedlinePlus, NHS, Mayo Clinic, Cleveland Clinic, `choosept.com` (APTA), CDC, OMS.

**Files:** Modify `contenido/fisioterapia.ts` (`export const fisioterapia`) y `contenido/enfermeria.ts` (`export const enfermeria`).

| archivo | slug | nombre (exacto) |
|---|---|---|
| fisioterapia | terapia-manual | Terapia manual |
| fisioterapia | masajes-relajantes | Masajes relajantes |
| fisioterapia | masajes-descontracturantes | Masajes descontracturantes |
| fisioterapia | rehabilitacion | Rehabilitación |
| fisioterapia | aparatologia | Aparatología |
| enfermeria | curaciones | Curaciones |
| enfermeria | control-presion-arterial | Control de presión arterial |
| enfermeria | control-peso-talla | Control de peso y talla |
| enfermeria | glicemia-capilar | Glicemia capilar |
| enfermeria | sueros | Sueros |
| enfermeria | inyectables | Inyectables |

Nota: "Sueros" e "Inyectables" siempre **con prescripción médica**; decirlo en `queEs` y en `antes` (traer la receta). No promover sueros "vitamínicos" sin indicación.

- [ ] **Step 1–4** como en la Task 3. **Step 5:** `git add public-site/src/lib/tratamientos/contenido/fisioterapia.ts public-site/src/lib/tratamientos/contenido/enfermeria.ts && git commit -m "content(web): fisioterapia y enfermería con fuentes verificadas"`

---

### Task 10: Fotos con licencia libre

**Files:**
- Create: `public-site/scripts/optimizar-imagen.mjs`
- Create: `public-site/public/tratamientos/<slug>.jpg` (hasta 54)
- Modify: `public-site/src/lib/tratamientos/creditos.ts`

**Interfaces:**
- Consumes: slugs de `categorias.ts`; tipo `Credito`.
- Produces: `CREDITOS` llenos; `buscarTratamiento` ya devuelve `/tratamientos/<slug>.jpg` cuando hay crédito.

- [ ] **Step 1: Script de optimización** — `public-site/scripts/optimizar-imagen.mjs`

```js
// Uso: node scripts/optimizar-imagen.mjs <foto-descargada> <slug>
// Deja public/tratamientos/<slug>.jpg en 1600×1067 (3:2), JPEG, ≤ 350 KB.
import sharp from 'sharp';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [entrada, slug] = process.argv.slice(2);
if (!entrada || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug ?? '')) {
  console.error('Uso: node scripts/optimizar-imagen.mjs <foto-descargada> <slug>');
  process.exit(1);
}

const carpeta = fileURLToPath(new URL('../public/tratamientos/', import.meta.url));
mkdirSync(carpeta, { recursive: true });
const destino = `${carpeta}${slug}.jpg`;
const LIMITE = 350 * 1024;

for (const calidad of [80, 72, 64, 56, 48]) {
  await sharp(entrada)
    .rotate()
    .resize({ width: 1600, height: 1067, fit: 'cover', position: 'attention' })
    .jpeg({ quality: calidad, mozjpeg: true })
    .toFile(destino);
  const peso = statSync(destino).size;
  if (peso <= LIMITE) {
    console.log(`${slug}.jpg: ${Math.round(peso / 1024)} KB (calidad ${calidad})`);
    process.exit(0);
  }
}
console.error(`${slug}.jpg sigue pesando más de 350 KB`);
process.exit(1);
```

- [ ] **Step 2: Buscar y descargar.** Para cada uno de los 54 slugs:
  - buscar en Unsplash (`https://unsplash.com/s/photos/<términos>`; o el JSON de `https://unsplash.com/napi/search/photos?query=<términos>&per_page=20`), Pexels (`https://www.pexels.com/search/<términos>/`) o Wikimedia Commons (API: `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=<términos>&prop=imageinfo&iiprop=url|extmetadata&format=json`, leer `LicenseShortName` y `Artist`). Términos en inglés funcionan mejor ("microneedling facial treatment", "gynecologist consultation", "ultrasound scan", "physiotherapy massage", "blood pressure measurement"…).
  - elegir según el criterio de Global Constraints (cálida, clara, adultos, nada gráfico, sin marcas).
  - descargar el original a la carpeta del scratchpad de la sesión (nunca dentro de `public-site/` ni `backend/`), en una subcarpeta vacía propia: `curl -sL -o <scratch>/fotos/<slug>.src "<url de descarga>"`.
  - `cd public-site && node scripts/optimizar-imagen.mjs <scratch>/fotos/<slug>.src <slug>`.
  - mirar el resultado con Read (la herramienta muestra imágenes) para confirmar que se ve bien recortado.
  - registrar en `CREDITOS`: `'<slug>': { autor: '<nombre del autor>', sitio: 'Unsplash' | 'Pexels' | 'Wikimedia Commons', url: '<página de la foto, no la del archivo>', licencia: 'Unsplash License' | 'Pexels License' | 'CC0 1.0' | 'CC BY 4.0' | 'CC BY-SA 4.0' }`.
  - se prefiere una foto distinta por slug; si para alguno no hay una adecuada, no registrarlo (usa la de su categoría) y anotarlo en el informe.

- [ ] **Step 3:** `cd public-site && npm test` → PASS (valida archivo, peso, licencia y dominio de cada crédito).
- [ ] **Step 4:** `du -sh public-site/public/tratamientos` en el informe (esperado < 15 MB).
- [ ] **Step 5:** Ver en el navegador `/tratamientos/microneedling` y `/tratamientos/papanicolau`: aparece la foto nueva y el crédito al pie.
- [ ] **Step 6: Commit**

```bash
git add public-site/scripts/optimizar-imagen.mjs public-site/public/tratamientos public-site/src/lib/tratamientos/creditos.ts
git commit -m "feat(web): fotos con licencia libre para cada tratamiento"
```

---

### Task 11: Enlaces en la portada, test de completitud y verificación final

**Files:**
- Modify: `public-site/src/components/Tratamientos.tsx`
- Modify: `public-site/src/lib/tratamientos/tratamientos.test.mjs`

**Interfaces:**
- Consumes: `CATEGORIAS` con `slug` (Task 1), las 54 páginas (Tasks 3–9).

- [ ] **Step 1: Test de completitud que falla si falta algo** — agregar al final de `tratamientos.test.mjs`:

```js
test('están los 54 tratamientos', () => {
  const escritos = new Set(TODOS.map((t) => t.slug));
  const faltan = slugsDeCategorias().filter((s) => !escritos.has(s));
  assert.deepEqual(faltan, [], `sin contenido: ${faltan.join(', ')}`);
  assert.equal(TODOS.length, 54);
});
```

- [ ] **Step 2:** `cd public-site && npm test` → PASS (si falla, alguna Task de contenido quedó incompleta: completarla antes de seguir).

- [ ] **Step 3: Enlaces en la portada.** En `public-site/src/components/Tratamientos.tsx`:
  - import: `import Link from 'next/link';`
  - ítems de columnas: reemplazar `<li key={it.nombre}>✦ {it.nombre}</li>` por

```tsx
                                        <li key={it.nombre}>
                                          {it.slug ? (
                                            <Link href={`/tratamientos/${it.slug}`} className="group inline-flex items-baseline gap-1 hover:text-tan">
                                              ✦ {it.nombre}
                                              <span aria-hidden="true" className="opacity-0 transition-opacity group-hover:opacity-100">→</span>
                                            </Link>
                                          ) : (
                                            <>✦ {it.nombre}</>
                                          )}
                                        </li>
```

  - grupos con `slug` (categorías 02–05): justo después de `<p className="text-sm text-muted">{g.descripcion}</p>` agregar

```tsx
                            {g.slug && (
                              <Link
                                href={`/tratamientos/${g.slug}`}
                                className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-tan hover:opacity-70"
                              >
                                Ver tratamiento <span aria-hidden="true">→</span>
                              </Link>
                            )}
```

- [ ] **Step 4:** `npx tsc --noEmit && npx eslint src && npm test` → limpio.

- [ ] **Step 5: Build de producción** — `cd public-site && npx next build`. Esperado: termina sin errores y la lista de rutas muestra `/tratamientos/[slug]` como SSG con 54 rutas. (El build usa `.next/`; el dev server en 3001 puede seguir corriendo, pero si el build choca con él, detener el dev server, construir y volver a levantarlo con `npx next dev -p 3001`.)

- [ ] **Step 6: Verificación en el navegador** (Playwright MCP, en computadora y a 390 px):
  - portada → abrir "Medicina Estética" → "Tratamientos Faciales" → clic en "PRP facial" → llega a `/tratamientos/prp-facial`.
  - portada → "Ginecología y Obstetricia" → "Papanicolau" → "Ver tratamiento" → `/tratamientos/papanicolau`.
  - en la página: preguntas abren/cierran; "Reservar este tratamiento" abre el modal en el paso de profesional con PRP facial; "Reservar consulta" (Nav) y "Agenda tu cita" abren en "Elige un servicio".
  - caso "servicio no encontrado": en la base local (`bd_novaged`, nunca otra) poner `activo = 0` al servicio "Mentoplastia" → en `/tratamientos/mentoplastia` el botón abre en "Elige un servicio" → volver a `activo = 1` y confirmar que quedó en 1.
  - "Otros tratamientos de Tratamientos Faciales" lleva a otra página del grupo.
  - `/tratamientos/no-existe` y `/tratamientos/Microneedling` → 404.
  - 390 px en `/tratamientos/acido-hialuronico-hidratacion` y `/tratamientos/relleno-de-labios`: `document.documentElement.scrollWidth <= 390`.
  - consola del navegador sin errores.
  - borrar capturas y archivos temporales de `.playwright-mcp` al terminar.

- [ ] **Step 7: Muestreo de fuentes** — abrir (curl o WebFetch) las URL de 10 tratamientos de categorías distintas y confirmar que responden y tratan del tema. Anotar en el informe.

- [ ] **Step 8: Commit**

```bash
git add public-site/src/components/Tratamientos.tsx public-site/src/lib/tratamientos/tratamientos.test.mjs
git commit -m "feat(web): la portada enlaza a la página de cada tratamiento"
```
