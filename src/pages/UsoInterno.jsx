import { useCallback, useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import PhotoSection from '../components/PhotoSection.jsx';
import useInternalAuth from '../hooks/useInternalAuth.js';
import { PHOTO_SECTIONS } from '../utils/internalPhotos.js';
import '../internal.css';

export default function UsoInterno() {
  const { user, checking, error, signIn, signOut } = useInternalAuth();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [busySections, setBusySections] = useState({});
  const uploading = Object.values(busySections).some(Boolean);
  const memberId = user?.id;
  const onBusyChange = useCallback((id, value) => setBusySections((current) => ({ ...current, [id]: value })), []);

  useEffect(() => {
    if (memberId) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [memberId]);

  useEffect(() => {
    if (!uploading) return;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [uploading]);

  async function submit(event) {
    event.preventDefault();
    if (submitting || !code) return;
    setSubmitting(true);
    try { if (await signIn(code)) setCode(''); }
    finally { setSubmitting(false); }
  }

  async function closeSession() {
    setClosing(true);
    try { await signOut(); }
    finally { setClosing(false); }
  }

  if (checking) return <div className="internal-checking" role="status"><Icon name="lock" /><p>Verificando acceso…</p></div>;

  if (!user) return (
    <section className="internal-login" aria-labelledby="login-title">
      <span className="login-icon"><Icon name="lock" /></span>
      <p className="eyebrow">ESPACIO DEL EQUIPO</p>
      <h1 id="login-title">Uso interno</h1>
      <p className="login-description">Ingresa el código del equipo para compartir y consultar nuestras fotos.</p>
      <form onSubmit={submit} className="internal-login-form">
        <label htmlFor="internal-code">Código de acceso</label>
        <input id="internal-code" name="code" type="password" autoComplete="current-password" required maxLength={256} value={code} onChange={(event) => setCode(event.target.value)} placeholder="Ingresa tu código" disabled={submitting} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} />
        {error && <p id="login-error" className="field-error" role="alert">{error}</p>}
        <button type="submit" className="primary-button" disabled={submitting || !code}><Icon name="lock" />{submitting ? 'Verificando…' : 'Entrar al área interna'}</button>
      </form>
      <a className="back-link" href="#/perros"><Icon name="back" /> Volver a adopciones</a>
    </section>
  );

  return (
    <div className="internal-page">
      <div className="internal-page-heading"><div><p className="eyebrow">ESPACIO DEL EQUIPO</p><h1>Un equipo, muchas historias.</h1><p>Comparte las fotos que dan vida a APAQRO.</p></div><button type="button" className="secondary-button" onClick={closeSession} disabled={closing || uploading}><Icon name="logout" />{closing ? 'Cerrando…' : 'Cerrar sesión'}</button></div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <p className="internal-privacy"><Icon name="lock" />Fotos privadas, solo para el equipo.</p>
      {uploading && <p className="upload-notice" role="status">Espera a que terminen las subidas antes de salir de esta página.</p>}
      <div className="photo-sections">{PHOTO_SECTIONS.map((section) => <PhotoSection key={section.id} section={section} onBusyChange={onBusyChange} />)}</div>
    </div>
  );
}
