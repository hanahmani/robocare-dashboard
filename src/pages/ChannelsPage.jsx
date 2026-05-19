import { useState, useEffect, useMemo } from 'react'
import { Mail, MessageCircle, MessageSquare, Settings as SettingsIcon, RefreshCw } from 'lucide-react'
import { StatusBadge } from '../components/Badges'
import { fetchSentNotifications, computeStats } from '../api/Notificationapi'

const channelIcons = {
  EMAIL: { Icon: Mail, bg: 'bg-blue-50', color: 'text-blue-600', label: 'Email' },
  WHATSAPP: { Icon: MessageCircle, bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'WhatsApp' },
  SMS: { Icon: MessageSquare, bg: 'bg-orange-50', color: 'text-orange-600', label: 'SMS' },
}

export default function ChannelsPage() {
  const [allNotifications, setAllNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      const notifications = await fetchSentNotifications()
      const rawNotifications = Array.isArray(notifications) ? notifications : []
      setAllNotifications(rawNotifications)
    } catch (err) {
      console.error('Failed to load notifications', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const stats = useMemo(() => {
    const baseStats = computeStats(allNotifications)
    const channelCounts = baseStats.byType || { EMAIL: 0, SMS: 0, WHATSAPP: 0 }
    
    return {
      EMAIL: {
        count: channelCounts.EMAIL || 0,
        successRate: baseStats.total > 0 ? Math.round(((channelCounts.EMAIL || 0) / baseStats.total) * 100) : 0,
      },
      WHATSAPP: {
        count: channelCounts.WHATSAPP || 0,
        successRate: baseStats.total > 0 ? Math.round(((channelCounts.WHATSAPP || 0) / baseStats.total) * 100) : 0,
      },
      SMS: {
        count: channelCounts.SMS || 0,
        successRate: baseStats.total > 0 ? Math.round(((channelCounts.SMS || 0) / baseStats.total) * 100) : 0,
      },
    }
  }, [allNotifications])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <RefreshCw className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600 mt-3">Loading channels...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor delivery channels for the RoboCare notification microservice.
          </p>
        </div>
        <button
          onClick={() => loadData()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(channelIcons).map(([key, meta]) => {
          const Icon = meta.Icon
          const channelStats = stats[key]
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.bg}`}>
                    <Icon className={`w-5 h-5 ${meta.color}`} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{meta.label}</h3>
                    <p className="text-xs text-gray-500">Active channel</p>
                  </div>
                </div>
                <div className="px-2 py-1 bg-green-50 border border-green-200 rounded text-xs font-medium text-green-700">
                  Active
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2 font-medium">
                    Sent (24h)
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{channelStats.count}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2 font-medium">
                    Share
                  </div>
                  <div className="text-3xl font-bold text-emerald-600">{channelStats.successRate}%</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-end">
                <button className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  <SettingsIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  Configure
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
