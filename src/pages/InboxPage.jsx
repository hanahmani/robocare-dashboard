import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, RefreshCw, Mail, MessageCircle, Reply, Link as LinkIcon, Inbox, Phone } from 'lucide-react'
import { getInboxNotifications } from '../services/notificationService'
import { PageHero, PageKpi, PageWrapper } from '../components/PageHero'

const LAST_24H = 24 * 60 * 60 * 1000
const ERROR_PAT = /(failed|error|exception|traceback|stack trace)/i

function fmtDate(v) {
  if (!v) return '—'
  const d = typeof v === 'number' && v < 1e12 ? new Date(v * 1000) : new Date(v)
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('fr-FR')
}

function parseDate(v) {
  if (!v) return null
  const d = typeof v === 'number' && v < 1e12 ? new Date(v * 1000) : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function recent(v) {
  const d = parseDate(v); return d ? Date.now() - d.getTime() <= LAST_24H : false
}

function norm(v = '') { return String(v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') }

function sanitize(v) {
  return String(v || '').split('\n').map((l) => l.trim()).filter(Boolean).filter((l) => !ERROR_PAT.test(l)).join('\n')
}

function preview(v) {
  const t = sanitize(v).trim().split('\n').join(' ').replace(/\s+/g, ' ')
  if (!t) return '—'
  const m = t.match(/^.*?[.!?](?:\s|$)/)
  if (m) return m[0].trim()
  const w = t.split(' ')
  return w.length > 18 ? `${w.slice(0, 18).join(' ')}...` : t || '—'
}

function fmtWA(item) {
  const isReply = Boolean(item.reply || item.sentId)
  return { id: `WA-${item.id}`, channel: 'WhatsApp', originId: item.id, sender: item.contactName || item.sender || item.contactWaId || 'Unknown', senderDetail: item.sender || item.contactWaId || '', title: item.messageType || 'WhatsApp', preview: item.message || '—', receivedAt: item.receivedAt || item.messageTimestamp, reply: isReply, linkedSentId: item.sentId, icon: MessageCircle, raw: item }
}

function fmtEmail(item) {
  const isReply = Boolean(item.reply || item.sentId || item.inReplyTo)
  return { id: `EM-${item.id}`, channel: 'Email', originId: item.id, sender: item.senderName || item.senderEmail || 'Unknown', senderDetail: item.senderEmail || '', title: item.subject || 'Email', preview: item.bodyText || '—', receivedAt: item.receivedAt || item.emailDate, reply: isReply, linkedSentId: item.sentId || item.inReplyTo, icon: Mail, raw: item }
}

function ExpandMsg({ title, msg }) {
  const [exp, setExp] = useState(false)
  const safe = sanitize(msg)
  const prev = preview(safe)
  const more = safe && safe !== prev
  return (
    <div className="space-y-1">
      {title && <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</div>}
      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{prev}</div>
      {more && (
        <button onClick={() => setExp(!exp)} className="text-xs font-semibold text-green-700 dark:text-green-400 hover:underline">
          {exp ? 'Voir moins' : 'Voir plus ›'}
        </button>
      )}
      {exp && <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line break-words leading-relaxed">{safe}</div>}
    </div>
  )
}

function ChBadge({ ch }) {
  if (ch === 'WhatsApp') return <div className="inline-flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-green-500" /><span className="text-sm font-medium text-green-700 dark:text-green-400">WhatsApp</span></div>
  if (ch === 'Email') return <div className="inline-flex items-center gap-1.5"><Mail className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium text-blue-700 dark:text-blue-400">Email</span></div>
  return <div className="inline-flex items-center gap-1.5"><Phone className="w-4 h-4 text-orange-500" /><span className="text-sm font-medium text-orange-700 dark:text-orange-400">SMS</span></div>
}

const inputCls = 'pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-500 w-full transition-all'
const selCls = 'px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500/25 transition-all'

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
    setLoading(true); setError('')
    try {
      const res = await getInboxNotifications()
      setWhatsapp(Array.isArray(res.whatsapp) ? res.whatsapp : [])
      setEmails(Array.isArray(res.emails) ? res.emails : [])
      setSent(Array.isArray(res.sent) ? res.sent : [])
    } catch (err) {
      setError(err?.message || 'Unable to load inbox.')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadInbox() }, [])

  const sentById = useMemo(() => {
    const map = new Map()
    sent.forEach((item) => {
      if (item?.id != null) map.set(String(item.id), item)
      if (item?.messageId) map.set(String(item.messageId), item)
    })
    return map
  }, [sent])

  const items = useMemo(() => {
    const normSearch = norm(search)
    const merged = [...whatsapp.map(fmtWA), ...emails.map(fmtEmail)]
    return merged
      .filter((item) => {
        if (channelFilter !== 'All' && item.channel !== channelFilter) return false
        if (replyFilter === 'Replied' && !item.reply) return false
        if (replyFilter === 'New' && !recent(item.receivedAt)) return false
        if (normSearch) {
          const hay = [item.sender, item.senderDetail, item.preview, item.title, String(item.linkedSentId || ''), String(item.originId || '')].join(' ').toLowerCase()
          if (!hay.includes(normSearch)) return false
        }
        return true
      })
      .map((item) => {
        const orig = item.linkedSentId ? sentById.get(String(item.linkedSentId)) : null
        return { ...item, original: orig }
      })
      .sort((a, b) => new Date(b.receivedAt || 0) - new Date(a.receivedAt || 0))
  }, [whatsapp, emails, search, channelFilter, replyFilter, sentById])

  const stats = useMemo(() => {
    const total = whatsapp.length + emails.length
    const replied = [...whatsapp, ...emails].filter((i) => Boolean(i.reply || i.sentId || i.inReplyTo)).length
    return { total, whatsapp: whatsapp.length, emails: emails.length, replied }
  }, [whatsapp, emails])

  return (
    <PageWrapper>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <PageHero
        title="Inbox notifications"
        subtitle="WhatsApp et emails reçus, avec détection automatique des réponses via 'sentId'."
        right={
          <button onClick={loadInbox} disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* ── KPI cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PageKpi title="Total reçus" value={stats.total} desc="All messages received" />
        <PageKpi title="WhatsApp" value={stats.whatsapp} desc="WA messages" accent="#1D9E75" />
        <PageKpi title="Emails" value={stats.emails} desc="Email messages" accent="#185FA5" />
        <PageKpi title="Réponses détectées" value={stats.replied} desc="Replies to sent msgs" accent="#2d7a1f" />
      </div>

      {/* ── Filters + table ──────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher expéditeur, message, sujet..." className={inputCls} />
          </div>
          <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className={selCls}>
            <option value="All">Tous les canaux</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Email">Email</option>
          </select>
          <select value={replyFilter} onChange={(e) => setReplyFilter(e.target.value)} className={selCls}>
            <option value="All">Tous</option>
            <option value="Replied">Réponses</option>
            <option value="New">Nouveaux</option>
          </select>
        </div>

        {error && <div className="px-5 py-3 border-b border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-sm text-red-700 dark:text-red-400">{error}</div>}

        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                <div className="h-8 w-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/3" /><div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No messages found</p>
            <p className="text-gray-400 dark:text-gray-600 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Canal', 'Expéditeur', 'Message / Sujet', 'Reçu le', 'Réponse ?', 'ID lié'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-4"><ChBadge ch={item.channel} /></td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${item.channel === 'WhatsApp' ? 'bg-green-500' : item.channel === 'Email' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                          {(item.sender || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.sender}</div>
                          {item.senderDetail && <div className="text-xs text-gray-400 dark:text-gray-500">{item.senderDetail}</div>}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <ExpandMsg title={item.title} msg={item.preview} />
                      {item.original && (
                        <div className="mt-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2">
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Message d'origine</div>
                          <ExpandMsg msg={item.original?.message || item.original?.bodyText || item.original?.subject || '—'} />
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtDate(item.receivedAt)}</td>

                    <td className="px-5 py-4">
                      {item.reply ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full px-2.5 py-1 text-xs font-semibold">
                          <Reply className="w-3 h-3" /> Réponse
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full px-2.5 py-1 text-xs font-medium">
                          Nouveau
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {item.linkedSentId ? (
                        <button onClick={() => navigate(`/notifications?focus=${encodeURIComponent(String(item.linkedSentId))}`)}
                          className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 font-semibold text-sm hover:underline">
                          <LinkIcon className="w-3 h-3" />#{item.linkedSentId}
                        </button>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
