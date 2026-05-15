import { useState, useMemo } from 'react'
import { Search, Plus, MoreVertical, X } from 'lucide-react'
import Card from '../components/Card'
import { Avatar, ChannelTag } from '../components/Badges'
import { recipients as initialRecipients } from '../data/mockData'

const CHANNELS = ['Email', 'WhatsApp', 'SMS', 'Push']

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
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'

const EMPTY_FORM = { name: '', email: '', phone: '', channels: [] }

export default function RecipientsPage() {
  const [data, setData] = useState(initialRecipients)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [actionMenu, setActionMenu] = useState(null)

  const filtered = useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q)
    )
  }, [data, search])

  function openAdd() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(r) {
    setEditTarget(r.id)
    setForm({ name: r.name, email: r.email, phone: r.phone, channels: [...r.channels] })
    setShowModal(true)
    setActionMenu(null)
  }

  function toggleChannel(ch) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter((c) => c !== ch) : [...f.channels, ch],
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editTarget) {
      setData((prev) =>
        prev.map((r) =>
          r.id === editTarget ? { ...r, ...form } : r
        )
      )
    } else {
      const newR = {
        id: `U-${Date.now().toString().slice(-4)}`,
        ...form,
        lastActive: 'Just now',
      }
      setData((prev) => [newR, ...prev])
    }
    setShowModal(false)
  }

  function handleDelete(id) {
    setData((prev) => prev.filter((r) => r.id !== id))
    setActionMenu(null)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="relative w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full pl-9 pr-8 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
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
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Add Recipient
        </button>
      </div>

      <Card padding="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-100 bg-gray-50/40">
              <th className="text-left font-medium px-5 py-3">Name</th>
              <th className="text-left font-medium px-5 py-3">Email</th>
              <th className="text-left font-medium px-5 py-3">Phone</th>
              <th className="text-left font-medium px-5 py-3">Channels</th>
              <th className="text-left font-medium px-5 py-3">Last Active</th>
              <th className="px-5 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                  No recipients match your search.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const initials = r.name
                  .split(' ')
                  .map((s) => s[0])
                  .join('')
                  .slice(0, 2)
                return (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={initials} />
                        <div>
                          <div className="text-gray-900 font-medium">{r.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{r.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{r.email}</td>
                    <td className="px-5 py-3 text-gray-700 font-mono text-[13px]">{r.phone}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        {r.channels.map((c) => (
                          <ChannelTag key={c} channel={c} />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{r.lastActive}</td>
                    <td className="px-5 py-3 relative">
                      <button
                        onClick={() => setActionMenu(actionMenu === r.id ? null : r.id)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {actionMenu === r.id && (
                        <div className="absolute right-4 top-8 z-20 bg-white border border-gray-200 rounded-md shadow-lg min-w-[120px] py-1">
                          <button
                            onClick={() => openEdit(r)}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} recipient{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </Card>

      {showModal && (
        <Modal
          title={editTarget ? 'Edit Recipient' : 'Add Recipient'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555 000 0000"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Channels</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      form.channels.includes(ch)
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
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
                {editTarget ? 'Save Changes' : 'Add Recipient'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
