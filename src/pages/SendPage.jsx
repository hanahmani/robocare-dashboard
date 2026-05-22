import { useState, useEffect, useMemo, useCallback } from 'react'
import { Select, message as antMessage } from 'antd'
import { Send, MessageCircle, Phone, Mail, X, CheckCircle, XCircle, Loader2, ChevronDown, ExternalLink } from 'lucide-react'
import { PageHero, PageWrapper } from '../components/PageHero'
import apiClient from '../api/apiClient'

// ─── static WhatsApp templates (kept for preview UX) ──────────────────────────
const WA_TEMPLATES = {
  hello_world: {
    name: 'hello_world', lang: 'en_US', category: 'UTILITY', status: 'APPROVED',
    fields: [], bodyText: 'Hello! This is a test message from RoboCare.', headerText: null, hasButton: false,
  },
  land_report: {
    name: 'land_report', lang: 'en_US', category: 'UTILITY', status: 'APPROVED',
    fields: ['message', 'bodyText', 'fileUrl'],
    bodyText: 'Your agricultural report for field A12 is ready. Soil humidity is 62%.', headerText: null, hasButton: false,
  },
  rapo: {
    name: 'rapo', lang: 'en_US', category: 'UTILITY', status: 'APPROVED',
    fields: ['headerText', 'message', 'bodyText', 'fileUrl'],
    bodyText: 'Your weekly precision agriculture report is now available.',
    headerText: 'Weekly Agriculture Report', hasButton: true, buttonLabel: 'View Report',
  },
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function extractVars(text = '') {
  const vars = new Set()
  const regex = /\{\{\s*([\w.-]+)\s*\}\}/g
  let m
  while ((m = regex.exec(text)) !== null) vars.add(m[1])
  return [...vars]
}

const inputCls =
  'w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-500 transition-all placeholder-gray-400 dark:placeholder-gray-500'
const labelCls =
  'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider'

// ─── main component ───────────────────────────────────────────────────────────
export default function SendPage() {
  const [activeChannel, setActiveChannel] = useState('whatsapp')

  // shared recipients (Ant Design Select tags)
  const [recipients, setRecipients] = useState([])

  // WhatsApp
  const [waTemplate, setWaTemplate] = useState('hello_world')
  const [headerText, setHeaderText] = useState('')
  const [bodyText, setBodyText] = useState(WA_TEMPLATES.hello_world.bodyText)
  const [waMessage, setWaMessage] = useState('')
  const [fileUrl, setFileUrl] = useState('')

  // Email
  const [emailTemplates, setEmailTemplates] = useState([])
  const [emailTemplateId, setEmailTemplateId] = useState(null)
  const [emailTemplateVars, setEmailTemplateVars] = useState({})
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailCc, setEmailCc] = useState([])
  const [emailBcc, setEmailBcc] = useState([])
  const [emailFileUrl, setEmailFileUrl] = useState('')

  // SMS
  const [smsTemplates, setSmsTemplates] = useState([])
  const [smsTemplateId, setSmsTemplateId] = useState(null)
  const [smsTemplateVars, setSmsTemplateVars] = useState({})
  const [smsMessage, setSmsMessage] = useState('')

  // Send state
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState(null)

  // Load templates on mount
  useEffect(() => {
    apiClient.get('/api/templates', { params: { channel: 'EMAIL' } })
      .then((r) => setEmailTemplates(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
    apiClient.get('/api/templates', { params: { channel: 'SMS' } })
      .then((r) => setSmsTemplates(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
  }, [])

  // Auto-clear result after 8s
  useEffect(() => {
    if (!result) return
    const t = setTimeout(() => setResult(null), 8000)
    return () => clearTimeout(t)
  }, [result])

  // WhatsApp template sync
  useEffect(() => {
    const t = WA_TEMPLATES[waTemplate]
    if (t) { setHeaderText(t.headerText || ''); setBodyText(t.bodyText || ''); setWaMessage(''); setFileUrl('') }
  }, [waTemplate])

  const currentWaTemplate = WA_TEMPLATES[waTemplate] || WA_TEMPLATES.hello_world

  // Detected vars for selected email/SMS template
  const selectedEmailTemplate = useMemo(
    () => emailTemplates.find((t) => t.id === emailTemplateId) || null,
    [emailTemplates, emailTemplateId],
  )
  const selectedSmsTemplate = useMemo(
    () => smsTemplates.find((t) => t.id === smsTemplateId) || null,
    [smsTemplates, smsTemplateId],
  )
  const emailVars = useMemo(
    () => extractVars((selectedEmailTemplate?.body || '') + ' ' + (selectedEmailTemplate?.subject || '')),
    [selectedEmailTemplate],
  )
  const smsVars = useMemo(
    () => extractVars(selectedSmsTemplate?.body || ''),
    [selectedSmsTemplate],
  )

  const handleChannelChange = useCallback((ch) => {
    setActiveChannel(ch)
    setRecipients([])
    setResult(null)
  }, [])

  const buildPayload = () => {
    if (activeChannel === 'whatsapp') {
      return { to: recipients, message: bodyText || waMessage }
    }
    if (activeChannel === 'sms') {
      if (smsTemplateId) return { to: recipients, templateId: smsTemplateId, variables: smsTemplateVars }
      return { to: recipients, message: smsMessage }
    }
    // email
    const base = {
      to: recipients,
      ...(emailCc.length ? { cc: emailCc } : {}),
      ...(emailBcc.length ? { bcc: emailBcc } : {}),
    }
    if (emailTemplateId) return { ...base, templateId: emailTemplateId, variables: emailTemplateVars }
    return { ...base, subject: emailSubject, message: emailMessage, ...(emailFileUrl ? { fileUrl: emailFileUrl } : {}) }
  }

  const ENDPOINTS = { whatsapp: '/api/notifications/whatsapp', sms: '/api/notifications/sms', email: '/api/notifications/email' }

  const handleSend = async () => {
    if (recipients.length === 0) {
      setResult({ type: 'error', message: 'Veuillez ajouter au moins un destinataire.' })
      return
    }
    if (activeChannel === 'email' && !emailTemplateId && (!emailSubject || !emailMessage)) {
      setResult({ type: 'error', message: 'Objet et message sont requis.' })
      return
    }
    if (activeChannel === 'sms' && !smsTemplateId && !smsMessage) {
      setResult({ type: 'error', message: 'Le message est requis.' })
      return
    }

    setIsSending(true)
    setResult(null)
    try {
      const res = await apiClient.post(ENDPOINTS[activeChannel], buildPayload())
      const data = res.data || {}
      setResult({ type: 'success', data })
      // reset fields
      setRecipients([])
      setSmsMessage(''); setEmailSubject(''); setEmailMessage(''); setEmailCc([]); setEmailBcc([]); setEmailFileUrl('')
      setEmailTemplateId(null); setEmailTemplateVars({}); setSmsTemplateId(null); setSmsTemplateVars({})
    } catch (err) {
      const data = err.response?.data
      setResult({ type: 'error', message: data?.error || "Erreur lors de l'envoi." })
    } finally {
      setIsSending(false)
    }
  }

  const channels = [
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'sms', label: 'SMS', icon: Phone },
    { id: 'email', label: 'Email', icon: Mail },
  ]
  const channelMeta = { whatsapp: { label: 'WhatsApp', icon: MessageCircle }, sms: { label: 'SMS', icon: Phone }, email: { label: 'Email', icon: Mail } }[activeChannel]

  return (
    <PageWrapper>
      <PageHero
        label="Send Center"
        title="Envoyer une notification"
        subtitle="Choisissez un canal, préparez votre message, puis envoyez à un ou plusieurs destinataires."
        right={
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3 text-center min-w-[120px]">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Canal actif</div>
            <div className="flex items-center justify-center gap-1.5">
              <channelMeta.icon className={`w-4 h-4 ${activeChannel === 'whatsapp' ? 'text-green-600' : activeChannel === 'sms' ? 'text-orange-500' : 'text-blue-500'}`} />
              <span className="text-sm font-black text-gray-900 dark:text-white">{channelMeta.label}</span>
            </div>
          </div>
        }
      />

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6">
        {/* Channel tabs */}
        <div className="flex gap-2 mb-6">
          {channels.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleChannelChange(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                activeChannel === id
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {/* Recipients */}
          <div>
            <label className={labelCls}>Destinataires</label>
            <Select
              mode="tags"
              style={{ width: '100%' }}
              value={recipients}
              onChange={setRecipients}
              tokenSeparators={[',']}
              placeholder={activeChannel === 'email' ? 'Ex: user@exemple.com' : 'Ex: +21612345678'}
              notFoundContent={null}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Appuyez sur Entrée ou virgule pour ajouter un destinataire
            </p>
          </div>

          {/* ── WhatsApp ── */}
          {activeChannel === 'whatsapp' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Template</label>
                  <div className="relative">
                    <select
                      value={waTemplate}
                      onChange={(e) => setWaTemplate(e.target.value)}
                      className={inputCls + ' appearance-none pr-10'}
                    >
                      {Object.keys(WA_TEMPLATES).map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[currentWaTemplate.status, currentWaTemplate.category, currentWaTemplate.lang].map((v) => (
                      <span key={v} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{v}</span>
                    ))}
                  </div>
                </div>
                {currentWaTemplate.fields.includes('headerText') && (
                  <div>
                    <label className={labelCls}>Header Text</label>
                    <input type="text" value={headerText} onChange={(e) => setHeaderText(e.target.value)} className={inputCls} />
                  </div>
                )}
                {currentWaTemplate.fields.includes('message') && (
                  <div>
                    <label className={labelCls}>Message / Variable</label>
                    <input type="text" value={waMessage} onChange={(e) => setWaMessage(e.target.value)} placeholder="Ahmed" className={inputCls} />
                  </div>
                )}
                {currentWaTemplate.fields.includes('bodyText') && (
                  <div>
                    <label className={labelCls}>Body Text</label>
                    <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={3} className={inputCls + ' resize-none'} />
                  </div>
                )}
                {currentWaTemplate.fields.includes('fileUrl') && (
                  <div>
                    <label className={labelCls}>File URL</label>
                    <input type="text" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="524/Rapport.pdf ou https://..." className={inputCls} />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Aperçu WhatsApp</p>
                <div className="bg-gradient-to-b from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 rounded-2xl p-4 flex-1 min-h-64 flex items-center justify-center">
                  <div className="max-w-xs w-full">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl rounded-bl-none shadow-sm p-4 space-y-2">
                      {headerText && <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">{headerText}</div>}
                      <div className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words">{bodyText || '(Message vide)'}</div>
                      {fileUrl && <div className="text-green-600 text-xs font-medium pt-2 border-t border-gray-200 dark:border-gray-700">📎 Fichier PDF joint</div>}
                      {currentWaTemplate.hasButton && (
                        <div className="pt-2">
                          <button type="button" disabled className="w-full bg-white dark:bg-gray-700 text-green-600 border border-green-300 dark:border-green-700 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-1">
                            {currentWaTemplate.buttonLabel}<ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SMS ── */}
          {activeChannel === 'sms' && (
            <div className="space-y-5">
              {smsTemplates.length > 0 && (
                <div>
                  <label className={labelCls}>Template SMS (optionnel)</label>
                  <Select
                    allowClear
                    placeholder="Sélectionner un template..."
                    value={smsTemplateId}
                    onChange={(v) => { setSmsTemplateId(v ?? null); setSmsTemplateVars({}) }}
                    style={{ width: '100%' }}
                    options={smsTemplates.map((t) => ({ label: t.name, value: t.id }))}
                  />
                </div>
              )}
              {smsTemplateId && smsVars.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Variables du template
                  </p>
                  {smsVars.map((v) => (
                    <div key={v}>
                      <label className={labelCls}>{`{{${v}}}`}</label>
                      <input
                        type="text"
                        value={smsTemplateVars[v] || ''}
                        onChange={(e) => setSmsTemplateVars((prev) => ({ ...prev, [v]: e.target.value }))}
                        placeholder={`Valeur pour ${v}`}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              )}
              {!smsTemplateId && (
                <div>
                  <label className={labelCls}>Message</label>
                  <div className="relative">
                    <textarea
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      rows={4}
                      placeholder="Entrez votre message SMS..."
                      className={inputCls + ' resize-none'}
                    />
                    <div className={`absolute bottom-2 right-3 text-xs ${smsMessage.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                      {smsMessage.length} / 160
                    </div>
                  </div>
                  {smsMessage.length > 160 && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      ⚠ Ce message sera envoyé en {Math.ceil(smsMessage.length / 160)} SMS
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Email ── */}
          {activeChannel === 'email' && (
            <div className="space-y-5">
              {/* CC / BCC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>CC</label>
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    value={emailCc}
                    onChange={setEmailCc}
                    tokenSeparators={[',']}
                    placeholder="Adresses en copie..."
                    notFoundContent={null}
                  />
                </div>
                <div>
                  <label className={labelCls}>BCC</label>
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    value={emailBcc}
                    onChange={setEmailBcc}
                    tokenSeparators={[',']}
                    placeholder="Adresses en copie cachée..."
                    notFoundContent={null}
                  />
                </div>
              </div>

              {/* Template selector */}
              {emailTemplates.length > 0 && (
                <div>
                  <label className={labelCls}>Template Email (optionnel)</label>
                  <Select
                    allowClear
                    placeholder="Utiliser un template..."
                    value={emailTemplateId}
                    onChange={(v) => { setEmailTemplateId(v ?? null); setEmailTemplateVars({}) }}
                    style={{ width: '100%' }}
                    options={emailTemplates.map((t) => ({ label: t.name, value: t.id }))}
                  />
                </div>
              )}

              {/* Template variable inputs */}
              {emailTemplateId && emailVars.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Variables du template
                  </p>
                  {emailVars.map((v) => (
                    <div key={v}>
                      <label className={labelCls}>{`{{${v}}}`}</label>
                      <input
                        type="text"
                        value={emailTemplateVars[v] || ''}
                        onChange={(e) => setEmailTemplateVars((prev) => ({ ...prev, [v]: e.target.value }))}
                        placeholder={`Valeur pour ${v}`}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Direct message fields */}
              {!emailTemplateId && (
                <>
                  <div>
                    <label className={labelCls}>Objet *</label>
                    <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Sujet de l'email" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Message *</label>
                    <textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} rows={5} placeholder="Contenu de l'email..." className={inputCls + ' resize-none'} />
                  </div>
                  <div>
                    <label className={labelCls}>URL du fichier joint (optionnel)</label>
                    <input type="text" value={emailFileUrl} onChange={(e) => setEmailFileUrl(e.target.value)} placeholder="https://..." className={inputCls} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || recipients.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {isSending
              ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Envoi en cours...</span></>
              : <><Send className="w-4 h-4" /><span>Envoyer la notification</span></>}
          </button>

          {/* Result */}
          {result && (
            <div className={`rounded-xl border p-4 flex items-start gap-3 ${
              result.type === 'success'
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
            }`}>
              {result.type === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800 dark:text-green-300 space-y-0.5">
                    {result.data?.successCount != null && (
                      <p className="font-semibold">✓ {result.data.successCount} envoi(s) réussi(s)</p>
                    )}
                    {result.data?.failCount > 0 && (
                      <p className="text-orange-700 dark:text-orange-400">⚠ {result.data.failCount} échec(s)</p>
                    )}
                    {result.data?.errorDetails && (
                      <p className="text-xs opacity-80">{result.data.errorDetails}</p>
                    )}
                    {!result.data?.successCount && !result.data?.failCount && (
                      <p>Notification envoyée avec succès.</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-300">{result.message}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
