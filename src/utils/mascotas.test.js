import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatSex, formatValue, getAge, normalizeSpecies } from './mascotas.js';

const today = new Date(2026, 9, 12);

test('calcula la edad actual desde el nacimiento, no desde la edad de ingreso', () => {
  assert.deepEqual(getAge({ fecha_nacimiento_estimada: '2022-08-15', edad_al_ingreso: '1 año' }, today), { label: 'Edad estimada', value: '4 años, 1 mes' });
  assert.equal(getAge({ fecha_nacimiento_estimada: '2025-10-13' }, today).value, '11 meses');
  assert.equal(getAge({ fecha_nacimiento_estimada: '2025-10-12' }, today).value, '1 año');
  assert.equal(getAge({ fecha_nacimiento_estimada: '2026-10-12' }, today).value, 'Menos de 1 mes');
});

test('usa edad al ingresar y tiempo transcurrido si falta el nacimiento', () => {
  assert.equal(getAge({ fecha_ingreso: '2025-10-12', edad_al_ingreso: '2 meses' }, today).value, '1 año, 2 meses');
  assert.equal(getAge({ fecha_ingreso: '2025-10-12', edad_al_ingreso: '1 año y 6 meses' }, today).value, '2 años, 6 meses');
  assert.equal(getAge({ fecha_ingreso: '2025-10-12', edad_al_ingreso: '0.5 años' }, today).value, '1 año, 6 meses');
});

test('conserva texto ambiguo y distingue edad al ingresar de edad actual', () => {
  assert.deepEqual(getAge({ edad_al_ingreso: '2 meses' }, today), { label: 'Edad al ingresar', value: '2 meses' });
  assert.deepEqual(getAge({ fecha_ingreso: '2025-01-01', edad_al_ingreso: '1 a 2 años' }, today), { label: 'Edad al ingresar', value: '1 a 2 años' });
  assert.deepEqual(getAge({ fecha_ingreso: '2025-01-01', edad_al_ingreso: '2' }, today), { label: 'Edad al ingresar', value: '2' });
});

test('tolera nulos, fechas inválidas, fechas futuras y valores cero', () => {
  assert.equal(getAge({}, today).value, 'Por conocer');
  assert.equal(getAge({ fecha_nacimiento_estimada: '2030-01-01' }, today).value, 'Por conocer');
  assert.equal(getAge({ fecha_nacimiento_estimada: '2025-02-31' }, today).value, 'Por conocer');
  assert.equal(formatDate('incorrecta'), 'Por conocer');
  assert.equal(formatValue(0), '0');
});

test('conserva el día de una fecha sin hora y normaliza los datos de catálogo', () => {
  assert.equal(formatDate('2023-08-15'), '15 de agosto de 2023');
  assert.equal(normalizeSpecies(' PERRO '), 'perro');
  assert.equal(normalizeSpecies('Felino'), 'gato');
  assert.equal(normalizeSpecies(null), '');
  assert.equal(formatSex('Hembra'), 'Hembra');
  assert.equal(formatValue(['Perros', 'Gatos']), 'Perros, Gatos');
  assert.equal(formatValue(null), 'Por conocer');
});
