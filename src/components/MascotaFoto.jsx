import { useState } from 'react';
import { normalizeSpecies } from '../utils/mascotas.js';
import Icon from './Icon.jsx';

export default function MascotaFoto({ mascota, priority = false }) {
  const [failedSource, setFailedSource] = useState(null);
  const source = typeof mascota.foto === 'string' ? mascota.foto.trim() : '';
  const hasPhoto = source && source !== failedSource;
  const species = normalizeSpecies(mascota.especie);

  return (
    <div className={'pet-photo ' + (hasPhoto ? '' : 'pet-photo--placeholder')}>
      {hasPhoto ? (
        <img src={source} alt={'Foto de ' + (mascota.nombre || 'la mascota')} loading={priority ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedSource(source)} />
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
