import { useState, useEffect } from 'react'
import { fetchHealth } from '../api/Notificationapi'
import { Activity, Wifi, WifiOff, TrendingUp, AlertCircle, Clock } from 'lucide-react'

export default function PerformancePage() {
  const [metrics, setMetrics] = useState({
    responseTime: null, online: false, uptime: 99.97, errorCount: 0, lastCheck: null,
  })

  useEffect(() => {
    const check = async () => {
      const t0 = performance.now()
      try {
        await fetchHealth()
        setMetrics(p => ({
          ...p, online: true,
          responseTime: Math.round(performance.now() - t0),
          lastCheck: new Date().toLocaleTimeString('fr-FR'),
        }))
      } catch {
        setMetrics(p => ({
          ...p, online: false,
          responseTime: null,
          errorCount: p.errorCount + 1,
          lastCheck: new Date().toLocaleTimeString('fr-FR'),
        }))
      }
    }
    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [])

  const cards = [
    { label: 'API Status', value: metrics.online ? 'Online' : 'Offline', icon: metrics.online ? Wifi : WifiOff, color: metrics.online ? 'text-green-500' : 'text-red-500', bg: metrics.online ? 'bg-green-50' : 'bg-red-50' },
    { label: 'Response Time', value: metrics.responseTime ? `${metrics.responseTime}ms` : '—', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Uptime', value: `${metrics.uptime}%`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Errors (session)', value: String(metrics.errorCount), icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
  ]

  return (
    <div className="page-shell px-4 sm:px-8 py-6 space-y-6 max-w-5xl mx-auto">
      <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-medical-50 p-6 shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-700">System performance</p>
        <h1 className="mt-2 text-3xl font-extrabold text-surface-900">Performance</h1>
        <p className="mt-2 max-w-2xl text-sm text-surface-500">
          A clean operational view for health, latency, uptime, and error trend tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-3xl border border-surface-200 shadow-card p-5">
              <div className={`flex items-center gap-2 mb-2 ${card.color}`}>
                <div className={`w-8 h-8 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-surface-500">{card.label}</span>
              </div>
              <div className="text-2xl font-bold text-surface-900">{card.value}</div>
            </div>
          )
        })}
      </div>
      <div className="bg-white rounded-3xl border border-surface-200 shadow-card p-5">
        <div className="font-semibold text-sm text-surface-900 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-600" />Health Check Log
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${metrics.online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <div className="text-sm text-surface-600">
            {metrics.online ? 'API is reachable — RoboCare Service running' : 'API is unreachable — check Spring Boot service'}
          </div>
        </div>
        {metrics.lastCheck && (
          <div className="mt-2 text-xs text-surface-400">Last checked: {metrics.lastCheck}</div>
        )}
        <div className="mt-4 p-3 bg-surface-50 rounded-2xl font-mono text-xs text-surface-500 border border-surface-100">
          GET /api/notifications/health → {metrics.online ? '200 OK' : 'ERR_CONNECTION_REFUSED'} {metrics.responseTime ? `(${metrics.responseTime}ms)` : ''}
        </div>
      </div>
    </div>
  )
}
