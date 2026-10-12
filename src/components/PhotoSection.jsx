import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { listInternalPhotos, uploadInternalPhoto } from '../../lib/internal-photos.js';
import { createPhotoPath, MAX_BATCH_FILES, PHOTO_ACCEPT, photoDisplayName, photoErrorMessage, validatePhoto } from '../utils/internalPhotos.js';

function SelectedPhoto({ item, disabled, onRemove }) {
  const [preview, setPreview] = useState('');
  useEffect(() => {
    const url = URL.createObjectURL(item.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [item.file]);

  return (
    <li className="selected-photo">
      {preview && <img src={preview} alt={'Vista previa de ' + item.file.name} />}
      <div><span className="selected-filename">{item.file.name}</span><span className="selected-size">{(item.file.size / 1024 / 1024).toFixed(1)} MB</span>{item.error && <span className="field-error">{item.error}</span>}</div>
      <button type="button" className="icon-button" disabled={disabled} onClick={onRemove} aria-label={'Quitar ' + item.file.name}><Icon name="close" /></button>
    </li>
  );
}

function GalleryPhoto({ photo }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [photo.url]);
  const name = photoDisplayName(photo.name);
  return (
    <a className="gallery-photo" href={photo.url} target="_blank" rel="noreferrer" aria-label={'Abrir ' + name + ' en otra pestaña'}>
      {failed ? <span className="gallery-photo-fallback"><Icon name="image" /><span>Vista previa no disponible</span></span> : <img src={photo.url} alt={name} loading="lazy" onError={() => setFailed(true)} />}
      <span className="gallery-photo-name">{name}</span>
    </a>
  );
}

export default function PhotoSection({ section, onBusyChange }) {
  const [items, setItems] = useState([]);
  const [validating, setValidating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [feedback, setFeedback] = useState('');
  const [selectionErrors, setSelectionErrors] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [galleryError, setGalleryError] = useState('');
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(6);
  const [hasMore, setHasMore] = useState(false);
  const [revision, setRevision] = useState(0);
  const fileInput = useRef(null);
  const busy = useRef(false);
  const mounted = useRef(false);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setGalleryError('');
    listInternalPhotos(section.id, limit)
      .then(({ photos: next, hasMore: more }) => { if (active) { setPhotos(next); setHasMore(more); } })
      .catch((error) => { if (active) setGalleryError(photoErrorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [section.id, limit, revision]);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') setRevision((value) => value + 1); };
    const interval = window.setInterval(refresh, 8 * 60 * 1000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', refresh); };
  }, []);

  async function selectFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (busy.current || !files.length) return;
    busy.current = true;
    setValidating(true);
    setFeedback('');
    const errors = [];
    const accepted = [];
    const room = MAX_BATCH_FILES - items.length;
    if (files.length > room) errors.push(`Puedes seleccionar hasta ${MAX_BATCH_FILES} fotos por subida.`);
    try {
      for (const file of files.slice(0, room)) {
        if (items.some((item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified)) continue;
        const error = await validatePhoto(file);
        if (error) errors.push(`${file.name}: ${error}`);
        else accepted.push({ id: crypto.randomUUID(), file, path: createPhotoPath(section.id, file), error: '' });
      }
      if (mounted.current) setItems((current) => [...current, ...accepted]);
    } catch {
      errors.push('No se pudo leer una de las fotos. Vuelve a seleccionarla.');
    } finally {
      busy.current = false;
      if (mounted.current) { setSelectionErrors(errors); setValidating(false); }
    }
  }

  async function upload() {
    if (busy.current || !items.length) return;
    busy.current = true;
    setUploading(true);
    setFeedback('');
    setSelectionErrors([]);
    onBusyChange(section.id, true);
    const failed = [];
    let saved = 0;
    try {
      for (const [index, item] of items.entries()) {
        if (!mounted.current) break;
        setProgress(`Subiendo foto ${index + 1} de ${items.length}…`);
        try {
          await uploadInternalPhoto(item);
          saved += 1;
        } catch (error) {
          failed.push({ ...item, error: photoErrorMessage(error) });
        }
      }
      if (mounted.current) {
        setItems(failed);
        setFeedback(`${saved} ${saved === 1 ? 'foto guardada' : 'fotos guardadas'}.${failed.length ? ` ${failed.length} no se pudieron subir; puedes reintentarlo.` : ''}`);
        if (saved) setRevision((value) => value + 1);
      }
    } finally {
      busy.current = false;
      onBusyChange(section.id, false);
      if (mounted.current) { setUploading(false); setProgress(''); }
    }
  }

  return (
    <section className="photo-section" aria-labelledby={'section-' + section.id}>
      <div className="photo-section-heading"><span className="section-icon"><Icon name={section.icon} /></span><div><h2 id={'section-' + section.id}>{section.title}</h2><p>{section.description}</p></div></div>

      <input ref={fileInput} className="sr-only" type="file" tabIndex={-1} aria-label={'Seleccionar ' + section.title.toLowerCase()} accept={PHOTO_ACCEPT} multiple onChange={selectFiles} disabled={uploading || validating} />
      <button className="photo-picker" type="button" onClick={() => fileInput.current?.click()} disabled={uploading || validating || items.length >= MAX_BATCH_FILES}>
        <Icon name="upload" /><strong>{validating ? 'Preparando fotos…' : 'Seleccionar fotos'}</strong><span>JPG, PNG o WebP · hasta 6 MB por foto</span>
      </button>

      {selectionErrors.length > 0 && <ul className="upload-errors" role="alert">{selectionErrors.map((error, index) => <li key={index}>{error}</li>)}</ul>}
      {items.length > 0 && <><ul className="selected-photos">{items.map((item) => <SelectedPhoto key={item.id} item={item} disabled={uploading || validating} onRemove={() => setItems((current) => current.filter(({ id }) => id !== item.id))} />)}</ul><button type="button" className="primary-button upload-button" onClick={upload} disabled={uploading || validating}><Icon name="upload" />{uploading ? 'Subiendo…' : `Subir ${items.length} ${items.length === 1 ? 'foto' : 'fotos'}`}</button></>}
      <p className="upload-feedback" role="status" aria-live="polite">{progress || feedback}</p>

      <div className="gallery-heading"><h3>Fotos guardadas</h3><button className="icon-button" type="button" onClick={() => setRevision((value) => value + 1)} disabled={loading} aria-label={'Actualizar ' + section.title.toLowerCase()}><Icon name="refresh" /></button></div>
      {galleryError ? <p className="field-error" role="alert">{galleryError}</p> : loading && !photos.length ? <p className="gallery-empty" role="status">Cargando fotos…</p> : photos.length ? <div className="internal-gallery" aria-busy={loading}>{photos.map((photo) => <GalleryPhoto key={photo.id} photo={photo} />)}</div> : <div className="gallery-empty"><Icon name="image" /><p>Aún no hay fotos en este apartado.</p></div>}
      {hasMore && !galleryError && <button type="button" className="text-button" onClick={() => setLimit((value) => value + 6)} disabled={loading}>{loading ? 'Cargando…' : 'Ver más fotos'}</button>}
    </section>
  );
}
