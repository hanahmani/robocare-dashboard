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
    <div className="page-shell px-4 sm:px-8 py-6 space-y-6">
      <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-medical-50 p-6 shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-700">Analytics center</p>
        <h1 className="mt-2 text-3xl font-extrabold text-surface-900">Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm text-surface-500">
          Explore volume, channel mix, and success trends in a layout that matches the rest of the RoboCare interface.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Volume over time */}
        <div className="bg-white rounded-3xl border border-surface-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-sm text-surface-900">Notification Volume</div>
            <div className="flex gap-1">
              {['24h', '7d'].map(r => (
                <button key={r} onClick={() => setMode(r)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${mode === r ? 'bg-brand-600 text-white shadow-glow' : 'text-surface-500 hover:bg-surface-100'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={volumeData} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#65a30d" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#65a30d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="value" name="Volume" stroke="#65a30d" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Channel pie */}
        <div className="bg-white rounded-3xl border border-surface-200 shadow-card p-5">
          <div className="font-semibold text-sm text-surface-900 mb-4">Channel Distribution</div>
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
        <div className="bg-white rounded-3xl border border-surface-200 shadow-card p-5">
          <div className="font-semibold text-sm text-surface-900 mb-4">Success vs Failed (7 days)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={successBarData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Success" fill="#65a30d" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Failed" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Smart insights */}
        <div className="bg-white rounded-3xl border border-surface-200 shadow-card p-5">
          <div className="font-semibold text-sm text-surface-900 mb-4">Smart Insights</div>
          <div className="space-y-2">
            {[
              stats.failed > 5 && { type: 'error', msg: `${stats.failed} failures detected — review error logs` },
              { type: 'info', msg: `Most active channel: ${stats.byType ? Object.entries(stats.byType).sort((a,b)=>b[1]-a[1])[0]?.[0] : '—'}` },
              Number(stats.successRate) >= 95 && { type: 'success', msg: `Delivery rate ${stats.successRate}% — exceeds 95% target` },
              Number(stats.successRate) < 80 && { type: 'warning', msg: `Delivery rate ${stats.successRate}% — below threshold` },
              { type: 'info', msg: 'Peak sending window: 09:00–12:00 based on historical data' },
            ].filter(Boolean).slice(0, 4).map((ins, i) => {
              const colors = {
                error: 'bg-alert-50 border-alert-200 text-alert-700',
                warning: 'bg-warning-50 border-warning-200 text-warning-700',
                success: 'bg-medical-50 border-medical-200 text-medical-700',
                info: 'bg-brand-50 border-brand-200 text-brand-700',
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
