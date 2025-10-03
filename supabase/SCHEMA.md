# Esquema de Base de Datos - CMS Estático

## Tabla `public.copy`

Almacena todo el contenido editable del sitio.

### Estructura

```sql
- id: uuid (PK, auto)
- page: text (nombre de la página: 'home', 'contacto', 'fiscal', etc.)
- key: text (clave del contenido: 'hero.title', 'cta.buttonText', etc.)
- value: text (valor del contenido)
- type: text (tipo: 'text', 'markdown', 'image', default: 'text')
- locale: text (idioma: 'es', default: 'es')
- updated_at: timestamptz (timestamp de última actualización)
- owner: uuid (FK a auth.users, usuario que editó por última vez)
```

### Índices

- `copy_page_locale_idx`: índice en (page, locale) para queries rápidas
- `copy_unique_idx`: índice único en (page, key, locale) para evitar duplicados

### RLS (Row Level Security)

- **Lectura pública:** cualquier usuario anónimo puede leer (para el sitio estático)
- **Escritura restringida:** solo usuarios autenticados pueden escribir, y solo si `auth.uid() = owner`

## Storage Bucket `assets`

Almacena imágenes y archivos multimedia editables desde el admin.

### Configuración

- **Público:** sí (para servir imágenes en el sitio estático)
- **Tamaño máximo por archivo:** 50MB (configurable)
- **Tipos permitidos:** image/*, video/* (configurable)

## Usuario Admin

Para usar el CMS, necesitas crear un usuario admin en Supabase:

1. Ve a Supabase Dashboard → Authentication → Users
2. Crea un nuevo usuario:
	- Email: `admin@local.dev` (o el que prefieras)
	- Password: `admin` (cámbialo en el primer login)
	- Email confirmed: ✅ (marca como confirmado)
3. Copia el UUID del usuario creado
4. Actualiza las variables de entorno:
	- En Supabase Edge Function: `ADMIN_UID=<uuid-copiado>`
	- En el código, puedes agregar validaciones adicionales

### Seeds iniciales

Los seeds se insertan con `owner = '<ADMIN_UID>'`. Debes reemplazar `<ADMIN_UID>` con el UUID real del usuario admin que creaste.

```sql
-- Ejemplo:
insert into public.copy (page, key, value, type, locale, owner)
values
	('home', 'hero.title', 'Asesoría integral para empresas', 'text', 'es', '<ADMIN_UID>');
```

## Migraciones

Las migraciones se almacenan en:
- Supabase gestionado: automático vía MCP
- Historial visible en Supabase Dashboard → Database → Migrations

