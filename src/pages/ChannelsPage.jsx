import { useState, useEffect, useMemo } from 'react'
import { Mail, MessageCircle, MessageSquare, Settings as SettingsIcon, RefreshCw, Activity } from 'lucide-react'
import { StatusBadge } from '../components/Badges'
import { fetchSentNotifications, computeStats } from '../api/Notificationapi'
import { PageHero, PageKpi, PageWrapper } from '../components/PageHero'

const channelIcons = {
  EMAIL: { Icon: Mail, accent: '#185FA5', activeBg: 'bg-blue-50 dark:bg-blue-950/40', activeText: 'text-blue-600 dark:text-blue-400', label: 'Email', desc: 'SMTP / transactional emails' },
  WHATSAPP: { Icon: MessageCircle, accent: '#1D9E75', activeBg: 'bg-green-50 dark:bg-green-950/40', activeText: 'text-green-600 dark:text-green-400', label: 'WhatsApp', desc: 'Meta Business API' },
  SMS: { Icon: MessageSquare, accent: '#d97706', activeBg: 'bg-orange-50 dark:bg-orange-950/40', activeText: 'text-orange-600 dark:text-orange-400', label: 'SMS', desc: 'Mobile messaging gateway' },
}

export default function ChannelsPage() {
  const [allNotifications, setAllNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const notifications = await fetchSentNotifications()
      setAllNotifications(Array.isArray(notifications) ? notifications : [])
    } catch (err) {
      console.error('Failed to load notifications', err)
    } finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { loadData() }, [])

  const stats = useMemo(() => {
    const baseStats = computeStats(allNotifications)
    const channelCounts = baseStats.byType || { EMAIL: 0, SMS: 0, WHATSAPP: 0 }
    return {
      EMAIL: { count: channelCounts.EMAIL || 0, share: baseStats.total > 0 ? Math.round(((channelCounts.EMAIL || 0) / baseStats.total) * 100) : 0 },
      WHATSAPP: { count: channelCounts.WHATSAPP || 0, share: baseStats.total > 0 ? Math.round(((channelCounts.WHATSAPP || 0) / baseStats.total) * 100) : 0 },
      SMS: { count: channelCounts.SMS || 0, share: baseStats.total > 0 ? Math.round(((channelCounts.SMS || 0) / baseStats.total) * 100) : 0 },
      total: baseStats.total || 0,
    }
  }, [allNotifications])

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading channels...</p>
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      {/* Hero */}
      <PageHero
        label="Channel Monitor"
        title="Delivery Channels"
        subtitle="Surveillez et configurez les canaux de livraison du microservice de notifications RoboCare."
        right={
          <button
            onClick={() => loadData({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PageKpi title="Total envoyés" value={stats.total} desc="All channels combined" />
        <PageKpi title="WhatsApp" value={stats.WHATSAPP.count} desc={`${stats.WHATSAPP.share}% of total`} accent="#1D9E75" />
        <PageKpi title="Email" value={stats.EMAIL.count} desc={`${stats.EMAIL.share}% of total`} accent="#185FA5" />
        <PageKpi title="SMS" value={stats.SMS.count} desc={`${stats.SMS.share}% of total`} accent="#d97706" />
      </div>

      {/* Channel cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(channelIcons).map(([key, meta]) => {
          const Icon = meta.Icon
          const channelStats = stats[key]
          return (
            <div key={key} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.activeBg}`}>
                    <Icon className={`w-5 h-5 ${meta.activeText}`} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{meta.label}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{meta.desc}</p>
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-full text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Active
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Messages</div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white">{channelStats.count}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Part</div>
                  <div className="text-3xl font-black" style={{ color: meta.accent }}>{channelStats.share}%</div>
                </div>
              </div>

              {/* Share bar */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${channelStats.share}%`, backgroundColor: meta.accent }} />
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    <SettingsIcon className="w-3.5 h-3.5" strokeWidth={2} />
                    Configure
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </PageWrapper>
  )
}
