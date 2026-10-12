import { readFile } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { INTERNAL_BUCKET, MAX_PHOTO_BYTES, PHOTO_TYPES } from '../src/utils/internalPhotos.js';

// Server-side setup only. Never import this script into src/ or expose its env vars with VITE_.
const env = { ...loadEnv('development', process.cwd(), ''), ...process.env };
const email = 'equipo-interno@apaqro.org';

async function setup() {
  for (const name of ['VITE_SUPABASE_URL', 'SUPABASE_ACCESS_TOKEN', 'SUPABASE_INTERNAL_ACCESS_CODE']) {
    if (!env[name]) throw new Error(`Añade ${name} a .env.local antes de ejecutar la configuración.`);
  }
  const projectUrl = new URL(env.VITE_SUPABASE_URL);
  if (projectUrl.protocol !== 'https:' || !/^[a-z0-9]+\.supabase\.co$/.test(projectUrl.hostname)) throw new Error('VITE_SUPABASE_URL debe ser la URL HTTPS del proyecto Supabase.');
  const ref = projectUrl.hostname.split('.')[0];
  const sql = await readFile(new URL('../supabase/internal-storage.sql', import.meta.url), 'utf8');

  async function management(endpoint, options = {}) {
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/${endpoint}`, {
      ...options,
      headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Supabase Management respondió HTTP ${response.status}. Comprueba el token y sus permisos sobre este proyecto.`);
    return response.json();
  }

  const keys = await management('api-keys?reveal=true');
  const adminKey = keys.find((key) => key.name === 'service_role' && key.api_key)?.api_key
    || keys.find((key) => key.type === 'secret' && key.api_key)?.api_key;
  if (!adminKey) throw new Error('El token no pudo obtener una clave administrativa del proyecto.');
  const admin = createClient(projectUrl.origin, adminKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, options = {}) => fetch(input, { ...options, signal: AbortSignal.timeout(30000) }) } });

  let existing = null;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error('No se pudo comprobar la cuenta interna en Supabase Auth.');
    existing = data.users.find((user) => user.email?.toLowerCase() === email);
    if (existing || data.users.length < 100) break;
  }
  if (existing && existing.app_metadata?.apaqro_role !== 'team') throw new Error('La dirección de la cuenta interna ya pertenece a otro usuario. No se modificó esa cuenta.');

  const { data: buckets, error: bucketError } = await admin.storage.listBuckets();
  if (bucketError) throw new Error('No se pudieron consultar los buckets de Storage.');
  const bucketExists = buckets.some((bucket) => bucket.id === INTERNAL_BUCKET);

  await management('database/query', { method: 'POST', body: JSON.stringify({ query: sql }) });
  console.log('Políticas privadas de lectura y subida configuradas.');

  const options = { public: false, fileSizeLimit: MAX_PHOTO_BYTES, allowedMimeTypes: Object.keys(PHOTO_TYPES) };
  const { error: storageError } = bucketExists
    ? await admin.storage.updateBucket(INTERNAL_BUCKET, options)
    : await admin.storage.createBucket(INTERNAL_BUCKET, options);
  if (storageError) throw new Error('No se pudo configurar el bucket privado.');
  console.log('Bucket privado apaqro-interno preparado.');

  const attributes = { password: env.SUPABASE_INTERNAL_ACCESS_CODE, email_confirm: true, app_metadata: { ...existing?.app_metadata, apaqro_role: 'team' } };
  const { error: userError } = existing
    ? await admin.auth.admin.updateUserById(existing.id, attributes)
    : await admin.auth.admin.createUser({ ...attributes, email });
  if (userError) throw new Error('No se pudo configurar la cuenta del equipo. Revisa los requisitos de contraseña de Supabase Auth.');
  console.log('Cuenta interna preparada. El acceso se valida en Supabase Auth.');
  console.log('Configuración completa. Abre #/uso-interno e ingresa el código del equipo.');
}

setup().catch((error) => { console.error(error.message); process.exitCode = 1; });
