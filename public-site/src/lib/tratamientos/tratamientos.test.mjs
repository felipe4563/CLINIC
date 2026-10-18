import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
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

// Nombres exactos de la tabla `servicios` en producción, después de la migración
// 20261018000000-servicios-ortografia (pedido de la doctora): el botón de reservar busca por nombre.
const NOMBRES_SERVICIOS = [
  'Microneedling', 'PRP facial', 'PDRN / PN', 'Exosomas', 'Peelings médicos', 'Ácido hialurónico (hidratación facial)',
  'Cóctel de vitaminas', 'DMAE + silicio orgánico con microneedling', 'Cóctel de aminoácidos',
  'Ácido hialurónico (Fillers)', 'Toxina botulínica (Botox)', 'Perfilado de nariz', 'Relleno / perfilado de labios',
  'Mentoplastia', 'Marcación mandibular', 'Levantamiento de pómulos', 'Hidroxiapatita de calcio', 'Hilos tensores',
  'Bioestimuladores de colágeno', 'Adipoestructuración', 'Lipólisis química', 'Enzimas recombinantes',
  'Enzimas lipolíticas', 'Ondas rusas', 'Radiofrecuencia', 'Drenaje linfático manual', 'Masajes reductores',
  'Blefaroplastia sin cirugía', 'Eliminación de acrocordones', 'Eliminación de verrugas', 'Consulta ginecológica',
  'Obstetricia', 'Planificación familiar', 'Control prenatal', 'Papanicolau', 'Colposcopía', 'Ecografía abdominal',
  'Ecografía ginecológica', 'Ecografía musculoesquelética', 'Masajes relajantes', 'Masajes descontracturantes',
  'Rehabilitación', 'Aparatología', 'Curaciones', 'Control de signos vitales', 'Glicemia capilar', 'Sueros',
  'Inyectables',
];

// Fuentes médicas permitidas (spec, "Fuentes y reglas de redacción"). Se acepta el dominio y sus subdominios.
export const DOMINIOS_FUENTES = [
  'medlineplus.gov', 'nih.gov', 'cancer.gov', 'cdc.gov', 'fda.gov', 'mayoclinic.org', 'clevelandclinic.org', 'nhs.uk',
  'aad.org', 'asds.net', 'plasticsurgery.org', 'acog.org', 'who.int', 'paho.org', 'cochranelibrary.com', 'choosept.com',
];
const DOMINIOS_FOTOS = ['unsplash.com', 'pexels.com', 'commons.wikimedia.org', 'flickr.com'];
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

test('las categorías tienen 48 slugs únicos y válidos', () => {
  const slugs = slugsDeCategorias();
  assert.equal(slugs.length, 48);
  assert.equal(new Set(slugs).size, 48);
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
    if (c.licencia.startsWith('CC')) {
      assert.match(c.licenciaUrl ?? '', /^https:\/\/creativecommons\.org\//, `${slug}: falta el enlace a la licencia`);
    }
    assert.ok(dominioPermitido(c.url, DOMINIOS_FOTOS), `${slug}: foto de un sitio no permitido ${c.url}`);
    const archivo = new URL(`${slug}.jpg`, CARPETA_FOTOS);
    assert.ok(existsSync(archivo), `falta public/tratamientos/${slug}.jpg`);
    assert.ok(statSync(archivo).size <= 350 * 1024, `${slug}.jpg pesa más de 350 KB`);
  }
});

test('cada tratamiento tiene su propia foto, sin repetir', () => {
  const sinFoto = slugsDeCategorias().filter((s) => !CREDITOS[s]);
  assert.deepEqual(sinFoto, [], `sin foto propia: ${sinFoto.join(', ')}`);
  const vistos = new Map();
  for (const [slug, c] of Object.entries(CREDITOS)) {
    const huella = createHash('sha256').update(readFileSync(new URL(`${slug}.jpg`, CARPETA_FOTOS))).digest('hex');
    for (const clave of [c.url, huella]) {
      assert.ok(!vistos.has(clave), `${slug} repite la foto de ${vistos.get(clave)}`);
      vistos.set(clave, slug);
    }
  }
});

test('están los 48 tratamientos', () => {
  const escritos = new Set(TODOS.map((t) => t.slug));
  const faltan = slugsDeCategorias().filter((s) => !escritos.has(s));
  assert.deepEqual(faltan, [], `sin contenido: ${faltan.join(', ')}`);
  assert.equal(TODOS.length, 48);
});

const textosDe = (t) => [
  t.resumen, ...t.queEs, ...t.beneficios, ...t.antes, ...t.despues, ...t.contraindicaciones,
  ...t.preguntas.flatMap((p) => [p.pregunta, p.respuesta]),
];

test('sin primera persona sobre la investigación', () => {
  const PRIMERA = /\b(encontramos|podemos|nuestr[oa]s?|hemos)\b/i;
  for (const t of TODOS) {
    for (const x of textosDe(t)) assert.doesNotMatch(x, PRIMERA, `${t.slug}: primera persona en "${x.slice(0, 60)}"`);
  }
});

test('no hay viñetas repetidas dentro de una misma lista', () => {
  for (const t of TODOS) {
    for (const campo of ['queEs', 'beneficios', 'antes', 'despues', 'contraindicaciones']) {
      const norm = t[campo].map((x) => x.trim().toLowerCase());
      assert.equal(new Set(norm).size, norm.length, `${t.slug}.${campo}: viñetas repetidas`);
    }
  }
});
