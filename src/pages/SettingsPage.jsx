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
    <div className="page-shell px-4 sm:px-8 py-6 space-y-6 max-w-5xl mx-auto">
      <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-medical-50 p-6 shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-700">System settings</p>
        <h1 className="mt-2 text-3xl font-extrabold text-surface-900">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-surface-500">
          Fine-tune notification behavior and delivery rules with a cleaner interface aligned to the RoboCare brand.
        </p>
      </div>

      {/* Filtre nuit */}
      <Card className="mb-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-semibold text-surface-900 mb-1">Night Filter</h3>
            <p className="text-sm text-surface-500">
              Block non-critical notifications between 22h and 7h.
            </p>
          </div>
          <Toggle enabled={nightFilter} onChange={setNightFilter} />
        </div>
        <div className="mt-4 rounded-2xl border border-surface-100 bg-surface-50 p-4 text-sm text-surface-600">
          Critical priority notifications will still be delivered.
        </div>
      </Card>

      {/* Retry */}
      <Card className="mb-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-semibold text-surface-900 mb-1">Retry Strategy</h3>
            <p className="text-sm text-surface-500">
              Exponential backoff: 1 min, 5 min, 15 min — max 4 attempts before PERMANENTLY_FAILED.
            </p>
          </div>
          <Toggle enabled={retryEnabled} onChange={setRetryEnabled} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <div>
            <label className="text-xs font-semibold text-surface-500">Max attempts</label>
            <input
              type="number"
              defaultValue={4}
              className="mt-1 w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-surface-500">Initial delay (min)</label>
            <input
              type="number"
              defaultValue={1}
              className="mt-1 w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-surface-500">Backoff factor</label>
            <input
              type="number"
              defaultValue={5}
              className="mt-1 w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
            />
          </div>
        </div>
      </Card>

      {/* Notifications admin */}
      <Card className="mb-0">
        <h3 className="font-semibold text-surface-900 mb-4">Admin Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-surface-900">Email notifications</div>
              <div className="text-xs text-surface-500 mt-0.5">Receive system alerts by email</div>
            </div>
            <Toggle enabled={emailNotif} onChange={setEmailNotif} />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-surface-100">
            <div>
              <div className="text-sm text-surface-900">Critical errors only</div>
              <div className="text-xs text-surface-500 mt-0.5">
                Only get notified for severity = CRITICAL
              </div>
            </div>
            <Toggle enabled={criticalOnly} onChange={setCriticalOnly} />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <button className="px-4 py-2 text-sm bg-white border border-surface-200 rounded-full hover:bg-surface-50 text-surface-700">
          Cancel
        </button>
        <button className="px-4 py-2 text-sm bg-brand-600 text-white rounded-full hover:bg-brand-700 shadow-glow">
          Save changes
        </button>
      </div>
    </div>
  )
}
