import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const PAGES = ['home', 'contacto', 'fiscal', 'laboral', 'contable', 'servicios']

export default function Admin() {
	const [session, setSession] = useState(null)
	const [loading, setLoading] = useState(true)
	const [selectedPage, setSelectedPage] = useState('home')
	const [content, setContent] = useState([])
	const [saving, setSaving] = useState(false)
	const [publishing, setPublishing] = useState(false)
	const [message, setMessage] = useState(null)
	const [needsPasswordChange, setNeedsPasswordChange] = useState(false)

	useEffect(() => {
		// Verificar sesión
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session)
			setLoading(false)
			
			// Verificar si la contraseña es "admin" (esto es aproximado, en producción se haría diferente)
			if (session && session.user.email.includes('admin@local.dev')) {
				setNeedsPasswordChange(true)
			}
		})

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session)
		})

		return () => subscription.unsubscribe()
	}, [])

	useEffect(() => {
		if (session) {
			loadContent()
		}
	}, [session, selectedPage])

	const loadContent = async () => {
		try {
			const { data, error } = await supabase
				.from('copy')
				.select('*')
				.eq('page', selectedPage)
				.eq('locale', 'es')
				.order('key')

			if (error) throw error

			setContent(data || [])
		} catch (err) {
			console.error('error cargando contenido:', err)
			setMessage({ type: 'error', text: 'Error al cargar contenido' })
		}
	}

	const handleLogout = async () => {
		await supabase.auth.signOut()
		window.location.href = '/login'
	}

	const handleSave = async () => {
		setSaving(true)
		setMessage(null)

		try {
			const updates = content.map((item) => ({
				...item,
				owner: session.user.id,
				updated_at: new Date().toISOString(),
			}))

			for (const item of updates) {
				const { error } = await supabase
					.from('copy')
					.upsert(item, { onConflict: 'page,key,locale' })

				if (error) throw error
			}

			setMessage({ type: 'success', text: 'Contenido guardado correctamente' })
			setTimeout(() => setMessage(null), 3000)
		} catch (err) {
			console.error('error guardando:', err)
			setMessage({ type: 'error', text: 'Error al guardar: ' + err.message })
		} finally {
			setSaving(false)
		}
	}

	const handlePublish = async () => {
		setPublishing(true)
		setMessage(null)

		try {
			// Primero guardar cambios
			await handleSave()

			// Llamar a Edge Function para disparar rebuild
			const { data: { session } } = await supabase.auth.getSession()
			
			const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
			const edgeFunctionUrl = `${supabaseUrl}/functions/v1/rebuild`
			
			const response = await fetch(edgeFunctionUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${session?.access_token}`,
				},
			})

			if (!response.ok) {
				throw new Error('Error al disparar rebuild')
			}

			setMessage({ type: 'success', text: 'Deploy iniciado correctamente. El sitio se actualizará en unos minutos.' })
		} catch (err) {
			console.error('error publicando:', err)
			setMessage({ type: 'error', text: 'Error al publicar: ' + err.message })
		} finally {
			setPublishing(false)
		}
	}

	const handleImageUpload = async (itemIndex, file) => {
		if (!file) return

		try {
			const fileExt = file.name.split('.').pop()
			const fileName = `${selectedPage}/${Date.now()}.${fileExt}`

			// Subir a storage
			const { data, error } = await supabase.storage
				.from('assets')
				.upload(fileName, file)

			if (error) throw error

			// Obtener URL pública
			const { data: { publicUrl } } = supabase.storage
				.from('assets')
				.getPublicUrl(fileName)

			// Actualizar contenido con la nueva URL
			const newContent = [...content]
			newContent[itemIndex].value = publicUrl
			setContent(newContent)

			setMessage({ type: 'success', text: 'Imagen subida correctamente' })
			setTimeout(() => setMessage(null), 3000)
		} catch (err) {
			console.error('error subiendo imagen:', err)
			setMessage({ type: 'error', text: 'Error al subir imagen: ' + err.message })
		}
	}

	const handleValueChange = (index, newValue) => {
		const newContent = [...content]
		newContent[index].value = newValue
		setContent(newContent)
	}

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<p className="text-gray-600 dark:text-gray-400">Cargando...</p>
			</div>
		)
	}

	if (!session) {
		if (typeof window !== 'undefined') {
			window.location.href = '/login'
		}
		return null
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			{/* Header */}
			<header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
								CMS Admin
							</h1>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								{session.user.email}
							</p>
						</div>
						<div className="flex items-center gap-4">
							<button
								onClick={handleSave}
								disabled={saving}
								className="px-4 py-2 bg-yellow-200 hover:bg-yellow-300 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-medium rounded-lg transition-colors"
							>
								{saving ? 'Guardando...' : 'Guardar'}
							</button>
							<button
								onClick={handlePublish}
								disabled={publishing}
								className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
							>
								{publishing ? 'Publicando...' : 'Publicar'}
							</button>
							<button
								onClick={handleLogout}
								className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
							>
								Salir
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* Banner de advertencia si necesita cambiar contraseña */}
			{needsPasswordChange && (
				<div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
						<p className="text-yellow-800 dark:text-yellow-400 text-sm">
							⚠️ <strong>Seguridad:</strong> Cambia tu contraseña por defecto desde el dashboard de Supabase.
						</p>
					</div>
				</div>
			)}

			{/* Mensaje de feedback */}
			{message && (
				<div className={`border-b ${
					message.type === 'success'
						? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
						: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
				}`}>
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
						<p className={`text-sm ${
							message.type === 'success'
								? 'text-green-800 dark:text-green-400'
								: 'text-red-800 dark:text-red-400'
						}`}>
							{message.text}
						</p>
					</div>
				</div>
			)}

			{/* Tabs de páginas */}
			<div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<nav className="flex gap-4 overflow-x-auto">
						{PAGES.map((page) => (
							<button
								key={page}
								onClick={() => setSelectedPage(page)}
								className={`px-4 py-3 font-medium border-b-2 transition-colors capitalize ${
									selectedPage === page
										? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
										: 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
								}`}
							>
								{page}
							</button>
						))}
					</nav>
				</div>
			</div>

			{/* Contenido */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="space-y-6">
					{content.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-gray-600 dark:text-gray-400">
								No hay contenido para esta página. Crea registros en la base de datos.
							</p>
						</div>
					) : (
						content.map((item, index) => (
							<div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
								<div className="mb-2">
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
										{item.key}
									</label>
									<span className="text-xs text-gray-500 dark:text-gray-400">
										{item.type}
									</span>
								</div>

								{item.type === 'image' ? (
									<div className="space-y-2">
										<input
											type="text"
											value={item.value}
											onChange={(e) => handleValueChange(index, e.target.value)}
											className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
											placeholder="URL de la imagen"
										/>
										<div className="flex items-center gap-2">
											<input
												type="file"
												accept="image/*"
												onChange={(e) => handleImageUpload(index, e.target.files[0])}
												className="text-sm text-gray-600 dark:text-gray-400"
											/>
										</div>
										{item.value && (
											<img
												src={item.value}
												alt={item.key}
												className="mt-2 max-w-xs rounded-lg border border-gray-200 dark:border-gray-700"
											/>
										)}
									</div>
								) : item.type === 'markdown' ? (
									<textarea
										value={item.value}
										onChange={(e) => handleValueChange(index, e.target.value)}
										rows={6}
										className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
									/>
								) : (
									<textarea
										value={item.value}
										onChange={(e) => handleValueChange(index, e.target.value)}
										rows={3}
										className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
									/>
								)}
							</div>
						))
					)}
				</div>
			</main>
		</div>
	)
}

