import { AlertTriangle } from 'lucide-react'
import Card from './Card'
import { criticalErrors } from '../data/mockData'

export default function CriticalErrorsPanel() {
  return (
    <Card padding="p-0" className="overflow-hidden">
      <div className="px-5 py-3 bg-red-50/60 border-b border-red-100 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={1.75} />
        <h3 className="text-sm font-semibold text-red-700">Critical Errors</h3>
      </div>
      <ul className="divide-y divide-gray-100">
        {criticalErrors.map((err, i) => (
          <li key={i} className="px-5 py-3 hover:bg-gray-50 transition-colors">
            <div className="text-sm font-semibold text-gray-900">{err.title}</div>
            <div className="text-xs text-gray-600 mt-0.5">{err.detail}</div>
            <div className="text-[11px] text-gray-400 mt-1 font-mono">{err.time}</div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
