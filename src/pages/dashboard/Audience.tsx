import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PieChartCard } from '@/components/charts/Charts'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useSite } from '@/lib/SiteContext'

interface PieItem {
  name: string
  value: number
}

interface DeviceStats {
  devices: PieItem[]
  browsers: PieItem[]
  os: PieItem[]
}

export default function AudiencePage() {
  const { selected } = useSite()
  const id = selected?.id
  const [data, setData] = useState<DeviceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    async function load() {
      const { data: result } = await supabase.rpc('get_device_stats', { p_site_id: id, p_days: 30 })
      if (result) setData(result as DeviceStats)
      setLoading(false)
    }
    load()
  }, [selected])

  if (loading) return <LoadingSpinner />
  if (!data) return <div className="p-6 text-slate-500">No hay datos disponibles</div>

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-lg md:text-xl font-bold text-slate-900">Audiencia</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <PieChartCard title="Dispositivos" data={data.devices} height={280} />
        <PieChartCard title="Navegadores" data={data.browsers} height={280} />
        <PieChartCard title="Sistemas operativos" data={data.os} height={280} />
      </div>
    </div>
  )
}
