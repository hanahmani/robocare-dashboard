import { useState } from 'react'
import Card from '../components/Card'

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        enabled ? 'bg-brand-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
          enabled ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const [nightFilter, setNightFilter] = useState(true)
  const [retryEnabled, setRetryEnabled] = useState(true)
  const [emailNotif, setEmailNotif] = useState(true)
  const [criticalOnly, setCriticalOnly] = useState(false)

  return (
    <div className="p-6 max-w-3xl">
      {/* Filtre nuit */}
      <Card className="mb-5">
        <h3 className="font-semibold text-gray-900 mb-1">Night Filter</h3>
        <p className="text-sm text-gray-500 mb-4">
          Block non-critical notifications between 22h and 7h.
        </p>
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm text-gray-900">Enable night filter</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Critical priority notifications will still be delivered.
            </div>
          </div>
          <Toggle enabled={nightFilter} onChange={setNightFilter} />
        </div>
      </Card>

      {/* Retry */}
      <Card className="mb-5">
        <h3 className="font-semibold text-gray-900 mb-1">Retry Strategy</h3>
        <p className="text-sm text-gray-500 mb-4">
          Exponential backoff: 1 min, 5 min, 15 min — max 4 attempts before PERMANENTLY_FAILED.
        </p>
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="text-sm text-gray-900">Enable automatic retry</div>
          <Toggle enabled={retryEnabled} onChange={setRetryEnabled} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <label className="text-xs text-gray-500">Max attempts</label>
            <input
              type="number"
              defaultValue={4}
              className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Initial delay (min)</label>
            <input
              type="number"
              defaultValue={1}
              className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Backoff factor</label>
            <input
              type="number"
              defaultValue={5}
              className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </Card>

      {/* Notifications admin */}
      <Card className="mb-5">
        <h3 className="font-semibold text-gray-900 mb-4">Admin Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-900">Email notifications</div>
              <div className="text-xs text-gray-500 mt-0.5">Receive system alerts by email</div>
            </div>
            <Toggle enabled={emailNotif} onChange={setEmailNotif} />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <div className="text-sm text-gray-900">Critical errors only</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Only get notified for severity = CRITICAL
              </div>
            </div>
            <Toggle enabled={criticalOnly} onChange={setCriticalOnly} />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <button className="px-4 py-1.5 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700">
          Cancel
        </button>
        <button className="px-4 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700">
          Save changes
        </button>
      </div>
    </div>
  )
}
