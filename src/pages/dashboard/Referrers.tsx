import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChartCard } from '@/components/charts/Charts'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Referrer {
  source: string
  visits: number
  unique_visitors: number
}

export default function ReferrersPage() {
  const [referrers, setReferrers] = useState<Referrer[]>([])
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

      if (!sites?.length) { setLoading(false); return }

      const { data } = await supabase.rpc('get_referrers', { p_site_id: sites[0].id, p_days: 30 })
      if (data) setReferrers(data as Referrer[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />

  const total = referrers.reduce((s, r) => s + r.visits, 0)
  const chartData = referrers.slice(0, 10).map(r => ({ name: r.source, visits: r.visits }))

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-lg md:text-xl font-bold text-slate-900">Fuentes de tráfico</h1>

      <BarChartCard title="Tráfico por fuente" data={chartData} dataKey="visits" xKey="name" height={300} />

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Fuente</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Visitas</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Visitantes únicos</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500 whitespace-nowrap">%</th>
            </tr>
          </thead>
          <tbody>
            {referrers.map((ref) => {
              return (
                <tr key={ref.source} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700 font-medium">{ref.source}</td>
                  <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">{ref.visits.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">{ref.unique_visitors.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">{ref.visits > 0 ? ((ref.visits / total) * 100).toFixed(1) : '0'}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
