import { AGE_FILTERS, formatSex, formatValue, getAge, getAgeInMonths, normalizeSpecies, normalizeText } from './mascotas.js';

const MISSING = '__missing__';
export const REPORT_COLUMNS = [
  { key: 'nombre', label: 'Nombre', width: 22 },
  { key: 'especie', label: 'Especie', width: 14 },
  { key: 'sexo', label: 'Sexo', width: 14 },
  { key: 'estatus', label: 'Estatus', width: 22 },
  { key: 'edad_actual', label: 'Edad actual estimada', width: 25 },
  { key: 'edad_meses', label: 'Edad actual (meses)', width: 22 },
  { key: 'nivel_energia', label: 'Nivel de energía', width: 20 },
  { key: 'temperamento', label: 'Temperamento', width: 30 },
  { key: 'convive_con', label: 'Convive con', width: 30 },
  { key: 'fecha_ingreso', label: 'Fecha de ingreso', width: 20 },
  { key: 'edad_al_ingreso', label: 'Edad al ingresar', width: 22 },
  { key: 'fecha_nacimiento_estimada', label: 'Nacimiento estimado', width: 24 },
  { key: 'observaciones', label: 'Observaciones', width: 55 },
  { key: 'foto', label: 'URL de foto', width: 45 },
  { key: 'ficha', label: 'URL de ficha', width: 45 },
  { key: 'created_at', label: 'Fecha de registro', width: 28 },
  { key: 'id', label: 'ID', width: 38 },
];

const presenceOptions = [{ value: 'with', label: 'Con dato' }, { value: 'without', label: 'Sin dato' }];
export const MAIN_FILTERS = [
  { key: 'especie', label: 'Especie', type: 'category' },
  { key: 'sexo', label: 'Sexo', type: 'category' },
  { key: 'estatus', label: 'Estatus', type: 'category' },
  { key: 'edad', label: 'Edad actual', options: AGE_FILTERS },
  { key: 'nivel_energia', label: 'Nivel de energía', type: 'category' },
  { key: 'temperamento', label: 'Temperamento', type: 'category' },
  { key: 'convive_con', label: 'Convive con', type: 'category' },
];
export const DETAIL_FILTERS = [
  { key: 'nombre', label: 'Nombre', type: 'text' },
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'edad_al_ingreso', label: 'Edad al ingresar', type: 'text' },
  { key: 'observaciones', label: 'Texto en observaciones', type: 'text' },
  { key: 'foto', label: 'Foto', options: [{ value: 'with', label: 'Con foto' }, { value: 'without', label: 'Sin foto' }] },
  { key: 'ficha', label: 'Ficha', options: [{ value: 'with', label: 'Con ficha' }, { value: 'without', label: 'Sin ficha' }] },
  { key: 'observaciones_estado', label: 'Observaciones', options: presenceOptions },
  { key: 'edad_min', label: 'Edad mínima (meses)', type: 'number' },
  { key: 'edad_max', label: 'Edad máxima (meses)', type: 'number' },
];
export const DATE_FILTERS = [
  { key: 'fecha_ingreso', label: 'Fecha de ingreso' },
  { key: 'fecha_nacimiento_estimada', label: 'Nacimiento estimado' },
  { key: 'created_at', label: 'Fecha de registro' },
];
export const FILTER_DEFINITIONS = [
  { key: 'search', label: 'Búsqueda general' }, ...MAIN_FILTERS, ...DETAIL_FILTERS,
  ...DATE_FILTERS.flatMap(({ key, label }) => [
    { key: `${key}_desde`, label: `${label}: desde` },
    { key: `${key}_hasta`, label: `${label}: hasta` },
    { key: `${key}_estado`, label, options: presenceOptions },
  ]),
];
export const EMPTY_REPORT_FILTERS = Object.fromEntries(FILTER_DEFINITIONS.map(({ key }) => [key, '']));

export function reportValue(pet, key, now = new Date()) {
  if (key === 'edad_meses') return getAgeInMonths(pet, now) ?? '';
  if (key === 'edad_actual') return getAgeInMonths(pet, now) === null ? '' : getAge(pet, now).value;
  // Preserve the stored values in the report, including IDs and original dates.
  if (typeof pet[key] === 'string') return pet[key].trim() ? pet[key] : '';
  return formatValue(pet[key], '');
}

function categoryValues(pet, key) {
  const raw = formatValue(pet[key], '');
  if (!raw) return [{ value: MISSING, label: 'Sin dato' }];
  const labels = key === 'especie' ? [normalizeSpecies(raw)]
    : key === 'sexo' ? [formatSex(raw)]
      : ['temperamento', 'convive_con'].includes(key) ? raw.split(/[,;|\n]/).map((item) => item.trim()).filter(Boolean) : [raw];
  return labels.length ? labels.map((label) => ({ value: normalizeText(label), label: key === 'especie' ? label.charAt(0).toUpperCase() + label.slice(1) : label })) : [{ value: MISSING, label: 'Sin dato' }];
}

export function getReportOptions(pets, key) {
  const options = new Map();
  pets.forEach((pet) => categoryValues(pet, key).forEach((option) => {
    if (!options.has(option.value)) options.set(option.value, option);
  }));
  return [...options.values()].sort((a, b) => a.value === MISSING ? 1 : b.value === MISSING ? -1 : a.label.localeCompare(b.label, 'es'));
}

