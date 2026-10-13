import test from 'node:test';
import assert from 'node:assert/strict';
import { AGE_FILTERS, formatDate, formatSex, formatValue, getAge, getAgeInMonths, getEnergyOptions, matchesPetFilters, normalizeSpecies } from './mascotas.js';

const today = new Date(2026, 9, 12);

test('calcula la edad actual desde el nacimiento, no desde la edad de ingreso', () => {
  assert.deepEqual(getAge({ fecha_nacimiento_estimada: '2022-08-15', edad_al_ingreso: '1 año' }, today), { label: 'Edad estimada', value: '4 años' });
  assert.equal(getAge({ fecha_nacimiento_estimada: '2025-10-13' }, today).value, '11 meses');
  assert.equal(getAge({ fecha_nacimiento_estimada: '2025-10-12' }, today).value, '1 año');
  assert.equal(getAge({ fecha_nacimiento_estimada: '2026-10-12' }, today).value, 'Menos de 1 mes');
});

test('usa edad al ingresar y tiempo transcurrido si falta el nacimiento', () => {
  assert.equal(getAge({ fecha_ingreso: '2025-10-12', edad_al_ingreso: '2 meses' }, today).value, '1 año');
  assert.equal(getAge({ fecha_ingreso: '2025-10-12', edad_al_ingreso: '1 año y 6 meses' }, today).value, '2 años');
  assert.equal(getAge({ fecha_ingreso: '2025-10-12', edad_al_ingreso: '0.5 años' }, today).value, '1 año');
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

test('sin filtros incluye mascotas con datos completos o faltantes', () => {
  assert.equal(matchesPetFilters({}, {}, today), true);
  assert.equal(matchesPetFilters({ sexo: 'Hembra', nivel_energia: 'Alta' }, {}, today), true);
});

test('combina sexo, edad actual y energía y permite limpiar la selección', () => {
  const mascotas = [
    { id: 'coincide', sexo: ' F ', fecha_ingreso: '2025-10-12', edad_al_ingreso: '2 meses', nivel_energia: ' ALTA ' },
    { id: 'otro-sexo', sexo: 'Macho', fecha_nacimiento_estimada: '2025-10-12', nivel_energia: 'Alta' },
    { id: 'otra-edad', sexo: 'Hembra', fecha_nacimiento_estimada: '2020-10-12', nivel_energia: 'Alta' },
    { id: 'otra-energia', sexo: 'Hembra', fecha_nacimiento_estimada: '2025-10-12', nivel_energia: 'Baja' },
    { id: 'sin-datos' },
  ];
  const filters = { sexo: 'hembra', edad: '1-2', energia: 'alta' };
  assert.deepEqual(mascotas.filter((mascota) => matchesPetFilters(mascota, filters, today)).map(({ id }) => id), ['coincide']);
  assert.equal(mascotas.filter((mascota) => matchesPetFilters(mascota, { ...filters, energia: '' }, today)).length, 2);
  assert.equal(mascotas.filter((mascota) => matchesPetFilters(mascota, { sexo: '', edad: '', energia: '' }, today)).length, 5);
  assert.equal(mascotas.filter((mascota) => matchesPetFilters(mascota, { ...filters, energia: 'media' }, today)).length, 0);
});

test('los rangos de edad no se superponen y respetan el día del cumpleaños', () => {
  const cases = [
    ['2026-10-12', 'under-1'],
    ['2025-10-13', 'under-1'],
    ['2025-10-12', '1-2'],
    ['2023-10-13', '1-2'],
    ['2023-10-12', '3-6'],
    ['2019-10-13', '3-6'],
    ['2019-10-12', '7-plus'],
  ];
  for (const [birthday, expected] of cases) {
    const mascota = { fecha_nacimiento_estimada: birthday };
    const matches = AGE_FILTERS.filter(({ value }) => matchesPetFilters(mascota, { edad: value }, today));
    assert.deepEqual(matches.map(({ value }) => value), [expected], birthday);
  }
});

test('filtra por edad actual aunque la edad al ingresar fuera de otro rango', () => {
  const mascota = { fecha_ingreso: '2020-10-12', edad_al_ingreso: '2 años' };
  assert.equal(getAgeInMonths(mascota, today), 96);
  assert.equal(matchesPetFilters(mascota, { edad: '7-plus' }, today), true);
  assert.equal(matchesPetFilters(mascota, { edad: '1-2' }, today), false);
  assert.equal(getAgeInMonths({ ...mascota, fecha_nacimiento_estimada: '2023-10-12' }, today), 36);
});

test('las edades desconocidas no se confunden con mascotas menores de un año', () => {
  const mascotas = [
    {},
    { edad_al_ingreso: '2 meses' },
    { fecha_nacimiento_estimada: '2030-01-01' },
    { fecha_nacimiento_estimada: '2025-02-31' },
    { fecha_ingreso: '2025-01-01', edad_al_ingreso: '1 a 2 años' },
  ];
  for (const mascota of mascotas) {
    assert.equal(getAgeInMonths(mascota, today), null);
    assert.equal(matchesPetFilters(mascota, { edad: 'unknown' }, today), true);
    assert.equal(matchesPetFilters(mascota, { edad: 'under-1' }, today), false);
  }
  assert.equal(matchesPetFilters({ fecha_nacimiento_estimada: '2026-10-12' }, { edad: 'unknown' }, today), false);
});

test('las opciones de energía provienen de los datos y agrupan variantes y valores vacíos', () => {
  const mascotas = ['Alta', ' ALTA ', 'Média', 'media', 'Baja', null, ''].map((nivel_energia) => ({ nivel_energia }));
  assert.deepEqual(getEnergyOptions(mascotas), [
    { value: 'alta', label: 'Alta' },
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Média' },
    { value: 'por conocer', label: 'Por conocer' },
  ]);
  assert.equal(matchesPetFilters({ nivel_energia: ' MÉDIA ' }, { energia: 'media' }, today), true);
  assert.equal(matchesPetFilters({}, { sexo: 'por conocer', energia: 'por conocer' }, today), true);
  assert.deepEqual(getEnergyOptions([]), []);
});
