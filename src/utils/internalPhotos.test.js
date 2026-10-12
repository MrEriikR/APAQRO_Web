import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhotoPath, MAX_PHOTO_BYTES, photoDisplayName, validatePhoto } from './internalPhotos.js';

const pngHeader = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

test('acepta cabeceras de JPG, PNG y WebP', async () => {
  assert.equal(await validatePhoto(new File([pngHeader], 'foto.png', { type: 'image/png' })), '');
  assert.equal(await validatePhoto(new File([new Uint8Array([255, 216, 255, 224])], 'foto.jpg', { type: 'image/jpeg' })), '');
  assert.equal(await validatePhoto(new File(['RIFF1234WEBP'], 'foto.webp', { type: 'image/webp' })), '');
});

test('rechaza archivos vacíos, demasiado grandes y tipos no permitidos', async () => {
  assert.match(await validatePhoto(new File([], 'vacio.png', { type: 'image/png' })), /vacío/);
  assert.match(await validatePhoto({ type: 'image/png', size: MAX_PHOTO_BYTES + 1 }), /6 MB/);
  assert.match(await validatePhoto(new File(['<svg />'], 'foto.svg', { type: 'image/svg+xml' })), /JPG, PNG o WebP/);
});

test('rechaza contenido disfrazado de imagen', async () => {
  assert.match(await validatePhoto(new File(['<script>alert(1)</script>'], 'foto.png', { type: 'image/png' })), /contenido/);
  assert.match(await validatePhoto(new File([pngHeader], 'foto.jpg', { type: 'image/jpeg' })), /contenido/);
});

test('las rutas quedan dentro del apartado y no sobrescriben nombres repetidos', () => {
  const file = new File([pngHeader], '../../Gubía y amigos.png', { type: 'image/png' });
  const first = createPhotoPath('animales-nuevos', file);
  const second = createPhotoPath('animales-nuevos', file);
  assert.equal(first.split('/').length, 2);
  assert.ok(first.startsWith('animales-nuevos/'));
  assert.ok(first.endsWith('_Gubia-y-amigos.png'));
  assert.notEqual(first, second);
  assert.equal(photoDisplayName(first.split('/')[1]), 'Gubia-y-amigos.png');
  assert.throws(() => createPhotoPath('../public', file), /inválido/);
});
