import { internalSupabase } from './internal-supabase.js';
import { assertPhotoSection, INTERNAL_BUCKET } from '../src/utils/internalPhotos.js';

export async function listInternalPhotos(section, limit) {
  assertPhotoSection(section);
  const storage = internalSupabase.storage.from(INTERNAL_BUCKET);
  const { data, error } = await storage.list(section, { limit: limit + 1, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) throw error;
  const files = data.filter((file) => file.id);
  const visible = files.slice(0, limit);
  if (!visible.length) return { photos: [], hasMore: false };
  const paths = visible.map((file) => `${section}/${file.name}`);
  const { data: signed, error: signError } = await storage.createSignedUrls(paths, 600);
  if (signError) throw signError;
  const urls = new Map(signed.map((item) => [item.path, item.signedUrl]));
  if (paths.some((path) => !urls.get(path))) throw new Error('No se pudieron abrir las fotos.');
  return { photos: visible.map((file) => ({ ...file, url: urls.get(`${section}/${file.name}`) })), hasMore: files.length > limit };
}

export async function uploadInternalPhoto(item) {
  assertPhotoSection(item.path.split('/')[0]);
  const { error } = await internalSupabase.storage.from(INTERNAL_BUCKET).upload(item.path, item.file, {
    contentType: item.file.type,
    cacheControl: '300',
    upsert: false,
    metadata: { originalName: item.file.name },
  });
  if (error) throw error;
}
