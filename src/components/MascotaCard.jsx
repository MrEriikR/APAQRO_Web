import Icon from './Icon.jsx';
import MascotaFoto from './MascotaFoto.jsx';
import { getAge, formatSex, sexIcon } from '../utils/mascotas.js';

export default function MascotaCard({ mascota, index }) {
  const age = getAge(mascota);

  return (
    <article className="pet-card">
      <a className="pet-card-link" href={'#/mascotas/' + encodeURIComponent(mascota.id)} aria-label={'Conoce a ' + (mascota.nombre || 'esta mascota')}>
        <MascotaFoto mascota={mascota} priority={index < 3} />
        <div className="pet-card-body">
          <h3 className="pet-card-name"><Icon name="paw" />{mascota.nombre || 'Nombre por conocer'}</h3>
          <dl className="pet-card-facts">
            <div><dt className="sr-only">Sexo</dt><dd><Icon name={sexIcon(mascota.sexo)} />{formatSex(mascota.sexo)}</dd></div>
            <div><dt className="sr-only">{age.label}</dt><dd><Icon name="birthday" />{age.value}{age.label === 'Edad al ingresar' && <span className="age-note">al ingresar</span>}</dd></div>
          </dl>
          <div className="pet-card-action"><span>Conóceme</span><span className="card-arrow"><Icon name="arrow" /></span></div>
        </div>
      </a>
    </article>
  );
}
