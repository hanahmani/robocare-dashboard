import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, RefreshCw, Mail, MessageCircle, Reply, Link as LinkIcon } from 'lucide-react'
import Card from '../components/Card'
import { ChannelTag } from '../components/Badges'
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

function MessagePreview({ title, message }) {
  const [expanded, setExpanded] = useState(false)
  const safeMessage = sanitizeDisplayText(message)
  const preview = getPreviewSentence(safeMessage)
  const hasMore = safeMessage && safeMessage !== preview

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
    <div className="page-shell px-4 sm:px-8 py-6 space-y-6">
      <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-medical-50 p-6 shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-700">Unified inbox</p>
        <h1 className="mt-2 text-3xl font-extrabold text-surface-900">Inbox</h1>
        <p className="mt-2 max-w-2xl text-sm text-surface-500">
          WhatsApp and email replies are displayed in a single branded workspace with clearer tracking.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap rounded-3xl border border-surface-200 bg-white/85 p-4 shadow-card backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Inbox notifications</h1>
          <p className="text-sm text-surface-500 mt-1">
            WhatsApp et emails reçus, avec détection automatique des réponses via `sentId`.
          </p>
        </div>
        <button
          onClick={loadInbox}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-surface-200 bg-white text-sm text-surface-700 hover:bg-surface-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-gray-500">Total reçus</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{stats.total}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">WhatsApp</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{stats.whatsapp}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Emails</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{stats.emails}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Réponses détectées</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{stats.replied}</div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher expéditeur, message, sujet..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white"
            >
              <option value="All">Tous les canaux</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
            </select>
            <select
              value={replyFilter}
              onChange={(e) => setReplyFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white"
            >
              <option value="All">Tous</option>
              <option value="Replied">Réponses</option>
              <option value="New">Nouveaux</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500">Chargement...</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">Aucune notification reçue trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-100 bg-gray-50/40">
                  <th className="text-left font-medium px-4 py-3">Canal</th>
                  <th className="text-left font-medium px-4 py-3">Expéditeur</th>
                  <th className="text-left font-medium px-4 py-3">Message / Sujet</th>
                  <th className="text-left font-medium px-4 py-3">Reçu le</th>
                  <th className="text-left font-medium px-4 py-3">Réponse ?</th>
                  <th className="text-left font-medium px-4 py-3">ID lié</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors align-top">
                    <td className="px-4 py-3">
                      <ChannelTag channel={item.channel} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.sender}</div>
                      {item.senderDetail && (
                        <div className="text-[11px] text-gray-500 mt-0.5">{item.senderDetail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xl">
                      <MessagePreview title={item.title} message={item.preview} />
                      {item.original && (
                        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                          <div className="font-medium text-gray-700 mb-1">Message d'origine</div>
                          <div className="mb-1">
                            <span className="text-gray-500">Source:</span> {item.originalLabel}
                          </div>
                          <MessagePreview message={item.originalPreview} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(item.receivedAt)}</td>
                    <td className="px-4 py-3">
                      <ReplyBadge reply={item.reply} />
                      <div className="mt-2 text-[11px] text-gray-500">{item.replyNote}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {item.linkedSentId ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/notifications?focus=${encodeURIComponent(String(item.linkedSentId))}`)}
                          className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                          title="Open linked sent notification"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          #{item.linkedSentId}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
