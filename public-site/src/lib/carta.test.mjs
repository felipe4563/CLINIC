import { test } from 'node:test';
import assert from 'node:assert/strict';
import { armarCarta } from './carta.ts';
import { CATEGORIAS } from './tratamientos/categorias.ts';
import { faciales } from './tratamientos/contenido/faciales.ts';
import { armonizacion } from './tratamientos/contenido/armonizacion.ts';
import { rejuvenecimiento } from './tratamientos/contenido/rejuvenecimiento.ts';
import { corporales } from './tratamientos/contenido/corporales.ts';
import { plasma } from './tratamientos/contenido/plasma.ts';
import { ginecologia } from './tratamientos/contenido/ginecologia.ts';
import { ecografia } from './tratamientos/contenido/ecografia.ts';
import { fisioterapia } from './tratamientos/contenido/fisioterapia.ts';
import { enfermeria } from './tratamientos/contenido/enfermeria.ts';

const TODOS = [...faciales, ...armonizacion, ...rejuvenecimiento, ...corporales, ...plasma, ...ginecologia, ...ecografia, ...fisioterapia, ...enfermeria];

test('la carta tiene las cinco especialidades con los 48 tratamientos, sin repetir', () => {
  const carta = armarCarta(CATEGORIAS, TODOS);
  assert.deepEqual(carta.map((e) => e.total), [30, 6, 3, 4, 5]);
  const slugs = carta.flatMap((e) => e.secciones.flatMap((s) => s.items.map((i) => i.slug)));
  assert.equal(slugs.length, 48);
  assert.equal(new Set(slugs).size, 48);
});

test('cada tratamiento de la carta reserva con el nombre exacto del servicio', () => {
  const carta = armarCarta(CATEGORIAS, TODOS);
  const items = carta.flatMap((e) => e.secciones.flatMap((s) => s.items));
  const botox = items.find((i) => i.slug === 'toxina-botulinica');
  assert.equal(botox.nombreServicio, 'Toxina botulínica (Botox)');
  const hidratacion = items.find((i) => i.slug === 'acido-hialuronico-hidratacion');
  assert.equal(hidratacion.nombreServicio, 'Ácido hialurónico (hidratación facial)');
});

test('Medicina Estética queda agrupada por tipo; las demás, en una sola lista con descripción', () => {
  const [estetica, gine] = armarCarta(CATEGORIAS, TODOS);
  assert.deepEqual(estetica.secciones.map((s) => s.titulo), ['Tratamientos Faciales', 'Armonización Facial', 'Rejuvenecimiento · Lifting', 'Tratamientos Corporales', 'Plasma Láser']);
  assert.equal(gine.secciones.length, 1);
  assert.equal(gine.secciones[0].titulo, null);
  assert.ok(gine.secciones[0].items.every((i) => i.descripcion));
});

test('un tratamiento sin página no aparece en la carta', () => {
  const carta = armarCarta(CATEGORIAS, TODOS.filter((t) => t.slug !== 'sueros'));
  assert.equal(carta[4].total, 4);
});
