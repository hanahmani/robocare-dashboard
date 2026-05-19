import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Search, MessageCircle, Mail, Phone, TrendingUp, Clock, CheckCircle, AlertCircle, X, ChevronRight, Reply, ArrowRight } from 'lucide-react'
import { fetchSentNotifications, fetchReceivedWhatsApp, fetchReceivedEmails } from '../api/Notificationapi'

const CHANNELS = {
  EMAIL: { label: 'Email', icon: Mail, color: 'purple', bgColor: 'bg-purple-50', textColor: 'text-purple-700', iconColor: 'text-purple-500' },
  WHATSAPP: { label: 'WhatsApp', icon: MessageCircle, color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700', iconColor: 'text-green-500' },
  SMS: { label: 'SMS', icon: Phone, color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700', iconColor: 'text-blue-500' },
}

function getInitials(recipient) {
  if (!recipient) return '??'
  if (recipient.includes('@')) {
    const name = recipient.split('@')[0]
    return name
      .split(/[._-]/)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase() || '')
      .join('')
      .slice(0, 2) || name.slice(0, 2).toUpperCase()
  }
  const clean = recipient.replace(/[+\d\s-()]/g, '')
  return (clean.slice(0, 2) || recipient.slice(-2)).toUpperCase()
}

function getAvatarColor(recipient) {
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1']
  let hash = 0
  for (let i = 0; i < recipient.length; i++) {
    hash = ((hash << 5) - hash) + recipient.charCodeAt(i)
    hash = hash & hash
  }
  return colors[Math.abs(hash) % colors.length]
}

function getChannelConfig(channel) {
  const channelStr = String(channel || '').toUpperCase()
  return CHANNELS[channelStr] || { label: 'Unknown', icon: Mail, color: 'gray', bgColor: 'bg-gray-50', textColor: 'text-gray-700', iconColor: 'text-gray-500' }
}

function RecipientDetailDrawer({ recipient, sentNotifications, receivedNotifications, stats, onClose }) {
  if (!recipient) return null

  const channels = stats.byChannel || {}
  const statuses = stats.byStatus || {}

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close drawer" className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-5xl bg-gray-50 shadow-2xl border-l border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recipient Profile</h2>
            <p className="text-sm text-gray-500 mt-1">{recipient}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sent</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total}</p>
              </div>

              <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.successRate}%</p>
              </div>

              <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Received</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{receivedNotifications.length}</p>
              </div>

              <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">{stats.failed}</p>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Send Status Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(statuses).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{status}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            status === 'SENT' ? 'bg-green-500' : status === 'FAILED' ? 'bg-red-500' : status === 'PARTIAL' ? 'bg-amber-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Channels Used</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(CHANNELS).map(([key, config]) => {
                  const Icon = config.icon
                  const count = channels[key] || 0
                  return (
                    <div key={key} className="rounded-lg border border-gray-200 p-4 text-center">
                      <Icon className={`w-5 h-5 mx-auto mb-2 ${config.iconColor}`} />
                      <p className="text-xs font-medium text-gray-600">{config.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sent Notifications */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Sent Notifications ({sentNotifications.length})</h3>
              {sentNotifications.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sentNotifications.map((notification) => {
                    const config = getChannelConfig(notification.type)
                    const Icon = config.icon
                    const date = new Date(notification.sentAt || notification.createdAt)
                    const statusColor = {
                      SENT: 'bg-green-50 border-green-200 text-green-700',
                      FAILED: 'bg-red-50 border-red-200 text-red-700',
                      PARTIAL: 'bg-amber-50 border-amber-200 text-amber-700',
                      PENDING: 'bg-gray-50 border-gray-200 text-gray-700',
                    }[notification.status] || 'bg-gray-50 border-gray-200 text-gray-700'

                    return (
                      <div key={notification.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${config.iconColor}`} />
                            <span className="text-xs font-medium text-gray-600">{config.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor}`}>
                              {notification.status}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{date.toLocaleString('fr-FR')}</span>
                        </div>
                        <p className="text-sm text-gray-700">{notification.message || notification.subject || notification.bodyText || '—'}</p>
                        {notification.errorMessage && (
                          <p className="text-xs text-red-600 mt-2 p-1.5 bg-red-50 rounded">{notification.errorMessage}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No sent notifications</p>
              )}
            </div>

            {/* Received Messages */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Reply className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-900">Received Messages ({receivedNotifications.length})</h3>
              </div>
              {receivedNotifications.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {receivedNotifications.map((notification) => {
                    const config = getChannelConfig(notification.type)
                    const Icon = config.icon
                    const date = new Date(notification.receivedAt || notification.createdAt)

                    return (
                      <div key={notification.id} className="border border-purple-200 rounded-lg p-3 bg-purple-50 hover:bg-purple-100 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${config.iconColor}`} />
                            <span className="text-xs font-medium text-gray-600">{config.label} Reply</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">Received</span>
                          </div>
                          <span className="text-xs text-gray-500">{date.toLocaleString('fr-FR')}</span>
                        </div>
                        <p className="text-sm text-gray-700">{notification.message || notification.content || '—'}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No received messages from this recipient</p>
              )}
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
      setLoading(true)
      setError('')
      const [sent, whatsapp, emails] = await Promise.all([
        fetchSentNotifications().catch(() => []),
        fetchReceivedWhatsApp().catch(() => []),
        fetchReceivedEmails().catch(() => []),
      ])
      setAllSentNotifications(sent || [])
      
      // Combine received messages (WhatsApp and Emails)
      const combinedReceived = [
        ...(Array.isArray(whatsapp) ? whatsapp : []),
        ...(Array.isArray(emails) ? emails : []),
      ]
      setAllReceivedNotifications(combinedReceived)
      hasLoadedRef.current = true
    } catch (err) {
      setError(err?.message || 'Failed to load recipients data')
      console.error('Error loading data:', err)
      setAllSentNotifications([])
      setAllReceivedNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadData()
    }
  }, [loadData])

  const recipientStats = useMemo(() => {
    const grouped = {}

    allSentNotifications.forEach((notification) => {
      const recipient = notification.recipient || 'Unknown'
      if (!grouped[recipient]) {
        grouped[recipient] = {
          recipient,
          total: 0,
          sent: 0,
          failed: 0,
          partial: 0,
          byChannel: { EMAIL: 0, WHATSAPP: 0, SMS: 0 },
          byStatus: { SENT: 0, FAILED: 0, PARTIAL: 0, PENDING: 0 },
          lastSent: null,
          firstSent: null,
          failedCount: 0,
          lastError: null,
          sentNotifications: [],
          receivedNotifications: [],
        }
      }

      const stats = grouped[recipient]
      stats.total += 1
      stats.sentNotifications.push(notification)

      const status = notification.status || 'PENDING'
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
      if (status === 'SENT') stats.sent += 1
      if (status === 'FAILED') stats.failed += 1
      if (status === 'PARTIAL') stats.partial += 1

      const channel = notification.type || 'UNKNOWN'
      if (stats.byChannel[channel]) stats.byChannel[channel] += 1

      const date = new Date(notification.sentAt || notification.createdAt)
      if (!stats.lastSent || date > new Date(stats.lastSent)) {
        stats.lastSent = new Date(notification.sentAt || notification.createdAt).toLocaleString('fr-FR')
      }
      if (!stats.firstSent || date < new Date(stats.firstSent)) {
        stats.firstSent = new Date(notification.sentAt || notification.createdAt).toLocaleString('fr-FR')
      }

      if (notification.errorMessage) {
        stats.failedCount += 1
        stats.lastError = notification.errorMessage
      }
    })

    // Add received messages to recipients (try multiple field names)
    allReceivedNotifications.forEach((notification) => {
      // Try different field names for sender
      const sender = notification.sender || notification.from || notification.phone || notification.email || 'Unknown'
      
      // Try to find matching recipient - be flexible with field names
      Object.values(grouped).forEach((stats) => {
        // Check if this recipient matches the sender
        if (
          stats.recipient === sender ||
          stats.recipient === notification.sender ||
          stats.recipient === notification.from ||
          stats.recipient === notification.phone ||
          stats.recipient === notification.email
        ) {
          stats.receivedNotifications.push({
            ...notification,
            type: notification.type || (notification.email ? 'EMAIL' : notification.phone ? 'WHATSAPP' : 'UNKNOWN'),
          })
        }
      })
    })

    Object.values(grouped).forEach((stats) => {
      stats.successRate = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0
    })

    return Object.values(grouped)
  }, [allSentNotifications, allReceivedNotifications])

  const filteredRecipients = useMemo(() => {
    return recipientStats
      .filter((r) => r.recipient.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.total - a.total)
  }, [recipientStats, searchQuery])

  if (loading) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
            <p className="text-gray-600 text-sm">Loading recipients...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recipients</h1>
          <p className="text-sm text-gray-500 mt-1">Complete analysis of every client</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5" style={{ borderLeft: '4px solid #3b82f6' }}>
          <p className="text-sm text-gray-500 font-medium">Total Recipients</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{filteredRecipients.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5" style={{ borderLeft: '4px solid #10b981' }}>
          <p className="text-sm text-gray-500 font-medium">Total Sent</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{allSentNotifications.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <p className="text-sm text-gray-500 font-medium">Received Messages</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{allReceivedNotifications.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5" style={{ borderLeft: '4px solid #f59e0b' }}>
          <p className="text-sm text-gray-500 font-medium">Success Rate</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {recipientStats.length > 0
              ? Math.round(
                  recipientStats.reduce((sum, r) => sum + r.sent, 0) /
                  recipientStats.reduce((sum, r) => sum + r.total, 0) * 100
                )
              : 0}%
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-3 relative">
          <Search className="w-4 h-4 text-gray-400 absolute ml-3" />
          <input
            type="text"
            placeholder="Search recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
          />
        </div>
      </div>

      {/* Recipients List */}
      <div className="grid gap-3">
        {filteredRecipients.length > 0 ? (
          filteredRecipients.map((recipient) => (
            <div
              key={recipient.recipient}
              onClick={() => setSelectedRecipient(recipient)}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: getAvatarColor(recipient.recipient) }}
                >
                  {getInitials(recipient.recipient)}
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{recipient.recipient}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="text-blue-600 font-medium">{recipient.total} sent</span> •{' '}
                    <span className="text-green-600 font-medium">{recipient.successRate}% success</span> •{' '}
                    <span className="text-purple-600 font-medium">{recipient.receivedNotifications.length} received</span>
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {recipient.sent > 0 && (
                    <div className="bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs font-medium text-green-700">{recipient.sent}</span>
                    </div>
                  )}
                  {recipient.failed > 0 && (
                    <div className="bg-red-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                      <span className="text-xs font-medium text-red-700">{recipient.failed}</span>
                    </div>
                  )}
                  {recipient.receivedNotifications.length > 0 && (
                    <div className="bg-purple-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Reply className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-xs font-medium text-purple-700">{recipient.receivedNotifications.length}</span>
                    </div>
                  )}
                </div>

                {/* Channel Icons */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {recipient.byChannel.EMAIL > 0 && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 border border-purple-200">
                      <Mail className="w-4 h-4 text-purple-600" />
                    </div>
                  )}
                  {recipient.byChannel.WHATSAPP > 0 && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 border border-green-200">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                  {recipient.byChannel.SMS > 0 && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 border border-blue-200">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No recipients found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedRecipient && (
        <RecipientDetailDrawer
          recipient={selectedRecipient.recipient}
          sentNotifications={selectedRecipient.sentNotifications}
          receivedNotifications={selectedRecipient.receivedNotifications}
          stats={selectedRecipient}
          onClose={() => setSelectedRecipient(null)}
        />
      )}
    </div>
  )
}
