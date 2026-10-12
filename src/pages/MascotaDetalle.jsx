import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import MascotaFoto from '../components/MascotaFoto.jsx';
import CatalogState from '../components/CatalogState.jsx';
import { formatDate, formatSex, formatValue, getAge, normalizeSpecies, sexIcon } from '../utils/mascotas.js';

function DescargarFicha({ ficha }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  async function download() {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(false);

    try {
      const response = await fetch(ficha, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error('No se pudo descargar la ficha.');
      const blob = await response.blob();
      const filename = decodeURIComponent(new URL(ficha, window.location.href).pathname.split('/').pop()) || 'ficha';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <button type="button" className="primary-button detail-download" onClick={download} disabled={downloading} aria-busy={downloading}>
        <Icon name="download" />
        <span>{downloading ? 'Descargando…' : 'Descargar ficha'}</span>
      </button>
      {downloadError && <p className="detail-download-error" role="alert">No pudimos descargar la ficha. Inténtalo de nuevo.</p>}
    </>
  );
}

function DetailFact({ icon, label, children }) {
  return (
    <div className="detail-fact">
      <dt><span className="fact-icon"><Icon name={icon} /></span><span>{label}</span></dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function MascotaDetalle({ mascota, loading, error, onRetry }) {
  const back = mascota && normalizeSpecies(mascota.especie) === 'gato' ? '#/gatos' : '#/perros';
  const age = mascota ? getAge(mascota) : null;
  const nombre = formatValue(mascota?.nombre, 'esta mascota');
  const ficha = typeof mascota?.ficha === 'string' ? mascota.ficha.trim() : '';
  const asunto = `Preguntar por ${nombre}`;
  const mensaje = `Hola, me gustaría recibir más información sobre la adopción de ${nombre}.\r\n\r\n¡Gracias!`;
  const correo = `mailto:adopta@apaqro.org?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;

  return (
    <div className="detail-page">
      <a className="back-link" href={back}><Icon name="back" /> Volver al catálogo</a>

      {loading ? (
        <div className="detail-loading" role="status"><span className="sr-only">Cargando la ficha…</span><div className="skeleton detail-loading-photo" /><div className="detail-loading-copy"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /><div className="skeleton detail-loading-facts" /></div></div>
      ) : error ? (
        <CatalogState icon="info" title="No pudimos cargar esta ficha" onRetry={onRetry}>Revisa tu conexión e inténtalo de nuevo en un momento.</CatalogState>
      ) : !mascota ? (
        <CatalogState title="No encontramos esta mascota">La ficha ya no está disponible. Puedes conocer a otros compañeros en el catálogo.</CatalogState>
      ) : (
        <article className="pet-detail" aria-labelledby="pet-name">
          <div className="detail-visual">
            <MascotaFoto key={mascota.id} mascota={mascota} priority />
            {ficha && <DescargarFicha key={`${mascota.id}-${ficha}`} ficha={ficha} />}
          </div>

          <div className="detail-content">
            <p className="eyebrow">UNA HISTORIA POR CONOCER</p>
            <h1 id="pet-name" className="detail-name"><Icon name="paw" />{mascota.nombre || 'Nombre por conocer'}</h1>
            <p className="detail-intro">Los pequeños detalles de tu próximo gran amigo.</p>

            <a className="primary-button detail-contact" href={correo}>
              <Icon name="mail" />
              <span>{asunto}</span>
            </a>

            <dl className="detail-highlights">
              <DetailFact icon={sexIcon(mascota.sexo)} label="Sexo">{formatSex(mascota.sexo)}</DetailFact>
              <DetailFact icon="birthday" label={age.label}>{age.value}</DetailFact>
              <DetailFact icon="paw" label="Especie">{formatValue(mascota.especie)}</DetailFact>
              <DetailFact icon="heart" label="Estatus">{formatValue(mascota.estatus)}</DetailFact>
            </dl>

            <section className="detail-section" aria-labelledby="about-title">
              <h2 id="about-title">Un poquito sobre mí</h2>
              <dl className="detail-facts">
                <DetailFact icon="smile" label="Temperamento">{formatValue(mascota.temperamento)}</DetailFact>
                <DetailFact icon="energy" label="Nivel de energía">{formatValue(mascota.nivel_energia)}</DetailFact>
                <DetailFact icon="friends" label="Convive con">{formatValue(mascota.convive_con)}</DetailFact>
              </dl>
            </section>

            <section className="detail-section" aria-labelledby="history-title">
              <h2 id="history-title">Mi historia</h2>
              <dl className="detail-facts">
                <DetailFact icon="home" label="Fecha de ingreso">{formatDate(mascota.fecha_ingreso)}</DetailFact>
                <DetailFact icon="birthday" label="Edad al ingresar">{formatValue(mascota.edad_al_ingreso)}</DetailFact>
                <DetailFact icon="calendar" label="Nacimiento estimado">{formatDate(mascota.fecha_nacimiento_estimada)}</DetailFact>
              </dl>
            </section>

            <section className="observations" aria-labelledby="observations-title">
              <h2 id="observations-title"><Icon name="note" /> Lo que debes saber de mí</h2>
              <p>{formatValue(mascota.observaciones, 'Todavía no hay observaciones adicionales sobre mí.')}</p>
            </section>
          </div>
        </article>
      )}
    </div>
  );
}
