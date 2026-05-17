import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { SiteProvider, useSite } from '@/lib/SiteContext'

const navItems = [
  { href: '/dashboard', label: 'Resumen', icon: '◉' },
  { href: '/dashboard/pages', label: 'Páginas', icon: '◎' },
  { href: '/dashboard/referrers', label: 'Refirientes', icon: '⇄' },
  { href: '/dashboard/audience', label: 'Audiencia', icon: '◐' },
  { href: '/dashboard/events', label: 'Eventos', icon: '◇' },
  { href: '/dashboard/realtime', label: 'Tiempo real', icon: '●' },
  { href: '/dashboard/settings', label: 'Ajustes', icon: '⚙' },
]

function Sidebar({ email, onClose }: { email: string; onClose: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { sites, selected, setSelected } = useSite()
  const [open, setOpen] = useState(false)

  return (
    <aside className="fixed md:sticky top-0 left-0 z-30 h-full w-56 bg-slate-900 text-slate-300 flex flex-col">
      <div className="p-5 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Tomy Analytics</h2>
        <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white text-xl leading-none">&times;</button>
      </div>

      <div className="px-3 pt-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 transition-colors text-left"
        >
          <span className="text-blue-400 text-xs">◉</span>
          <span className="flex-1 truncate text-white">{selected?.name || 'Sin sitio'}</span>
          <span className="text-slate-500 text-xs">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="mt-1 bg-slate-800 rounded-lg overflow-hidden">
            {sites.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelected(s); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors ${selected?.id === s.id ? 'text-white bg-slate-700' : 'text-slate-400'}`}
              >
                <span className="truncate block">{s.name}</span>
                <span className="text-xs text-slate-500 truncate block">{s.domain}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
        {navItems.map(item => (
          <Link
            key={item.href}
            to={item.href}
            onClick={onClose}
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
          onClick={() => { supabase.auth.signOut(); navigate('/auth/login', { replace: true }) }}
          className="mt-2 text-slate-400 hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

function DashboardLayoutInner() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { sites, selected, setSelected } = useSite()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/auth/login', { replace: true }); return }
      setEmail(user.email || '')
    })
  }, [navigate])

  useEffect(() => {
    if (!sites.length) navigate('/onboarding', { replace: true })
  }, [sites, navigate])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed md:static inset-0 z-30 w-56 transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar email={email} onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b flex items-center gap-2 px-3 md:px-5 h-12">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-600 text-xl leading-none mr-1">☰</button>
          <h2 className="text-sm font-semibold text-slate-700 hidden md:block">
            {navItems.find(i => i.href === location.pathname)?.label || 'Dashboard'}
          </h2>

          <div className="flex-1" />

          <select
            value={selected?.id ?? ''}
            onChange={e => {
              const site = sites.find(s => s.id === e.target.value)
              if (site) setSelected(site)
            }}
            className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 max-w-40 truncate"
          >
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          {selected ? <Outlet /> : (
            <div className="p-10 text-center text-slate-500">
              <p>No hay sitios registrados.</p>
              <Link to="/onboarding" className="text-blue-600 hover:underline text-sm mt-1 inline-block">Crear un sitio</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function DashboardLayout() {
  return (
    <SiteProvider>
      <DashboardLayoutInner />
    </SiteProvider>
  )
}
