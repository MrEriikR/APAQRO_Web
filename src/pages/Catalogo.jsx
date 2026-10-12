import Icon from '../components/Icon.jsx';
import MascotaCard from '../components/MascotaCard.jsx';
import CatalogState, { LoadingCards } from '../components/CatalogState.jsx';
import { normalizeSpecies } from '../utils/mascotas.js';

export default function Catalogo({ mascotas, especie, loading, error, onRetry }) {
  const pets = mascotas.filter((mascota) => normalizeSpecies(mascota.especie) === especie);
  const plural = especie === 'gato' ? 'gatos' : 'perros';

  return (
    <>
      <section className="catalog-hero" aria-labelledby="adopta-title">
        <h1 id="adopta-title">Adopta<span className="title-dot">.</span></h1>
        <div className="species-switch" role="group" aria-label="Tipo de mascota">
          <button type="button" className={`species-button ${especie === 'perro' ? 'is-active' : ''}`} aria-pressed={especie === 'perro'} aria-controls="mascotas" onClick={() => { window.location.hash = '/perros'; }}><Icon name="dog" /> PERROS</button>
          <button type="button" className={`species-button ${especie === 'gato' ? 'is-active' : ''}`} aria-pressed={especie === 'gato'} aria-controls="mascotas" onClick={() => { window.location.hash = '/gatos'; }}><Icon name="cat" /> GATOS</button>
        </div>
        <p>Un nuevo amigo. Una historia juntos. <span>Un hogar para siempre.</span></p>
      </section>

      <section id="mascotas" className="catalog-section" aria-labelledby="catalog-title" aria-busy={loading}>
        <div className="catalog-heading">
          <div><p className="eyebrow">EL AMOR TIENE CUATRO PATAS</p><h2 id="catalog-title">Conoce a tu próximo compañero</h2></div>
          {!loading && !error && <span className="catalog-count" role="status"><span className="count-dot" />{pets.length} {pets.length === 1 ? (especie === 'gato' ? 'gato' : 'perro') : plural}</span>}
        </div>

        {loading ? <LoadingCards /> : error ? (
          <CatalogState icon="info" title="No pudimos cargar las mascotas" onRetry={onRetry}>Revisa tu conexión e inténtalo de nuevo en un momento.</CatalogState>
        ) : pets.length === 0 ? (
          <CatalogState icon={especie === 'gato' ? 'cat' : 'dog'} title={`Aún no hay ${plural} para mostrar`}>Vuelve pronto para conocer a nuestros próximos compañeros.</CatalogState>
        ) : (
          <div className="pet-grid">{pets.map((mascota, index) => <MascotaCard key={mascota.id} mascota={mascota} index={index} />)}</div>
        )}
      </section>
    </>
  );
}
