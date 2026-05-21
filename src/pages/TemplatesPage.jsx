import { useState, useMemo } from 'react'
import { Plus, Edit2, Copy, Trash2, Search, X, FileText, Layout } from 'lucide-react'
import { ChannelTag, StatusBadge } from '../components/Badges'
import { templates as initialTemplates } from '../data/templatesConfig'
import { getMetaWhatsAppTemplates, getWhatsAppTemplateParameterSchema } from '../data/whatsappTemplates'
import { PageHero, PageKpi, PageWrapper } from '../components/PageHero'

const CHANNELS = ['Email', 'WhatsApp', 'SMS']
const LANGUAGES = ['FR', 'EN', 'AR']
const STATUSES = ['Active', 'Draft']

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-500 transition-all placeholder-gray-400 dark:placeholder-gray-500'
const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

const EMPTY_FORM = { name: '', channel: 'Email', language: 'FR', content: '', status: 'Active' }

export default function TemplatesPage() {
  const [data, setData] = useState(initialTemplates)
  const metaTemplates = getMetaWhatsAppTemplates()
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = useMemo(() => data.filter((t) => {
    if (channelFilter !== 'All' && t.channel !== channelFilter) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [data, search, channelFilter])

  function openAdd() { setEditTarget(null); setForm(EMPTY_FORM); setShowModal(true) }
  function openEdit(t) { setEditTarget(t.id); setForm({ name: t.name, channel: t.channel, language: t.language, content: t.content || '', status: t.status }); setShowModal(true) }
  function handleDuplicate(t) { setData((prev) => [{ ...t, id: `TPL-${Date.now().toString().slice(-4)}`, name: `${t.name} (Copy)`, updated: 'Just now', status: 'Draft' }, ...prev]) }
  function handleDelete(id) { setData((prev) => prev.filter((t) => t.id !== id)); setConfirmDelete(null) }
  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editTarget) {
      setData((prev) => prev.map((t) => t.id === editTarget ? { ...t, ...form, updated: 'Just now' } : t))
    } else {
      setData((prev) => [{ id: `TPL-${Date.now().toString().slice(-4)}`, ...form, updated: 'Just now' }, ...prev])
    }
    setShowModal(false)
  }

  const activeCount = data.filter((t) => t.status === 'Active').length
  const draftCount = data.filter((t) => t.status === 'Draft').length

  return (
    <PageWrapper>
      {/* Hero */}
      <PageHero
        label="Template Library"
        title="Templates"
        subtitle="Gérez vos modèles de notification pour tous les canaux — WhatsApp Meta, Email, et SMS."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PageKpi title="Total templates" value={data.length} desc="Custom templates" />
        <PageKpi title="Actifs" value={activeCount} desc="Ready to use" accent="#2d7a1f" />
        <PageKpi title="Brouillons" value={draftCount} desc="In progress" accent="#d97706" />
        <PageKpi title="Meta WA" value={metaTemplates.length} desc="From Meta account" accent="#185FA5" />
      </div>

      {/* Meta WhatsApp Templates */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">WhatsApp Meta</div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Meta Templates</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Templates chargés depuis votre compte Meta WhatsApp Business.</p>
          </div>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl">
            {metaTemplates.length} templates
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {metaTemplates.map((template) => {
            const fields = getWhatsAppTemplateParameterSchema(template)
            return (
              <div key={template.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div>
                    <div className="text-[10px] text-gray-400 font-mono mb-1">{template.id}</div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{template.name}</h3>
                  </div>
                  <StatusBadge status={template.status} />
                </div>
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <ChannelTag channel={template.channel} />
                  <span className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full font-semibold">{template.language}</span>
                </div>
                <div className="space-y-2">
                  {template.components.map((component, index) => (
                    <div key={`${template.id}-${component.type}-${index}`} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400">{component.type}</span>
                        {component.format && <span className="text-[10px] text-gray-400">{component.format}</span>}
                      </div>
                      {component.text && <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line">{component.text}</p>}
                      {component.buttons?.length > 0 && (
                        <div className="mt-1.5 space-y-1.5">
                          {component.buttons.map((button, bi) => (
                            <div key={`${button.text}-${bi}`} className="rounded border border-dashed border-gray-300 dark:border-gray-600 p-1.5 bg-gray-50 dark:bg-gray-900">
                              <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{button.text}</div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 break-all">{button.url}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  {fields.length > 0 ? `${fields.length} paramètre${fields.length > 1 ? 's' : ''}` : 'Aucun paramètre'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Custom Templates */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400 mb-1">Custom</div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Custom Templates</h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="pl-9 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-500 transition-all w-48"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500/25 transition-all cursor-pointer"
            >
              <option value="All">Tous les canaux</option>
              {CHANNELS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Layout className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No templates found</p>
            <p className="text-gray-400 dark:text-gray-600 text-sm mt-1">Try adjusting your filters or create a new template</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <div key={t.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-[10px] text-gray-400 font-mono">{t.id}</div>
                  <StatusBadge status={t.status} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">{t.name}</h3>
                {t.content && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{t.content}</p>}
                <div className="flex items-center justify-between mt-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <ChannelTag channel={t.channel} />
                  <span className="text-[10px] px-2 py-0.5 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full font-semibold">{t.language}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Updated {t.updated}</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/40 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors" title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDuplicate(t)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Duplicate">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setConfirmDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal title={editTarget ? 'Modifier le template' : 'Nouveau template'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Nom du template *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ex: Crop Alert - Critical"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Canal</label>
                <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className={inputCls}>
                  {CHANNELS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Langue</label>
                <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className={inputCls}>
                  {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Contenu</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Entrez le contenu du template..."
                rows={4}
                className={inputCls + ' resize-none'}
              />
            </div>
            <div>
              <label className={labelCls}>Statut</label>
              <div className="flex gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, status: s })}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                      form.status === s
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                Annuler
              </button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">
                {editTarget ? 'Enregistrer' : 'Créer le template'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          message="Êtes-vous sûr de vouloir supprimer ce template ? Cette action est irréversible."
          onConfirm={() => handleDelete(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </PageWrapper>
  )
}
