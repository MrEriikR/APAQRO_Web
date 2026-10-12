import { useEffect } from 'react';
import Icon from './components/Icon.jsx';
import SiteHeader from './components/SiteHeader.jsx';
import UsoInterno from './pages/UsoInterno.jsx';
import Catalogo from './pages/Catalogo.jsx';
import MascotaDetalle from './pages/MascotaDetalle.jsx';
import useMascotas from './hooks/useMascotas.js';
import useHashRoute from './hooks/useHashRoute.js';
import './App.css';

export default function App() {
  const route = useHashRoute();
  const { mascotas, loading, error, retry } = useMascotas();
  const mascota = route.id ? mascotas.find((item) => item.id === route.id) : null;

  useEffect(() => {
    document.title = route.page === 'internal' ? 'Uso interno · APAQRO' : mascota
      ? (mascota.nombre || 'Conóceme') + ' · Adopta en APAQRO'
      : 'Adopta · APAQRO';
  }, [mascota, route.page]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (window.location.hash && window.location.hash !== '#contenido') {
      document.getElementById('contenido')?.focus({ preventScroll: true });
    }
  }, [route.page, route.id]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido" onClick={(event) => {
        event.preventDefault();
        document.getElementById('contenido')?.focus();
      }}>Saltar al contenido</a>
      <SiteHeader internal={route.page === 'internal'} />

      <main id="contenido" className="main-content" tabIndex={-1}>
        {route.page === 'internal' ? <UsoInterno /> : route.page === 'detail' ? (
          <MascotaDetalle mascota={mascota} loading={loading} error={error} onRetry={retry} />
        ) : (
          <Catalogo mascotas={mascotas} especie={route.species} loading={loading} error={error} onRetry={retry} />
        )}
      </main>

      <footer className="site-footer">
        <span className="footer-message"><Icon name="heart" /> Una adopción, dos vidas que cambian.</span>
        <span className="footer-brand">APAQRO <span aria-hidden="true">·</span> Adopta con amor</span>
      </footer>
    </div>
  );
}
