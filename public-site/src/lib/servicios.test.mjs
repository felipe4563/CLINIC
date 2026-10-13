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
