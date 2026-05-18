import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import Card from './Card'
import { successFailureWeek } from '../data/chartConfig'

export default function SuccessFailureChart() {
  return (
    <Card padding="p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Success vs Failure</h3>
      <div className="h-40 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={successFailureWeek} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: 12,
              }}
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
            />
            <Bar dataKey="success" fill="#52c41a" radius={[3, 3, 0, 0]} />
            <Bar dataKey="failure" fill="#ff4d4f" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
