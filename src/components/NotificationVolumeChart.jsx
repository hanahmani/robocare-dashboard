import { useState } from 'react'
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import Card from './Card'
import {
  notificationVolume,
  notificationVolume7d,
  notificationVolume30d,
  notificationVolume3m,
} from '../data/chartConfig'

const dataByRange = {
  'Last 24 Hours': notificationVolume,
  'Last 7 Days': notificationVolume7d,
  'Last 30 Days': notificationVolume30d,
  'Last 3 Months': notificationVolume3m,
}

export default function NotificationVolumeChart({ dateFilter = 'Last 24 Hours' }) {
  const [mode, setMode] = useState('Line')
  const data = dataByRange[dateFilter] ?? notificationVolume

  return (
    <Card padding="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Notification Volume</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">{dateFilter}</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
          {['Line', 'Area'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-0.5 text-xs rounded transition-colors ${
                mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'Line' ? (
            <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}
                formatter={(v) => [v.toLocaleString(), 'Volume']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: '#3b82f6' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(v) => [v.toLocaleString(), 'Volume']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#volumeGradient)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
