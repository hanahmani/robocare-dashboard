import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Search, MessageCircle, Mail, Phone, CheckCircle, AlertCircle, X, ChevronRight, Reply, Users, TrendingUp } from 'lucide-react'
import { fetchSentNotifications, fetchReceivedWhatsApp, fetchReceivedEmails } from '../api/Notificationapi'
import { PageHero, PageKpi, PageWrapper } from '../components/PageHero'

const CHANNELS = {
  EMAIL: { label: 'Email', icon: Mail, iconColor: 'text-purple-500', activeBg: 'bg-purple-50 dark:bg-purple-950/40', borderColor: 'border-purple-200 dark:border-purple-800' },
  WHATSAPP: { label: 'WhatsApp', icon: MessageCircle, iconColor: 'text-green-500', activeBg: 'bg-green-50 dark:bg-green-950/40', borderColor: 'border-green-200 dark:border-green-800' },
  SMS: { label: 'SMS', icon: Phone, iconColor: 'text-blue-500', activeBg: 'bg-blue-50 dark:bg-blue-950/40', borderColor: 'border-blue-200 dark:border-blue-800' },
}

function getInitials(recipient) {
  if (!recipient) return '??'
  if (recipient.includes('@')) {
    const name = recipient.split('@')[0]
    return name.split(/[._-]/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('').slice(0, 2) || name.slice(0, 2).toUpperCase()
  }
  const clean = recipient.replace(/[+\d\s-()]/g, '')
  return (clean.slice(0, 2) || recipient.slice(-2)).toUpperCase()
}

function getAvatarColor(recipient) {
  const colors = ['#2d7a1f', '#185FA5', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1']
  let hash = 0
  for (let i = 0; i < recipient.length; i++) { hash = ((hash << 5) - hash) + recipient.charCodeAt(i); hash = hash & hash }
  return colors[Math.abs(hash) % colors.length]
}

function getChannelConfig(channel) {
  return CHANNELS[String(channel || '').toUpperCase()] || { label: 'Unknown', icon: Mail, iconColor: 'text-gray-500', activeBg: 'bg-gray-50', borderColor: 'border-gray-200' }
}

function RecipientDetailDrawer({ recipient, sentNotifications, receivedNotifications, stats, onClose }) {
  if (!recipient) return null
  const channels = stats.byChannel || {}
  const statuses = stats.byStatus || {}
  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close drawer" className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-5xl bg-gray-50 dark:bg-gray-950 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
        {/* Drawer header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Recipient Profile</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{recipient}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Sent', value: stats.total, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800' },
                { label: 'Success Rate', value: `${stats.successRate}%`, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
                { label: 'Received', value: receivedNotifications.length, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
                { label: 'Failed', value: stats.failed, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`rounded-xl border p-4 ${bg}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
                  <p className={`text-3xl font-black mt-2 ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Status breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Send Status Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(statuses).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{status}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${status === 'SENT' ? 'bg-green-500' : status === 'FAILED' ? 'bg-red-500' : status === 'PARTIAL' ? 'bg-amber-500' : 'bg-gray-400'}`} style={{ width: `${(count / stats.total) * 100}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Channels used */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Channels Used</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(CHANNELS).map(([key, config]) => {
                  const Icon = config.icon
                  return (
                    <div key={key} className={`rounded-xl border p-4 text-center ${config.activeBg} ${config.borderColor}`}>
                      <Icon className={`w-5 h-5 mx-auto mb-2 ${config.iconColor}`} />
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{config.label}</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{channels[key] || 0}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sent notifications */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Sent Notifications ({sentNotifications.length})</h3>
              {sentNotifications.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {sentNotifications.map((n) => {
                    const config = getChannelConfig(n.type)
                    const Icon = config.icon
                    const date = new Date(n.sentAt || n.createdAt)
                    const statusColor = { SENT: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400', FAILED: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400', PARTIAL: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400' }[n.status] || 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    return (
                      <div key={n.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{config.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor}`}>{n.status}</span>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{date.toLocaleString('fr-FR')}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{n.message || n.subject || n.bodyText || '—'}</p>
                        {n.errorMessage && <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 p-1.5 bg-red-50 dark:bg-red-950/30 rounded">{n.errorMessage}</p>}
                      </div>
                    )
                  })}
                </div>
              ) : <p className="text-sm text-gray-500 dark:text-gray-400">No sent notifications</p>}
            </div>

            {/* Received messages */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Reply className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Received Messages ({receivedNotifications.length})</h3>
              </div>
              {receivedNotifications.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {receivedNotifications.map((n) => {
                    const config = getChannelConfig(n.type)
                    const Icon = config.icon
                    const date = new Date(n.receivedAt || n.createdAt)
                    return (
                      <div key={n.id} className="border border-purple-200 dark:border-purple-800 rounded-xl p-3 bg-purple-50 dark:bg-purple-950/30">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{config.label} Reply</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-300">Received</span>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{date.toLocaleString('fr-FR')}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{n.message || n.content || '—'}</p>
                      </div>
                    )
                  })}
                </div>
              ) : <p className="text-sm text-gray-500 dark:text-gray-400">No received messages from this recipient</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RecipientsPage() {
  const [allSentNotifications, setAllSentNotifications] = useState([])
  const [allReceivedNotifications, setAllReceivedNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecipient, setSelectedRecipient] = useState(null)
  const hasLoadedRef = useRef(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const [sent, whatsapp, emails] = await Promise.all([
        fetchSentNotifications().catch(() => []),
        fetchReceivedWhatsApp().catch(() => []),
        fetchReceivedEmails().catch(() => []),
      ])
      setAllSentNotifications(sent || [])
      setAllReceivedNotifications([...(Array.isArray(whatsapp) ? whatsapp : []), ...(Array.isArray(emails) ? emails : [])])
      hasLoadedRef.current = true
    } catch (err) {
      setError(err?.message || 'Failed to load recipients data')
      setAllSentNotifications([]); setAllReceivedNotifications([])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { if (!hasLoadedRef.current) loadData() }, [loadData])

  const recipientStats = useMemo(() => {
    const grouped = {}
    allSentNotifications.forEach((n) => {
      const recipient = n.recipient || 'Unknown'
      if (!grouped[recipient]) {
        grouped[recipient] = { recipient, total: 0, sent: 0, failed: 0, partial: 0, byChannel: { EMAIL: 0, WHATSAPP: 0, SMS: 0 }, byStatus: { SENT: 0, FAILED: 0, PARTIAL: 0, PENDING: 0 }, lastSent: null, firstSent: null, failedCount: 0, lastError: null, sentNotifications: [], receivedNotifications: [] }
      }
      const stats = grouped[recipient]
      stats.total += 1; stats.sentNotifications.push(n)
      const status = n.status || 'PENDING'
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
      if (status === 'SENT') stats.sent += 1
      if (status === 'FAILED') stats.failed += 1
      if (status === 'PARTIAL') stats.partial += 1
      const channel = n.type || 'UNKNOWN'
      if (stats.byChannel[channel] !== undefined) stats.byChannel[channel] += 1
      const date = new Date(n.sentAt || n.createdAt)
      if (!stats.lastSent || date > new Date(stats.lastSent)) stats.lastSent = date.toLocaleString('fr-FR')
      if (!stats.firstSent || date < new Date(stats.firstSent)) stats.firstSent = date.toLocaleString('fr-FR')
      if (n.errorMessage) { stats.failedCount += 1; stats.lastError = n.errorMessage }
    })
    allReceivedNotifications.forEach((n) => {
      const sender = n.sender || n.from || n.phone || n.email || 'Unknown'
      Object.values(grouped).forEach((stats) => {
        if (stats.recipient === sender || stats.recipient === n.sender || stats.recipient === n.from || stats.recipient === n.phone || stats.recipient === n.email) {
          stats.receivedNotifications.push({ ...n, type: n.type || (n.email ? 'EMAIL' : n.phone ? 'WHATSAPP' : 'UNKNOWN') })
        }
      })
    })
    Object.values(grouped).forEach((stats) => { stats.successRate = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0 })
    return Object.values(grouped)
  }, [allSentNotifications, allReceivedNotifications])

  const filteredRecipients = useMemo(() => (
    recipientStats.filter((r) => r.recipient.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => b.total - a.total)
  ), [recipientStats, searchQuery])

  const globalSuccessRate = useMemo(() => {
    const total = recipientStats.reduce((s, r) => s + r.total, 0)
    const sent = recipientStats.reduce((s, r) => s + r.sent, 0)
    return total > 0 ? Math.round((sent / total) * 100) : 0
  }, [recipientStats])

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-green-600 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading recipients...</p>
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      {/* Hero */}
      <PageHero
        label="Client Profiles"
        title="Recipients"
        subtitle="Analyse complète de chaque client ayant reçu une notification via le microservice RoboCare."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PageKpi title="Total destinataires" value={filteredRecipients.length} desc="Clients uniques" />
        <PageKpi title="Messages envoyés" value={allSentNotifications.length} desc="All channels" accent="#2d7a1f" />
        <PageKpi title="Reçus (replies)" value={allReceivedNotifications.length} desc="WhatsApp + Email" accent="#7c3aed" />
        <PageKpi title="Taux de succès" value={`${globalSuccessRate}%`} desc="Delivered / Total" accent="#185FA5" />
      </div>

      {/* Search + list */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un destinataire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-500 transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="px-5 py-3 border-b border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-sm text-red-700 dark:text-red-400">{error}</div>
        )}

        {filteredRecipients.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No recipients found</p>
            <p className="text-gray-400 dark:text-gray-600 text-sm mt-1">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredRecipients.map((recipient) => (
              <div
                key={recipient.recipient}
                onClick={() => setSelectedRecipient(recipient)}
                className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: getAvatarColor(recipient.recipient) }}
                >
                  {getInitials(recipient.recipient)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{recipient.recipient}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span className="text-green-700 dark:text-green-400 font-medium">{recipient.total} envoyés</span>
                    {' · '}
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{recipient.successRate}% succès</span>
                    {' · '}
                    <span className="text-purple-600 dark:text-purple-400 font-medium">{recipient.receivedNotifications.length} reçus</span>
                  </p>
                </div>

                {/* Status badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {recipient.sent > 0 && (
                    <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400">{recipient.sent}</span>
                    </div>
                  )}
                  {recipient.failed > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-semibold text-red-700 dark:text-red-400">{recipient.failed}</span>
                    </div>
                  )}
                  {recipient.receivedNotifications.length > 0 && (
                    <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Reply className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">{recipient.receivedNotifications.length}</span>
                    </div>
                  )}
                </div>

                {/* Channel icons */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {recipient.byChannel.EMAIL > 0 && (
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                      <Mail className="w-3.5 h-3.5 text-purple-500" />
                    </div>
                  )}
                  {recipient.byChannel.WHATSAPP > 0 && (
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
                      <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                    </div>
                  )}
                  {recipient.byChannel.SMS > 0 && (
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                      <Phone className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedRecipient && (
        <RecipientDetailDrawer
          recipient={selectedRecipient.recipient}
          sentNotifications={selectedRecipient.sentNotifications}
          receivedNotifications={selectedRecipient.receivedNotifications}
          stats={selectedRecipient}
          onClose={() => setSelectedRecipient(null)}
        />
      )}
    </PageWrapper>
  )
}
