import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import AdminHome from './admin/AdminHome'

const PAGES = [
	{ id: 'home', label: 'Inicio' },
	{ id: 'contacto', label: 'Contacto' },
	{ id: 'fiscal', label: 'Fiscal' },
	{ id: 'laboral', label: 'Laboral' },
	{ id: 'contable', label: 'Contable' },
	{ id: 'servicios', label: 'Servicios' }
]

export default function AdminNew() {
	const [session, setSession] = useState(null)
	const [loading, setLoading] = useState(true)
	const [selectedPage, setSelectedPage] = useState('home')
	const [publishing, setPublishing] = useState(false)
	const [message, setMessage] = useState(null)

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session)
			setLoading(false)
		})

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session)
		})

		return () => subscription.unsubscribe()
	}, [])

	const handleLogout = async () => {
		await supabase.auth.signOut()
		window.location.href = '/login'
	}

	const handlePublish = async () => {
		setPublishing(true)
		setMessage(null)

		try {
			const { data: { session } } = await supabase.auth.getSession()
			
			const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
			const edgeFunctionUrl = `${supabaseUrl}/functions/v1/rebuild`
			
			const response = await fetch(edgeFunctionUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${session?.access_token}`,
					'Origin': window.location.origin,
				},
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				console.error('Error publicando:', errorData)
				throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
			}

			setMessage({ 
				type: 'success', 
				text: '✅ Publicación iniciada. El sitio se actualizará en 2-3 minutos.' 
			})
		} catch (err) {
			console.error('error publicando:', err)
			setMessage({ type: 'error', text: 'Error al publicar: ' + err.message })
		} finally {
			setPublishing(false)
		}
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
			<header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
								Editor de Contenido
							</h1>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								{session.user.email}
							</p>
						</div>
						<div className="flex items-center gap-3">
							<button
								onClick={handlePublish}
								disabled={publishing}
								className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
							>
								{publishing ? 'Publicando...' : '🚀 Publicar Cambios'}
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

			{/* Mensaje global */}
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

			{/* Tabs */}
			<div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<nav className="flex gap-2 overflow-x-auto">
						{PAGES.map((page) => (
							<button
								key={page.id}
								onClick={() => setSelectedPage(page.id)}
								className={`px-5 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
									selectedPage === page.id
										? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
										: 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
								}`}
							>
								{page.label}
							</button>
						))}
					</nav>
				</div>
			</div>

			{/* Contenido */}
			<main className="max-w-7xl mx-auto py-8">
				{selectedPage === 'home' && <AdminHome userId={session.user.id} />}
				{selectedPage !== 'home' && (
					<div className="text-center py-12 text-gray-600 dark:text-gray-400">
						<p>Editor específico para {PAGES.find(p => p.id === selectedPage)?.label} en desarrollo.</p>
						<p className="text-sm mt-2">Por ahora, usa la pestaña "Inicio" que ya está lista.</p>
					</div>
				)}
			</main>
		</div>
	)
}

