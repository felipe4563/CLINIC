# Páginas de detalle por tratamiento (web pública) — Diseño

Fecha: 2026-10-13 · Estado: aprobado en conversación, pendiente de revisión escrita

## Objetivo

La sección "Tratamientos" de la web pública (public-site, puerto 3001) hoy solo lista
nombres. Cada uno de los 54 tratamientos tendrá su propia página con información
completa, para que la paciente entienda el tratamiento y pueda reservarlo desde ahí.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Quién mantiene el contenido | Fijo en el código (cambiar un texto = commit + deploy). Sin backend ni panel. |
| Alcance | Los 54 tratamientos de las 5 categorías (Medicina Estética, Ginecología y Obstetricia, Ecografía, Fisioterapia, Enfermería). |
| Secciones de cada página | Qué es y beneficios · Antes / después del tratamiento y contraindicaciones · Preguntas frecuentes + botón reservar. |
| No incluido | Ficha rápida (duración, nº de sesiones, precio). Fotos nuevas. |
| Origen de la información | Investigada en internet en fuentes médicas verificadas; cada página muestra sus fuentes. |
| Fotos | Una foto por tratamiento, descargada de internet con licencia libre (ver "Imágenes"). Si para alguno no hay una adecuada, usa la foto de su categoría. |

## Fuentes y reglas de redacción

- **Fuentes permitidas** (orden de preferencia): MedlinePlus en español (NIH), Mayo Clinic
  (es/en), Cleveland Clinic, NHS (Reino Unido), sociedades médicas — American Academy of
  Dermatology (AAD), American Society for Dermatologic Surgery (ASDS), American Society of
  Plastic Surgeons (ASPS), ACOG (ginecología/obstetricia), OMS/OPS — y artículos revisados
  por pares en PubMed/PMC para los procedimientos que no tengan ficha en las anteriores
  (PDRN, exosomas, plasma láser, enzimas recombinantes, etc.). No se usan blogs de clínicas,
  vendedores de productos ni foros.
- **Mínimo 1 fuente por tratamiento, idealmente 2.** Cada fuente: nombre del sitio,
  título de la página y URL. Las URL se comprueban (que abran y hablen del tratamiento).
- **Redacción propia** en español neutro, parafraseada (no se copian párrafos), con el tono
  de la web: cálido, sobrio, sin promesas ("puede ayudar a…", nunca "elimina para siempre").
  Sin cifras de eficacia que no estén en la fuente.
- Si para un tratamiento la evidencia es limitada o experimental (p. ej. exosomas), el texto
  lo dice con naturalidad ("es un tratamiento reciente; la evidencia aún está en desarrollo").
- Cada página lleva al pie: "Información orientativa. No reemplaza la valoración médica
  personalizada." y la lista de fuentes con enlace (abren en pestaña nueva, `rel="noopener"`).
- **La doctora revisa los textos antes de publicarlos en producción.** El código queda listo;
  el deploy espera esa revisión.

## Imágenes

- **Solo bancos con licencia de uso comercial**: Unsplash (Unsplash License) y Pexels
  (Pexels License) — sin atribución obligatoria — y, si hace falta, Wikimedia Commons con
  licencia CC0, CC BY o CC BY-SA (con atribución). Nunca imágenes de Google sin licencia,
  de otras clínicas o con marcas/logos visibles.
- **Criterio visual**: tono cálido y claro acorde a la web (beige, crema, blanco); que
  represente el tratamiento o la zona (rostro, piel, manos, consultorio, equipo) sin ser
  gráfica (sin sangre, agujas clavadas en primer plano ni heridas abiertas). Personas
  adultas.
- **Archivos**: `public-site/public/tratamientos/<slug>.jpg`, horizontales, 1600 px de ancho,
  JPEG calidad ~80, ≤ 350 KB cada una (redimensionadas con `sharp`, que ya trae Next).
- **Créditos**: `public-site/src/lib/tratamientos/creditos.ts` con, por slug: autor, sitio,
  URL de la foto original y licencia. Los de Wikimedia (atribución obligatoria) se muestran
  al pie de la página junto a las fuentes; Unsplash/Pexels se registran igual aunque no se
  muestren.
- Una misma foto puede repetirse entre tratamientos parecidos si no hay otra buena, pero se
  prefiere una distinta por página. Si no hay ninguna adecuada, `imagen` queda vacía y la
  página usa la foto de la categoría.

## Arquitectura

### Datos: `public-site/src/lib/tratamientos.ts`

Fuente única del catálogo de la web. Reemplaza el arreglo `categorias` escrito dentro de
`Tratamientos.tsx`; la sección de la portada y las páginas de detalle leen de aquí.

```ts
type Fuente = { sitio: string; titulo: string; url: string };
type Pregunta = { pregunta: string; respuesta: string };
type Tratamiento = {
  slug: string;            // 'prp-facial' — único, minúsculas, sin acentos
  nombre: string;          // igual al nombre del servicio en la base ('PRP facial')
  resumen: string;         // 1 frase para el encabezado y la meta description (≤ 160 caracteres)
  queEs: string[];         // 1–3 párrafos
  beneficios: string[];    // 3–6 viñetas
  antes: string[];         // cuidados previos, 2–6 viñetas
  despues: string[];       // cuidados posteriores, 2–6 viñetas
  contraindicaciones: string[]; // 2–8 viñetas
  preguntas: Pregunta[];   // 3–5
  fuentes: Fuente[];       // ≥ 1
  imagen?: string;         // '/tratamientos/prp-facial.jpg'; si falta, la de la categoría
};
```

