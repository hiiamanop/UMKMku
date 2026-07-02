'use client'

import { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Loader2 } from 'lucide-react'

type Period = 'daily' | 'weekly' | 'monthly'
type Metric = 'tokens' | 'orders' | 'addon'

interface Point { label: string; tokens: number; orders: number; addon: number }

const METRICS: { key: Metric; label: string; color: string }[] = [
  { key: 'tokens', label: 'Token AI', color: '#0A2F73' },
  { key: 'orders', label: 'Pesanan', color: '#F4B400' },
  { key: 'addon',  label: 'Add-on',  color: '#16a34a' },
]

const PERIODS: { key: Period; label: string }[] = [
  { key: 'daily',   label: 'Harian' },
  { key: 'weekly',  label: 'Mingguan' },
  { key: 'monthly', label: 'Bulanan' },
]

export function UsageChart({ tenantId, hasAddon }: { tenantId: string; hasAddon: boolean }) {
  const [period, setPeriod] = useState<Period>('daily')
  const [active, setActive] = useState<Set<Metric>>(new Set(['tokens', 'orders']))
  const [data, setData] = useState<Point[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dashboard/usage-history?tenantId=${tenantId}&period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tenantId, period])

  function toggleMetric(key: Metric) {
    setActive(prev => {
      const next = new Set(prev)
      if (next.has(key)) { if (next.size > 1) next.delete(key) }
      else next.add(key)
      return next
    })
  }

  const visibleMetrics = METRICS.filter(m => m.key !== 'addon' || hasAddon)

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold" style={{ color: '#0A2F73' }}>Grafik Penggunaan</div>

        {/* Period toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={period === p.key ? { background: '#0A2F73', color: '#fff' } : { color: '#5E6B85' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric filter */}
      <div className="flex flex-wrap gap-2">
        {visibleMetrics.map(m => (
          <button key={m.key} onClick={() => toggleMetric(m.key)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
            style={active.has(m.key)
              ? { background: m.color, color: '#fff', borderColor: m.color }
              : { background: '#fff', color: '#5E6B85', borderColor: '#E5EAF0' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: active.has(m.key) ? '#fff' : m.color }} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-56 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} width={40}
                tickFormatter={v => Number.isInteger(v) ? String(v) : v.toFixed(1)} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E5EAF0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(val, name) => {
                  const m = METRICS.find(x => x.label === name)
                  if (m?.key === 'tokens') return [`${val ?? 0}k token`, name]
                  return [`${val ?? 0} pesanan`, name]
                }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {visibleMetrics.filter(m => active.has(m.key)).map(m => (
                <Line key={m.key} type="monotone" dataKey={m.key} name={m.label}
                  stroke={m.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
