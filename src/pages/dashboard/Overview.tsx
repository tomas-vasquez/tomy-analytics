import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { StatCard } from '@/components/ui/StatCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LineChartCard } from '@/components/charts/Charts'

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString()
}

interface Stats {
  uniqueVisitors: number
  totalPageviews: number
  totalSessions: number
  avgDuration: number
  bounceRate: number
}

interface DailyStat {
  date: string
  unique_visitors: number
  total_pageviews: number
  total_sessions: number
  avg_duration_seconds: number
  bounce_rate: number
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: sites } = await supabase
        .from('sites')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (!sites?.length) {
        setLoading(false)
        return
      }

      const id = sites[0].id

      const [statsRes, dailyRes] = await Promise.all([
        supabase.rpc('get_dashboard_stats', { p_site_id: id, p_days: 30 }),
        supabase.rpc('get_daily_stats', { p_site_id: id, p_days: 30 }),
      ])

      if (statsRes.data) setStats(statsRes.data as Stats)
      if (dailyRes.data) setDailyStats(dailyRes.data as DailyStat[])
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-lg md:text-xl font-bold text-slate-900">Resumen del panel</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard title="Visitantes" value={formatNumber(stats?.uniqueVisitors || 0)} icon="◎" />
        <StatCard title="Páginas vistas" value={formatNumber(stats?.totalPageviews || 0)} icon="◉" />
        <StatCard title="Sesiones" value={formatNumber(stats?.totalSessions || 0)} icon="◇" />
        <StatCard title="Duración media" value={formatDuration(stats?.avgDuration || 0)} icon="◐" />
        <StatCard title="Tasa de rebote" value={`${stats?.bounceRate || 0}%`} icon="○" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <LineChartCard
          title="Páginas vistas en el tiempo"
          data={dailyStats as unknown as Record<string, unknown>[]}
          dataKey="total_pageviews"
          xKey="date"
        />
        <LineChartCard
          title="Visitantes únicos"
          data={dailyStats as unknown as Record<string, unknown>[]}
          dataKey="unique_visitors"
          xKey="date"
        />
      </div>
    </div>
  )
}
