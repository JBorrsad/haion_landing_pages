import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)

	const handleLogin = async (e) => {
		e.preventDefault()
		setLoading(true)
		setError(null)

		// Convertir usuario a email si no contiene @
		const email = username.includes('@') ? username : `${username}@local.dev`

		try {
			const { data, error: signInError } = await supabase.auth.signInWithPassword({
				email,
				password,
			})

			if (signInError) {
				throw signInError
			}

			// Login exitoso: redirigir a admin
			window.location.href = '/admin'
		} catch (err) {
			console.error('error login:', err)
			setError(err.message || 'Error al iniciar sesión')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
			<div className="max-w-md w-full">
				<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
							Admin CMS
						</h1>
						<p className="text-gray-600 dark:text-gray-400">
							Haion Consulting
						</p>
					</div>

					<form onSubmit={handleLogin} className="space-y-6">
						<div>
							<label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Usuario o email
							</label>
							<input
								id="username"
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
								className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
								placeholder="admin"
								autoComplete="username"
							/>
						</div>

						<div>
							<label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Contraseña
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
								placeholder="••••••••"
								autoComplete="current-password"
							/>
						</div>

						{error && (
							<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
								{error}
							</div>
						)}

						<button
							type="submit"
							disabled={loading}
							className="w-full px-6 py-3 bg-yellow-200 hover:bg-yellow-300 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-semibold rounded-lg transition-colors"
						>
							{loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
						</button>
					</form>

					<div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
						<p>Acceso restringido solo para administradores</p>
					</div>
				</div>
			</div>
		</div>
	)
}

