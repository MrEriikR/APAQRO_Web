import { useSyncExternalStore } from 'react';

function subscribe(callback) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

export default function useHashRoute() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  if (hash === '#/uso-interno') return { page: 'internal', hash };
  const parts = hash.split('/');
  const detail = parts[0] === '#' && parts[1] === 'mascotas' && parts[2] && parts.length === 3;
  return detail
    ? { page: 'detail', id: parts[2], hash }
    : { page: 'catalog', species: hash === '#/gatos' ? 'gato' : 'perro', hash };
}
