import { useState } from 'react';
import { normalizeSpecies } from '../utils/mascotas.js';
import { getPetImageSources } from '../utils/petImages.js';
import Icon from './Icon.jsx';

export default function MascotaFoto({ mascota, priority = false }) {
  const source = typeof mascota.foto === 'string' ? mascota.foto.trim() : '';
  return <FotoConAlternativas key={source} mascota={mascota} priority={priority} sources={getPetImageSources(source)} />;
}

function FotoConAlternativas({ mascota, priority, sources }) {
  const [attempt, setAttempt] = useState(0);
  const source = sources[attempt];
  const hasPhoto = Boolean(source);
  const species = normalizeSpecies(mascota.especie);

  return (
    <div className={'pet-photo ' + (hasPhoto ? '' : 'pet-photo--placeholder')}>
      {hasPhoto ? (
        <img key={source} src={source} alt={'Foto de ' + (mascota.nombre || 'la mascota')} loading={priority ? 'eager' : 'lazy'} decoding="async" onError={() => setAttempt((current) => current === attempt ? current + 1 : current)} />
      ) : (
        <div className="photo-placeholder" role="img" aria-label={'Foto de ' + (mascota.nombre || 'la mascota') + ' no disponible'}>
          <span className="placeholder-orbit" aria-hidden="true" />
          <Icon name={species === 'gato' ? 'cat' : species === 'perro' ? 'dog' : 'paw'} className="placeholder-animal" />
          <span className="placeholder-caption">Foto próximamente</span>
          <Icon name="paw" className="placeholder-paw" />
        </div>
      )}
    </div>
  );
}
