import test from 'node:test';
import assert from 'node:assert/strict';
import { read, utils } from 'xlsx';
import {
  activeReportFilters, createReportCsv, EMPTY_REPORT_FILTERS, filterReportPets, getReportOptions,
  localDateKey, REPORT_COLUMNS, reportMatrix, sortReportPets, validateReportFilters,
} from './internalReports.js';
import { createReportWorkbook } from './reportWorkbook.js';

const now = new Date(2026, 9, 13, 12);
const pets = [
  { id: '001', nombre: 'Lúna', especie: 'Canino', sexo: 'F', estatus: 'En adopción', fecha_nacimiento_estimada: '2025-10-13', fecha_ingreso: '2026-01-01', edad_al_ingreso: '3 meses', nivel_energia: 'Alta', temperamento: ['Sociable', 'Juguetón'], convive_con: ['Perros', 'Niños'], observaciones: 'Necesita revisión', foto: 'https://example.test/luna.jpg', ficha: 'https://example.test/luna.png', created_at: '2026-01-01T12:00:00Z' },
  { id: '002', nombre: 'Milo', especie: 'Felino', sexo: 'Macho', estatus: 'Adoptado', fecha_nacimiento_estimada: '2020-10-13', fecha_ingreso: '2026-01-31', nivel_energia: 'Baja', temperamento: 'Tranquilo', convive_con: 'Gatos; Niños', observaciones: '', foto: '', ficha: '', created_at: '2026-01-31T12:00:00Z' },
  { id: '003', nombre: 'Nube', especie: 'Perro', sexo: 'Hembra', fecha_ingreso: '2026-02-01', edad_al_ingreso: 'Por confirmar', convive_con: 'No convive con gatos', foto: '   ' },
  { id: '004', nombre: 'Sin datos' },
];
const ids = (filters) => filterReportPets(pets, filters, now).map(({ id }) => id);

test('incluye todos los registros sin filtros, también los incompletos', () => {
  assert.deepEqual(ids(EMPTY_REPORT_FILTERS), ['001', '002', '003', '004']);
});

test('combina categorías, edades, fechas y texto usando AND', () => {
  assert.deepEqual(ids({ especie: 'perro', sexo: 'hembra', estatus: 'en adopcion', edad: '1-2', nivel_energia: 'alta', temperamento: 'jugueton', convive_con: 'ninos', fecha_ingreso_desde: '2026-01-01', fecha_ingreso_hasta: '2026-01-31', search: 'revision', foto: 'with', ficha: 'with' }), ['001']);
  assert.deepEqual(ids({ especie: 'gato', sexo: 'hembra' }), []);
});

test('ofrece categorías normalizadas, valores desconocidos y campos vacíos', () => {
  assert.deepEqual(getReportOptions(pets, 'especie'), [{ value: 'gato', label: 'Gato' }, { value: 'perro', label: 'Perro' }, { value: '__missing__', label: 'Sin dato' }]);
  assert.equal(getReportOptions(pets, 'sexo').filter(({ value }) => value === 'hembra').length, 1);
  assert.deepEqual(ids({ especie: '__missing__' }), ['004']);
  assert.deepEqual(filterReportPets([{ especie: 'Conejo' }], { especie: 'conejo' }), [{ especie: 'Conejo' }]);
});

test('la convivencia respeta elementos completos y no confunde una negación', () => {
  assert.deepEqual(ids({ convive_con: 'gatos' }), ['002']);
  assert.deepEqual(ids({ convive_con: 'ninos' }), ['001', '002']);
  assert.deepEqual(ids({ temperamento: 'sociable' }), ['001']);
});

test('busca sin acentos ni diferencias de mayúsculas en cada campo de texto', () => {
  assert.deepEqual(ids({ nombre: ' LUNA ' }), ['001']);
  assert.deepEqual(ids({ id: '002' }), ['002']);
  assert.deepEqual(ids({ edad_al_ingreso: 'confirmar' }), ['003']);
  assert.deepEqual(ids({ observaciones: 'REVISION' }), ['001']);
  assert.deepEqual(ids({ search: 'luna.png' }), ['001']);
});

test('los rangos de edad incluyen cero y ambos extremos sin inferir edades desconocidas', () => {
  assert.deepEqual(ids({ edad_min: '12', edad_max: '12' }), ['001']);
  assert.deepEqual(ids({ edad_min: '0', edad_max: '0' }), []);
  assert.deepEqual(ids({ edad: 'unknown' }), ['003', '004']);
  assert.deepEqual(ids({ edad_min: '0', edad: 'unknown' }), []);
  assert.equal(filterReportPets([{ fecha_nacimiento_estimada: '2026-10-13' }], { edad_max: '0' }, now).length, 1);
});

test('las tres fechas aceptan límites inclusivos y excluyen datos ausentes o inválidos', () => {
  assert.deepEqual(ids({ fecha_ingreso_desde: '2026-01-01', fecha_ingreso_hasta: '2026-01-31' }), ['001', '002']);
  assert.deepEqual(ids({ fecha_nacimiento_estimada_desde: '2025-10-13', fecha_nacimiento_estimada_hasta: '2025-10-13' }), ['001']);
  const day = localDateKey(pets[1].created_at);
  assert.deepEqual(ids({ created_at_desde: day, created_at_hasta: day }), ['002']);
  assert.deepEqual(ids({ fecha_ingreso_estado: 'without' }), ['004']);
  assert.deepEqual(ids({ created_at_estado: 'with' }), ['001', '002']);
  assert.equal(localDateKey('2026-02-31'), '');
  assert.equal(localDateKey('2026-01-01'), '2026-01-01');
});

