import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders })
	}

	try {
		// Verificar variables de entorno
		const GH_REPO_TOKEN = Deno.env.get('GH_REPO_TOKEN')
		const GH_OWNER = Deno.env.get('GH_OWNER')
		const GH_REPO = Deno.env.get('GH_REPO')
		const ADMIN_UID = Deno.env.get('ADMIN_UID')
		const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN')

		if (!GH_REPO_TOKEN || !GH_OWNER || !GH_REPO || !ADMIN_UID) {
			throw new Error('Missing required environment variables')
		}

		// Verificar origen (opcional - JWT es suficiente seguridad)
		const origin = req.headers.get('origin')
		// Permitir haion-consulting.es y cualquier subdominio de github.io
		const allowedOrigins = [
			'https://haion-consulting.es',
			'http://localhost:4321',
			'http://localhost:4322'
		]
		
		const isAllowedOrigin = allowedOrigins.some(allowed => origin?.startsWith(allowed)) || 
			origin?.includes('.github.io')
		
		if (ALLOWED_ORIGIN && origin && !isAllowedOrigin) {
			console.log('Origin not allowed:', origin)
			// Por ahora solo log, no bloqueamos (JWT es la seguridad real)
		}

		// Verificar autenticación del usuario
		const authHeader = req.headers.get('Authorization')
		if (!authHeader) {
			throw new Error('Missing authorization header')
		}

		const supabaseClient = createClient(
			Deno.env.get('SUPABASE_URL') ?? '',
			Deno.env.get('SUPABASE_ANON_KEY') ?? '',
			{
				global: {
					headers: { Authorization: authHeader },
				},
			}
		)

		const {
			data: { user },
			error: userError,
		} = await supabaseClient.auth.getUser()

		if (userError || !user) {
			throw new Error('Invalid authentication')
		}

		// Verificar que el usuario es admin
		if (user.id !== ADMIN_UID) {
			return new Response(
				JSON.stringify({ error: 'Unauthorized: Admin access required' }),
				{
					status: 403,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				}
			)
		}

		// Disparar repository_dispatch en GitHub
		const dispatchResponse = await fetch(
			`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/dispatches`,
			{
				method: 'POST',
				headers: {
					'Accept': 'application/vnd.github+json',
					'Authorization': `Bearer ${GH_REPO_TOKEN}`,
					'X-GitHub-Api-Version': '2022-11-28',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					event_type: 'cms_update',
					client_payload: {
						user: user.email,
						timestamp: new Date().toISOString(),
					},
				}),
			}
		)

		if (!dispatchResponse.ok) {
			const errorText = await dispatchResponse.text()
			console.error('github dispatch error:', errorText)
			throw new Error(`GitHub API error: ${dispatchResponse.status}`)
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Deploy triggered successfully',
				user: user.email,
			}),
			{
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		)

	} catch (error) {
		console.error('error in rebuild function:', error)

		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			}
		)
	}
})

