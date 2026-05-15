import Card from './Card'
import { TrendingUp, AlertCircle } from 'lucide-react'

export default function StatCard({
  label,
  value,
  valueColor = 'text-gray-900',
  delta,
  deltaPositive = true,
  bar,
  subtitle,
  subtitleIcon,
  subtitleColor = 'text-gray-500',
}) {
  return (
    <Card padding="p-4">
      <div className="text-[11px] font-medium tracking-wider uppercase text-gray-500 mb-2">
        {label}
      </div>
      <div className={`text-2xl font-semibold ${valueColor}`}>{value}</div>

      {delta && (
        <div
          className={`mt-2 flex items-center gap-1 text-xs ${
            deltaPositive ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          <TrendingUp className="w-3 h-3" strokeWidth={2} />
          <span className="font-medium">{delta}</span>
        </div>
      )}

      {bar && (
        <div className="mt-3 h-1 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${bar.percent}%`, backgroundColor: bar.color }}
          />
        </div>
      )}

      {subtitle && (
        <div className={`mt-2 flex items-center gap-1 text-xs ${subtitleColor}`}>
          {subtitleIcon === 'alert' && <AlertCircle className="w-3 h-3" strokeWidth={2} />}
          <span>{subtitle}</span>
        </div>
      )}
    </Card>
  )
}
