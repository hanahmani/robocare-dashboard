import { useState, useMemo } from 'react'
import { Plus, Edit2, Copy, Trash2, Search, X } from 'lucide-react'
import Card from '../components/Card'
import { ChannelTag, StatusBadge } from '../components/Badges'
import { templates as initialTemplates } from '../data/mockData'

const CHANNELS = ['Email', 'WhatsApp', 'SMS', 'Push']
const LANGUAGES = ['FR', 'EN', 'AR']
const STATUSES = ['Active', 'Draft']

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4"
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

function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-gray-700 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'

const selectCls =
  'w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white'

const EMPTY_FORM = { name: '', channel: 'Email', language: 'FR', content: '', status: 'Active' }

export default function TemplatesPage() {
  const [data, setData] = useState(initialTemplates)
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = useMemo(() => {
    return data.filter((t) => {
      if (channelFilter !== 'All' && t.channel !== channelFilter) return false
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [data, search, channelFilter])

  function openAdd() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(t) {
    setEditTarget(t.id)
    setForm({
      name: t.name,
      channel: t.channel,
      language: t.language,
      content: t.content || '',
      status: t.status,
    })
    setShowModal(true)
  }

  function handleDuplicate(t) {
    const copy = {
      ...t,
      id: `TPL-${Date.now().toString().slice(-4)}`,
      name: `${t.name} (Copy)`,
      updated: 'Just now',
      status: 'Draft',
    }
    setData((prev) => [copy, ...prev])
  }

  function handleDelete(id) {
    setData((prev) => prev.filter((t) => t.id !== id))
    setConfirmDelete(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editTarget) {
      setData((prev) =>
        prev.map((t) =>
          t.id === editTarget ? { ...t, ...form, updated: 'Just now' } : t
        )
      )
    } else {
      const newT = {
        id: `TPL-${Date.now().toString().slice(-4)}`,
        ...form,
        updated: 'Just now',
      }
      setData((prev) => [newT, ...prev])
    }
    setShowModal(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
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
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          New Template
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          No templates match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Card key={t.id} className="hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="text-[11px] text-gray-400 font-mono">{t.id}</div>
                <StatusBadge status={t.status} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{t.name}</h3>
              {t.content && (
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{t.content}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <ChannelTag channel={t.channel} />
                <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                  {t.language}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Updated {t.updated}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(t)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(t.id)}
                    className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          title={editTarget ? 'Edit Template' : 'New Template'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Template Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Crop Alert - Critical"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
                <select
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                  className={selectCls}
                >
                  {CHANNELS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className={selectCls}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Enter template message content..."
                rows={4}
                className={inputCls + ' resize-none'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <div className="flex gap-3">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, status: s })}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      form.status === s
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {s}
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
                {editTarget ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          message="Are you sure you want to delete this template? This action cannot be undone."
          onConfirm={() => handleDelete(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
