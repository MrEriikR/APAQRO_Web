export const INTERNAL_BUCKET = 'apaqro-interno';
export const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
export const MAX_BATCH_FILES = 10;
export const PHOTO_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const PHOTO_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
export const PHOTO_SECTIONS = [
  { id: 'animales-nuevos', title: 'Fotos animales nuevos', description: 'Las primeras fotos de quienes llegan a APAQRO.', icon: 'paw' },
  { id: 'eventos', title: 'Fotos eventos', description: 'Encuentros, jornadas y momentos para recordar.', icon: 'calendar' },
  { id: 'colaboradores', title: 'Fotos colaboradores', description: 'Las personas que hacen posible nuestra labor.', icon: 'friends' },
];

export function assertPhotoSection(section) {
  if (!PHOTO_SECTIONS.some(({ id }) => id === section)) throw new Error('Apartado de fotos inválido.');
}

export async function validatePhoto(file) {
  if (!PHOTO_TYPES[file.type]) return 'Usa una imagen JPG, PNG o WebP.';
  if (!file.size) return 'El archivo está vacío.';
  if (file.size > MAX_PHOTO_BYTES) return 'La foto supera el límite de 6 MB.';
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10];
  const valid = file.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : file.type === 'image/png' ? png.every((byte, index) => bytes[index] === byte)
    : bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70 && bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80;
  return valid ? '' : 'El contenido del archivo no corresponde a una imagen compatible.';
}

export function createPhotoPath(section, file) {
  assertPhotoSection(section);
  const extension = PHOTO_TYPES[file.type];
  if (!extension) throw new Error('Formato de foto inválido.');
  const name = file.name.replace(/\.[^.]*$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'foto';
  return `${section}/${Date.now()}_${crypto.randomUUID()}_${name}.${extension}`;
}

export function photoDisplayName(name) {
  return name.replace(/^\d+_[a-f0-9-]{36}_/, '');
}

export function photoErrorMessage(error) {
  const status = Number(error?.statusCode || error?.status);
  if (status === 401 || status === 403) return 'Tu sesión no permite esta operación. Vuelve a ingresar o consulta al responsable del equipo.';
  if (status === 413) return 'La foto supera el tamaño permitido.';
  if (status === 409) return 'Esta foto ya se guardó. Actualiza la galería para verla.';
  return 'No se pudo completar la operación. Revisa tu conexión e inténtalo de nuevo.';
}
