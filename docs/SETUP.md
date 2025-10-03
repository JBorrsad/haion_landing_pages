# Setup y Configuración del CMS

## Variables de Entorno

### Frontend (Astro/Vite) - Archivo `.env`

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Supabase public credentials (seguras para el navegador)
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

**Importante:**
- Estas variables son **públicas** y se exponen en el navegador
- Solo usar `ANON_KEY`, **nunca** `SERVICE_ROLE`
- El RLS de Supabase protege los datos

### GitHub Actions - Secrets del Repositorio

Configura estos secrets en: `Settings → Secrets and variables → Actions`

```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE=tu-service-role-key-aqui
```

**Importante:**
- `SERVICE_ROLE` solo para GitHub Actions
- **Nunca** expongas `SERVICE_ROLE` en el código frontend
- **Nunca** commits estos valores al repositorio

### Edge Function (Supabase) - Variables de Entorno

Configura en Supabase Dashboard: `Edge Functions → rebuild → Settings`

```
GH_REPO_TOKEN=ghp_tu-github-token-aqui
GH_OWNER=tu-usuario-github
GH_REPO=nombre-del-repo
ADMIN_UID=uuid-del-usuario-admin
ALLOWED_ORIGIN=https://tu-sitio.github.io
```

**Generar GitHub Token:**
1. Ve a GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Scopes necesarios:
   - `repo` (full control)
   - `workflow`
4. Copia el token y guárdalo en `GH_REPO_TOKEN`

**Obtener ADMIN_UID:**
1. Ve a Supabase Dashboard → Authentication → Users
2. Crea el usuario admin (ver siguiente sección)
3. Copia su UUID y guárdalo en `ADMIN_UID`

## Configuración Inicial

### 1. Crear Usuario Admin en Supabase

1. Ve a Supabase Dashboard → Authentication → Users
2. Click en "Add user" → "Create new user"
3. Configura:
   - Email: `admin@local.dev` (o el que prefieras)
   - Password: `admin` (cámbialo después del primer login)
   - Email Confirmed: ✅ **Importante: marcar como confirmado**
4. Copia el UUID del usuario (se muestra en la lista)
5. Guarda este UUID en la variable `ADMIN_UID` de la Edge Function

### 2. Crear Bucket de Storage

1. Ve a Supabase Dashboard → Storage
2. Click en "New bucket"
3. Nombre: `assets`
4. Public: ✅ (marcar como público)
5. File size limit: 50 MB (ajustar según necesidad)
6. Allowed MIME types: `image/*` (ajustar según necesidad)

### 3. Configurar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. Source: "GitHub Actions"
4. Configura los secrets (ver sección anterior)

### 4. Desplegar Edge Function

Desde la terminal, con Supabase CLI instalado:

```bash
# Login a Supabase
supabase login

# Link al proyecto
supabase link --project-ref tu-project-ref

# Deploy de la función
supabase functions deploy rebuild
```

O manualmente desde el dashboard:
1. Ve a Edge Functions → Create function
2. Nombre: `rebuild`
3. Pega el código de `supabase/functions/rebuild/index.ts`
4. Configura las variables de entorno

### 5. Insertar Contenido Inicial

El contenido inicial ya está en Supabase si ejecutaste las seeds de la Fase 2.

Si necesitas agregar más contenido:

1. Accede a `/login` en tu sitio local o desplegado
2. Usuario: `admin` (o el email configurado)
3. Password: el configurado
4. Navega a `/admin` y edita el contenido

O manualmente en Supabase:

```sql
-- Insertar contenido de ejemplo
insert into public.copy (page, key, value, type, locale, owner)
values
	('home', 'hero.title', 'Mi título', 'text', 'es', '<UUID_DEL_ADMIN>')
on conflict (page, key, locale) do update
set value = excluded.value, owner = excluded.owner, updated_at = now();
```

## Flujo de Trabajo

### Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env (ver arriba)

# 3. Sincronizar contenido desde Supabase (opcional)
node scripts/sync-from-supabase.mjs

# 4. Iniciar servidor de desarrollo
npm run dev

# 5. Acceder a:
# - Sitio: http://localhost:4321
# - Admin: http://localhost:4321/admin
# - Login: http://localhost:4321/login
```

### Editar Contenido

1. Accede a `/login`
2. Inicia sesión con credenciales de admin
3. Ve a `/admin`
4. Selecciona la página a editar
5. Modifica los campos de texto/imagen
6. Click en "Guardar" → guarda en Supabase
7. Click en "Publicar" → dispara deploy automático

### Deploy Automático

Cuando pulsas "Publicar" en `/admin`:

1. Se guarda el contenido en Supabase
2. Se llama a la Edge Function `/rebuild`
3. La Edge Function dispara `repository_dispatch` en GitHub
4. GitHub Actions se ejecuta:
   - Checkout del código
   - Instala dependencias
   - Sincroniza contenido de Supabase → `content/*.json`
   - Build de Astro
   - Deploy a GitHub Pages
5. El sitio se actualiza en ~2-3 minutos

## Seguridad

### ✅ Buenas Prácticas

- RLS habilitado en tabla `copy`
- Solo lectura pública, escritura solo para owner
- Edge Function valida JWT y UID del admin
- CORS configurado para dominio específico
- Variables sensibles solo en GitHub Secrets y Edge Function
- Admin y login excluidos del sitemap (noindex)

### ❌ Nunca Hacer

- ❌ Exponer `SERVICE_ROLE` en el frontend
- ❌ Subir tokens o secrets al repositorio
- ❌ Permitir escritura a usuarios anónimos
- ❌ Usar contraseñas débiles para admin
- ❌ Deshabilitar RLS en producción

### Cambiar Contraseña de Admin

**Importante:** Cambia la contraseña por defecto en el primer login.

Desde Supabase Dashboard:
1. Authentication → Users
2. Click en el usuario admin
3. "Send password recovery"
4. O resetea manualmente la contraseña

O desde el código (futuro):
- Implementar cambio de contraseña en `/admin`

## Troubleshooting

### "Error al publicar"

- Verifica que `ADMIN_UID` coincida con el UUID del usuario
- Verifica que `GH_REPO_TOKEN` tenga permisos correctos
- Revisa logs de la Edge Function en Supabase

### "Content not found"

- Ejecuta `node scripts/sync-from-supabase.mjs` localmente
- Verifica que la tabla `copy` tenga datos
- Verifica que las variables `SUPABASE_*` estén configuradas

### Build falla en GitHub Actions

- Verifica que los secrets estén configurados
- Revisa logs en Actions → último workflow
- Verifica que `content/*.json` se generen correctamente

### Admin no carga

- Verifica que las variables `PUBLIC_SUPABASE_*` estén en `.env`
- Verifica que el usuario exista en Supabase Auth
- Abre DevTools Console y revisa errores

