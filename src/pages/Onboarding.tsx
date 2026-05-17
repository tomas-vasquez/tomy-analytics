import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/auth/login', { replace: true })
        return
      }
      supabase.rpc('get_user_sites').then(({ data }) => {
        const sites = data as { id: string }[] | null
        if (sites && sites.length > 0) {
          navigate('/dashboard', { replace: true })
        } else {
          setLoading(false)
        }
      })
    })
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError(null)

    const { data, error: rpcError } = await supabase.rpc('create_site', {
      p_name: name.trim(),
      p_domain: domain.trim() || '',
    })

    if (rpcError) {
      setError(rpcError.message)
      setCreating(false)
      return
    }

    const result = data as { error?: string; id?: string }
    if (result.error) {
      setError(result.error)
      setCreating(false)
      return
    }

    navigate('/dashboard', { replace: true })
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Bienvenido a Tomy Analytics</h1>
          <p className="text-slate-500 text-center text-sm mb-8">
            Crea tu primer sitio para empezar a medir
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre del sitio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Mi Sitio Web"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dominio <span className="text-slate-400 text-xs">(opcional)</span>
              </label>
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creando...' : 'Crear sitio'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
