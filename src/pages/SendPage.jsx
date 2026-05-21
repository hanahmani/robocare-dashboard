import { useState, useMemo, useEffect } from 'react'
import { Send, MessageCircle, Phone, Mail, X, CheckCircle, XCircle, Loader2, ChevronDown, ExternalLink } from 'lucide-react'
import { PageHero, PageWrapper } from '../components/PageHero'

const WHATSAPP_TEMPLATES = {
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
    bodyText: 'Your weekly precision agriculture report is now available. Please review the complete report by clicking the button below.',
    headerText: 'Weekly Agriculture Report', hasButton: true, buttonLabel: 'View Report',
  },
}

const inputCls = 'w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/25 focus:border-green-500 transition-all placeholder-gray-400 dark:placeholder-gray-500'
const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider'

const CHANNEL_META = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'green' },
  sms: { label: 'SMS', icon: Phone, color: 'orange' },
  email: { label: 'Email', icon: Mail, color: 'blue' },
}

export default function SendPage() {
  const [activeChannel, setActiveChannel] = useState('whatsapp')
  const [recipients, setRecipients] = useState([])
  const [recipientInput, setRecipientInput] = useState('')
  const [recipientError, setRecipientError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('hello_world')
  const [headerText, setHeaderText] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [message, setMessage] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [smsMessage, setSmsMessage] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailFileUrl, setEmailFileUrl] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState(null)

  const channels = [
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'sms', label: 'SMS', icon: Phone },
    { id: 'email', label: 'Email', icon: Mail },
  ]

  const currentTemplate = useMemo(() => WHATSAPP_TEMPLATES[selectedTemplate] || WHATSAPP_TEMPLATES.hello_world, [selectedTemplate])

  useEffect(() => {
    const t = WHATSAPP_TEMPLATES[selectedTemplate]
    if (t) { setHeaderText(t.headerText || ''); setBodyText(t.bodyText || ''); setMessage(''); setFileUrl('') }
  }, [selectedTemplate])

  useEffect(() => {
    if (!result) return
    const timer = setTimeout(() => setResult(null), 6000)
    return () => clearTimeout(timer)
  }, [result])

  const validateAndAddRecipient = (value) => {
    setRecipientError('')
    if (!value.trim()) return
    if (activeChannel === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) { setRecipientError('Email invalide'); return }
    } else {
      if (!/^\+\d{10,15}$/.test(value.trim())) { setRecipientError('Format invalide: utilisez +XXXXXXXXXXXX'); return }
    }
    if (recipients.includes(value.trim())) { setRecipientError('Ce destinataire est déjà ajouté'); return }
    setRecipients([...recipients, value.trim()])
    setRecipientInput('')
  }

  const isInputValid = () => {
    const v = recipientInput.trim()
    if (!v) return false
    return activeChannel === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) : /^\+\d{10,15}$/.test(v)
  }
  const canAddSuggestion = isInputValid() && !recipients.includes(recipientInput.trim())

  const handleRecipientInput = (e) => {
    const value = e.target.value
    setRecipientInput(value)
    setRecipientError('')
    if (value.includes(',')) {
      const parts = value.split(',')
      const newRecipient = parts[0].trim()
      if (newRecipient) validateAndAddRecipient(newRecipient)
    }
  }

  const handleChannelChange = (channelId) => {
    setActiveChannel(channelId); setRecipientError(''); setResult(null)
    setSmsMessage(''); setEmailSubject(''); setEmailMessage(''); setEmailFileUrl('')
  }

  const buildPayload = () => {
    if (activeChannel === 'whatsapp') {
      const p = { to: recipients, type: 'TEMPLATE', message, templateName: selectedTemplate, templateLang: currentTemplate.lang }
      if (headerText) p.headerText = headerText
      if (bodyText) p.bodyText = bodyText
      if (fileUrl) p.fileUrl = fileUrl
      return p
    }
    if (activeChannel === 'sms') return { to: recipients, message: smsMessage }
    const p = { to: recipients, subject: emailSubject, message: emailMessage }
    if (emailFileUrl) p.fileUrl = emailFileUrl
    return p
  }

  const handleSend = async () => {
    if (recipients.length === 0) { setResult({ type: 'error', message: 'Veuillez ajouter au moins un destinataire.' }); return }
    if (activeChannel === 'whatsapp' && !message) { setResult({ type: 'error', message: 'Le champ "Message" est requis.' }); return }
    if (activeChannel === 'sms' && !smsMessage) { setResult({ type: 'error', message: 'Le champ "Message" est requis.' }); return }
    if (activeChannel === 'email' && (!emailSubject || !emailMessage)) { setResult({ type: 'error', message: 'Les champs "Objet" et "Message" sont requis.' }); return }
    setIsSending(true); setResult(null)
    try {
      const payload = buildPayload()
      const response = await fetch(`/api/send/${activeChannel}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`)
      }
      setResult({ type: 'success', message: `✓ Notification envoyée à ${recipients.length} destinataire${recipients.length > 1 ? '(s)' : ''} avec succès !` })
      setRecipients([]); setRecipientInput(''); setSmsMessage(''); setEmailSubject(''); setEmailMessage(''); setEmailFileUrl(''); setMessage(''); setHeaderText(''); setBodyText(''); setFileUrl('')
    } catch (error) {
      setResult({ type: 'error', message: error.message || "Erreur lors de l'envoi. Vérifiez vos données." })
    } finally { setIsSending(false) }
  }

  const smsCharCount = smsMessage.length
  const isSmsTooLong = smsCharCount > 160
  const channelMeta = CHANNEL_META[activeChannel]

  return (
    <PageWrapper>
      {/* Hero */}
      <PageHero
        label="Send Center"
        title="Envoyer une notification"
        subtitle="Choisissez un canal, préparez le contenu, puis envoyez votre message à un ou plusieurs destinataires."
        right={
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3 text-center min-w-[120px]">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Canal actif</div>
            <div className="flex items-center justify-center gap-1.5">
              <channelMeta.icon className={`w-4 h-4 ${activeChannel === 'whatsapp' ? 'text-green-600' : activeChannel === 'sms' ? 'text-orange-500' : 'text-blue-500'}`} />
              <span className="text-sm font-black text-gray-900 dark:text-white">{channelMeta.label}</span>
            </div>
          </div>
        }
      />

      {/* Main form card */}
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

        <form className="space-y-5">
          {/* Recipients */}
          <div>
            <label className={labelCls}>Destinataires</label>
            <div className={`w-full rounded-xl bg-white dark:bg-gray-800 p-3 flex flex-wrap gap-2 items-center border transition-all focus-within:ring-2 ${
              recipientError
                ? 'border-red-300 dark:border-red-700 focus-within:ring-red-500/20'
                : 'border-gray-200 dark:border-gray-700 focus-within:ring-green-500/25 focus-within:border-green-500'
            }`}>
              {recipients.map((r, idx) => (
                <div key={idx} className="bg-green-600 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                  <span>{r}</span>
                  <button type="button" onClick={() => setRecipients(recipients.filter((_, i) => i !== idx))} className="hover:opacity-80 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {canAddSuggestion && (
                <div className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 text-sm px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse">
                  <span>{recipientInput.trim()}</span>
                  <button type="button" onClick={() => validateAndAddRecipient(recipientInput)} className="hover:opacity-80 font-bold ml-1">+</button>
                </div>
              )}
              <input
                type="text"
                value={recipientInput}
                onChange={handleRecipientInput}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); validateAndAddRecipient(recipientInput) } }}
                placeholder={activeChannel === 'email' ? 'Ex: user@exemple.com' : 'Ex: +21646308384'}
                className="flex-1 min-w-32 outline-none text-sm py-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            {recipientError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{recipientError}</p>}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Appuyez sur Entrée ou virgule pour ajouter un destinataire</p>
            {recipients.length > 0 && <p className="mt-1.5 text-xs font-medium text-green-700 dark:text-green-400">{recipients.length} destinataire{recipients.length > 1 ? '(s)' : ''}</p>}
          </div>

          {/* WhatsApp */}
          {activeChannel === 'whatsapp' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Template</label>
                  <div className="relative">
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className={inputCls + ' appearance-none pr-10'}
                    >
                      {Object.entries(WHATSAPP_TEMPLATES).map(([key]) => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[currentTemplate.status, currentTemplate.category, currentTemplate.lang].map((v) => (
                      <span key={v} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{v}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Language code</label>
                  <input type="text" value={currentTemplate.lang} readOnly className={inputCls + ' bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed'} />
                </div>
                {currentTemplate.fields.includes('headerText') && (
                  <div>
                    <label className={labelCls}>Header Text</label>
                    <input type="text" value={headerText} onChange={(e) => setHeaderText(e.target.value)} className={inputCls} />
                  </div>
                )}
                {currentTemplate.fields.includes('message') && (
                  <div>
                    <label className={labelCls}>Message / Variable</label>
                    <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ahmed" className={inputCls} />
                  </div>
                )}
                {currentTemplate.fields.includes('bodyText') && (
                  <div>
                    <label className={labelCls}>Body Text</label>
                    <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={3} className={inputCls + ' resize-none'} />
                  </div>
                )}
                {currentTemplate.fields.includes('fileUrl') && (
                  <div>
                    <label className={labelCls}>File URL</label>
                    <input type="text" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="524/Rapport.pdf ou https://..." className={inputCls} />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Aperçu WhatsApp</p>
                <div className="bg-gradient-to-b from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 rounded-2xl p-4 flex-1 min-h-96 flex items-center justify-center">
                  <div className="max-w-xs w-full space-y-3">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl rounded-bl-none shadow-sm p-4 space-y-2">
                      {headerText && <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">{headerText}</div>}
                      <div className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words">{bodyText || '(Message vide)'}</div>
                      {fileUrl && <div className="text-green-600 text-xs font-medium pt-2 border-t border-gray-200 dark:border-gray-700">📎 Fichier PDF joint</div>}
                      {currentTemplate.hasButton && (
                        <div className="pt-2">
                          <button type="button" disabled className="w-full bg-white dark:bg-gray-700 text-green-600 border border-green-300 dark:border-green-700 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-1">
                            {currentTemplate.buttonLabel}<ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SMS */}
          {activeChannel === 'sms' && (
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
                <div className={`absolute bottom-2 right-3 text-xs ${isSmsTooLong ? 'text-red-500' : 'text-gray-400'}`}>{smsCharCount} / 160</div>
              </div>
              {isSmsTooLong && <p className="mt-2 text-xs text-red-600 dark:text-red-400">⚠️ Ce message sera envoyé en {Math.ceil(smsCharCount / 160)} SMS</p>}
            </div>
          )}

          {/* Email */}
          {activeChannel === 'email' && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Objet</label>
                <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Sujet de l'email" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Message</label>
                <textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} rows={5} placeholder="Contenu de l'email..." className={inputCls + ' resize-none'} />
              </div>
              <div>
                <label className={labelCls}>URL du fichier joint (optionnel)</label>
                <input type="text" value={emailFileUrl} onChange={(e) => setEmailFileUrl(e.target.value)} placeholder="https://..." className={inputCls} />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Lien direct vers un PDF ou fichier accessible publiquement</p>
              </div>
            </div>
          )}

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || recipients.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {isSending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Envoi en cours...</span></>
            ) : (
              <><Send className="w-4 h-4" /><span>Envoyer la notification</span></>
            )}
          </button>

          {/* Result */}
          {result && (
            <div className={`rounded-xl border p-4 flex items-start gap-3 ${
              result.type === 'success'
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
            }`}>
              {result.type === 'success'
                ? <><CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" /><p className="text-sm text-green-800 dark:text-green-300">{result.message}</p></>
                : <><XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-800 dark:text-red-300">{result.message}</p></>
              }
            </div>
          )}
        </form>
      </div>
    </PageWrapper>
  )
}
