import { useState, useMemo } from 'react'
import { MoreVertical, Search, Download, Plus, X } from 'lucide-react'
import Card from '../components/Card'
import { Avatar, ChannelTag, StatusBadge } from '../components/Badges'
import { allNotifications, templates } from '../data/mockData'

const CHANNELS = ['Email', 'WhatsApp', 'SMS', 'Push']
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

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'

const selectCls =
  'w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white'

export default function NotificationsPage() {
  const [data, setData] = useState(allNotifications)
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [actionMenu, setActionMenu] = useState(null)

  const [form, setForm] = useState({
    recipient: '',
    channel: 'Email',
    template: '',
    message: '',
    status: 'Sent',
  })

  const filtered = useMemo(() => {
    return data.filter((n) => {
      if (channelFilter !== 'All' && n.channel !== channelFilter) return false
      if (statusFilter !== 'All' && n.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!n.recipient.toLowerCase().includes(q) && !n.id.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [data, search, channelFilter, statusFilter])

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.recipient.trim()) return
    const initials = form.recipient
      .split(/[@.\s]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0].toUpperCase())
      .join('')
    const newItem = {
      id: `NEW-${Date.now().toString().slice(-5)}`,
      initials: initials || 'NN',
      recipient: form.recipient,
      channel: form.channel,
      status: form.status,
      timestamp: 'Just now',
    }
    setData((prev) => [newItem, ...prev])
    setShowModal(false)
    setForm({ recipient: '', channel: 'Email', template: '', message: '', status: 'Sent' })
  }

  function handleDelete(id) {
    setData((prev) => prev.filter((n) => n.id !== id))
    setActionMenu(null)
  }

  function handleExport() {
    const rows = [
      ['ID', 'Recipient', 'Channel', 'Status', 'Timestamp'],
      ...filtered.map((n) => [n.id, n.recipient, n.channel, n.status, n.timestamp]),
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
            onClick={() => setShowModal(true)}
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
              <th className="text-left font-medium px-5 py-3">Timestamp</th>
              <th className="text-left font-medium px-5 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                  No notifications match your search.
                </td>
              </tr>
            ) : (
              filtered.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50/50 transition-colors">
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

      {showModal && (
        <Modal title="New Notification" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Recipient *">
              <input
                type="text"
                required
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                placeholder="email@example.com or +1 555..."
                className={inputCls}
              />
            </Field>
            <Field label="Channel">
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                className={selectCls}
              >
                {CHANNELS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Template (optional)">
              <select
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
                className={selectCls}
              >
                <option value="">— Select a template —</option>
                {templates
                  .filter((t) => t.channel === form.channel)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Message">
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Enter message content..."
                rows={3}
                className={inputCls + ' resize-none'}
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={selectCls}
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700"
              >
                Send
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
