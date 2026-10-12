# Adopta · APAQRO

Catálogo responsive de perros y gatos con React, Vite y Supabase.

## Desarrollo

```sh
npm install
npm run dev
```

En PowerShell, si la política de ejecución bloquea `npm.ps1`, usa `npm.cmd run dev`.

La conexión utiliza estas variables en `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu-clave-publicable
```

Usa la clave publicable del proyecto. Las variables `VITE_*` forman parte del cliente; nunca uses una clave `service_role` o secreta.

## Datos

El catálogo consulta `public.mascotas`. Usa las columnas `id`, `nombre`, `sexo`, `fecha_ingreso`, `edad_al_ingreso`, `fecha_nacimiento_estimada`, `convive_con`, `observaciones`, `temperamento`, `nivel_energia`, `estatus`, `foto`, `created_at` y `especie`.

- `especie`: admite `Perro` / `Gato`, sin importar mayúsculas, y equivalentes como `Canino` / `Felino`.
- `foto`: URL de imagen accesible por el navegador, por ejemplo una URL pública de Supabase Storage. Una foto ausente o que no carga muestra un placeholder local.
- La edad actual se calcula desde `fecha_nacimiento_estimada`. Si falta, se calcula con `fecha_ingreso` y una edad de ingreso con unidades explícitas (por ejemplo, `1 año`, `2 meses` o `1 año y 6 meses`). Si no se puede calcular, se indica que se muestra la edad al ingresar. En el detalle se conserva el texto original de `edad_al_ingreso`.
- Las fechas sin hora se interpretan como fechas locales para evitar que aparezca el día anterior.
- Se muestran todos los registros legibles de cada especie; `estatus` se presenta tal como está guardado, sin filtrar registros ni inventar disponibilidad.
- `id` identifica la ficha y `created_at` es un dato interno; no se exponen como datos de adopción.
- Los campos faltantes muestran `Por conocer`. El catálogo no crea ni modifica registros de mascotas.

La clave publicable debe tener permiso de lectura para los registros que quieras mostrar mediante tus políticas RLS. Si Supabase devuelve cero registros por una política de acceso, se verá un catálogo vacío; si devuelve un error, se podrá reintentar la carga.

## Navegación y personalización

- Inicio/perros: `#/perros` (predeterminado). Gatos: `#/gatos`.
- Ficha compartible y recargable: `#/mascotas/<uuid>`.
- Las rutas usan el fragmento de la URL; no requieren reglas de reescritura del servidor.
- Color de botones, iconos y acentos: `--color-primary` en `src/index.css`.
- Logo: `public/logo.png`, centrado en la barra de menú.
- Menú: `src/components/SiteHeader.jsx`. El enlace **Uso interno** abre `#/uso-interno`.
- Donaciones: define `VITE_DONATION_URL` o edita el placeholder en `SiteHeader.jsx`. Mientras esté vacío, el botón azul no navega.
- Ficha individual: `src/pages/MascotaDetalle.jsx`.
- Grid: tres columnas en escritorio, dos en tablet y una en móvil.

## Área interna y fotos

La página privada usa Supabase Auth para validar el código del equipo y Supabase Storage para guardar las fotos en tres apartados: animales nuevos, eventos y colaboradores. Cada uno incluye selección múltiple, vistas previas, validación, estado de subida y galería privada.

Para activar la cuenta y los permisos, sigue [supabase/README.md](supabase/README.md). El código y el token administrativo pertenecen a `.env.local`; nunca se publican mediante variables `VITE_*`.

## Verificación

```sh
npm run build
npm test
```
