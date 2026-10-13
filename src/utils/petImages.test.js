import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchPetImage, getPetImageSources } from './petImages.js';

test('Napoleón conserva su enlace original y prueba napoleon.png sin cambiar el registro', () => {
  const mascota = Object.freeze({ nombre: 'Napoleón', foto: 'https://example.test/storage/v1/object/public/mascotas/napole%C3%B3n.png' });
  assert.deepEqual(getPetImageSources(mascota.foto), [mascota.foto, 'https://example.test/storage/v1/object/public/mascotas/napoleon.png']);
  assert.equal(mascota.nombre, 'Napoleón');
});

test('normaliza tildes, diéresis y eñes, también Unicode descompuesto', () => {
  for (const name of ['ÁÉÍÓÚ-Ü-Ñ', 'ÁÉÍÓÚ-Ü-Ñ'.normalize('NFD')]) {
    assert.deepEqual(getPetImageSources(`/fotos/${name}.PNG`), [`/fotos/${name}.PNG`, '/fotos/AEIOU-U-N.PNG', '/fotos/aeiou-u-n.png']);
  }
  assert.deepEqual(getPetImageSources('fotos/Napoleón.png'), ['fotos/Napoleón.png', 'fotos/Napoleon.png', 'fotos/napoleon.png']);
});

test('mantiene carpetas, parámetros, fragmentos y caracteres reservados codificados', () => {
  const prefix = 'https://example.test/álbum/cachorros/';
  const suffix = '?token=A%2BB%2FC&download=Napole%C3%B3n.png#vista';
  assert.deepEqual(getPetImageSources(`${prefix}napole%C3%B3n%20%231%2F2.png${suffix}`), [
    `${prefix}napole%C3%B3n%20%231%2F2.png${suffix}`,
    `${prefix}napoleon%20%231%2F2.png${suffix}`,
  ]);
});

test('no inventa URLs para fotos vacías ni cambia URLs sin acentos o de otros esquemas', () => {
  for (const empty of [null, undefined, '', '  ', 0]) assert.deepEqual(getPetImageSources(empty), []);
  for (const source of ['/fotos/Luna.png', '/fotos/ni%C3%B1o%.png', 'data:image/svg+xml,<svg>ü</svg>', 'blob:https://example.test/ü', 'https://example.test/álbum/', 'https://álbum.test']) {
    assert.deepEqual(getPetImageSources(source), [source]);
  }
});

test('no solicita variantes si el archivo original con acento existe', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => new Response('image', { status: 200 }));
  const result = await fetchPetImage('/fichas/napoleón.png');
  assert.equal(result.url, '/fichas/napoleón.png');
  assert.equal(await result.response.text(), 'image');
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('descarga la ficha usando el nombre sin acento cuando el original no existe', async (context) => {
  const options = { signal: AbortSignal.timeout(1000) };
  const fetchMock = context.mock.method(globalThis, 'fetch', async (url) => new Response('image', { status: url === '/fichas/napoleon.png' ? 200 : 400 }));
  const result = await fetchPetImage('/fichas/Napole%C3%B3n.png', options);
  assert.equal(result.url, '/fichas/napoleon.png');
  assert.deepEqual(fetchMock.mock.calls.map(({ arguments: args }) => args[0]), ['/fichas/Napole%C3%B3n.png', '/fichas/Napoleon.png', '/fichas/napoleon.png']);
  assert.ok(fetchMock.mock.calls.every(({ arguments: args }) => args[1].signal === options.signal));
});

test('limita los reintentos y propaga el fallo cuando ninguna imagen existe', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(fetchPetImage('/fotos/napoleón.png'), /No se pudo descargar/);
  assert.equal(fetchMock.mock.callCount(), 2);
});

test('una descarga cancelada no intenta otras variantes', async (context) => {
  const controller = new AbortController();
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => { controller.abort(); throw controller.signal.reason; });
  await assert.rejects(fetchPetImage('/fotos/napoleón.png', { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(fetchMock.mock.callCount(), 1);
});
