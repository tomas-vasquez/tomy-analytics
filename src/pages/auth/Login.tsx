import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

const REDIRECT_URL = `${window.location.origin}/auth/callback`

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError, data } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: REDIRECT_URL } })

    if (authError) {
      setError(authError.message)
    } else {
      if (mode === 'login' || data?.user?.aud === 'authenticated') {
        navigate('/onboarding', { replace: true })
      } else {
        setError('Revisa tu correo para confirmar tu cuenta')
        setMode('login')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Tomy Analytics</h1>
          <p className="text-slate-500 text-center text-sm mb-8">
            {mode === 'login' ? 'Inicia sesión' : 'Crea una cuenta'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button onClick={() => setMode('signup')} className="text-blue-600 hover:underline">
                  Registrarse
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button onClick={() => setMode('login')} className="text-blue-600 hover:underline">
                  Iniciar sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
