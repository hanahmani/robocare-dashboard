import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, RefreshCw, Mail, MessageCircle, Reply, Link as LinkIcon, Inbox, Phone } from 'lucide-react'
import { getInboxNotifications } from '../services/notificationService'

const LAST_24_HOURS_MS = 24 * 60 * 60 * 1000
const ERROR_TEXT_PATTERN = /(failed|error|exception|traceback|stack trace)/i

function formatDateTime(value) {
  if (!value) return '—'
  const date = typeof value === 'number' && value < 1e12 ? new Date(value * 1000) : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('fr-FR')
}

function parseDate(value) {
  if (!value) return null
  const date = typeof value === 'number' && value < 1e12 ? new Date(value * 1000) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function isWithinLast24Hours(value) {
  const date = parseDate(value)
  if (!date) return false
  return Date.now() - date.getTime() <= LAST_24_HOURS_MS
}

function normalizeText(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function sanitizeDisplayText(value) {
  const text = String(value || '')
  if (!text) return ''

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !ERROR_TEXT_PATTERN.test(line))
    .join('\n')
}

function getPreviewSentence(value) {
  const text = sanitizeDisplayText(value).trim()
  if (!text) return '—'

  const compactText = text.split('\n').join(' ').replace(/\s+/g, ' ').trim()
  const sentenceMatch = compactText.match(/^.*?[.!?](?:\s|$)/)
  if (sentenceMatch) return sentenceMatch[0].trim()

  const words = compactText.split(' ')
  return words.length > 18 ? `${words.slice(0, 18).join(' ')}...` : compactText || '—'
}

function formatWhatsapp(item) {
  const isReply = Boolean(item.reply || item.sentId)
  return {
    id: `WA-${item.id}`,
    channel: 'WhatsApp',
    originId: item.id,
    sender: item.contactName || item.sender || item.contactWaId || 'Unknown',
    senderDetail: item.sender || item.contactWaId || '',
    title: item.messageType || 'WhatsApp message',
    preview: item.message || '—',
    receivedAt: item.receivedAt || item.messageTimestamp,
    reply: isReply,
    linkedSentId: item.sentId,
    replyNote: isReply ? `Réponse au message envoyé #${item.sentId}` : 'Nouveau message reçu',
    icon: MessageCircle,
    raw: item,
  }
}

function formatEmail(item) {
  const isReply = Boolean(item.reply || item.sentId || item.inReplyTo)
  return {
    id: `EM-${item.id}`,
    channel: 'Email',
    originId: item.id,
    sender: item.senderName || item.senderEmail || 'Unknown',
    senderDetail: item.senderEmail || '',
    title: item.subject || 'Email received',
    preview: item.bodyText || '—',
    receivedAt: item.receivedAt || item.emailDate,
    reply: isReply,
    linkedSentId: item.sentId || item.inReplyTo,
    replyNote: isReply
      ? `Réponse à l'email envoyé #${item.sentId || item.inReplyTo || '—'}`
      : 'Nouveau email reçu',
    icon: Mail,
    raw: item,
  }
}

function ReplyBadge({ reply }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium border rounded ${
        reply
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-gray-50 text-gray-700 border-gray-200'
      }`}
    >
      <Reply className="w-3 h-3" />
      {reply ? 'Réponse' : 'Nouveau'}
    </span>
  )
}

function MessagePreview({ title, message, compact = false }) {
  const [expanded, setExpanded] = useState(false)
  const safeMessage = sanitizeDisplayText(message)
  const preview = getPreviewSentence(safeMessage)
  const hasMore = safeMessage && safeMessage !== preview

  if (compact) {
    return (
      <div className="space-y-1">
        {title && <div className="text-sm font-medium text-gray-900">{title}</div>}
        <div className="text-xs text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
          {preview}
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="text-xs font-medium text-blue-600 hover:underline mt-1"
          >
            {expanded ? 'Voir moins' : 'Voir plus'}
          </button>
        )}
        {expanded && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs text-gray-700 whitespace-pre-line break-words leading-relaxed">
              {safeMessage}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {title && <div className="font-medium text-gray-900">{title}</div>}
      <div
        className={`text-xs text-gray-600 mt-0.5 leading-5 ${
          expanded ? 'whitespace-pre-line break-words' : 'whitespace-nowrap overflow-hidden text-ellipsis'
        }`}
      >
        {expanded ? safeMessage : preview}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          {expanded ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
  )
}

export default function InboxPage() {
  const navigate = useNavigate()
  const [whatsapp, setWhatsapp] = useState([])
  const [emails, setEmails] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('All')
  const [replyFilter, setReplyFilter] = useState('All')

  async function loadInbox() {
    setLoading(true)
    setError('')
    try {
      const res = await getInboxNotifications()
      setWhatsapp(Array.isArray(res.whatsapp) ? res.whatsapp : [])
      setEmails(Array.isArray(res.emails) ? res.emails : [])
      setSent(Array.isArray(res.sent) ? res.sent : [])
    } catch (err) {
      setError(err?.message || 'Impossible de charger les notifications reçues.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInbox()
  }, [])

  const sentById = useMemo(() => {
    const map = new Map()
    sent.forEach((item) => {
      if (item?.id !== undefined && item?.id !== null) {
        map.set(String(item.id), item)
      }
      if (item?.messageId) {
        map.set(String(item.messageId), item)
      }
    })
    return map
  }, [sent])

  const items = useMemo(() => {
    const normalizedSearch = normalizeText(search)
    const recentTerms = ['nouveau', 'nouveaux', 'new', 'novaeux']
    const recentQuery = recentTerms.some((term) => normalizedSearch.includes(term))
    const searchText = normalizedSearch
      .split(/\s+/)
      .filter(Boolean)
      .filter((term) => !recentTerms.includes(term))
      .join(' ')
    const merged = [
      ...whatsapp.map(formatWhatsapp),
      ...emails.map(formatEmail),
    ]

    return merged
      .filter((item) => {
        if (channelFilter !== 'All' && item.channel !== channelFilter) return false
        if (replyFilter === 'Replied' && !item.reply) return false
        if (replyFilter === 'New' && !isWithinLast24Hours(item.receivedAt)) return false
        if (recentQuery && !isWithinLast24Hours(item.receivedAt)) return false

        if (searchText) {
          const haystack = [item.sender, item.senderDetail, item.preview, item.title, String(item.linkedSentId || ''), String(item.originId || '')]
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(searchText)) return false
        }

        return true
      })
      .map((item) => {
        const linkedSent = item.linkedSentId ? sentById.get(String(item.linkedSentId)) : null
        const emailReply = item.channel === 'Email' && item.raw?.inReplyTo ? sentById.get(String(item.raw.inReplyTo)) : null
        const original = linkedSent || emailReply || null

        return {
          ...item,
          original,
          originalLabel: original
            ? `${original.type || item.channel} #${original.id || original.messageId || '—'}`
            : null,
          originalPreview: original
            ? original.message || original.bodyText || original.subject || original.templateName || '—'
            : null,
        }
      })
      .sort((a, b) => new Date(b.receivedAt || 0) - new Date(a.receivedAt || 0))
  }, [whatsapp, emails, search, channelFilter, replyFilter, sentById])

  const stats = useMemo(() => {
    const total = whatsapp.length + emails.length
    const replied = [...whatsapp, ...emails].filter((item) => Boolean(item.reply || item.sentId || item.inReplyTo)).length
    return {
      total,
      whatsapp: whatsapp.length,
      emails: emails.length,
      replied,
    }
  }, [whatsapp, emails])

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox notifications</h1>
          <p className="text-sm text-gray-500 mt-1">WhatsApp et emails reçus, avec détection automatique des réponses.</p>
        </div>
        <button
          onClick={loadInbox}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Total reçus */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between">
            <div className="text-sm font-medium text-gray-500">Total reçus</div>
            <Inbox className="w-4 h-4 text-blue-500 opacity-60" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
        </div>

        {/* WhatsApp */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 border-l-4 border-l-green-500">
          <div className="flex items-start justify-between">
            <div className="text-sm font-medium text-gray-500">WhatsApp</div>
            <MessageCircle className="w-4 h-4 text-green-500 opacity-60" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats.whatsapp}</div>
        </div>

        {/* Emails */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 border-l-4 border-l-purple-500">
          <div className="flex items-start justify-between">
            <div className="text-sm font-medium text-gray-500">Emails</div>
            <Mail className="w-4 h-4 text-purple-500 opacity-60" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats.emails}</div>
        </div>

        {/* Réponses détectées */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 border-l-4 border-l-amber-500">
          <div className="flex items-start justify-between">
            <div className="text-sm font-medium text-gray-500">Réponses détectées</div>
            <Reply className="w-4 h-4 text-amber-500 opacity-60" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats.replied}</div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Filters Row */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200 bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher expéditeur, message, sujet..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer focus:outline-none hover:border-gray-300 transition-colors"
            >
              <option value="All">Tous les canaux</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
            </select>
            <select
              value={replyFilter}
              onChange={(e) => setReplyFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer focus:outline-none hover:border-gray-300 transition-colors"
            >
              <option value="All">Tous</option>
              <option value="Replied">Réponses</option>
              <option value="New">Nouveaux</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-5 py-3 border-b border-red-200 bg-red-50 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table Content */}
        {loading ? (
          <div className="divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                <div className="h-8 w-16 bg-gray-200 rounded" />
                <div className="h-8 w-24 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun message trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Canal</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expéditeur</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message / Sujet</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reçu le</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Réponse ?</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID lié</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="bg-white hover:bg-slate-50 transition-colors">
                    {/* Canal */}
                    <td className="px-5 py-4">
                      {item.channel === 'WhatsApp' ? (
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-700">WhatsApp</span>
                        </div>
                      ) : item.channel === 'Email' ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-purple-700">Email</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-700">SMS</span>
                        </div>
                      )}
                    </td>

                    {/* Expéditeur */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            item.channel === 'WhatsApp'
                              ? 'bg-green-500'
                              : item.channel === 'Email'
                                ? 'bg-purple-500'
                                : 'bg-blue-500'
                          }`}
                        >
                          {item.sender.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{item.sender}</div>
                          {item.senderDetail && <div className="text-xs text-gray-400">{item.senderDetail}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Message / Sujet */}
                    <td className="px-5 py-4 max-w-2xl">
                      <MessagePreview title={item.title} message={item.preview} compact={true} />
                      {item.original && (
                        <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Message d'origine</div>
                          <div className="text-xs text-gray-500 mb-1">Source: {item.originalLabel}</div>
                          <MessagePreview message={item.originalPreview} compact={true} />
                        </div>
                      )}
                    </td>

                    {/* Reçu le */}
                    <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDateTime(item.receivedAt)}</td>

                    {/* Réponse ? */}
                    <td className="px-5 py-4">
                      {item.reply ? (
                        <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1">
                          <Reply className="w-3 h-3" />
                          <span className="text-xs font-medium">Réponse</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center bg-gray-100 text-gray-500 rounded-full px-2.5 py-1">
                          <span className="text-xs font-medium">Nouveau</span>
                        </div>
                      )}
                    </td>

                    {/* ID lié */}
                    <td className="px-5 py-4">
                      {item.linkedSentId ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/notifications?focus=${encodeURIComponent(String(item.linkedSentId))}`)}
                          className="inline-flex items-center gap-1 text-blue-600 font-medium text-sm hover:underline transition-colors"
                          title="Open linked sent notification"
                        >
                          <LinkIcon className="w-3 h-3" />
                          #{item.linkedSentId}
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
