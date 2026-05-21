import { useState } from 'react'
import { Save, X, Moon, Bell, RefreshCw, Shield } from 'lucide-react'
import { PageHero, PageWrapper } from '../components/PageHero'

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/25 ${
        enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function SettingRow({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 min-w-0 pr-6">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</div>
        {desc && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>}
      </div>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-500 transition-all'
const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider'

function SectionCard({ icon: Icon, title, desc, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950/40 flex items-center justify-center">
          <Icon className="w-4 h-4 text-green-700 dark:text-green-400" strokeWidth={2} />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      {desc && <p className="text-xs text-gray-500 dark:text-gray-400 ml-11 mb-4">{desc}</p>}
      <div className="ml-0 divide-y divide-gray-100 dark:divide-gray-800">
        {children}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [nightFilter, setNightFilter] = useState(true)
  const [retryEnabled, setRetryEnabled] = useState(true)
  const [emailNotif, setEmailNotif] = useState(true)
  const [criticalOnly, setCriticalOnly] = useState(false)
  const [maxAttempts, setMaxAttempts] = useState(4)
  const [initialDelay, setInitialDelay] = useState(1)
  const [backoffFactor, setBackoffFactor] = useState(5)

  return (
    <PageWrapper>
      {/* Hero */}
      <PageHero
        label="System Config"
        title="Settings"
        subtitle="Configurez vos préférences de notification et le comportement du système RoboCare."
      />

      <div className="max-w-2xl space-y-4">
        {/* Night Filter */}
        <SectionCard icon={Moon} title="Night Filter" desc="Bloque les notifications non critiques entre 22h et 7h.">
          <SettingRow
            label="Activer le filtre nocturne"
            desc="Les notifications critiques seront tout de même livrées."
          >
            <Toggle enabled={nightFilter} onChange={setNightFilter} />
          </SettingRow>
        </SectionCard>

        {/* Retry Strategy */}
        <SectionCard icon={RefreshCw} title="Retry Strategy" desc="Backoff exponentiel : 1 min, 5 min, 15 min — max 4 tentatives avant PERMANENTLY_FAILED.">
          <SettingRow label="Activer le retry automatique" desc="Relance automatiquement les envois échoués.">
            <Toggle enabled={retryEnabled} onChange={setRetryEnabled} />
          </SettingRow>
          <div className="pt-4 pb-2">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Max tentatives</label>
                <input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} disabled={!retryEnabled} className={inputCls + (!retryEnabled ? ' opacity-50 cursor-not-allowed' : '')} />
              </div>
              <div>
                <label className={labelCls}>Délai initial (min)</label>
                <input type="number" value={initialDelay} onChange={(e) => setInitialDelay(e.target.value)} disabled={!retryEnabled} className={inputCls + (!retryEnabled ? ' opacity-50 cursor-not-allowed' : '')} />
              </div>
              <div>
                <label className={labelCls}>Backoff factor</label>
                <input type="number" value={backoffFactor} onChange={(e) => setBackoffFactor(e.target.value)} disabled={!retryEnabled} className={inputCls + (!retryEnabled ? ' opacity-50 cursor-not-allowed' : '')} />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Admin Alerts */}
        <SectionCard icon={Bell} title="Admin Alerts" desc="Recevez des alertes système par email.">
          <SettingRow label="Notifications email" desc="Recevez les alertes système par email.">
            <Toggle enabled={emailNotif} onChange={setEmailNotif} />
          </SettingRow>
          <SettingRow label="Erreurs critiques uniquement" desc="Seulement notifié pour severity = CRITICAL.">
            <Toggle enabled={criticalOnly} onChange={setCriticalOnly} />
          </SettingRow>
        </SectionCard>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <X className="w-4 h-4" />
            Annuler
          </button>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </div>
    </PageWrapper>
  )
}
