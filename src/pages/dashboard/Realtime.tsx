import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { StatCard } from '@/components/ui/StatCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useSite } from '@/lib/SiteContext'

interface Pageview {
  path: string
  title: string
  device_type: string
  created_at: string
}

interface RealtimeData {
  activeVisitors: number
  pageviews: Pageview[]
}

export default function RealtimePage() {
  const { selected } = useSite()
  const [data, setData] = useState<RealtimeData | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    if (!selected) return
    const { data: result } = await supabase.rpc('get_realtime', { p_site_id: selected.id })
    if (result) setData(result as RealtimeData)
    setLoading(false)
  }

  useEffect(() => {
    if (!selected) { setLoading(false); return }
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [selected])

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg md:text-xl font-bold text-slate-900">Tiempo real</h1>
        <span className="flex items-center gap-2 text-xs md:text-sm text-slate-500">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="hidden sm:inline">Actualizando cada 10s</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <StatCard
          title="Visitantes activos (últ. 5 min)"
          value={data?.activeVisitors || 0}
          icon="●"
        />
        <StatCard
          title="Páginas vistas (últ. 5 min)"
          value={data?.pageviews?.length || 0}
          icon="◉"
        />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-700">Páginas vistas en vivo</h3>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {data?.pageviews?.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">Sin actividad en los últimos 5 minutos</div>
          ) : (
            data?.pageviews?.map((pv, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-400">
                    {pv.device_type === 'mobile' ? '📱' : pv.device_type === 'tablet' ? '📟' : '💻'}
                  </span>
                  <span className="truncate text-slate-700">{pv.path || '/'}</span>
                </div>
                <span className="text-slate-400 text-xs ml-2">
                  {new Date(pv.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
