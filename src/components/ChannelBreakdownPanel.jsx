import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import Card from './Card'
import { channelBreakdown as staticChannelBreakdown } from '../data/chartConfig'

export default function ChannelBreakdownPanel({ channelFilter = 'All Channels', stats = null }) {
  // prefer live stats.byType when available
  const dataFromStats = stats && stats.byType ? Object.entries(stats.byType).map(([key, value]) => {
    const name = key === 'WHATSAPP' ? 'WhatsApp' : key === 'EMAIL' ? 'Email' : key === 'SMS' ? 'SMS' : key
    const color = name === 'Email' ? '#1677ff' : name === 'WhatsApp' ? '#52c41a' : '#fa8c16'
    return { name, value, label: `${value}`, percent: 0, color }
  }) : null

  // ensure static fallback uses brand colors
  const baseStatic = staticChannelBreakdown.map((c) => ({ ...c, color: c.name === 'Email' ? '#1677ff' : c.name === 'WhatsApp' ? '#52c41a' : '#fa8c16' }))
  const base = dataFromStats || baseStatic

  const total = base.reduce((s, it) => s + (it.value || 0), 0)

  const displayData =
    channelFilter === 'All Channels'
      ? base.map((c) => ({ ...c, percent: total > 0 ? Math.round(((c.value || 0) / total) * 1000) / 10 : 0 }))
      : base.filter((c) => c.name === channelFilter).map((c) => ({ ...c, percent: 100 }))

  return (
    <Card padding="p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Channel Breakdown</h3>

      <div className="space-y-3">
        {displayData.map((c) => (
          <div key={c.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-sm text-gray-700">{c.name}</span>
              </div>
              <span className="text-xs text-gray-500">
                {c.label} ({c.percent}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${c.percent}%`, backgroundColor: c.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center relative">
        <div className="w-40 h-40 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {displayData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.color}
                    opacity={channelFilter !== 'All Channels' ? 1 : 0.95}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-gray-500">
              {channelFilter === 'All Channels' ? 'Total' : channelFilter}
            </span>
            <span className="text-base font-semibold text-gray-900">
              {total || '—'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
