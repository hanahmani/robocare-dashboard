import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  MoreVertical, Search, Download, Plus, X, ChevronRight,
  Send, Mail, MessageCircle, Phone, RefreshCw, RotateCcw,
} from 'lucide-react'
import { StatusBadge } from '../components/Badges'
import { getSentNotifications, normalizeNotification } from '../services/notificationService'
import { PageHero, HeroStat, PageKpi, PageWrapper } from '../components/PageHero'
import SendPage from './SendPage'

const CHANNELS = ['Email', 'WhatsApp', 'SMS']
const STATUSES = ['Sent', 'Failed', 'Partial', 'Pending']
const TIME_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '24h', label: 'Last 24 h' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]
const SORT_OPTIONS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'oldest', label: 'Oldest first' },
]

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
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
      <button className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-6xl bg-gray-50 dark:bg-gray-950 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  )
}

function getMessagePreview(notification) {
  const message = notification.fullMessage || notification.message || notification.bodyText || notification.subject || '—'
  const compact = String(message).split('\n').join(' ').replace(/\s+/g, ' ').trim()
  const match = compact.match(/^.*?[.!?](?:\s|$)/)
  const preview = match ? match[0].trim() : (compact.split(' ').length > 18 ? `${compact.split(' ').slice(0, 18).join(' ')}...` : compact || '—')
  return { preview: preview || message, hasMore: compact !== preview }
}

