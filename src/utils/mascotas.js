const missing = 'Por conocer';

export function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeSpecies(value) {
  const normalized = normalizeText(value);
  if (['perro', 'perros', 'perra', 'canino', 'canina', 'dog'].includes(normalized)) return 'perro';
  if (['gato', 'gatos', 'gata', 'felino', 'felina', 'cat'].includes(normalized)) return 'gato';
  return normalized;
}

export function formatValue(value, fallback = missing) {
  if (Array.isArray(value)) return value.map((item) => formatValue(item, '')).filter(Boolean).join(', ') || fallback;
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number') return String(value);
  return fallback;
}

export function formatSex(value) {
  const normalized = normalizeText(value);
  if (['hembra', 'femenino', 'female', 'h', 'f'].includes(normalized)) return 'Hembra';
  if (['macho', 'masculino', 'male', 'm'].includes(normalized)) return 'Macho';
  return formatValue(value);
}

export function sexIcon(value) {
  const sex = formatSex(value);
  return sex === 'Hembra' ? 'female' : sex === 'Macho' ? 'male' : 'sex';
}

function parseDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly ? new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (dateOnly && (date.getFullYear() !== +dateOnly[1] || date.getMonth() !== +dateOnly[2] - 1 || date.getDate() !== +dateOnly[3])) return null;
  return date;
}

export function formatDate(value) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(date) : missing;
}

function fullMonthsSince(date, now) {
  return (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth() - (now.getDate() < date.getDate() ? 1 : 0);
}

function formatMonths(total) {
  if (total < 1) return 'Menos de 1 mes';
  const years = Math.floor(total / 12);
  if (years >= 1) return `${years} ${years === 1 ? 'año' : 'años'}`;
  return `${total} ${total === 1 ? 'mes' : 'meses'}`;
}

function entryAgeInMonths(value) {
  const normalized = normalizeText(value);
  // Only infer age from explicit units; keep ranges and other descriptions as text.
  if (!/^(?:\d+(?:[.,]\d+)?\s*anos?(?:\s*(?:y|,)\s*|\s+)?)?(?:\d+\s*mes(?:es)?)?$/.test(normalized) || !normalized) return null;
  const years = normalized.match(/(\d+(?:[.,]\d+)?)\s*anos?/);
  const months = normalized.match(/(\d+)\s*mes(?:es)?/);
  return Math.round(Number(years?.[1]?.replace(',', '.') || 0) * 12) + Number(months?.[1] || 0);
}

export function getAgeInMonths(mascota, now = new Date()) {
  const birthday = parseDate(mascota.fecha_nacimiento_estimada);
  if (birthday && birthday <= now) return fullMonthsSince(birthday, now);

  const entryDate = parseDate(mascota.fecha_ingreso);
  const entryMonths = entryAgeInMonths(mascota.edad_al_ingreso);
  if (entryDate && entryDate <= now && entryMonths !== null) {
    return entryMonths + fullMonthsSince(entryDate, now);
  }
  return null;
}

export function getAge(mascota, now = new Date()) {
  const months = getAgeInMonths(mascota, now);
  if (months !== null) return { label: 'Edad estimada', value: formatMonths(months) };

  if (formatValue(mascota.edad_al_ingreso, '')) {
    return { label: 'Edad al ingresar', value: formatValue(mascota.edad_al_ingreso) };
  }
  return { label: 'Edad estimada', value: missing };
}

// Límites en meses: cada rango incluye el mínimo y excluye el máximo.
export const AGE_FILTERS = [
  { value: 'under-1', label: 'Menos de 1 año', min: 0, max: 12 },
  { value: '1-2', label: 'De 1 a 2 años', min: 12, max: 36 },
  { value: '3-6', label: 'De 3 a 6 años', min: 36, max: 84 },
  { value: '7-plus', label: '7 años o más', min: 84, max: Infinity },
  { value: 'unknown', label: 'Edad por conocer' },
];

export function getEnergyOptions(mascotas) {
  const options = new Map();
  for (const mascota of mascotas) {
    const label = formatValue(mascota.nivel_energia);
    const value = normalizeText(label);
    if (!options.has(value)) options.set(value, { value, label });
  }
  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export function matchesPetFilters(mascota, { sexo = '', edad = '', energia = '' } = {}, now = new Date()) {
  if (sexo && normalizeText(formatSex(mascota.sexo)) !== sexo) return false;
  if (energia && normalizeText(formatValue(mascota.nivel_energia)) !== energia) return false;
  if (!edad) return true;

  const months = getAgeInMonths(mascota, now);
  if (edad === 'unknown') return months === null;
  const range = AGE_FILTERS.find((option) => option.value === edad);
  return Boolean(range && months !== null && months >= range.min && months < range.max);
}
