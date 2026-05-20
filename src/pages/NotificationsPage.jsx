import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MoreVertical, Search, Download, Plus, X, ChevronRight } from 'lucide-react'
import { ReloadOutlined } from '@ant-design/icons'
import { Alert, message as antMessage } from 'antd'
import Card from '../components/Card'
import { Avatar, ChannelTag, StatusBadge } from '../components/Badges'
import {
  getSentNotifications,
  normalizeNotification,
  sendEmailNotification,
  sendSmsNotification,
  sendWhatsAppNotification,
} from '../services/notificationService'
import SendNotificationPage from './SendWhatsappPage'

const CHANNELS = ['Email', 'WhatsApp', 'SMS']
const STATUSES = ['Sent', 'Failed', 'Partial', 'Pending']
const DATE_RANGES = ['All time', 'Today', 'Last 7 days', 'Last 30 days']
const FAILURE_ALERT_THRESHOLD = 15

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  )
}

function Drawer({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close drawer" className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-5xl bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

function getMessagePreview(notification) {
  const message = notification.fullMessage || notification.message || notification.bodyText || notification.subject || '—'
  const compactMessage = String(message).split('\n').join(' ').replace(/\s+/g, ' ').trim()
  const sentenceMatch = compactMessage.match(/^.*?[.!?](?:\s|$)/)
  const preview = sentenceMatch
    ? sentenceMatch[0].trim()
    : (compactMessage.split(' ').length > 18 ? `${compactMessage.split(' ').slice(0, 18).join(' ')}...` : compactMessage || '—')
  return {
    preview: preview || message,
    remaining: compactMessage !== preview,
  }
}

function normalizeQuery(query) {
  return String(query || '').toLowerCase().trim().replace(/\s+/g, ' ')
}

function getRangeBounds(label) {
  const now = Date.now()
  if (label === 'Today') return now - 24 * 60 * 60 * 1000
  if (label === 'Last 7 days') return now - 7 * 24 * 60 * 60 * 1000
  if (label === 'Last 30 days') return now - 30 * 24 * 60 * 60 * 1000
  return null
}

function parseSmartQuery(query) {
  const normalized = normalizeQuery(query)
  const tokens = normalized.split(' ').filter(Boolean)
  const statusMap = { failed: 'Failed', sent: 'Sent', pending: 'Pending', partial: 'Partial' }
  const channelMap = { email: 'Email', whatsapp: 'WhatsApp', sms: 'SMS' }

  let inferredStatus = 'All'
  let inferredChannel = 'All'
  let inferredRange = 'All time'

  const remaining = []

  tokens.forEach((token) => {
    if (statusMap[token]) {
      inferredStatus = statusMap[token]
      return
    }
    if (channelMap[token]) {
      inferredChannel = channelMap[token]
      return
    }
    if (token === 'today') {
      inferredRange = 'Today'
      return
    }
    if (token === 'yesterday' || token === 'week' || token === 'weekly') {
      inferredRange = 'Last 7 days'
      return
    }
    if (token === 'month' || token === 'monthly') {
      inferredRange = 'Last 30 days'
      return
    }
    remaining.push(token)
  })

  return {
    inferredStatus,
    inferredChannel,
    inferredRange,
    text: remaining.join(' '),
  }
}

function getRecipients(notification) {
  const rawRecipients = notification.raw?.to ?? notification.raw?.recipient ?? notification.recipient
  if (Array.isArray(rawRecipients)) {
    return rawRecipients.map((value) => String(value).trim()).filter(Boolean)
  }
  return String(rawRecipients || '')
    .split(/[,;\n]/)
    .map((value) => value.trim())
    .filter(Boolean)
}

function getRetryPayload(notification, nextChannel) {
  const recipients = getRecipients(notification)
  const message = notification.raw?.message || notification.fullMessage || notification.message || notification.bodyText || notification.subject || ''
  const subject = notification.raw?.subject || notification.subject || 'Retry notification'
  const base = {
    to: recipients,
    message,
  }

  if (nextChannel === 'Email') {
    return {
      ...base,
      subject,
    }
  }

  if (nextChannel === 'WhatsApp') {
    return {
      ...base,
      type: notification.raw?.type || 'TEMPLATE',
      templateName: notification.raw?.templateName || notification.templateName || '',
      templateLang: notification.raw?.templateLang || notification.templateLang || 'en_US',
      headerText: notification.raw?.headerText || notification.headerText || '',
      bodyText: notification.raw?.bodyText || notification.bodyText || '',
      fileUrl: notification.raw?.fileUrl || notification.fileUrl || '',
    }
  }

  return base
}

function NotificationMessagePreview({ notification, onOpenDetails }) {
  const [expanded, setExpanded] = useState(false)
  const { preview, remaining } = getMessagePreview(notification)
  const fullMessage = notification.fullMessage || notification.message || notification.bodyText || notification.subject || '—'

  return (
    <div className="space-y-2">
      <div
        className={`text-gray-900 text-sm leading-6 break-words ${
          expanded ? 'whitespace-pre-line' : 'whitespace-nowrap overflow-hidden text-ellipsis'
        }`}
      >
        {expanded ? fullMessage : preview}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
        {notification.templateName && <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">{notification.templateName}</span>}
        {notification.templateLang && <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">{notification.templateLang}</span>}
        {remaining && <span className="text-gray-400">...</span>}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
      >
        {expanded ? 'Voir moins' : 'Voir plus'}
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function SendDrawer({ onClose, onOpenFullPage }) {
  return (
    <Drawer title="New Notification" onClose={onClose}>
      <div className="p-6 space-y-5 overflow-auto h-full">
        <SendNotificationPage embedded />
        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={onOpenFullPage}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          >
            Open full send page
          </button>
        </div>
      </div>
    </Drawer>
  )
}

const inputCls =
  'w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'

const selectCls =
  'w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dateRangeFilter, setDateRangeFilter] = useState('All time')
  const [recipientFilter, setRecipientFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('recent')
  const [actionMenu, setActionMenu] = useState(null)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [showSendDrawer, setShowSendDrawer] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [retryTargetChannel, setRetryTargetChannel] = useState('')
  const [retryingId, setRetryingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const rowRefs = useRef(new Map())
  const focusId = searchParams.get('focus') || ''

  const loadData = useCallback(async () => {
    setLoading(true)
    let cancelled = false
    async function load() {
      try {
        const res = await getSentNotifications()
        const list = Array.isArray(res) ? res.map((r) => normalizeNotification(r)) : []
        if (!cancelled) setData(list || [])
      } catch (err) {
        console.error('Failed to load sent notifications', err)
        antMessage.error('Failed to refresh notification history')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const cancel = loadData()
    return () => {
      if (typeof cancel === 'function') cancel()
    }
  }, [loadData])

  useEffect(() => {
    if (!autoRefresh) return undefined
    const timer = window.setInterval(() => {
      loadData()
    }, 30000)
    return () => window.clearInterval(timer)
  }, [autoRefresh, loadData])

  const filtered = useMemo(() => {
    const smart = parseSmartQuery(search)
    const activeChannel = channelFilter !== 'All' ? channelFilter : smart.inferredChannel
    const activeStatus = statusFilter !== 'All' ? statusFilter : smart.inferredStatus
    const activeRange = dateRangeFilter !== 'All time' ? dateRangeFilter : smart.inferredRange
    const textQuery = normalizeQuery(`${smart.text} ${recipientFilter}`)
    const lowerBound = getRangeBounds(activeRange)

    const list = data.filter((n) => {
      const timestamp = new Date(n.raw?.sentAt || n.raw?.createdAt || 0).getTime()
      if (lowerBound && Number.isFinite(timestamp) && timestamp < lowerBound) return false
      if (activeChannel !== 'All' && String(n.channel).toLowerCase() !== activeChannel.toLowerCase()) return false
      if (activeStatus !== 'All' && String(n.status).toLowerCase() !== activeStatus.toLowerCase()) return false
      if (textQuery) {
        const haystack = [
          n.recipient,
          n.id,
          n.subject,
          n.message,
          n.fullMessage,
          n.templateName,
          n.templateLang,
          n.errorMessage,
          n.channel,
          n.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(textQuery)) return false
      }
      return true
    })
    return list.sort((a, b) => {
      const left = new Date(a.raw?.sentAt || a.raw?.createdAt || 0).getTime()
      const right = new Date(b.raw?.sentAt || b.raw?.createdAt || 0).getTime()
      return sortOrder === 'recent' ? right - left : left - right
    })
  }, [data, search, channelFilter, statusFilter, sortOrder, dateRangeFilter, recipientFilter])

  const failedCount = useMemo(() => filtered.filter((item) => String(item.status).toLowerCase() === 'failed').length, [filtered])
  const failureRate = useMemo(() => (filtered.length > 0 ? (failedCount / filtered.length) * 100 : 0), [failedCount, filtered.length])
  const pageClassName = 'page-shell px-4 sm:px-8 py-6 space-y-6'

  async function retryNotification(notification, nextChannel = notification.channel) {
    setRetryingId(notification.id)
    try {
      const payload = getRetryPayload(notification, nextChannel)
      if (nextChannel === 'Email') {
        await sendEmailNotification(payload)
      } else if (nextChannel === 'WhatsApp') {
        await sendWhatsAppNotification(payload)
      } else {
        await sendSmsNotification(payload)
      }

      antMessage.success(`Retried notification #${notification.id} as ${nextChannel}`)
      setSelectedNotification(null)
      setActionMenu(null)
      setRetryTargetChannel('')
      loadData()
    } catch (err) {
      antMessage.error(err?.message || 'Retry failed')
    } finally {
      setRetryingId(null)
    }
  }

  async function retryAllFailed() {
    const items = filtered.filter((item) => String(item.status).toLowerCase() === 'failed')
    if (items.length === 0) {
      antMessage.info('No failed notifications in the current filter.')
      return
    }

    setRetryingId('bulk')
    try {
      for (const item of items) {
        // Retry each item using its original channel to preserve behavior.
        // Users can change the channel in the details drawer before retrying a single item.
        // eslint-disable-next-line no-await-in-loop
        await retryNotification(item, item.channel)
      }
      antMessage.success(`Retried ${items.length} failed notification${items.length > 1 ? 's' : ''}.`)
      loadData()
    } finally {
      setRetryingId(null)
    }
  }

  useEffect(() => {
    if (!focusId) return
    const el = rowRefs.current.get(String(focusId))
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [focusId, filtered.length])

  function handleDelete(id) {
    setData((prev) => prev.filter((n) => n.id !== id))
    setActionMenu(null)
  }

  function openDetails(notification) {
    setSelectedNotification(notification)
  }

  function handleExport() {
    const rows = [
      ['ID', 'Recipient', 'Channel', 'Status', 'Message', 'Timestamp'],
      ...filtered.map((n) => [n.id, n.recipient, n.channel, n.status, n.fullMessage || n.message || n.bodyText || n.subject || '', n.timestamp]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'notifications.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={pageClassName}>
      <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-medical-50 p-6 shadow-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-700">Notification center</p>
            <h1 className="mt-2 text-3xl font-extrabold text-surface-900">Notifications</h1>
            <p className="mt-2 max-w-2xl text-sm text-surface-500">
              Search, review, retry, and export your notification history from a cleaner workspace.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[260px]">
            <div className="rounded-2xl border border-surface-200 bg-white/80 px-4 py-3 backdrop-blur-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-surface-400">Visible</div>
              <div className="mt-1 text-2xl font-extrabold text-surface-900">{filtered.length}</div>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-white/80 px-4 py-3 backdrop-blur-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-surface-400">Failures</div>
              <div className="mt-1 text-2xl font-extrabold text-alert-600">{failedCount}</div>
            </div>
          </div>
        </div>
      </div>

      {failureRate >= FAILURE_ALERT_THRESHOLD && (
        <Alert
          className="mb-0 rounded-2xl border-brand-100 shadow-card"
          type="warning"
          showIcon
          message="High failure rate detected"
          description={`The current filtered result set is at ${failureRate.toFixed(1)}% failures. Retry the failed items or narrow the filters to inspect the root cause.`}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-start justify-between gap-3 flex-wrap rounded-3xl border border-surface-200 bg-white/85 p-4 shadow-card backdrop-blur-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications... try: failed whatsapp yesterday"
              className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <input
            type="text"
            value={recipientFilter}
            onChange={(e) => setRecipientFilter(e.target.value)}
            placeholder="Filter recipient"
            className={inputCls}
          />

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className={selectCls}
          >
            <option value="All">All Channels</option>
            {CHANNELS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectCls}
          >
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className={selectCls}
          >
            {DATE_RANGES.map((range) => (
              <option key={range}>{range}</option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={selectCls}
          >
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => setAutoRefresh((value) => !value)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full border ${
              autoRefresh ? 'bg-medical-50 border-medical-200 text-medical-700' : 'bg-white border-surface-200 text-surface-700'
            }`}
          >
            Live {autoRefresh ? 'on' : 'off'}
          </button>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-surface-200 rounded-full hover:bg-surface-50 text-surface-700"
          >
            <ReloadOutlined spin={loading} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-surface-200 rounded-full hover:bg-surface-50 text-surface-700"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
            Export
          </button>
          <button
            onClick={retryAllFailed}
            disabled={retryingId === 'bulk'}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-warning-50 border border-warning-200 rounded-full hover:bg-warning-100 text-warning-700 disabled:opacity-60"
          >
            Retry all failed
          </button>
          <button
            onClick={() => setShowSendDrawer(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-full hover:bg-brand-700 shadow-glow"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            New Notification
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="bg-white">
          <div className="text-[11px] uppercase tracking-wider text-gray-400">Visible rows</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{filtered.length}</div>
        </Card>
        <Card className="bg-white">
          <div className="text-[11px] uppercase tracking-wider text-gray-400">Failed</div>
          <div className="mt-2 text-2xl font-semibold text-red-600">{failedCount}</div>
        </Card>
        <Card className="bg-white">
          <div className="text-[11px] uppercase tracking-wider text-gray-400">Failure rate</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{failureRate.toFixed(1)}%</div>
        </Card>
        <Card className="bg-white">
          <div className="text-[11px] uppercase tracking-wider text-gray-400">Live updates</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{autoRefresh ? 'On' : 'Off'}</div>
        </Card>
      </div>

      <Card padding="p-0" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-surface-500 border-b border-surface-100 bg-surface-50/60">
              <th className="text-left font-medium px-5 py-3">Recipient</th>
              <th className="text-left font-medium px-5 py-3">Channel</th>
              <th className="text-left font-medium px-5 py-3">Status</th>
              <th className="text-left font-medium px-5 py-3">Message</th>
              <th className="text-left font-medium px-5 py-3">Timestamp</th>
              <th className="text-left font-medium px-5 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                  No notifications match your search.
                </td>
              </tr>
            ) : (
                filtered.map((n) => (
                <tr
                  key={n.id}
                  ref={(node) => {
                    if (node) rowRefs.current.set(String(n.id), node)
                    else rowRefs.current.delete(String(n.id))
                  }}
                  className={`transition-colors ${String(n.id) === focusId ? 'bg-brand-50/70 ring-1 ring-inset ring-brand-200' : 'hover:bg-surface-50/70'}`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={n.initials} />
                      <div>
                        <div className="text-gray-900">{n.recipient}</div>
                        <div className="text-[11px] text-gray-400 font-mono">ID: {n.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <ChannelTag channel={n.channel} />
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={n.status} />
                  </td>
                  <td className="px-5 py-3 max-w-xl">
                    <NotificationMessagePreview notification={n} onOpenDetails={() => openDetails(n)} />
                    {n.errorMessage && String(n.status).toLowerCase() !== 'failed' && (
                      <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 whitespace-pre-wrap break-words">
                        Info: {n.errorMessage}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{n.timestamp}</td>
                  <td className="px-5 py-3 relative">
                    <button
                      onClick={() => setActionMenu(actionMenu === n.id ? null : n.id)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400"
                    >
                      <MoreVertical className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                    {actionMenu === n.id && (
                      <div className="absolute right-4 top-8 z-20 bg-white border border-gray-200 rounded-md shadow-lg min-w-[120px] py-1">
                        <button
                          onClick={() => { openDetails(n); setActionMenu(null) }}
                          className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => { openDetails(n); setRetryTargetChannel(n.channel); setActionMenu(null) }}
                          className="w-full text-left px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50"
                        >
                          Retry
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} notification{filtered.length !== 1 ? 's' : ''} shown
          </div>
        )}
      </Card>

      {showSendDrawer && (
        <SendDrawer
          onClose={() => setShowSendDrawer(false)}
          onOpenFullPage={() => navigate('/send')}
        />
      )}

      {selectedNotification && (
        <Modal title={`Notification #${selectedNotification.id}`} onClose={() => setSelectedNotification(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-gray-700">Recipient:</span> {selectedNotification.recipient}</div>
              <div><span className="font-medium text-gray-700">Channel:</span> {selectedNotification.channel}</div>
              <div><span className="font-medium text-gray-700">Status:</span> {selectedNotification.status}</div>
              <div><span className="font-medium text-gray-700">Timestamp:</span> {selectedNotification.timestamp}</div>
              {selectedNotification.templateName && <div><span className="font-medium text-gray-700">Template:</span> {selectedNotification.templateName}</div>}
              {selectedNotification.templateLang && <div><span className="font-medium text-gray-700">Lang:</span> {selectedNotification.templateLang}</div>}
            </div>

            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Message complet</div>
              <pre className="whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 leading-6 max-h-80 overflow-auto">
{selectedNotification.fullMessage || selectedNotification.message || selectedNotification.bodyText || selectedNotification.subject || '—'}
              </pre>
            </div>

            {selectedNotification.fileUrl && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">File:</span> {selectedNotification.fileUrl}
              </div>
            )}

            {selectedNotification.errorMessage && String(selectedNotification.status).toLowerCase() !== 'failed' && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-wrap">
                <span className="font-medium">Error:</span> {selectedNotification.errorMessage}
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">Retry notification</div>
                  <div className="text-xs text-gray-500">Change the channel before resending if needed.</div>
                </div>
                <select
                  value={retryTargetChannel || selectedNotification.channel}
                  onChange={(e) => setRetryTargetChannel(e.target.value)}
                  className={selectCls}
                >
                  {CHANNELS.map((channel) => (
                    <option key={channel}>{channel}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => retryNotification(selectedNotification, retryTargetChannel || selectedNotification.channel)}
                  disabled={retryingId === selectedNotification.id}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
                >
                  {retryingId === selectedNotification.id ? 'Retrying...' : 'Retry now'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