function MessagePreview({ notification }) {
  const [expanded, setExpanded] = useState(false)
  const { preview, hasMore } = getMessagePreview(notification)
  const full = notification.fullMessage || notification.message || notification.bodyText || notification.subject || '—'
  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-xs">{preview}</div>
      {notification.templateName && (
        <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-[10px]">
          {notification.templateName}
        </span>
      )}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 hover:underline"
        >
          {expanded ? 'Voir moins' : 'Voir plus'}
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
      {expanded && (
        <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line break-words leading-relaxed">{full}</div>
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-500 transition-all'
const selectCls = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-500 transition-all'

function ChannelCell({ channel }) {
  if (channel === 'WhatsApp') return <div className="inline-flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-green-500" /><span className="text-sm font-medium text-green-700 dark:text-green-400">WhatsApp</span></div>
  if (channel === 'Email') return <div className="inline-flex items-center gap-1.5"><Mail className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium text-blue-700 dark:text-blue-400">Email</span></div>
  return <div className="inline-flex items-center gap-1.5"><Phone className="w-4 h-4 text-orange-500" /><span className="text-sm font-medium text-orange-700 dark:text-orange-400">SMS</span></div>
}

function AvatarCircle({ name, channel }) {
  const bg = channel === 'WhatsApp' ? 'bg-green-500' : channel === 'Email' ? 'bg-purple-500' : 'bg-blue-500'
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${bg}`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [recipientFilter, setRecipientFilter] = useState('')
  const [channelFilter, setChannelFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [timeFilter, setTimeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('recent')
  const [liveRefresh, setLiveRefresh] = useState(true)
  const [actionMenu, setActionMenu] = useState(null)
  const [selectedNotif, setSelectedNotif] = useState(null)
  const [showSendDrawer, setShowSendDrawer] = useState(false)
  const rowRefs = useRef(new Map())
  const focusId = searchParams.get('focus') || ''

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await getSentNotifications()
        const list = Array.isArray(res) ? res.map((r) => normalizeNotification(r)) : []
        if (!cancelled) setData(list)
      } catch (err) {
        console.error('Failed to load sent notifications', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!liveRefresh) return
    const id = setInterval(async () => {
      try {
        const res = await getSentNotifications()
        const list = Array.isArray(res) ? res.map((r) => normalizeNotification(r)) : []
        setData(list)
      } catch {}
    }, 30_000)
    return () => clearInterval(id)
  }, [liveRefresh])

  const timeMs = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 }

  const filtered = useMemo(() => {
    const now = Date.now()
    const limit = timeMs[timeFilter] ? now - timeMs[timeFilter] : null
    return data
      .filter((n) => {
        if (channelFilter !== 'All' && String(n.channel).toLowerCase() !== channelFilter.toLowerCase()) return false
        if (statusFilter !== 'All' && String(n.status).toLowerCase() !== statusFilter.toLowerCase()) return false
        if (limit) {
          const ts = new Date(n.raw?.sentAt || n.raw?.createdAt || 0).getTime()
          if (ts < limit) return false
        }
        const q = search.toLowerCase()
        if (q && !String(n.recipient || '').toLowerCase().includes(q) && !String(n.id || '').toLowerCase().includes(q)) return false
        if (recipientFilter && !String(n.recipient || '').toLowerCase().includes(recipientFilter.toLowerCase())) return false
        return true
      })
      .sort((a, b) => {
        const l = new Date(a.raw?.sentAt || a.raw?.createdAt || 0).getTime()
        const r = new Date(b.raw?.sentAt || b.raw?.createdAt || 0).getTime()
        return sortOrder === 'recent' ? r - l : l - r
      })
  }, [data, search, recipientFilter, channelFilter, statusFilter, timeFilter, sortOrder])

  useEffect(() => {
    if (!focusId) return
    const el = rowRefs.current.get(String(focusId))
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusId, filtered.length])

  function handleDelete(id) { setData((prev) => prev.filter((n) => n.id !== id)); setActionMenu(null) }

  function handleExport() {
    const rows = [
      ['ID', 'Recipient', 'Channel', 'Status', 'Message', 'Timestamp'],
      ...filtered.map((n) => [n.id, n.recipient, n.channel, n.status, n.fullMessage || n.message || n.bodyText || n.subject || '', n.timestamp]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'notifications.csv' })
    a.click(); URL.revokeObjectURL(a.href)
  }

  const kpi = useMemo(() => {
    const total = data.length
    const failed = data.filter((n) => String(n.status).toLowerCase() === 'failed').length
    const rate = total > 0 ? ((failed / total) * 100).toFixed(1) : '0.0'
    return { visible: filtered.length, failed, rate, total }
  }, [data, filtered])

  return (
    <PageWrapper>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <PageHero
        label="Notification Center"
        title="Notifications"
        subtitle="Search, review, retry, and export your notification history from a cleaner workspace."
        right={
          <div className="flex items-center gap-2">
            <HeroStat label="Visible" value={kpi.visible} />
            <HeroStat label="Failures" value={kpi.failed} danger={kpi.failed > 0} />
          </div>
        }
      />

      {/* ── Filters & actions ────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications... try: failed whatsapp"
            className={`pl-9 pr-8 ${inputCls}`} />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter recipient */}
        <input type="text" value={recipientFilter} onChange={(e) => setRecipientFilter(e.target.value)}
          placeholder="Filter recipient" className={inputCls} />

        {/* Dropdowns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className={selectCls}>
            <option value="All">All Channels</option>
            {CHANNELS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className={selectCls}>
            {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={selectCls}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setLiveRefresh((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              liveRefresh
                ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
            }`}
          >
            {liveRefresh ? '● Live on' : '○ Live off'}
          </button>

          <button
            onClick={async () => { setLoading(true); try { const r = await getSentNotifications(); setData(Array.isArray(r) ? r.map(normalizeNotification) : []) } catch {} finally { setLoading(false) } }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          <button
            onClick={() => alert('Retrying all failed notifications...')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry all failed
          </button>

          <button
            onClick={() => setShowSendDrawer(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-green-700 hover:bg-green-800 text-white transition-colors ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            New Notification
          </button>
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PageKpi title="Visible Rows" value={kpi.visible} desc="Currently filtered" />
        <PageKpi title="Failed" value={kpi.failed} desc="Total errors" accent={kpi.failed > 0 ? '#dc2626' : undefined} />
        <PageKpi title="Failure Rate" value={`${kpi.rate}%`} desc="Of all notifications" accent={Number(kpi.rate) > 5 ? '#dc2626' : '#2d7a1f'} />
        <PageKpi title="Live Updates" value={liveRefresh ? 'On' : 'Off'} desc="Auto-refresh 30s" accent={liveRefresh ? '#2d7a1f' : '#6b7280'} />
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                {['Recipient', 'Channel', 'Status', 'Message', 'Timestamp', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <Send className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications found</p>
                    <p className="text-gray-400 dark:text-gray-600 text-sm mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filtered.map((n) => (
                  <tr
                    key={n.id}
                    ref={(node) => { if (node) rowRefs.current.set(String(n.id), node); else rowRefs.current.delete(String(n.id)) }}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${String(n.id) === focusId ? 'bg-green-50/50 dark:bg-green-950/20' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <AvatarCircle name={n.recipient} channel={n.channel} />
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{n.recipient}</div>
                          <div className="text-xs text-gray-400 font-mono">ID {n.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><ChannelCell channel={n.channel} /></td>
                    <td className="px-5 py-4"><StatusBadge status={n.status} /></td>
                    <td className="px-5 py-4 max-w-xs"><MessagePreview notification={n} /></td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{n.timestamp}</td>
                    <td className="px-5 py-4 relative">
                      <button onClick={() => setActionMenu(actionMenu === n.id ? null : n.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {actionMenu === n.id && (
                        <div className="absolute right-4 top-10 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[140px] py-1">
                          <button onClick={() => { setSelectedNotif(n); setActionMenu(null) }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            View details
                          </button>
                          <button onClick={() => handleDelete(n.id)}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
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
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
            {filtered.length} notification{filtered.length !== 1 ? 's' : ''} shown
          </div>
        )}
      </div>

      {/* ── Drawers / Modals ──────────────────────────────────── */}
      {showSendDrawer && (
        <Drawer title="New Notification" onClose={() => setShowSendDrawer(false)}>
          <div className="overflow-auto h-full"><SendPage /></div>
        </Drawer>
      )}

      {selectedNotif && (
        <Modal title={`Notification #${selectedNotif.id}`} onClose={() => setSelectedNotif(null)}>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div><span className="font-semibold">Recipient:</span> {selectedNotif.recipient}</div>
            <div><span className="font-semibold">Channel:</span> {selectedNotif.channel}</div>
            <div><span className="font-semibold">Status:</span> {selectedNotif.status}</div>
            <div><span className="font-semibold">Date:</span> {selectedNotif.timestamp}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Full message</div>
            <pre className="whitespace-pre-wrap break-words rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-sm text-gray-800 dark:text-gray-200 leading-relaxed max-h-80 overflow-auto">
              {selectedNotif.fullMessage || selectedNotif.message || selectedNotif.bodyText || selectedNotif.subject || '—'}
            </pre>
          </div>
        </Modal>
      )}
    </PageWrapper>
  )
}
