import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import MascotaCard from '../components/MascotaCard.jsx';
import CatalogState, { LoadingCards } from '../components/CatalogState.jsx';
import { AGE_FILTERS, getEnergyOptions, matchesPetFilters, normalizeSpecies } from '../utils/mascotas.js';

const emptyFilters = { sexo: '', edad: '', energia: '' };

export default function Catalogo({ mascotas, especie, loading, error, onRetry }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [now] = useState(() => new Date());
  const speciesPets = mascotas.filter((mascota) => normalizeSpecies(mascota.especie) === especie);
  const pets = speciesPets.filter((mascota) => matchesPetFilters(mascota, filters, now));
  const energyOptions = getEnergyOptions(speciesPets);
  const hasFilters = Object.values(filters).some(Boolean);
  const plural = especie === 'gato' ? 'gatos' : 'perros';

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

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
          <div><h2 id="catalog-title">Conoce a tu próximo compañero</h2></div>
          {!loading && !error && <span className="catalog-count" role="status" aria-atomic="true"><span className="count-dot" />{hasFilters ? `${pets.length} de ${speciesPets.length} ${speciesPets.length === 1 ? especie : plural}` : `${pets.length} ${pets.length === 1 ? especie : plural}`}</span>}
        </div>

        <fieldset className="catalog-filters" disabled={loading || Boolean(error)}>
          <legend className="sr-only">Filtros del catálogo</legend>
          <div className="catalog-filters-heading">
            <h3>Filtra tu búsqueda</h3>
            <button type="button" className="clear-filters" onClick={() => setFilters(emptyFilters)} disabled={!hasFilters} aria-controls="catalog-results"><Icon name="refresh" /> Limpiar filtros</button>
          </div>
          <div className="catalog-filter-fields">
            <label className="catalog-filter" htmlFor="filter-sex">
              <span><Icon name="sex" /> Sexo</span>
              <select id="filter-sex" name="sexo" value={filters.sexo} onChange={updateFilter} aria-controls="catalog-results">
                <option value="">Todos</option>
                <option value="hembra">Hembra</option>
                <option value="macho">Macho</option>
                <option value="por conocer">Por conocer</option>
              </select>
            </label>
            <label className="catalog-filter" htmlFor="filter-age">
              <span><Icon name="birthday" /> Edad</span>
              <select id="filter-age" name="edad" value={filters.edad} onChange={updateFilter} aria-controls="catalog-results">
                <option value="">Todas las edades</option>
                {AGE_FILTERS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="catalog-filter" htmlFor="filter-energy">
              <span><Icon name="energy" /> Energía</span>
              <select id="filter-energy" name="energia" value={filters.energia} onChange={updateFilter} aria-controls="catalog-results">
                <option value="">Todos los niveles</option>
                {energyOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
        </fieldset>

        <div id="catalog-results">
          {loading ? <LoadingCards /> : error ? (
            <CatalogState icon="info" title="No pudimos cargar las mascotas" onRetry={onRetry}>Revisa tu conexión e inténtalo de nuevo en un momento.</CatalogState>
          ) : speciesPets.length === 0 ? (
            <CatalogState icon={especie === 'gato' ? 'cat' : 'dog'} title={`Aún no hay ${plural} para mostrar`}>Vuelve pronto para conocer a nuestros próximos compañeros.</CatalogState>
          ) : pets.length === 0 ? (
            <CatalogState icon="search" title="No encontramos coincidencias">Prueba otros filtros o pulsa «Limpiar filtros» para ver todos los {plural}.</CatalogState>
          ) : (
            <div className="pet-grid">{pets.map((mascota, index) => <MascotaCard key={mascota.id} mascota={mascota} index={index} />)}</div>
          )}
        </div>
      </section>
    </>
  );
}