export function localDateKey(value) {
  if (!value) return '';
  const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly ? new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]) : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return dateOnly && key !== value ? '' : key;
}

export function validateReportFilters(filters) {
  for (const { key, label } of DATE_FILTERS) {
    const start = filters[`${key}_desde`];
    const end = filters[`${key}_hasta`];
    if ((start && !localDateKey(start)) || (end && !localDateKey(end))) return `${label}: ingresa una fecha válida.`;
    if (start && end && start > end) return `${label}: la fecha inicial debe ser anterior o igual a la final.`;
  }
  for (const key of ['edad_min', 'edad_max']) {
    if (filters[key] && (!Number.isInteger(Number(filters[key])) || Number(filters[key]) < 0)) return 'La edad en meses debe ser un número entero mayor o igual a cero.';
  }
  if (filters.edad_min !== '' && filters.edad_min != null && filters.edad_max !== '' && filters.edad_max != null && Number(filters.edad_min) > Number(filters.edad_max)) return 'La edad mínima no puede superar la máxima.';
  return '';
}

function matchesPresence(value, filter) {
  return !filter || (filter === 'with' ? Boolean(value) : !value);
}

export function filterReportPets(pets, filters = {}, now = new Date()) {
  if (validateReportFilters(filters)) return [];
  return pets.filter((pet) => {
    if (filters.search && !normalizeText(REPORT_COLUMNS.map(({ key }) => reportValue(pet, key, now)).join(' ')).includes(normalizeText(filters.search))) return false;
    for (const { key, type } of MAIN_FILTERS) {
      if (type === 'category' && filters[key] && !categoryValues(pet, key).some(({ value }) => value === filters[key])) return false;
    }
    for (const { key, type } of DETAIL_FILTERS) {
      if (type === 'text' && filters[key] && !normalizeText(reportValue(pet, key, now)).includes(normalizeText(filters[key]))) return false;
    }
    const age = getAgeInMonths(pet, now);
    if (filters.edad === 'unknown' && age !== null) return false;
    if (filters.edad && filters.edad !== 'unknown') {
      const range = AGE_FILTERS.find(({ value }) => value === filters.edad);
      if (!range || age === null || age < range.min || age >= range.max) return false;
    }
    if (filters.edad_min !== '' && filters.edad_min != null && (age === null || age < Number(filters.edad_min))) return false;
    if (filters.edad_max !== '' && filters.edad_max != null && (age === null || age > Number(filters.edad_max))) return false;
    for (const key of ['foto', 'ficha', 'observaciones']) {
      if (!matchesPresence(reportValue(pet, key, now), filters[key === 'observaciones' ? 'observaciones_estado' : key])) return false;
    }
    for (const { key } of DATE_FILTERS) {
      const date = localDateKey(pet[key]);
      if (!matchesPresence(date, filters[`${key}_estado`])) return false;
      if (filters[`${key}_desde`] && (!date || date < filters[`${key}_desde`])) return false;
      if (filters[`${key}_hasta`] && (!date || date > filters[`${key}_hasta`])) return false;
    }
    return true;
  });
}

export function sortReportPets(pets, key = 'nombre', direction = 'asc', now = new Date()) {
  const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
  return [...pets].sort((a, b) => {
    const sortKey = key === 'edad_actual' ? 'edad_meses' : key;
    const left = reportValue(a, sortKey, now);
    const right = reportValue(b, sortKey, now);
    if (left === '') return right === '' ? 0 : 1;
    if (right === '') return -1;
    const comparison = typeof left === 'number' && typeof right === 'number' ? left - right : collator.compare(String(left), String(right));
    return direction === 'desc' ? -comparison : comparison;
  });
}

export function activeReportFilters(filters, options = {}) {
  return FILTER_DEFINITIONS.filter(({ key }) => String(filters[key] ?? '').trim()).map(({ key, label, options: fixed }) => ({
    key, label, value: (fixed || options[key] || []).find((option) => option.value === filters[key])?.label || filters[key],
  }));
}

export function reportMatrix(pets, columnKeys, now = new Date()) {
  const columns = REPORT_COLUMNS.filter(({ key }) => columnKeys.includes(key));
  if (!columns.length) throw new Error('Selecciona al menos una columna.');
  return [columns.map(({ label }) => label), ...pets.map((pet) => columns.map(({ key }) => reportValue(pet, key, now)))];
}

export function createReportCsv(pets, columnKeys, now = new Date()) {
  return '\uFEFF' + reportMatrix(pets, columnKeys, now).map((row) => row.map((value) => {
    let text = String(value);
    // Spreadsheet applications can execute formulas even in quoted CSV fields.
    // eslint-disable-next-line no-control-regex -- Includes control prefixes that spreadsheet readers may ignore.
    if (/^[\s\u0000-\u001f]*[=+@-]/u.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }).join(',')).join('\r\n');
}

export function reportFilename(format, stamp = new Date()) {
  return `apaqro-mascotas-${localDateKey(stamp)}-${String(stamp.getHours()).padStart(2, '0')}${String(stamp.getMinutes()).padStart(2, '0')}${String(stamp.getSeconds()).padStart(2, '0')}.${format}`;
}
