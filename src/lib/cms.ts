/**
 * CMS Helper - Carga contenido estático desde JSON
 * 
 * Este helper permite cargar contenido de archivos JSON generados
 * por el script de sincronización desde Supabase.
 * 
 * El contenido se importa estáticamente en build-time, no en runtime.
 */

import homeEs from '../../content/es/home.json'
import contactoEs from '../../content/es/contacto.json'
import fiscalEs from '../../content/es/fiscal.json'
import laboralEs from '../../content/es/laboral.json'
import contableEs from '../../content/es/contable.json'
import serviciosEs from '../../content/es/servicios.json'

type Locale = 'es'
type Page = 'home' | 'contacto' | 'fiscal' | 'laboral' | 'contable' | 'servicios'

const contentMap: Record<Locale, Record<Page, any>> = {
	es: {
		home: homeEs,
		contacto: contactoEs,
		fiscal: fiscalEs,
		laboral: laboralEs,
		contable: contableEs,
		servicios: serviciosEs,
	},
}

/**
 * Carga el contenido de una página en un idioma específico
 * @param page - Nombre de la página
 * @param locale - Código del idioma (default: 'es')
 * @returns Objeto con el contenido de la página
 */
export function loadContent(page: Page, locale: Locale = 'es'): any {
	const content = contentMap[locale]?.[page]
	
	if (!content) {
		console.warn(`⚠️ Content not found for page "${page}" in locale "${locale}"`)
		return {}
	}
	
	return content
}

/**
 * Obtiene un valor específico del contenido usando notación de punto
 * @param page - Nombre de la página
 * @param key - Clave del contenido (ej: 'hero.title')
 * @param locale - Código del idioma (default: 'es')
 * @returns Valor del contenido o undefined
 */
export function getContent(page: Page, key: string, locale: Locale = 'es'): any {
	const content = loadContent(page, locale)
	const keys = key.split('.')
	
	let value = content
	for (const k of keys) {
		if (value && typeof value === 'object' && k in value) {
			value = value[k]
		} else {
			console.warn(`⚠️ Content key "${key}" not found in page "${page}"`)
			return undefined
		}
	}
	
	return value
}

