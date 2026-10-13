// Keep the original URL first: existing files may legitimately contain accents.
// Only normalize the filename, leaving its folder, query and fragment intact.
export function getPetImageSources(value) {
  const source = typeof value === 'string' ? value.trim() : '';
  if (!source) return [];

  try {
    const url = new URL(source, 'https://apaqro.invalid/');
    if (!['http:', 'https:'].includes(url.protocol) || url.pathname.endsWith('/')) return [source];

    const suffixIndex = source.search(/[?#]/);
    const path = suffixIndex === -1 ? source : source.slice(0, suffixIndex);
    const suffix = suffixIndex === -1 ? '' : source.slice(suffixIndex);
    const filenameIndex = path.lastIndexOf('/') + 1;
    const filename = decodeURIComponent(path.slice(filenameIndex));
    const normalized = filename.normalize('NFD').replace(/\p{M}/gu, '');
    if (normalized === filename) return [source];

    const prefix = path.slice(0, filenameIndex);
    return [...new Set([
      source,
      prefix + encodeURIComponent(normalized) + suffix,
      prefix + encodeURIComponent(normalized.toLowerCase()) + suffix,
    ])];
  } catch {
    // An invalid escape or URL must not prevent the rest of the catalog rendering.
    return [source];
  }
}

export async function fetchPetImage(source, options = {}) {
  for (const url of getPetImageSources(source)) {
    options.signal?.throwIfAborted();
    try {
      const response = await fetch(url, options);
      if (response.ok) return { response, url };
    } catch {
      // Share the caller's timeout across attempts; never retry an aborted request.
      options.signal?.throwIfAborted();
    }
  }
  throw new Error('No se pudo descargar la imagen.');
}
