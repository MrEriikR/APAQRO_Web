import Icon from './Icon.jsx';

export default function CatalogState({ icon = 'paw', title, children, onRetry }) {
  return (
    <div className="catalog-state" role={onRetry ? 'alert' : 'status'}>
      <span className="state-icon"><Icon name={icon} /></span>
      <h2>{title}</h2>
      <p>{children}</p>
      {onRetry && <button className="primary-button" type="button" onClick={onRetry}><Icon name="refresh" /> Volver a intentar</button>}
    </div>
  );
}

export function LoadingCards() {
  return (
    <div role="status" aria-label="Cargando mascotas">
      <span className="sr-only">Cargando mascotas…</span>
      <div className="pet-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="pet-card skeleton-card" key={index}>
            <div className="skeleton skeleton-photo" />
            <div className="pet-card-body"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /><div className="skeleton skeleton-link" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
