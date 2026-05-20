import { useMemo, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useNotifications } from '../hooks/useNotifications'
import { Spin } from 'antd'

const CHANNEL_COLORS = { EMAIL: '#185FA5', SMS: '#BA7517', WHATSAPP: '#1D9E75' }

export default function AnalyticsPage() {
  const { raw, stats, volumeByHour, volumeByDay, loading } = useNotifications()
  const [mode, setMode] = useState('24h')

  const volumeData = mode === '7d' ? volumeByDay : volumeByHour

  const pieData = [
    { name: 'Email',     value: stats.byType?.EMAIL    ?? 0, color: CHANNEL_COLORS.EMAIL },
    { name: 'SMS',       value: stats.byType?.SMS      ?? 0, color: CHANNEL_COLORS.SMS },
    { name: 'WhatsApp',  value: stats.byType?.WHATSAPP ?? 0, color: CHANNEL_COLORS.WHATSAPP },
  ]

  const successBarData = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      const ds = d.toISOString().slice(0, 10)
      const day = raw.filter(n => (n.sentAt || n.createdAt || '').startsWith(ds))
      return {
        day: d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' }),
        Success: day.filter(n => n.status === 'SENT').length,
        Failed:  day.filter(n => n.status === 'FAILED').length,
      }
    }), [raw])

  if (loading) return <div className="flex items-center justify-center h-64"><Spin size="large"/></div>

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Volume over time */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-sm text-gray-900">Notification Volume</div>
            <div className="flex gap-1">
              {['24h', '7d'].map(r => (
                <button key={r} onClick={() => setMode(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${mode === r ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={volumeData} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#185FA5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#185FA5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="value" name="Volume" stroke="#185FA5" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Channel pie */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="font-semibold text-sm text-gray-900 mb-4">Channel Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Success vs Failed */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="font-semibold text-sm text-gray-900 mb-4">Success vs Failed (7 days)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={successBarData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Success" fill="#639922" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Failed" fill="#E24B4A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Smart insights */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="font-semibold text-sm text-gray-900 mb-4">📊 Smart Insights</div>
          <div className="space-y-2">
            {[
              stats.failed > 5 && { type: 'error', msg: `${stats.failed} failures detected — review error logs` },
              { type: 'info', msg: `Most active channel: ${stats.byType ? Object.entries(stats.byType).sort((a,b)=>b[1]-a[1])[0]?.[0] : '—'}` },
              Number(stats.successRate) >= 95 && { type: 'success', msg: `Delivery rate ${stats.successRate}% — exceeds 95% target` },
              Number(stats.successRate) < 80 && { type: 'warning', msg: `Delivery rate ${stats.successRate}% — below threshold` },
              { type: 'info', msg: 'Peak sending window: 09:00–12:00 based on historical data' },
            ].filter(Boolean).slice(0, 4).map((ins, i) => {
              const colors = {
                error: 'bg-red-50 border-red-200 text-red-700',
                warning: 'bg-amber-50 border-amber-200 text-amber-700',
                success: 'bg-green-50 border-green-200 text-green-700',
                info: 'bg-blue-50 border-blue-200 text-blue-700',
              }
              return (
                <div key={i} className={`px-3 py-2 rounded-xl border text-xs font-medium ${colors[ins.type]}`}>
                  {ins.msg}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
