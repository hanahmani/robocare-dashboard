import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MoreVertical, Search, Download, Plus, X, ChevronRight, Send, Mail, MessageCircle, Phone } from 'lucide-react'
import { Avatar, ChannelTag, StatusBadge } from '../components/Badges'
import { getSentNotifications, normalizeNotification } from '../services/notificationService'
import SendPage from './SendPage'

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
      <div className="absolute right-0 top-0 h-full w-full max-w-6xl bg-gray-50 shadow-2xl border-l border-gray-200 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
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

function NotificationMessagePreview({ notification, onOpenDetails }) {
  const [expanded, setExpanded] = useState(false)
  const { preview, remaining } = getMessagePreview(notification)
  const fullMessage = notification.fullMessage || notification.message || notification.bodyText || notification.subject || '—'

  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
        {preview}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {notification.templateName && <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">{notification.templateName}</span>}
        {notification.templateLang && <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">{notification.templateLang}</span>}
      </div>
      {remaining && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline transition-colors"
        >
          {expanded ? 'Voir moins' : 'Voir plus'}
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
      {expanded && (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-gray-700 whitespace-pre-line break-words leading-relaxed">
            {fullMessage}
          </div>
        </div>
      )}
    </div>
  )
}

function SendDrawer({ onClose, onOpenFullPage }) {
  return (
    <Drawer title="New Notification" onClose={onClose}>
      <div className="overflow-auto h-full">
        <SendPage />
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
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications envoyées</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez et consultez toutes vos notifications envoyées.</p>
        </div>
        <button
          onClick={() => setShowSendDrawer(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Notification
        </button>
      </div>

      {/* Filters Row */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher destinataire, ID..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
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

          <div className="flex items-center gap-2">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer focus:outline-none hover:border-gray-300 transition-colors"
            >
              <option value="All">Tous les canaux</option>
              {CHANNELS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer focus:outline-none hover:border-gray-300 transition-colors"
            >
              <option value="All">Tous les statuts</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer focus:outline-none hover:border-gray-300 transition-colors"
            >
              <option value="recent">Plus récent</option>
              <option value="oldest">Plus ancien</option>
            </select>

            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Destinataire</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Canal</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date d'envoi</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Send className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Aucune notification trouvée</p>
                    <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres</p>
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
                    className={`bg-white hover:bg-slate-50 transition-colors ${String(n.id) === focusId ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-200' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            n.channel === 'WhatsApp'
                              ? 'bg-green-500'
                              : n.channel === 'Email'
                                ? 'bg-purple-500'
                                : 'bg-blue-500'
                          }`}
                        >
                          {n.initials || n.recipient?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{n.recipient}</div>
                          <div className="text-xs text-gray-400 font-mono">#{n.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {n.channel === 'WhatsApp' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-700">WhatsApp</span>
                        </div>
                      ) : n.channel === 'Email' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-purple-700">Email</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-700">SMS</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={n.status} />
                    </td>

                    <td className="px-5 py-4 max-w-2xl">
                      <NotificationMessagePreview notification={n} onOpenDetails={() => openDetails(n)} />
                      {n.errorMessage && String(n.status).toLowerCase() !== 'failed' && (
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="font-medium">Info:</span> {n.errorMessage}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{n.timestamp}</td>

                    <td className="px-5 py-4 relative">
                      <button
                        onClick={() => setActionMenu(actionMenu === n.id ? null : n.id)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {actionMenu === n.id && (
                        <div className="absolute right-4 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px] py-1">
                          <button
                            onClick={() => handleDelete(n.id)}
                            className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Supprimer
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
          <div className="px-5 py-3 border-t border-gray-200 text-xs text-gray-500">
            {filtered.length} notification{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

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
              <div><span className="font-medium text-gray-700">Destinataire:</span> {selectedNotification.recipient}</div>
              <div><span className="font-medium text-gray-700">Canal:</span> {selectedNotification.channel}</div>
              <div><span className="font-medium text-gray-700">Statut:</span> {selectedNotification.status}</div>
              <div><span className="font-medium text-gray-700">Date:</span> {selectedNotification.timestamp}</div>
              {selectedNotification.templateName && <div><span className="font-medium text-gray-700">Template:</span> {selectedNotification.templateName}</div>}
              {selectedNotification.templateLang && <div><span className="font-medium text-gray-700">Langue:</span> {selectedNotification.templateLang}</div>}
            </div>

            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Message complet</div>
              <pre className="whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 leading-6 max-h-80 overflow-auto">
{selectedNotification.fullMessage || selectedNotification.message || selectedNotification.bodyText || selectedNotification.subject || '—'}
              </pre>
            </div>

            {selectedNotification.fileUrl && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Fichier:</span> {selectedNotification.fileUrl}
              </div>
            )}

            {selectedNotification.errorMessage && String(selectedNotification.status).toLowerCase() !== 'failed' && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-wrap">
                <span className="font-medium">Erreur:</span> {selectedNotification.errorMessage}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
