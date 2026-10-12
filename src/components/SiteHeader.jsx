import Icon from './Icon.jsx';

// Sustituye el valor vacío por la URL de donaciones o define VITE_DONATION_URL.
const donationUrl = import.meta.env.VITE_DONATION_URL || '';

export default function SiteHeader({ internal }) {
  return (
    <header className="site-header">
      <a className="brand" href="#/perros" aria-label="APAQRO, ir al catálogo de adopción">
        <img src="/logo.png" width="184" height="60" alt="APAQRO" />
      </a>
      <nav className="header-menu" aria-label="Menú principal">
        <a className="internal-link" href="#/uso-interno" aria-current={internal ? 'page' : undefined}>Uso interno</a>
        <a className="donate-button" href={donationUrl || '#'} aria-disabled={!donationUrl} title={donationUrl ? 'Hacer una donación' : 'Donaciones: próximamente'} onClick={(event) => { if (!donationUrl) event.preventDefault(); }}>
          <Icon name="heart" /> Donar
        </a>
      </nav>
    </header>
  );
}
