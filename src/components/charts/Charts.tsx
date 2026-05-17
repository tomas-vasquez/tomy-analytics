import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-slate-500 text-xs mb-1 max-w-48 truncate">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

function truncate(value: string, max = 20) {
  return value.length > max ? value.slice(0, max) + '...' : value
}

let uid = 0
function id() { return ++uid }

export function LineChartCard({ data, dataKey, xKey, title, height = 300 }: {
  data: Record<string, unknown>[]
  dataKey: string
  xKey: string
  title: string
  height?: number
}) {
  const gid = `lg-${id()}`
  return (
    <div className="bg-white rounded-xl border p-4 md:p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data as any[]}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="#94a3b8" axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey={dataKey} stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#3b82f6' }} isAnimationActive={true} animationDuration={800} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BarChartCard({ data, dataKey, xKey, title, height = 300 }: {
  data: Record<string, unknown>[]
  dataKey: string
  xKey: string
  title: string
  height?: number
}) {
  const gid = `bg-${id()}`
  return (
    <div className="bg-white rounded-xl border p-4 md:p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data as any[]} margin={{ bottom: 80, left: 0, right: 0, top: 10 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="#94a3b8" axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={100} tickFormatter={truncate} />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
          <Bar dataKey={dataKey} fill={`url(#${gid})`} radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PieChartCard({ data, title, height = 300 }: {
  data: { name: string; value: number }[]
  title: string
  height?: number
}) {
  return (
    <div className="bg-white rounded-xl border p-4 md:p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={40}
            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            isAnimationActive={true}
            animationDuration={800}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
