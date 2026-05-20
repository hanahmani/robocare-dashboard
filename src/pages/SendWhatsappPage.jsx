import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import { recipients as recipientDirectory } from '../data/mockData'
import {
  sendEmailNotification,
  sendSmsNotification,
  sendWhatsAppNotification,
} from '../services/notificationService'
import {
  buildLandReportPayload,
  buildRapoPayload,
  buildWhatsAppTemplatePayload,
  findMetaWhatsAppTemplate,
  getMetaWhatsAppTemplates,
  getWhatsAppTemplateParameterSchema,
} from '../data/whatsappTemplates'

const CHANNELS = ['WhatsApp', 'SMS', 'Email']
const SCHEDULE_STORAGE_KEY = 'robocare.notificationSchedules'

function parseList(text) {
  return text
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function readScheduledJobs() {
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeScheduledJobs(jobs) {
  localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(jobs))
}

function formatScheduleLabel(dateTime) {
  if (!dateTime) return 'No schedule set'
  return new Date(dateTime).toLocaleString('fr-FR')
}

export default function SendWhatsappPage({ embedded = false }) {
  const [channel, setChannel] = useState('WhatsApp')
  const [recipients, setRecipients] = useState('+21646308384')
  const [recipientGroup, setRecipientGroup] = useState('custom')
  const [subject, setSubject] = useState('Test')
  const [message, setMessage] = useState('hello Imen , Test RoboCare notification')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [sendMode, setSendMode] = useState('now')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [scheduledJobs, setScheduledJobs] = useState(() => readScheduledJobs())
  const metaTemplates = getMetaWhatsAppTemplates()
  const [templateName, setTemplateName] = useState(metaTemplates[1]?.name || metaTemplates[0]?.name || '')
  const [templateValues, setTemplateValues] = useState({})
  const [rapoHeaderText, setRapoHeaderText] = useState('Weekly Agriculture Report')
  const [rapoBodyText, setRapoBodyText] = useState(
    'Your weekly precision agriculture report is now available. Please review the complete report by clicking the button below.',
  )
  const [rapoFileUrl, setRapoFileUrl] = useState(
    'media/pdf_report_files/524/Rapport_de_suivi_Avril_2026-2026-04-23.pdf',
  )
  const [landReportBodyText, setLandReportBodyText] = useState('Your agricultural report for field A12 is ready. Soil humidity is 62%.')
  const [landReportFileUrl, setLandReportFileUrl] = useState('524/Rapport.pdf')

  const recipientGroups = useMemo(() => {
    const directory = Array.isArray(recipientDirectory) ? recipientDirectory : []
    const byChannel = directory.reduce(
      (accumulator, item) => {
        const channels = Array.isArray(item.channels) ? item.channels : []
        if (channels.includes('Email') && item.email) accumulator.Email.push(item.email)
        if (channels.includes('WhatsApp') && item.phone) accumulator.WhatsApp.push(item.phone)
        if (channels.includes('SMS') && item.phone) accumulator.SMS.push(item.phone)
        return accumulator
      },
      { Email: [], WhatsApp: [], SMS: [] },
    )

    return [
      { id: 'custom', label: 'Custom list', recipients: null },
      {
        id: 'all',
        label: 'All recipients',
        recipients: directory.flatMap((item) => [item.email, item.phone]).filter(Boolean),
      },
      { id: 'email', label: 'Email audience', recipients: Array.from(new Set(byChannel.Email)) },
      { id: 'whatsapp', label: 'WhatsApp audience', recipients: Array.from(new Set(byChannel.WhatsApp)) },
      { id: 'sms', label: 'SMS audience', recipients: Array.from(new Set(byChannel.SMS)) },
    ]
  }, [])

  const parsedRecipients = useMemo(() => parseList(recipients), [recipients])
  const selectedTemplate = useMemo(() => findMetaWhatsAppTemplate(templateName), [templateName])
  const templateSchema = useMemo(() => getWhatsAppTemplateParameterSchema(selectedTemplate), [selectedTemplate])
  const languageCode = selectedTemplate?.language || 'en_US'
  const previewBody = useMemo(() => {
    if (channel === 'Email') return `${subject}\n\n${message}`.trim()
    if (channel === 'SMS') return message
    return selectedTemplate?.name || message
  }, [channel, subject, message, selectedTemplate?.name])

  async function dispatchNotification({ targetChannel = channel, targetRecipients = parsedRecipients } = {}) {
    if (targetRecipients.length === 0) {
      throw new Error('Ajoutez au moins un destinataire.')
    }

    if (targetChannel === 'WhatsApp') {
      if (selectedTemplate?.name === 'rapo') {
        return sendWhatsAppNotification(
          buildRapoPayload({
            to: targetRecipients,
            message,
            headerText: rapoHeaderText,
            bodyText: rapoBodyText,
            fileUrl: rapoFileUrl,
            templateLang: languageCode,
          }),
        )
      }

      if (selectedTemplate?.name === 'land_report') {
        return sendWhatsAppNotification(
          buildLandReportPayload({
            to: targetRecipients,
            message,
            bodyText: landReportBodyText,
            fileUrl: landReportFileUrl,
            templateLang: languageCode,
          }),
        )
      }

      const whatsappPayload = buildWhatsAppTemplatePayload(selectedTemplate, templateValues)
      return sendWhatsAppNotification({
        to: targetRecipients,
        message,
        type: 'TEMPLATE',
        ...whatsappPayload,
      })
    }

    if (targetChannel === 'SMS') {
      return sendSmsNotification({
        to: targetRecipients,
        message,
      })
    }

    return sendEmailNotification({
      to: targetRecipients,
      subject,
      message,
    })
  }

  async function flushScheduledJobs() {
    const queue = readScheduledJobs()
    const now = Date.now()
    const due = queue.filter((job) => Number(job.runAt) <= now && !job.completed)
    if (due.length === 0) return

    for (const job of due) {
      // Rehydrate the captured payload for the queued item.
      // eslint-disable-next-line no-await-in-loop
      await dispatchNotification({
        targetChannel: job.channel,
        targetRecipients: job.recipients,
      })
      job.completed = true
      job.completedAt = new Date().toISOString()
    }

    const nextQueue = queue.filter((job) => !job.completed)
    writeScheduledJobs(nextQueue)
    setScheduledJobs(nextQueue)
  }

  useEffect(() => {
    if (!selectedTemplate) return

    const nextValues = {}
    getWhatsAppTemplateParameterSchema(selectedTemplate).forEach((field) => {
      nextValues[field.key] = templateValues[field.key] || field.defaultValue || ''
    })
    setTemplateValues(nextValues)
  }, [selectedTemplate?.name])

  useEffect(() => {
    const timer = window.setInterval(() => {
      flushScheduledJobs().catch(() => {})
    }, 30000)

    return () => window.clearInterval(timer)
  }, [channel, parsedRecipients, selectedTemplate, templateValues, subject, message, rapoHeaderText, rapoBodyText, rapoFileUrl, landReportBodyText, landReportFileUrl, languageCode])

  useEffect(() => {
    if (recipientGroup === 'custom') return

    const group = recipientGroups.find((item) => item.id === recipientGroup)
    if (group?.recipients?.length) {
      setRecipients(group.recipients.join(', '))
    }
  }, [recipientGroup, recipientGroups])

  function updateTemplateValue(key, value) {
    setTemplateValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      if (sendMode === 'schedule') {
        if (!scheduleDate || !scheduleTime) {
          throw new Error('Choose a date and time to schedule the notification.')
        }

        if (parsedRecipients.length === 0) {
          throw new Error('Ajoutez au moins un destinataire.')
        }

        const runAt = new Date(`${scheduleDate}T${scheduleTime}:00`).getTime()
        if (Number.isNaN(runAt)) {
          throw new Error('Invalid schedule date/time.')
        }

        const queue = [
          ...scheduledJobs,
          {
            id: `sched-${Date.now()}`,
            channel,
            recipients: parsedRecipients,
            runAt,
            summary: previewBody,
          },
        ]
        writeScheduledJobs(queue)
        setScheduledJobs(queue)
        setResult({ type: 'success', message: `Notification scheduled for ${formatScheduleLabel(runAt)}.` })
        return
      }

      await dispatchNotification({ targetChannel: channel, targetRecipients: parsedRecipients })

      setResult({ type: 'success', message: 'Notification envoyée avec succès.' })
    } catch (error) {
      setResult({ type: 'error', message: error.message || 'Erreur lors de l’envoi.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={embedded ? 'space-y-6' : 'p-6 max-w-4xl mx-auto'}>
      <Card>
        <div className="space-y-6">
          {!embedded && (
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Envoyer une notification</h1>
              <p className="text-sm text-gray-500 mt-1">
                Sélectionnez le canal, ajoutez un ou plusieurs destinataires, puis envoyez via votre backend.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setChannel(item)}
                className={`px-4 py-2 rounded-md text-sm border transition-colors ${
                  channel === item
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destinataires
              </label>
              <textarea
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                placeholder="Un ou plusieurs numéros / emails, séparés par des virgules ou une ligne par destinataire"
              />
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Recipient group</label>
                  <select
                    value={recipientGroup}
                    onChange={(e) => setRecipientGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    {recipientGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Send mode</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSendMode('now')}
                      className={`flex-1 px-3 py-2 rounded-md border text-sm ${sendMode === 'now' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-200'}`}
                    >
                      Send now
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendMode('schedule')}
                      className={`flex-1 px-3 py-2 rounded-md border text-sm ${sendMode === 'schedule' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-200'}`}
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {channel === 'Email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="Sujet de l'email"
                />
              </div>
            )}

            {channel === 'WhatsApp' && (
              <div className="space-y-4 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp template</label>
                  <select
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                  >
                    {metaTemplates.map((template) => (
                      <option key={template.id} value={template.name}>
                        {template.name} ({template.language})
                      </option>
                    ))}
                  </select>
                  {selectedTemplate && (
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
                      <span className="px-2 py-0.5 rounded bg-white border border-gray-200">{selectedTemplate.status}</span>
                      <span className="px-2 py-0.5 rounded bg-white border border-gray-200">{selectedTemplate.category}</span>
                      <span className="px-2 py-0.5 rounded bg-white border border-gray-200">{selectedTemplate.language}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language code</label>
                  <input
                    value={languageCode}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-500"
                    placeholder="en_US"
                  />
                </div>

                {selectedTemplate?.name === 'land_report' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                      <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                        placeholder="hana"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Body text</label>
                      <textarea
                        value={landReportBodyText}
                        onChange={(e) => setLandReportBodyText(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                        placeholder="Your agricultural report for field A12 is ready. Soil humidity is 62%."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">File URL</label>
                      <input
                        value={landReportFileUrl}
                        onChange={(e) => setLandReportFileUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                        placeholder="524/Rapport.pdf"
                      />
                    </div>
                  </div>
                ) : selectedTemplate?.name === 'rapo' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                      <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                        placeholder="Hana"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Header text</label>
                      <input
                        value={rapoHeaderText}
                        onChange={(e) => setRapoHeaderText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                        placeholder="Weekly Agriculture Report"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Body text</label>
                      <textarea
                        value={rapoBodyText}
                        onChange={(e) => setRapoBodyText(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                        placeholder="Your weekly precision agriculture report is now available..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">File URL</label>
                      <input
                        value={rapoFileUrl}
                        onChange={(e) => setRapoFileUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                        placeholder="media/pdf_report_files/524/Rapport_de_suivi_Avril_2026-2026-04-23.pdf"
                      />
                    </div>
                  </div>
                ) : templateSchema.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templateSchema.map((field) => (
                      <div key={field.key} className={field.componentType === 'BODY' ? 'md:col-span-2' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                        </label>
                        <input
                          value={templateValues[field.key] || ''}
                          onChange={(e) => updateTemplateValue(field.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 bg-white border border-dashed border-gray-200 rounded-md p-3">
                    This template has no dynamic parameters.
                  </div>
                )}

                {selectedTemplate && (
                  <div className="rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-600">
                    <div className="font-medium text-gray-700 mb-1">Template preview</div>
                    <div className="whitespace-pre-line">
                      {selectedTemplate.components
                        .map((component) => component.text || component.buttons?.[0]?.text || '')
                        .filter(Boolean)
                        .join('\n')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {channel !== 'WhatsApp' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder={channel === 'SMS' ? 'hello Imen , Test RoboCare notification' : 'Contenu de l’email'}
                />
              </div>
            )}

            {sendMode === 'schedule' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-dashed border-gray-200 p-4 bg-gray-50/60">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                  />
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Live preview</div>
                  <div className="text-xs text-gray-500">What the delivery job will look like before it hits the backend.</div>
                </div>
                <div className="text-xs text-gray-500">
                  {parsedRecipients.length} recipient{parsedRecipients.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="text-[11px] uppercase tracking-wider text-gray-400">Channel</div>
                  <div className="mt-1 font-medium text-gray-900">{channel}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3 md:col-span-2">
                  <div className="text-[11px] uppercase tracking-wider text-gray-400">Subject / message</div>
                  <div className="mt-1 whitespace-pre-line text-gray-800">{previewBody || '—'}</div>
                </div>
              </div>
              {sendMode === 'schedule' && (
                <div className="text-xs text-gray-500">
                  Scheduled for: <span className="font-medium text-gray-700">{formatScheduleLabel(scheduleDate && scheduleTime ? new Date(`${scheduleDate}T${scheduleTime}:00`).getTime() : null)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {loading ? 'Envoi...' : `Envoyer via ${channel}`}
              </button>
              {result && (
                <span className={`text-sm ${result.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {result.message}
                </span>
              )}
            </div>

            {scheduledJobs.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Scheduled queue</div>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {scheduledJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      <span>{job.channel} for {formatScheduleLabel(job.runAt)}</span>
                      <span>{Array.isArray(job.recipients) ? job.recipients.length : 0} recipients</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      </Card>
    </div>
  )
}
