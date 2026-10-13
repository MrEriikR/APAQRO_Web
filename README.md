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

El catálogo consulta `public.mascotas`. Usa las columnas `id`, `nombre`, `sexo`, `fecha_ingreso`, `edad_al_ingreso`, `fecha_nacimiento_estimada`, `convive_con`, `observaciones`, `temperamento`, `nivel_energia`, `estatus`, `foto`, `ficha`, `created_at` y `especie`.

- `especie`: admite `Perro` / `Gato`, sin importar mayúsculas, y equivalentes como `Canino` / `Felino`.
- `foto`: URL de imagen accesible por el navegador, por ejemplo una URL pública de Supabase Storage. Una foto ausente o que no carga muestra un placeholder local.
- Si la foto o la ficha no carga y su nombre de archivo contiene tildes, diéresis o `ñ`, se reintenta sin esas marcas y, si hace falta, en minúsculas (por ejemplo, `napoleón.png` → `napoleon.png`). Se conserva primero la URL original y no se modifican carpetas ni parámetros del enlace. El nombre mostrado de la mascota y los datos de Supabase conservan sus caracteres originales.
- `ficha`: URL de la imagen que descarga el botón **Descargar ficha**, debajo de la foto en el detalle. Si está vacía, el botón no aparece. La URL debe permitir su lectura desde la app (CORS), como las URLs públicas de Supabase Storage.
- La edad actual se calcula desde `fecha_nacimiento_estimada`. Si falta, se calcula con `fecha_ingreso` y una edad de ingreso con unidades explícitas (por ejemplo, `1 año`, `2 meses` o `1 año y 6 meses`). Se muestra solo en años cumplidos a partir de un año, o solo en meses para menores de un año; antes del primer mes se muestra `Menos de 1 mes`. Si no se puede calcular, se indica que se muestra la edad al ingresar. En el detalle se conserva el texto original de `edad_al_ingreso`.
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

## Área interna y reportes

La página `#/uso-interno` usa Supabase Auth para validar el código del equipo y muestra un dashboard de mascotas. Consulta todos los registros legibles con la sesión del equipo, respetando las políticas RLS de `public.mascotas` y cargando todas las páginas de la consulta.

- Indicadores y tabla con filtros combinables de especie, sexo, estatus, edad actual, energía, temperamento, convivencia, nombre, ID, edad al ingresar, observaciones, presencia de fotos/fichas y fechas de ingreso, nacimiento y registro. **Más filtros** contiene los rangos y los campos adicionales. Las opciones de categorías provienen de los datos e incluyen `Sin dato` cuando corresponde.
- Los rangos de fecha incluyen ambos extremos; los timestamps usan el día local del navegador. La edad se calcula en meses cumplidos al cargar o actualizar el dashboard. Los rangos de edad y fecha excluyen los datos que no se pueden calcular; también se pueden consultar explícitamente los datos faltantes.
- La tabla permite ordenar, elegir columnas, paginar y seleccionar filas. La descarga incluye todos los resultados filtrados de todas las páginas; si hay filas seleccionadas, incluye únicamente esa selección. Cambiar filtros o actualizar datos limpia la selección de filas.
- Exportación en **CSV UTF-8**, **XLSX** y **XLS binario**. Las columnas y el orden coinciden con la vista previa. Excel incluye las hojas `Mascotas` y `Filtros`, con los criterios utilizados. Los IDs y las fechas originales se conservan como texto y la edad en meses es numérica; los campos faltantes se exportan vacíos.
- Se neutralizan fórmulas en CSV y se escriben textos literales en Excel. Si se exceden los límites de XLS o de longitud de celda de Excel, se informa al usuario para elegir otro formato sin truncar datos.
- Excel se genera con [SheetJS desde su distribución oficial](https://docs.sheetjs.com/docs/getting-started/installation/frameworks/); la librería se carga al solicitar una descarga de Excel.

El dashboard reemplaza las galerías de fotos; los archivos almacenados previamente no se eliminan.

Para activar la cuenta del equipo, sigue [supabase/README.md](supabase/README.md). El código y el token administrativo pertenecen a `.env.local`; nunca se publican mediante variables `VITE_*`. La cuenta autenticada del equipo necesita permiso de lectura en `public.mascotas` para consultar reportes.

## Verificación

```sh
npm run build
npm test
```
