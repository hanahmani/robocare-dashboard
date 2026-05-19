import Card from './Card'
import { ArrowUp, ArrowDown, AlertCircle } from 'lucide-react'

export default function StatCard({
  title = '',
  value = '',
  valueColor = '#111827',
  delta = null, // { text: '+4.5%', positive: true }
  progress = null, // { percent: 96, color: '#10b981' }
  badge = null, // { text: '0 Critical', color: '#dc2626' }
  subtitle = '',
}) {
  return (
    <Card padding="p-4">
      <div className="mb-2">
        <div className="text-[11px] font-medium tracking-wider uppercase text-gray-500">{title}</div>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div style={{ color: valueColor }} className="text-[22px] font-extrabold leading-none">{value}</div>
          {delta && (
            <div className={`mt-2 inline-flex items-center gap-2 text-sm ${delta.positive ? 'text-emerald-600' : 'text-red-600'}`}>
              {delta.positive ? (
                <ArrowUp className="w-4 h-4" strokeWidth={1.75} />
              ) : (
                <ArrowDown className="w-4 h-4" strokeWidth={1.75} />
              )}
              <span className="font-medium">{delta.text}</span>
            </div>
          )}
        </div>

        {badge && (
          <div className="flex-shrink-0">
            <div
              className="inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded-full"
              style={{ background: '#fff1f0', color: badge.color || '#dc2626', border: '1px solid #fee2e2' }}
            >
              <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{badge.text}</span>
            </div>
          </div>
        )}
      </div>

      {progress && (
        <div className="mt-3">
          <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height: 6 }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${progress.percent}%`, backgroundColor: progress.color || '#10b981' }}
            />
          </div>
        </div>
      )}

      {subtitle && (
        <div className="mt-3 text-sm text-gray-500">{subtitle}</div>
      )}
    </Card>
  )
}
