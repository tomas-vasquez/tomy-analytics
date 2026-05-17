import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Resumen', icon: '◉' },
  { href: '/dashboard/pages', label: 'Páginas', icon: '◎' },
  { href: '/dashboard/referrers', label: 'Refirientes', icon: '⇄' },
  { href: '/dashboard/audience', label: 'Audiencia', icon: '◐' },
  { href: '/dashboard/events', label: 'Eventos', icon: '◇' },
  { href: '/dashboard/realtime', label: 'Tiempo real', icon: '●' },
  { href: '/dashboard/settings', label: 'Ajustes', icon: '⚙' },
]

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/auth/login', { replace: true }); return }
      setEmail(user.email || '')
      supabase.rpc('get_user_sites').then(({ data }) => {
        const sites = data as { id: string }[] | null
        if (!sites || sites.length === 0) {
          navigate('/onboarding', { replace: true })
        }
      })
    })
  }, [navigate])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed md:sticky top-0 left-0 z-30 h-full w-56 bg-slate-900 text-slate-300 flex flex-col transition-transform md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Tomy Analytics</h2>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === item.href
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700 text-xs text-slate-500 hidden md:block">
          <p className="truncate">{email}</p>
          <button
            onClick={() => {
              supabase.auth.signOut()
              navigate('/auth/login', { replace: true })
            }}
            className="mt-2 text-slate-400 hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="md:hidden sticky top-0 z-10 bg-white border-b flex items-center gap-3 px-4 h-12">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600 text-xl leading-none">☰</button>
          <h2 className="text-sm font-semibold text-slate-700">{navItems.find(i => i.href === location.pathname)?.label || 'Dashboard'}</h2>
        </div>
        <Outlet />
      </main>

    </div>
  )
}
