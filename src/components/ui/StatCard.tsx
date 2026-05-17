export function StatCard({ title, value, subtitle, icon }: {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
}) {
  return (
    <div className="bg-white rounded-xl border p-4 md:p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {icon && <span className="text-lg text-slate-400">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  )
}
