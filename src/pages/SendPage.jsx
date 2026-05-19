import { useState, useMemo, useEffect } from 'react'
import {
  Send,
  MessageCircle,
  Phone,
  Mail,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'

const WHATSAPP_TEMPLATES = {
  hello_world: {
    name: 'hello_world',
    lang: 'en_US',
    category: 'UTILITY',
    status: 'APPROVED',
    fields: [],
    bodyText: 'Hello! This is a test message from RoboCare.',
    headerText: null,
    hasButton: false,
  },
  land_report: {
    name: 'land_report',
    lang: 'en_US',
    category: 'UTILITY',
    status: 'APPROVED',
    fields: ['message', 'bodyText', 'fileUrl'],
    bodyText: 'Your agricultural report for field A12 is ready. Soil humidity is 62%.',
    headerText: null,
    hasButton: false,
  },
  rapo: {
    name: 'rapo',
    lang: 'en_US',
    category: 'UTILITY',
    status: 'APPROVED',
    fields: ['headerText', 'message', 'bodyText', 'fileUrl'],
    bodyText:
      'Your weekly precision agriculture report is now available. Please review the complete report by clicking the button below.',
    headerText: 'Weekly Agriculture Report',
    hasButton: true,
    buttonLabel: 'View Report',
  },
}

export default function SendPage() {
  // Channel & Recipients
  const [activeChannel, setActiveChannel] = useState('whatsapp')
  const [recipients, setRecipients] = useState([])
  const [recipientInput, setRecipientInput] = useState('')
  const [recipientError, setRecipientError] = useState('')

  // WhatsApp fields
  const [selectedTemplate, setSelectedTemplate] = useState('hello_world')
  const [headerText, setHeaderText] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [message, setMessage] = useState('')
  const [fileUrl, setFileUrl] = useState('')

  // SMS fields
  const [smsMessage, setSmsMessage] = useState('')

  // Email fields
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailFileUrl, setEmailFileUrl] = useState('')

  // State
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState(null)

  const channels = [
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'sms', label: 'SMS', icon: Phone },
    { id: 'email', label: 'Email', icon: Mail },
  ]

  const currentTemplate = useMemo(() => {
    return WHATSAPP_TEMPLATES[selectedTemplate] || WHATSAPP_TEMPLATES.hello_world
  }, [selectedTemplate])

  // Auto-fill WhatsApp fields when template changes
  useEffect(() => {
    const template = WHATSAPP_TEMPLATES[selectedTemplate]
    if (template) {
      setHeaderText(template.headerText || '')
      setBodyText(template.bodyText || '')
      setMessage('')
      setFileUrl('')
    }
  }, [selectedTemplate])

  // Auto-hide result after 6 seconds
  useEffect(() => {
    if (!result) return
    const timer = setTimeout(() => setResult(null), 6000)
    return () => clearTimeout(timer)
  }, [result])

  const validateAndAddRecipient = (value) => {
    setRecipientError('')

    if (!value.trim()) return

    if (activeChannel === 'email') {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value.trim())) {
        setRecipientError('Email invalide')
        return
      }
    } else {
      // Phone validation (WhatsApp/SMS)
      const phoneRegex = /^\+\d{10,15}$/
      if (!phoneRegex.test(value.trim())) {
        setRecipientError('Format invalide: utilisez +XXXXXXXXXXXX')
        return
      }
    }

    if (recipients.includes(value.trim())) {
      setRecipientError('Ce destinataire est déjà ajouté')
      return
    }

    setRecipients([...recipients, value.trim()])
    setRecipientInput('')
  }

  // Check if current input is valid (for auto-suggest)
  const isInputValid = () => {
    const value = recipientInput.trim()
    if (!value) return false

    if (activeChannel === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    } else {
      const phoneRegex = /^\+\d{10,15}$/
      return phoneRegex.test(value)
    }
  }

  const canAddSuggestion = isInputValid() && !recipients.includes(recipientInput.trim())

  const handleRecipientInput = (e) => {
    const value = e.target.value
    setRecipientInput(value)
    setRecipientError('')

    if (value.includes(',')) {
      const parts = value.split(',')
      const newRecipient = parts[0].trim()
      if (newRecipient) {
        validateAndAddRecipient(newRecipient)
      }
    }
  }

  const handleRecipientKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      validateAndAddRecipient(recipientInput)
    }
  }

  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index))
  }

  const handleChannelChange = (channelId) => {
    setActiveChannel(channelId)
    setRecipientError('')
    setResult(null)
    // Keep recipients, reset other fields
    setSmsMessage('')
    setEmailSubject('')
    setEmailMessage('')
    setEmailFileUrl('')
  }

  // Build payloads
  const buildPayload = () => {
    if (activeChannel === 'whatsapp') {
      const payload = {
        to: recipients,
        type: 'TEMPLATE',
        message: message,
        templateName: selectedTemplate,
        templateLang: currentTemplate.lang,
      }
      if (headerText) payload.headerText = headerText
      if (bodyText) payload.bodyText = bodyText
      if (fileUrl) payload.fileUrl = fileUrl
      return payload
    } else if (activeChannel === 'sms') {
      return {
        to: recipients,
        message: smsMessage,
      }
    } else if (activeChannel === 'email') {
      const payload = {
        to: recipients,
        subject: emailSubject,
        message: emailMessage,
      }
      if (emailFileUrl) payload.fileUrl = emailFileUrl
      return payload
    }
  }

  const handleSend = async () => {
    if (recipients.length === 0) {
      setResult({
        type: 'error',
        message: 'Veuillez ajouter au moins un destinataire.',
      })
      return
    }

    // Validate required fields
    if (activeChannel === 'whatsapp' && !message) {
      setResult({
        type: 'error',
        message: 'Le champ "Message" est requis.',
      })
      return
    }
    if (activeChannel === 'sms' && !smsMessage) {
      setResult({
        type: 'error',
        message: 'Le champ "Message" est requis.',
      })
      return
    }
    if (activeChannel === 'email' && (!emailSubject || !emailMessage)) {
      setResult({
        type: 'error',
        message: 'Les champs "Objet" et "Message" sont requis.',
      })
      return
    }

    setIsSending(true)
    setResult(null)

    try {
      const payload = buildPayload()
      console.log(`Payload pour /api/send/${activeChannel}:`, payload)

      const response = await fetch(`/api/send/${activeChannel}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || `Erreur ${response.status}: ${response.statusText}`
        )
      }

      setResult({
        type: 'success',
        message: `✓ Notification envoyée à ${recipients.length} destinataire${recipients.length > 1 ? '(s)' : ''} avec succès !`,
      })

      // Reset form
      setRecipients([])
      setRecipientInput('')
      setSmsMessage('')
      setEmailSubject('')
      setEmailMessage('')
      setEmailFileUrl('')
      setMessage('')
      setHeaderText('')
      setBodyText('')
      setFileUrl('')
    } catch (error) {
      setResult({
        type: 'error',
        message: error.message || 'Erreur lors de l\'envoi. Vérifiez vos données.',
      })
    } finally {
      setIsSending(false)
    }
  }

  const smsCharCount = smsMessage.length
  const smsSegments = Math.ceil(smsCharCount / 160)
  const isSmsTooLong = smsCharCount > 160

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Envoyer une notification</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sélectionnez un canal, ajoutez des destinataires et envoyez votre notification.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-md p-8">
          {/* Channel Tabs */}
          <div className="mb-8 flex gap-2">
            {channels.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleChannelChange(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeChannel === id
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <form className="space-y-5">
            {/* Recipients Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Destinataires
              </label>
              <div
                className={`w-full rounded-lg bg-white p-3 flex flex-wrap gap-2 items-center border transition-all focus-within:ring-2 focus-within:ring-blue-500/20 ${
                  recipientError
                    ? 'border-red-300 focus-within:ring-red-500/20 focus-within:border-red-400'
                    : 'border-gray-300 focus-within:border-blue-400'
                }`}
              >
                {recipients.map((recipient, idx) => (
                  <div
                    key={idx}
                    className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-2"
                  >
                    <span>{recipient}</span>
                    <button
                      type="button"
                      onClick={() => removeRecipient(idx)}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Auto-suggest chip */}
                {canAddSuggestion && (
                  <div className="bg-green-100 text-green-700 text-sm px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse">
                    <span>{recipientInput.trim()}</span>
                    <button
                      type="button"
                      onClick={() => validateAndAddRecipient(recipientInput)}
                      className="hover:opacity-80 transition-opacity font-bold ml-1"
                    >
                      +
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  value={recipientInput}
                  onChange={handleRecipientInput}
                  onKeyDown={handleRecipientKeyDown}
                  placeholder={
                    activeChannel === 'email'
                      ? 'Ex: user@exemple.com'
                      : 'Ex: +21646308384'
                  }
                  className="flex-1 min-w-32 outline-none text-sm py-1 bg-transparent"
                />
              </div>
              {recipientError && (
                <p className="mt-1 text-xs text-red-600">{recipientError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Appuyez sur Entrée ou virgule pour ajouter un destinataire
              </p>
              {recipients.length > 0 && (
                <p className="mt-2 text-xs text-gray-600">
                  {recipients.length} destinataire{recipients.length > 1 ? '(s)' : ''}
                </p>
              )}
            </div>

            {/* WhatsApp Section */}
            {activeChannel === 'whatsapp' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Fields */}
                <div className="space-y-5">
                  {/* Template Select */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Template
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all pr-10"
                      >
                        {Object.entries(WHATSAPP_TEMPLATES).map(([key, template]) => (
                          <option key={key} value={key}>
                            {key}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Status Badges */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {currentTemplate.status}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {currentTemplate.category}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {currentTemplate.lang}
                      </span>
                    </div>
                  </div>

                  {/* Language Code */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Language code
                    </label>
                    <input
                      type="text"
                      value={currentTemplate.lang}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-100 text-gray-600"
                    />
                  </div>

                  {/* Conditional Fields */}
                  {currentTemplate.fields.includes('headerText') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Header Text
                      </label>
                      <input
                        type="text"
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                      />
                    </div>
                  )}

                  {currentTemplate.fields.includes('message') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Message / Variable (ex: nom du client)
                      </label>
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ahmed"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                      />
                    </div>
                  )}

                  {currentTemplate.fields.includes('bodyText') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Body Text
                      </label>
                      <textarea
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                      />
                    </div>
                  )}

                  {currentTemplate.fields.includes('fileUrl') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        File URL
                      </label>
                      <input
                        type="text"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        placeholder="524/Rapport.pdf ou https://..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* WhatsApp Preview */}
                <div className="flex flex-col">
                  <p className="text-xs text-gray-500 mb-2">Aperçu WhatsApp</p>
                  <div className="bg-gradient-to-b from-green-50 to-green-100/50 rounded-2xl p-4 flex-1 min-h-96 flex items-center justify-center">
                    <div className="max-w-xs w-full space-y-3">
                      {/* Message Bubble */}
                      <div className="bg-white rounded-3xl rounded-bl-none shadow-sm p-4 space-y-2">
                        {headerText && (
                          <div className="font-bold text-gray-900 text-sm">{headerText}</div>
                        )}
                        <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {bodyText || '(Message vide)'}
                        </div>

                        {fileUrl && (
                          <div className="text-blue-600 text-xs font-medium pt-2 border-t border-gray-200">
                            📎 Fichier PDF joint
                          </div>
                        )}

                        {currentTemplate.hasButton && (
                          <div className="pt-2">
                            <button
                              type="button"
                              disabled
                              className="w-full bg-white text-blue-600 border border-blue-300 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-blue-50"
                            >
                              {currentTemplate.buttonLabel}
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SMS Section */}
            {activeChannel === 'sms' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Message
                </label>
                <div className="relative">
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    rows={4}
                    placeholder="Entrez votre message SMS..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                  />
                  <div className={`absolute bottom-2 right-3 text-xs ${isSmsTooLong ? 'text-red-600' : 'text-gray-500'}`}>
                    {smsCharCount} / 160
                  </div>
                </div>
                {isSmsTooLong && (
                  <p className="mt-2 text-xs text-red-600">
                    ⚠️ Ce message sera envoyé en {smsSegments} SMS
                  </p>
                )}
              </div>
            )}

            {/* Email Section */}
            {activeChannel === 'email' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Objet
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Sujet de l'email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={5}
                    placeholder="Contenu de l'email..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    URL du fichier joint (optionnel)
                  </label>
                  <input
                    type="text"
                    value={emailFileUrl}
                    onChange={(e) => setEmailFileUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Lien direct vers un PDF ou fichier accessible publiquement
                  </p>
                </div>
              </div>
            )}

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || recipients.length === 0}
              className="w-full bg-blue-600 text-white font-semibold rounded-lg py-3 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Envoyer la notification</span>
                </>
              )}
            </button>

            {/* Result Alert */}
            {result && (
              <div
                className={`rounded-lg border p-4 flex items-start gap-3 transition-opacity duration-300 ${
                  result.type === 'success'
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                {result.type === 'success' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">{result.message}</p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{result.message}</p>
                  </>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
