import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Edit2, Trash2, Search, X, Eye, FileText, Tag as TagIcon } from 'lucide-react'
import { message } from 'antd'
import { getMetaWhatsAppTemplates, getWhatsAppTemplateParameterSchema } from '../data/whatsappTemplates'
import { ChannelTag, StatusBadge } from '../components/Badges'
import { PageHero, PageKpi, PageWrapper } from '../components/PageHero'
import apiClient from '../api/apiClient'

// ─── Utilitaire variables ─────────────────────────────────────────────────────
function extractVars(text = '') {
  const vars = new Set()
  const regex = /\{\{\s*([\w.-]+)\s*\}\}/g
  let m
  while ((m = regex.exec(text)) !== null) vars.add(m[1])
  return [...vars]
}

// ─── Styles partagés ──────────────────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-500 transition-all placeholder-gray-400 dark:placeholder-gray-500'
const labelCls =
  'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider'

// ─── Modal générique ──────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl mx-4 border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto ${wide ? 'w-full max-w-2xl' : 'w-full max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Valeurs par défaut du formulaire ─────────────────────────────────────────
const EMPTY_FORM = { name: '', channel: 'EMAIL', subject: '', body: '', description: '' }

// ─── Page principale ──────────────────────────────────────────────────────────
export default function TemplatesPage() {
  // ── API templates state ────────────────────────────────────────────────────
  const [templates, setTemplates]       = useState([])
  const [loading, setLoading]           = useState(false)
  const [channelFilter, setChannelFilter] = useState('All')
  const [search, setSearch]             = useState('')

  // ── Create / Edit modal ────────────────────────────────────────────────────
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)   // id or null
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState('')

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(null)

  // ── Preview modal ──────────────────────────────────────────────────────────
  const [previewTpl, setPreviewTpl]     = useState(null)
  const [previewVars, setPreviewVars]   = useState({})
  const [previewResult, setPreviewResult] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // ── Meta WA templates (static) ─────────────────────────────────────────────
  const metaTemplates = getMetaWhatsAppTemplates()

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const params = channelFilter !== 'All' ? { channel: channelFilter } : {}
      const res = await apiClient.get('/api/templates', { params })
      setTemplates(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      message.error(err.response?.data?.error || 'Erreur chargement templates')
    } finally {
      setLoading(false)
    }
  }, [channelFilter])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(
    () => templates.filter(
      (t) => !search || t.name.toLowerCase().includes(search.toLowerCase()),
    ),
    [templates, search],
  )

  // ── Detected vars while typing ─────────────────────────────────────────────
  const detectedVars = useMemo(
    () => extractVars((form.body || '') + ' ' + (form.subject || '')),
    [form.body, form.subject],
  )

  // ── CRUD helpers ───────────────────────────────────────────────────────────
  function openAdd() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  function openEdit(t) {
    setEditTarget(t.id)
    setForm({
      name: t.name || '',
      channel: t.channel || 'EMAIL',
      subject: t.subject || '',
      body: t.body || '',
      description: t.description || '',
    })
    setFormError('')
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.body.trim()) {
      setFormError('Le nom et le corps sont requis.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name: form.name,
        channel: form.channel,
        body: form.body,
        description: form.description || '',
        ...(form.channel === 'EMAIL' ? { subject: form.subject } : {}),
      }
      if (editTarget) {
        await apiClient.put(`/api/templates/${editTarget}`, payload)
        message.success('Template mis à jour')
      } else {
        await apiClient.post('/api/templates', payload)
        message.success('Template créé')
      }
      setShowModal(false)
      fetchTemplates()
    } catch (err) {
      const data = err.response?.data
      setFormError(data?.error || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      await apiClient.delete(`/api/templates/${id}`)
      message.success('Template supprimé')
      setConfirmDelete(null)
      fetchTemplates()
    } catch (err) {
      message.error(err.response?.data?.error || 'Erreur suppression')
    }
  }

  // ── Preview ─────────────────────────────────────────────────────────────────
  function openPreview(t) {
    setPreviewTpl(t)
    setPreviewVars({})
    setPreviewResult(null)
  }

  async function handlePreview() {
    if (!previewTpl) return
    setPreviewLoading(true)
    try {
      const res = await apiClient.post(`/api/templates/${previewTpl.id}/preview`, {
        variables: previewVars,
      })
      setPreviewResult(res.data)
    } catch (err) {
      message.error(err.response?.data?.error || 'Erreur prévisualisation')
    } finally {
      setPreviewLoading(false)
    }
  }

  const previewVarList = useMemo(
    () => (previewTpl ? extractVars((previewTpl.body || '') + ' ' + (previewTpl.subject || '')) : []),
    [previewTpl],
  )

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const emailCount = templates.filter((t) => t.channel === 'EMAIL').length
  const smsCount   = templates.filter((t) => t.channel === 'SMS').length

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      <PageHero
        label="Template Library"
        title="Templates"
        subtitle="Gérez vos modèles de notification Email & SMS, et consultez vos templates WhatsApp Meta."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PageKpi title="Total templates" value={templates.length} desc="Email + SMS" />
        <PageKpi title="Email" value={emailCount} desc="Templates email" accent="#185FA5" />
        <PageKpi title="SMS" value={smsCount} desc="Templates SMS" accent="#d97706" />
        <PageKpi title="Meta WA" value={metaTemplates.length} desc="Depuis compte Meta" accent="#1D9E75" />
      </div>

      {/* ── Section Email / SMS (API) ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400 mb-1">
              Email · SMS
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Templates personnalisés</h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-500 w-40"
              />
            </div>

            {/* Channel filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500/25 cursor-pointer"
            >
              <option value="All">Tous</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
            </select>

            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nouveau template
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse space-y-3">
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Aucun template trouvé</p>
            <p className="text-gray-400 dark:text-gray-600 text-sm mt-1">
              {templates.length > 0 ? 'Modifiez vos filtres' : 'Créez votre premier template'}
            </p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((t) => {
              const vars = extractVars((t.body || '') + ' ' + (t.subject || ''))
              const isEmail = t.channel === 'EMAIL'
              return (
                <div
                  key={t.id}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow flex flex-col"
                >
                  {/* Top */}
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] text-gray-400 font-mono mb-0.5">#{t.id}</div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">
                        {t.name}
                      </h3>
                    </div>
                    <span
                      className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isEmail
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                          : 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                      }`}
                    >
                      {t.channel}
                    </span>
                  </div>

                  {/* Subject (email only) */}
                  {isEmail && t.subject && (
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 font-medium truncate">
                      📧 {t.subject}
                    </div>
                  )}

                  {/* Body preview */}
                  {t.body && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 flex-1">
                      {t.body}
                    </p>
                  )}

                  {/* Variables */}
                  {vars.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {vars.map((v) => (
                        <span
                          key={v}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded font-mono"
                        >
                          <TagIcon className="w-2.5 h-2.5" />
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString('fr-FR') : '—'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => openPreview(t)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Prévisualiser"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/40 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(t.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Section Meta WhatsApp (statique) ───────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              WhatsApp Meta
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Meta Templates</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Templates chargés depuis votre compte Meta WhatsApp Business.
            </p>
          </div>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl">
            {metaTemplates.length} templates
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {metaTemplates.map((template) => {
            const fields = getWhatsAppTemplateParameterSchema(template)
            return (
              <div
                key={template.id}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div>
                    <div className="text-[10px] text-gray-400 font-mono mb-1">{template.id}</div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{template.name}</h3>
                  </div>
                  <StatusBadge status={template.status} />
                </div>
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <ChannelTag channel={template.channel} />
                  <span className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full font-semibold">
                    {template.language}
                  </span>
                </div>
                <div className="space-y-2">
                  {template.components.map((component, index) => (
                    <div
                      key={`${template.id}-${component.type}-${index}`}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
                          {component.type}
                        </span>
                        {component.format && (
                          <span className="text-[10px] text-gray-400">{component.format}</span>
                        )}
                      </div>
                      {component.text && (
                        <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {component.text}
                        </p>
                      )}
                      {component.buttons?.length > 0 && (
                        <div className="mt-1.5 space-y-1.5">
                          {component.buttons.map((button, bi) => (
                            <div
                              key={`${button.text}-${bi}`}
                              className="rounded border border-dashed border-gray-300 dark:border-gray-600 p-1.5 bg-gray-50 dark:bg-gray-900"
                            >
                              <div className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {button.text}
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 break-all">
                                {button.url}
                              </div>
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

      {/* ── Modal Créer / Modifier ───────────────────────────────────────────── */}
      {showModal && (
        <Modal
          title={editTarget ? 'Modifier le template' : 'Nouveau template'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {formError}
              </div>
            )}

            <div>
              <label className={labelCls}>Nom du template *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ex: bienvenue_client"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Canal</label>
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value, subject: '' })}
                className={inputCls}
              >
                <option value="EMAIL">EMAIL</option>
                <option value="SMS">SMS</option>
              </select>
            </div>

            {form.channel === 'EMAIL' && (
              <div>
                <label className={labelCls}>Objet</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="ex: Bienvenue {{nom}} !"
                  className={inputCls}
                />
              </div>
            )}

            <div>
              <label className={labelCls}>Corps du message *</label>
              <textarea
                required
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="ex: Bonjour {{nom}}, bienvenue chez RoboCare !"
                rows={5}
                className={inputCls + ' resize-none'}
              />
              <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                Utilisez <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{variable}}'}</code> pour insérer des variables dynamiques.
              </p>
            </div>

            {/* Variables détectées */}
            {detectedVars.length > 0 && (
              <div>
                <label className={labelCls}>Variables détectées</label>
                <div className="flex flex-wrap gap-1.5">
                  {detectedVars.map((v) => (
                    <span
                      key={v}
                      className="inline-flex items-center gap-0.5 px-2 py-1 text-xs bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg font-mono"
                    >
                      <TagIcon className="w-3 h-3" />
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className={labelCls}>Description (optionnel)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brève description du template"
                className={inputCls}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl transition-colors"
              >
                {saving ? 'Enregistrement…' : editTarget ? 'Enregistrer' : 'Créer le template'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal Confirmer suppression ──────────────────────────────────────── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">
              Confirmer la suppression de ce template ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Prévisualisation ───────────────────────────────────────────── */}
      {previewTpl && (
        <Modal
          title={`Aperçu — ${previewTpl.name}`}
          onClose={() => { setPreviewTpl(null); setPreviewResult(null) }}
          wide
        >
          {previewVarList.length > 0 && (
            <div className="mb-5">
              <p className={labelCls + ' mb-3'}>Valeurs des variables</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {previewVarList.map((v) => (
                  <div key={v}>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-mono">
                      {`{{${v}}}`}
                    </label>
                    <input
                      type="text"
                      value={previewVars[v] || ''}
                      onChange={(e) => setPreviewVars((prev) => ({ ...prev, [v]: e.target.value }))}
                      placeholder={`Valeur pour ${v}`}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handlePreview}
            disabled={previewLoading}
            className="w-full py-2.5 text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl transition-colors mb-5"
          >
            {previewLoading ? 'Génération…' : 'Générer l\'aperçu'}
          </button>

          {previewResult && (
            <div className="space-y-4">
              {previewResult.subject && (
                <div>
                  <div className={labelCls}>Objet rendu</div>
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-900 dark:text-blue-200 font-medium">
                    {previewResult.subject}
                  </div>
                </div>
              )}
              <div>
                <div className={labelCls}>Corps rendu</div>
                <pre className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words leading-relaxed max-h-60 overflow-auto">
                  {previewResult.body || previewResult.message || '—'}
                </pre>
              </div>
            </div>
          )}
        </Modal>
      )}
    </PageWrapper>
  )
}
