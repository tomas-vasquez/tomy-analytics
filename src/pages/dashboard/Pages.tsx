import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChartCard } from '@/components/charts/Charts'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface TopPage {
  path: string
  pageviews: number
  unique_visitors: number
}

export default function PagesPage() {
  const [pages, setPages] = useState<TopPage[]>([])
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

      const { data } = await supabase.rpc('get_top_pages', { p_site_id: sites[0].id, p_days: 30 })
      if (data) setPages(data as TopPage[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />

  const chartData = pages.slice(0, 15).map(p => ({ name: p.path, pageviews: p.pageviews }))

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-lg md:text-xl font-bold text-slate-900">Páginas</h1>

      <BarChartCard title="Páginas más visitadas" data={chartData} dataKey="pageviews" xKey="name" height={300} />

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Página</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Páginas vistas</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Visitantes únicos</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.path} className="border-b last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-700">{page.path || '/'}</td>
                <td className="px-4 py-3 text-right text-slate-700">{page.pageviews.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-slate-700">{page.unique_visitors.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
