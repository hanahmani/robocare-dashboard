import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Card from './Card'
import { criticalErrors as staticCritical } from '../data/chartConfig'
import { fetchCriticalErrors } from '../api/Notificationapi'

export default function CriticalErrorsPanel({ stats = null }) {
  const [dynamicErrors, setDynamicErrors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadErrors() {
      try {
        const errors = await fetchCriticalErrors()
        setDynamicErrors(Array.isArray(errors) ? errors : [])
      } catch (err) {
        console.error('Failed to fetch critical errors:', err)
        setDynamicErrors([])
      } finally {
        setLoading(false)
      }
    }

    loadErrors()
  }, [])

  const list = (stats && stats.failedWithErrors && stats.failedWithErrors.length) ? stats.failedWithErrors : (dynamicErrors.length > 0 ? dynamicErrors : staticCritical)

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-red-50 p-2">
            <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-700">Critical Errors</h3>
            <p className="text-xs text-surface-500">Grouped error snapshots with source and timestamp.</p>
          </div>
        </div>
        <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
          {Array.isArray(list) ? list.length : 0} issues
        </div>
      </div>

      <div className="grid gap-3">
        {list.map((err, i) => (
          <div key={i} className="rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/40 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-gray-900">{err.title}</div>
                <div className="text-xs text-gray-600 leading-5">{err.detail || 'No detail provided'}</div>
              </div>
              <div className="rounded-full border border-red-100 bg-white px-2.5 py-1 text-[11px] font-mono text-red-500">
                {err.time || 'unknown time'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
