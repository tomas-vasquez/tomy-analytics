import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChartCard } from '@/components/charts/Charts'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface EventItem {
  event_name: string
  count: number
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([])
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

      const { data } = await supabase.rpc('get_events', { p_site_id: sites[0].id, p_days: 30 })
      if (data) setEvents(data as EventItem[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />

  const chartData = events.map(e => ({ name: e.event_name, count: e.count }))

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-lg md:text-xl font-bold text-slate-900">Eventos personalizados</h1>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border p-6 md:p-10 text-center text-slate-500">
          <p>Aún no hay eventos personalizados.</p>
          <p className="text-sm mt-1">
            Agrega el atributo <code className="bg-slate-100 px-1 rounded">data-analytics-event</code> a elementos para rastrear clics.
          </p>
        </div>
      ) : (
        <>
          <BarChartCard title="Eventos" data={chartData} dataKey="count" xKey="name" height={300} />

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Nombre del evento</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Conteo</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.event_name} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700 font-medium">{ev.event_name}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{ev.count.toLocaleString()}</td>
                  </tr>
                ))}
          </tbody>
        </table>
        </div>
      </div>
        </>
      )}
    </div>
  )
}
