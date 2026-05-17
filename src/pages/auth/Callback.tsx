import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      navigate(session ? '/dashboard' : '/auth/login', { replace: true })
    })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500">Completando inicio de sesión...</p>
    </div>
  )
}
