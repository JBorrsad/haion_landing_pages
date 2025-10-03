# Guía de Imágenes y SEO

## Gestión de Imágenes en el CMS

### Subida de Imágenes

Las imágenes se pueden subir desde el panel `/admin` en dos formas:

1. **Subir a Supabase Storage:**
   - Usar el botón "Choose File" en campos de tipo `image`
   - La imagen se sube al bucket `assets`
   - Se genera automáticamente una URL pública
   - Esta URL se guarda en el campo `value`

2. **URL Externa:**
   - Escribir directamente una URL en el campo
   - Útil para imágenes ya alojadas

### Buenas Prácticas SEO

#### 1. Alt Text Obligatorio

**Siempre** añade un campo separado para el alt text de cada imagen:

```json
{
  "hero.image": "/img/hero.jpg",
  "hero.imageAlt": "Descripción clara y accesible"
}
```

El alt text debe:

- Describir el contenido de la imagen
- Ser conciso (máximo 125 caracteres)
- Incluir keywords relevantes de forma natural
- No usar "imagen de" o "foto de"

#### 2. Atributos Width y Height

Para evitar CLS (Cumulative Layout Shift), especifica siempre las dimensiones:

```astro
<img
	src={content.hero.image}
	alt={content.hero.imageAlt}
	width="1920"
	height="1080"
/>
```

#### 3. Formato y Optimización

- **Formato preferido:** WebP (con fallback a JPEG/PNG)
- **Tamaño máximo:** 200KB por imagen
- **Dimensiones recomendadas:**
  - Hero: 1920x1080px
  - Tarjetas: 800x600px
  - Iconos: 512x512px

#### 4. Responsive Images

Usa `srcset` para imágenes responsivas:

```astro
<img
	src={content.hero.image}
	alt={content.hero.imageAlt}
	srcset={content.hero.imageSrcset}
	sizes="(max-width: 768px) 100vw, 1920px"
	width="1920"
	height="1080"
/>
```

### Estructura de Contenido para Imágenes

En los JSON de contenido, organiza las imágenes así:

```json
{
  "hero": {
    "title": "Título",
    "image": "/img/hero.jpg",
    "imageAlt": "Descripción accesible",
    "imageWidth": 1920,
    "imageHeight": 1080,
    "imageSrcset": "/img/hero-800.jpg 800w, /img/hero-1920.jpg 1920w"
  }
}
```

### SEO: Robots y Sitemap

#### Excluir Admin de Indexación

El sitemap y robots.txt ya están configurados para excluir:

- `/admin`
- `/login`

Estas páginas tienen `<meta name="robots" content="noindex, nofollow" />`.

#### Mantener Sitemap Actualizado

El sitemap se genera automáticamente en el build con `@astrojs/sitemap`.

Solo incluye:

- Páginas públicas del sitio
- Excluye admin, login y páginas draft

### Descarga de Imágenes (Opcional)

Para versionar imágenes localmente y mejorar SEO:

1. En GitHub Actions, configura `DOWNLOAD_ASSETS=true`
2. El script `sync-from-supabase.mjs` descargará imágenes a `public/cms/`
3. Las URLs en los JSON se reescriben automáticamente

**Ventajas:**

- Imágenes versionadas con el código
- Mejor control de caché
- URLs relativas (mejor para SEO)
- No depende de Supabase Storage en producción

## Checklist SEO de Imágenes

- [ ] Todas las imágenes tienen alt text
- [ ] Alt text es descriptivo y conciso
- [ ] Width y height especificados
- [ ] Imágenes optimizadas (< 200KB)
- [ ] Formato WebP con fallback
- [ ] Srcset para responsive (opcional)
- [ ] Admin y login excluidos del sitemap
- [ ] Meta robots noindex en admin/login
