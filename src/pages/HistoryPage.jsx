import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Tag, Button, Select, Tooltip, Space, Switch, Input } from 'antd'
import { ReloadOutlined, MailOutlined, MessageOutlined, PhoneOutlined } from '@ant-design/icons'
import { fetchSentNotificationsDetailed, normalizeNotification } from '../api/Notificationapi'
import { PageHero, PageWrapper } from '../components/PageHero'

// ─── Constantes ──────────────────────────────────────────────────────────────
const TYPE_COLORS  = { EMAIL: 'blue', SMS: 'orange', WHATSAPP: 'green' }
const STATUS_COLORS = { Sent: 'green', Failed: 'red', Partial: 'orange', Pending: 'default' }

// ─── Icône de canal ──────────────────────────────────────────────────────────
function ChannelIcon({ type }) {
  if (type === 'WHATSAPP') return <MessageOutlined style={{ color: '#16a34a' }} />
  if (type === 'EMAIL')    return <MailOutlined    style={{ color: '#2563eb' }} />
  return                          <PhoneOutlined   style={{ color: '#ea580c' }} />
}

// ─── Statut WhatsApp ─────────────────────────────────────────────────────────
function WhatsAppStatus({ status }) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>
  const cfg = {
    SENT:      { text: 'Envoyé',    icon: '✓',  cls: 'text-gray-500' },
    DELIVERED: { text: 'Distribué', icon: '✓✓', cls: 'text-gray-500' },
    READ:      { text: 'Lu',        icon: '✓✓', cls: 'text-blue-500 font-semibold' },
    FAILED:    { text: 'Échec',     icon: '✗',  cls: 'text-red-500' },
  }[status] ?? { text: status, icon: '?', cls: 'text-gray-400' }
  return (
    <span className={`text-sm ${cfg.cls}`} title={cfg.text}>
      {cfg.icon} <span className="text-xs ml-0.5">{cfg.text}</span>
    </span>
  )
}

// ─── Aperçu de message tronqué ───────────────────────────────────────────────
function MsgCell({ text }) {
  if (!text) return <span className="text-gray-400 text-xs">—</span>
  const short = text.length > 80 ? text.slice(0, 80) + '…' : text
  return (
    <Tooltip title={text} overlayStyle={{ maxWidth: 400 }}>
      <span className="text-sm text-gray-700 dark:text-gray-300 cursor-default">{short}</span>
    </Tooltip>
  )
}