Las categorías y grupos conservan su estructura actual (número, título, descripción, imagen,
icono, respaldo, grupos con columnas). Las columnas de "Áreas de enfoque" / "Indicados para"
siguen siendo texto simple; solo los ítems que son tratamientos (los 54) referencian un
`Tratamiento` por slug. Los textos son largos, así que el contenido puede repartirse en un
archivo por categoría (`src/lib/tratamientos/medicina-estetica.ts`, etc.) y un índice que
los une; el resto del código solo importa el índice.

### Rutas

- `src/app/tratamientos/[slug]/page.tsx`: página de servidor con `generateStaticParams`
  (los 54 slugs) y `dynamicParams = false` → un slug inexistente da 404. `generateMetadata`
  pone título "<Nombre> — Clinic NovagED" y la `resumen` como descripción.
  Next 16: `params` es una Promise; seguir `node_modules/next/dist/docs/` antes de escribir.
- La parte interactiva (acordeón de preguntas, botón reservar, modal de reserva) va en
  componentes cliente; el texto se renderiza en servidor para que quede en el HTML estático.

### Página de detalle (de arriba abajo)

1. Nav (el mismo); sus enlaces de sección pasan a `/#tratamientos`, `/#nosotros`,
   `/#ubicacion` y el logo a `/`, para que funcionen desde cualquier página.
2. Encabezado: foto del tratamiento (o de la categoría), migas "Tratamientos / <Categoría>", nombre en serif,
   `resumen`, botón "Reservar este tratamiento".
3. "Qué es" (párrafos) y "Beneficios" (viñetas ✦).
4. "Antes del tratamiento", "Después del tratamiento", "Contraindicaciones".
5. "Preguntas frecuentes" en acordeón (mismo chevron de la portada).
6. Llamado final con el botón de reservar.
7. "Otros tratamientos de <Categoría>": enlaces a los demás de la misma categoría.
8. Aviso orientativo + fuentes. Footer (el mismo, con los enlaces corregidos).
9. Botón flotante "Agenda tu cita" y el modal de reserva, igual que en la portada.

Mismo sistema visual que la portada (colores `cream`, `pearl`, `espresso`, `tan`,
`manhattan`, `muted`; Bodoni en títulos). Responsive: a 390 px sin scroll horizontal.

### Portada

En `Tratamientos.tsx`, cada ítem que sea un tratamiento pasa a ser un enlace a
`/tratamientos/<slug>` (con "→" sutil al pasar el cursor). El resto del diseño, el acordeón
y los textos de categoría quedan iguales.

### Reserva con el servicio elegido

- `bookingContext` gana `open(nombreServicio?: string)`. Sin argumento se comporta como hoy.
- Con nombre: se busca en el catálogo público de servicios (el mismo que usa
  `StepServicio`) uno **activo** cuyo nombre coincida (comparación sin mayúsculas ni
  acentos ni espacios sobrantes). Si existe, se fija el servicio y se abre en el paso
  "profesional". Si no existe o falla la carga, se abre en el paso "servicio" como siempre.
- Se busca por nombre y no por id porque los ids difieren entre la base local y la de
  producción; los nombres de la base son los mismos de la web.

## Errores y casos borde

- Slug desconocido → 404 de Next.
- Servicio renombrado o desactivado en el panel → la reserva abre en "elegir servicio"; la
  página sigue visible.
- Catálogo inaccesible (backend caído) → la página se ve igual (es estática); el modal
  muestra el error que ya muestra hoy.
- Fuente que deja de existir en el futuro → no rompe nada; se corrige en el código.

## Pruebas

- Script de verificación del contenido (sin dependencias nuevas, con `node --test`):
  54 tratamientos; slugs únicos y con formato válido; cada sección dentro de sus mínimos
  y máximos; `resumen` ≤ 160 caracteres; ≥ 1 fuente con URL `https://`; cada ítem-
  tratamiento de la portada apunta a un slug existente; si hay `imagen`, el archivo existe
  en `public/`, pesa ≤ 350 KB y tiene su crédito registrado.
- `npm run build` del public-site genera las 54 páginas sin errores; `tsc` y lint limpios.
- Navegador (Playwright): portada → clic en un tratamiento → página correcta; acordeón de
  preguntas; "Reservar este tratamiento" abre el modal en el paso profesional con el servicio
  correcto; con un nombre inexistente abre en "elegir servicio"; enlaces del nav vuelven a la
  portada; 390 px sin desborde; slug falso da 404.
- Muestreo manual de fuentes: abrir las URL de al menos 10 tratamientos de distintas
  categorías.

## Fuera de alcance

Backend, panel, precios/duración en la página, sesiones de fotos propias, traducciones,
edición del contenido desde el panel (se podrá migrar más adelante: el formato de datos es
el mismo que tendría una tabla).