test('valida rangos invertidos, fechas imposibles y edades negativas o fraccionarias', () => {
  for (const filters of [{ edad_min: '13', edad_max: '12' }, { edad_min: '-1' }, { edad_max: '1.5' }, { fecha_ingreso_desde: '2026-02-01', fecha_ingreso_hasta: '2026-01-01' }, { fecha_ingreso_desde: '2026-02-31' }]) {
    assert.ok(validateReportFilters(filters));
    assert.deepEqual(ids(filters), []);
  }
});

test('filtra presencia de fotos, fichas y observaciones, incluidos espacios vacíos', () => {
  assert.deepEqual(ids({ foto: 'without' }), ['002', '003', '004']);
  assert.deepEqual(ids({ ficha: 'with', observaciones_estado: 'with' }), ['001']);
  assert.deepEqual(ids({ observaciones_estado: 'without' }), ['002', '003', '004']);
});

test('ordena sin modificar los datos originales y deja edades desconocidas al final', () => {
  assert.deepEqual(sortReportPets(pets, 'edad_meses', 'desc', now).map(({ id }) => id), ['002', '001', '003', '004']);
  assert.deepEqual(pets.map(({ id }) => id), ['001', '002', '003', '004']);
});

test('ordena la edad visible por duración, aunque cambien las unidades de meses a años', () => {
  const ages = [{ id: 'adulto', fecha_nacimiento_estimada: '2024-10-13' }, { id: 'cachorro', fecha_nacimiento_estimada: '2025-12-13' }, { id: 'sin-edad' }];
  assert.deepEqual(sortReportPets(ages, 'edad_actual', 'asc', now).map(({ id }) => id), ['cachorro', 'adulto', 'sin-edad']);
});

test('la matriz comparte columnas, filas y orden del reporte sin paginar ni inventar valores', () => {
  const result = sortReportPets(filterReportPets(pets, { especie: 'perro' }, now), 'nombre', 'desc', now);
  assert.deepEqual(reportMatrix(result, ['id', 'nombre', 'edad_meses'], now), [['Nombre', 'Edad actual (meses)', 'ID'], ['Nube', '', '003'], ['Lúna', 12, '001']]);
  assert.throws(() => reportMatrix(pets, [], now), /columna/);
  const many = Array.from({ length: 80 }, (_, index) => ({ id: String(index) }));
  assert.equal(reportMatrix(many, ['id']).length, 81);
});

test('CSV conserva acentos, comillas, comas y saltos de línea con BOM UTF-8', () => {
  const csv = createReportCsv([{ nombre: 'Niña, "Lúna"', observaciones: 'Línea 1\nLínea 2', id: '001' }], ['nombre', 'observaciones', 'id'], now);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /"Niña, ""Lúna"""/);
  const rows = utils.sheet_to_json(read(csv, { type: 'string', raw: true }).Sheets.Sheet1, { header: 1 });
  assert.deepEqual(rows[1], ['Niña, "Lúna"', 'Línea 1\nLínea 2', '001']);
});

test('CSV neutraliza fórmulas y prefijos peligrosos en datos externos', () => {
  for (const value of ['=1+1', '+1+1', '-1+1', '@SUM(A1)', '\t=1+1', '  =1+1', '\rtexto']) {
    assert.ok(createReportCsv([{ nombre: value }], ['nombre']).includes(`"'${value}"`));
  }
});

for (const format of ['xlsx', 'xls']) {
  test(`${format.toUpperCase()} real se puede reabrir con filas filtradas, columnas y metadatos correctos`, () => {
    const selected = filterReportPets(pets, { especie: 'perro', foto: 'with' }, now);
    const columnKeys = ['nombre', 'edad_meses', 'fecha_ingreso', 'id'];
    const active = activeReportFilters({ especie: 'perro', foto: 'with' }, { especie: getReportOptions(pets, 'especie') });
    const data = createReportWorkbook({ pets: selected, columnKeys, format, now, filters: active });
    const signature = [...new Uint8Array(data).slice(0, 4)];
    assert.deepEqual(signature, format === 'xlsx' ? [0x50, 0x4b, 0x03, 0x04] : [0xd0, 0xcf, 0x11, 0xe0]);
    const workbook = read(data, { type: 'array' });
    assert.deepEqual(workbook.SheetNames, ['Mascotas', 'Filtros']);
    assert.deepEqual(utils.sheet_to_json(workbook.Sheets.Mascotas, { header: 1 }), reportMatrix(selected, columnKeys, now));
    assert.equal(workbook.Sheets.Mascotas.D2.t, 's');
    assert.equal(workbook.Sheets.Mascotas.B2.t, 'n');
    const summary = utils.sheet_to_json(workbook.Sheets.Filtros, { header: 1 });
    assert.ok(summary.some((row) => row[0] === 'Especie' && row[1] === 'Perro'));
    assert.ok(summary.some((row) => row[0] === 'Foto' && row[1] === 'Con foto'));
  });

  test(`${format.toUpperCase()} trata fórmulas como texto literal`, () => {
    const data = createReportWorkbook({ pets: [{ nombre: '=HYPERLINK("https://example.test")' }], columnKeys: ['nombre'], format, now });
    const cell = read(data, { type: 'array' }).Sheets.Mascotas.A2;
    assert.equal(cell.t, 's');
    assert.equal(cell.f, undefined);
    assert.equal(cell.v, '=HYPERLINK("https://example.test")');
  });
}

test('Excel rechaza límites que causarían pérdida de datos', () => {
  assert.throws(() => createReportWorkbook({ pets: new Array(65536), columnKeys: ['id'], format: 'xls', now }), /XLSX o CSV/);
  assert.throws(() => createReportWorkbook({ pets: [{ observaciones: 'x'.repeat(32768) }], columnKeys: ['observaciones'], format: 'xlsx', now }), /texto completo/);
  assert.equal(REPORT_COLUMNS.length, 17);
});
