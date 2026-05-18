import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MoreVertical, Search, Download, Plus, X, ChevronRight } from 'lucide-react'
import Card from '../components/Card'
import { Avatar, ChannelTag, StatusBadge } from '../components/Badges'
import { getSentNotifications, normalizeNotification } from '../services/notificationService'
import SendNotificationPage from './SendWhatsappPage'

const CHANNELS = ['Email', 'WhatsApp', 'SMS']
const STATUSES = ['Sent', 'Failed', 'Partial', 'Pending']

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
  const lines = String(message).split('\n').filter(Boolean)
  const preview = lines.slice(0, 2).join(' • ') || message
  const remaining = lines.slice(2).join(' • ')
  return {
    preview: preview || message,
    remaining,
  }
}

function NotificationMessagePreview({ notification, onOpenDetails }) {
  const { preview, remaining } = getMessagePreview(notification)

  return (
    <div className="space-y-2">
      <div className="text-gray-900 text-sm leading-6 break-words whitespace-normal">
        {preview}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
        {notification.templateName && <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">{notification.templateName}</span>}
        {notification.templateLang && <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">{notification.templateLang}</span>}
        {remaining && <span className="text-gray-400">...</span>}
      </div>
      <button
        type="button"
        onClick={onOpenDetails}
        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
      >
        Voir plus
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
  const [sortOrder, setSortOrder] = useState('recent')
  const [actionMenu, setActionMenu] = useState(null)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [showSendDrawer, setShowSendDrawer] = useState(false)
  const rowRefs = useRef(new Map())
  const focusId = searchParams.get('focus') || ''

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await getSentNotifications()
        const list = Array.isArray(res) ? res.map((r) => normalizeNotification(r)) : []
        if (!cancelled) setData(list || [])
      } catch (err) {
        console.error('Failed to load sent notifications', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const list = data.filter((n) => {
      if (channelFilter !== 'All' && String(n.channel).toLowerCase() !== channelFilter.toLowerCase()) return false
      if (statusFilter !== 'All' && String(n.status).toLowerCase() !== statusFilter.toLowerCase()) return false
      if (search) {
        const q = search.toLowerCase()
        if (!String(n.recipient || '').toLowerCase().includes(q) && !String(n.id || '').toLowerCase().includes(q)) return false
      }
      return true
    })
    return list.sort((a, b) => {
      const left = new Date(a.raw?.sentAt || a.raw?.createdAt || 0).getTime()
      const right = new Date(b.raw?.sentAt || b.raw?.createdAt || 0).getTime()
      return sortOrder === 'recent' ? right - left : left - right
    })
  }, [data, search, channelFilter, statusFilter, sortOrder])

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
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-9 pr-8 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-gray-400"
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

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-700"
          >
            <option value="All">All Channels</option>
            {CHANNELS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-700"
          >
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-700"
          >
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
            Export
          </button>
          <button
            onClick={() => setShowSendDrawer(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            New Notification
          </button>
        </div>
      </div>

      <Card padding="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-100 bg-gray-50/40">
              <th className="text-left font-medium px-5 py-3">Recipient</th>
              <th className="text-left font-medium px-5 py-3">Channel</th>
              <th className="text-left font-medium px-5 py-3">Status</th>
              <th className="text-left font-medium px-5 py-3">Message</th>
              <th className="text-left font-medium px-5 py-3">Timestamp</th>
              <th className="text-left font-medium px-5 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
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
                  className={`transition-colors ${String(n.id) === focusId ? 'bg-brand-50/70 ring-1 ring-inset ring-brand-200' : 'hover:bg-gray-50/50'}`}
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
                    {n.errorMessage && (
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

            {selectedNotification.errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-wrap">
                <span className="font-medium">Error:</span> {selectedNotification.errorMessage}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
