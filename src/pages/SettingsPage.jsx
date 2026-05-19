import { useState } from 'react'
import Card from '../components/Card'

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
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
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your notification preferences and system behavior.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Night Filter */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Night Filter</h3>
          <p className="text-sm text-gray-500 mb-6">
            Block non-critical notifications between 22h and 7h.
          </p>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-medium text-gray-900">Enable night filter</div>
              <div className="text-xs text-gray-500 mt-1">
                Critical priority notifications will still be delivered.
              </div>
            </div>
            <Toggle enabled={nightFilter} onChange={setNightFilter} />
          </div>
        </div>

        {/* Retry Strategy */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Retry Strategy</h3>
          <p className="text-sm text-gray-500 mb-6">
            Exponential backoff: 1 min, 5 min, 15 min — max 4 attempts before PERMANENTLY_FAILED.
          </p>
          <div className="flex items-center justify-between py-3 border-b border-gray-200 mb-6">
            <div className="text-sm font-medium text-gray-900">Enable automatic retry</div>
            <Toggle enabled={retryEnabled} onChange={setRetryEnabled} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Max attempts</label>
              <input
                type="number"
                defaultValue={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Initial delay (min)</label>
              <input
                type="number"
                defaultValue={1}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Backoff factor</label>
              <input
                type="number"
                defaultValue={5}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Admin Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Admin Alerts</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium text-gray-900">Email notifications</div>
                <div className="text-xs text-gray-500 mt-1">Receive system alerts by email</div>
              </div>
              <Toggle enabled={emailNotif} onChange={setEmailNotif} />
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">Critical errors only</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Only get notified for severity = CRITICAL
                  </div>
                </div>
                <Toggle enabled={criticalOnly} onChange={setCriticalOnly} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
            Cancel
          </button>
          <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
