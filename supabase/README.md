# Configurar el área interna

La página `#/uso-interno` solicita únicamente el código. Internamente utiliza la cuenta compartida `equipo-interno@apaqro.org` en **Supabase Auth**. El código se verifica en el servidor y no se incluye en el JavaScript público.

Las fotos se guardan en el bucket **privado** `apaqro-interno`, dentro de `animales-nuevos/`, `eventos/` y `colaboradores/`. La tabla `mascotas` y sus fotos no se modifican al subir imágenes a estos apartados.

## Activación automática

1. Crea un token personal en [Supabase → Account → Access Tokens](https://supabase.com/dashboard/account/tokens) con permisos para administrar este proyecto, consultar sus claves y ejecutar SQL.
2. Añade `SUPABASE_ACCESS_TOKEN=...` a `.env.local`. El código solicitado ya está preparado en `SUPABASE_INTERNAL_ACCESS_CODE` en ese archivo local. No uses el prefijo `VITE_` para ninguno de esos dos valores.
3. Desde la raíz del proyecto, ejecuta:

   ```sh
   npm run setup:internal
   ```

   En PowerShell puedes usar `npm.cmd run setup:internal`.

4. Abre la app, entra a **Uso interno** e ingresa el código del equipo.

El script aplica `internal-storage.sql`, crea el bucket privado con un límite de 6 MB por archivo y formatos JPG/PNG/WebP, y crea la cuenta confirmada con el rol `app_metadata.apaqro_role = team`. Usa la API administrativa sin enviar correos. Si la cuenta ya existe pero no tiene el rol de equipo, se detiene sin modificarla.

El token personal solo se usa al ejecutar este script. Puedes retirarlo de `.env.local` después de configurar el proyecto. Repetir el script sobre la cuenta del equipo actualiza su código al valor local y mantiene privado el bucket.

## Configuración desde el panel como alternativa

1. En **Authentication → Users → Add user → Create new user**, crea `equipo-interno@apaqro.org`, usa el código acordado como contraseña y activa la confirmación automática.
2. En **Storage**, crea `apaqro-interno` con **Public bucket desactivado**, tamaño máximo **6291456 bytes** y tipos permitidos `image/jpeg`, `image/png`, `image/webp`.
3. Ejecuta el archivo `internal-storage.sql` en el SQL Editor.
4. Asigna el rol a esa cuenta desde el SQL Editor:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
     || '{"apaqro_role":"team"}'::jsonb
   where email = 'equipo-interno@apaqro.org';
   ```

5. Cierra cualquier sesión interna abierta y vuelve a entrar para recibir el rol actualizado.

## Acceso y comportamiento

- Las políticas de Storage comprueban el rol del JWT emitido por Supabase. Ocultar o manipular el formulario en el navegador no concede acceso a los archivos.
- Una política restrictiva impide que políticas públicas preexistentes den acceso a este bucket. Los demás buckets mantienen sus permisos.
- La sesión interna se guarda en `sessionStorage`, separada del catálogo público. Se restaura al recargar esa pestaña; **Cerrar sesión** termina esa sesión sin cerrar las de otros colaboradores.
- Las vistas previas usan enlaces firmados de 10 minutos, renovados mientras el área interna está abierta. Un enlace ya emitido puede seguir funcionando hasta que expire, incluso después de cerrar sesión.
- Solo se añaden permisos de lectura y subida. No se ofrecen acciones de eliminación o sobrescritura.
- Cada apartado permite seleccionar hasta 10 fotos, revisar vistas previas y reintentar las que fallen. Los nombres de Storage son únicos; las subidas no reemplazan fotos anteriores.
- El navegador comprueba formato, cabecera y tamaño; Storage también limita el MIME y el tamaño. Las galerías cargan seis fotos inicialmente y permiten ver más.

La configuración remota no está aplicada hasta que el script termine correctamente. Antes de eso, el formulario no podrá autenticar la cuenta y las fotos no se podrán subir.