// ─── Page principale ─────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [data,          setData]          = useState([])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [typeFilter,    setTypeFilter]    = useState(null)
  const [statusFilter,  setStatusFilter]  = useState(null)
  const [searchText,    setSearchText]    = useState('')
  const [autoRefresh,   setAutoRefresh]   = useState(false)
  const intervalRef = useRef(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Endpoint enrichi : inclut "sentByUser" (qui a envoyé) et "whatsappStatus"
      const raw = await fetchSentNotificationsDetailed(typeFilter || null)
      const list = Array.isArray(raw) ? raw.map(normalizeNotification) : []
      setData(list)
    } catch (err) {
      setError(err.message || 'Impossible de charger l\'historique.')
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  // Auto-refresh toutes les 20 s
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (autoRefresh) intervalRef.current = setInterval(fetchHistory, 20_000)
    return () => clearInterval(intervalRef.current)
  }, [autoRefresh, fetchHistory])

  // Filtrage côté client
  const filtered = useMemo(() => data.filter((n) => {
    if (statusFilter && n.status !== statusFilter) return false
    const q = searchText.toLowerCase()
    if (q && !String(n.recipient ?? '').toLowerCase().includes(q) &&
             !String(n.id ?? '').toLowerCase().includes(q)) return false
    return true
  }), [data, statusFilter, searchText])

  // ─── Colonnes ──────────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'ID', dataIndex: 'id', key: 'id', width: 70,
      render: (v) => <span className="font-mono text-xs text-gray-500">#{v}</span>,
    },
    {
      title: 'Type', dataIndex: 'type', key: 'type', width: 110,
      render: (type) => (
        <span className="inline-flex items-center gap-1.5">
          <ChannelIcon type={type} />
          <Tag color={TYPE_COLORS[type] || 'default'} style={{ margin: 0 }}>{type}</Tag>
        </span>
      ),
    },
    {
      title: 'Destinataire', dataIndex: 'recipient', key: 'recipient', width: 200,
      render: (v) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{v || '—'}</span>
      ),
    },
    {
      title: 'Objet / Template', key: 'subject', width: 180,
      render: (_, n) => {
        const label = n.subject || n.templateName || n.raw?.subject || '—'
        return <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      },
    },
    {
      title: 'Message', key: 'message', width: 260,
      render: (_, n) => <MsgCell text={n.fullMessage || n.message || n.bodyText} />,
    },
    {
      title: 'Statut', dataIndex: 'status', key: 'status', width: 100,
      render: (s) => {
        const upper = String(s ?? '').toUpperCase()
        const color = { SENT: 'green', FAILED: 'red', PARTIAL: 'orange' }[upper] ?? STATUS_COLORS[s] ?? 'default'
        return <Tag color={color}>{s || '—'}</Tag>
      },
    },
    {
      title: 'Erreur', dataIndex: 'errorMessage', key: 'errorMessage', width: 160,
      render: (v) => v
        ? <Tooltip title={v}><span className="text-xs text-red-600 dark:text-red-400 truncate block max-w-[150px]">{v}</span></Tooltip>
        : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      title: 'WhatsApp', key: 'whatsappStatus', width: 130,
      render: (_, n) => <WhatsAppStatus status={n.raw?.whatsappStatus} />,
    },
    {
      title: 'Envoyé par', key: 'sentByUser', width: 170,
      render: (_, n) => {
        const who = n.raw?.sentByUser
        return who
          ? <span className="text-sm text-gray-700 dark:text-gray-300">{who}</span>
          : <span className="text-gray-400 text-xs">Système</span>
      },
    },
    {
      title: 'Date', dataIndex: 'timestamp', key: 'timestamp', width: 140,
      render: (rel, n) => (
        <Tooltip title={n.raw?.sentAt ? new Date(n.raw.sentAt).toLocaleString('fr-FR') : ''}>
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{rel || '—'}</span>
        </Tooltip>
      ),
    },
  ]

  // ─── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      <PageHero
        label="Historique"
        title="Notifications envoyées"
        subtitle="Consultez l'historique de toutes les notifications avec statut de livraison en temps réel."
      />

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Barre de filtres */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <Select
            allowClear
            placeholder="Canal"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 130 }}
            options={[
              { label: '📧 EMAIL',    value: 'EMAIL' },
              { label: '💬 SMS',      value: 'SMS' },
              { label: '📱 WhatsApp', value: 'WHATSAPP' },
            ]}
          />
          <Select
            allowClear
            placeholder="Statut"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            options={[
              { label: '✓ Envoyé',  value: 'Sent' },
              { label: '✗ Échoué', value: 'Failed' },
              { label: '⚠ Partiel', value: 'Partial' },
            ]}
          />
          <Input.Search
            placeholder="Rechercher destinataire ou ID…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={setSearchText}
            style={{ width: 260 }}
            allowClear
          />

          <Space className="ml-auto" size="small">
            <span className="text-xs text-gray-500 dark:text-gray-400">Auto</span>
            <Switch
              size="small"
              checked={autoRefresh}
              onChange={setAutoRefresh}
              checkedChildren="20s"
              unCheckedChildren="off"
            />
            <Button icon={<ReloadOutlined />} onClick={fetchHistory} loading={loading}>
              Rafraîchir
            </Button>
          </Space>
        </div>

        {/* Erreur */}
        {error && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Résumé */}
        {!loading && data.length > 0 && (
          <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span><strong className="text-gray-700 dark:text-gray-300">{data.length}</strong> total</span>
            <span><strong className="text-green-700 dark:text-green-400">{data.filter(n => String(n.status).toLowerCase() === 'sent').length}</strong> envoyés</span>
            <span><strong className="text-red-600 dark:text-red-400">{data.filter(n => String(n.status).toLowerCase() === 'failed').length}</strong> échoués</span>
            {filtered.length !== data.length && (
              <span><strong className="text-blue-600">{filtered.length}</strong> affichés (filtrés)</span>
            )}
          </div>
        )}

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ minWidth: col.width, width: col.width }}
                    className="text-left px-4 py-3 text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                // Skeleton
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center">
                    <ReloadOutlined className="text-4xl text-gray-200 dark:text-gray-700 mb-3 block mx-auto" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune notification trouvée</p>
                    <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
                      {data.length > 0 ? 'Essayez de modifier vos filtres' : 'Aucune notification envoyée pour le moment'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((n) => (
                  <tr
                    key={n.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 align-middle">
                        {col.render
                          ? col.render(n[col.dataIndex], n)
                          : n[col.dataIndex] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pied de tableau */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
            {filtered.length} notification{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
