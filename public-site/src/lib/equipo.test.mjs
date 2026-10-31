import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nombreCorto, parrafos, separarNombre } from './equipo.ts';

test('parrafos separa por línea en blanco y limpia espacios', () => {
  assert.deepEqual(parrafos('Primero\ncontinúa.\n\n  \n Segundo.  \n'), ['Primero continúa.', 'Segundo.']);
  assert.deepEqual(parrafos(''), []);
  assert.deepEqual(parrafos(null), []);
});

test('separarNombre deja los dos últimos apellidos aparte', () => {
  assert.deepEqual(separarNombre('Dra. Maria Noemi Ponce Caisiri'), ['Dra. Maria Noemi', 'Ponce Caisiri']);
  assert.deepEqual(separarNombre('Ana Rojas'), ['Ana Rojas', '']);
});

test('nombreCorto conserva el título', () => {
  assert.equal(nombreCorto('Dra. Maria Noemi Ponce'), 'Dra. Maria');
  assert.equal(nombreCorto('Lic Ana Rojas'), 'Lic Ana');
  assert.equal(nombreCorto('Ana Rojas'), 'Ana');
});
