import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import InternalDashboard from '../components/InternalDashboard.jsx';
import useInternalAuth from '../hooks/useInternalAuth.js';
import '../internal.css';

export default function UsoInterno() {
  const { user, checking, error, signIn, signOut } = useInternalAuth();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);
  const memberId = user?.id;

  useEffect(() => {
    if (memberId) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [memberId]);

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
      <p className="login-description">Ingresa el código del equipo para consultar el dashboard y descargar reportes de mascotas.</p>
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
      <div className="internal-page-heading"><div><p className="eyebrow">ESPACIO DEL EQUIPO</p><h1>Dashboard de mascotas</h1><p>Consulta, filtra y descarga la información que necesitas.</p></div><button type="button" className="secondary-button" onClick={closeSession} disabled={closing}><Icon name="logout" />{closing ? 'Cerrando…' : 'Cerrar sesión'}</button></div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <InternalDashboard key={memberId} />
    </div>
  );
}
