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
    <Card padding="p-5" className="relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-brand-50/60" />
      <div className="relative text-[11px] font-semibold tracking-wider uppercase text-gray-500 mb-2">
        {label}
      </div>
      <div className={`relative text-2xl font-bold ${valueColor}`}>{value}</div>

      {delta && (
        <div
          className={`relative mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            deltaPositive ? 'text-emerald-600' : 'text-red-600'
          } ${
            deltaPositive ? 'bg-emerald-50' : 'bg-red-50'
          }`}
        >
          <TrendingUp className="w-3 h-3" strokeWidth={2} />
          <span>{delta}</span>
        </div>
      )}

      {bar && (
        <div className="relative mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${bar.percent}%`, backgroundColor: bar.color }}
          />
        </div>
      )}

      {subtitle && (
        <div className={`relative mt-2 flex items-center gap-1 text-xs ${subtitleColor}`}>
          {subtitleIcon === 'alert' && <AlertCircle className="w-3 h-3" strokeWidth={2} />}
          <span>{subtitle}</span>
        </div>
      )}
    </Card>
  )
}
