/**
 * api/notificationApi.js
 * Fonctions d'appel vers le microservice Spring Boot (port 8081 via proxy Vite).
 */

import { findMetaWhatsAppTemplate } from '../data/whatsappTemplates'

const BASE = '/api/notifications'

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`)
  }

  if (res.status === 204) return null
  return res.json()
}

export async function fetchSentNotifications(type = null) {
  const url = type ? `${BASE}/history/sent?type=${encodeURIComponent(type)}` : `${BASE}/history/sent`
  return request(url)
}

export async function fetchReceivedWhatsApp() {
  return request(`${BASE}/history/received`)
}

export async function fetchReceivedBySentId(sentId) {
  return request(`${BASE}/history/received/${sentId}`)
}

export async function fetchReceivedEmails({ newOnly, since } = {}) {
  const params = new URLSearchParams()
  if (newOnly) params.set('newOnly', 'true')
  if (since) params.set('since', since)
  const qs = params.toString()
  return request(`${BASE}/history/emails${qs ? `?${qs}` : ''}`)
}

export async function triggerEmailFetch(since = null) {
  const url = since ? `${BASE}/history/emails/fetch?since=${since}` : `${BASE}/history/emails/fetch`
  return request(url, { method: 'POST' })
}

export async function sendEmail(payload) {
  return request(`${BASE}/email`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function sendWhatsApp(payload) {
  return request(`${BASE}/whatsapp`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function sendSms(payload) {
  return request(`${BASE}/sms`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchHealth() {
  return request(`${BASE}/health`)
}

export function normalizeNotification(n) {
  const initials = (n.recipient || '')
    .replace(/[+\d\s-]/g, '')
    .split(/[@.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || '')
    .join('') || n.recipient?.slice(0, 2).toUpperCase() || '??'

  return {
    id: String(n.id),
    initials,
    recipient: n.recipient,
    type: n.type,
    channel: capitalize(n.type),
    status: capitalize(n.status),
    subject: n.subject || '',
    message: n.message || '',
    templateName: n.templateName || '',
    templateLang: n.templateLang || '',
    headerText: n.headerText || '',
    bodyText: n.bodyText || '',
    fileUrl: n.fileUrl || '',
    fullMessage: buildFullMessage(n),
    timestamp: formatRelative(n.sentAt || n.createdAt),
    errorMessage: n.errorMessage || null,
    raw: n,
  }
}

function buildFullMessage(notification) {
  if (notification.type === 'WHATSAPP') {
    return buildWhatsAppMessage(notification)
  }

  const parts = []

  if (notification.message) parts.push(notification.message)
  if (notification.headerText) parts.push(notification.headerText)
  if (notification.bodyText) parts.push(notification.bodyText)
  if (notification.fileUrl) parts.push(notification.fileUrl)

  return parts.filter(Boolean).join('\n')
}

function buildWhatsAppMessage(notification) {
  const template = findMetaWhatsAppTemplate(notification.templateName || notification.raw?.templateName || '')
  const templateName = notification.templateName || notification.raw?.templateName || template?.name || ''
  const recipientName = firstText(
    notification.message,
    notification.recipientName,
    notification.raw?.recipientName,
    notification.raw?.name,
    notification.raw?.toName,
  ) || '—'
  const greeting = `Hello ${recipientName}.`

  if (templateName === 'land_report') {
    const bodyText = resolveBodyText(notification, template) || DEFAULT_LAND_REPORT_BODY
    return [greeting, bodyText, 'have a nice day']
      .filter(Boolean)
      .join('\n')
  }

  if (templateName === 'rapo') {
    return [greeting, resolveHeaderText(notification, template), resolveBodyText(notification, template), 'have a nice day']
      .filter(Boolean)
      .join('\n')
  }

  const fallbackParts = [
    notification.message,
    notification.headerText,
    notification.bodyText,
    notification.subject,
    notification.raw?.content,
    notification.raw?.text,
    notification.raw?.messageText,
    notification.raw?.body,
    notification.raw?.bodyText,
  ]

  const rawParts = flattenTextValues(fallbackParts)

  if (rawParts.length > 1) {
    return rawParts.join('\n')
  }

  if (template) {
    const headerText = resolveHeaderText(notification, template)
    const bodyText = resolveBodyText(notification, template)
    return [headerText, bodyText].filter(Boolean).join('\n')
  }

  return rawParts.join('\n')
}

const DEFAULT_LAND_REPORT_BODY =
  'Your weekly precision agriculture report is now available. Please review the complete report by clicking the button below.'

function resolveHeaderText(notification, template) {
  return firstText(
    notification.headerText,
    notification.raw?.headerText,
    notification.raw?.header,
    template?.components?.find((component) => component.type === 'HEADER')?.example?.header_text?.[0],
    template?.components?.find((component) => component.type === 'HEADER')?.text,
  ) || ''
}

function resolveBodyText(notification, template) {
  return firstText(
    notification.bodyText,
    notification.raw?.bodyText,
    notification.raw?.body,
    notification.raw?.content,
    notification.raw?.text,
    template?.components?.find((component) => component.type === 'BODY')?.example?.body_text?.[0]?.[1],
    template?.components?.find((component) => component.type === 'BODY')?.text,
  ) || ''
}

function firstText(...values) {
  for (const value of values) {
    const text = flattenTextValues([value]).find(Boolean)
    if (text) return text
  }
  return ''
}

function flattenTextValues(values) {
  const result = []

  const visit = (value) => {
    if (value == null) return
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed && !result.includes(trimmed)) result.push(trimmed)
      return
    }
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (typeof value === 'object') {
      Object.values(value).forEach(visit)
    }
  }

  values.forEach(visit)
  return result
}

function capitalize(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function formatRelative(isoStr) {
  if (!isoStr) return '—'
  const date = new Date(isoStr)
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return "À l'instant"
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`
  return date.toLocaleDateString('fr-FR')
}

export function computeStats(notifications) {
  const total = notifications.length
  const sent = notifications.filter((n) => n.status === 'SENT').length
  const failed = notifications.filter((n) => n.status === 'FAILED').length
  const partial = notifications.filter((n) => n.status === 'PARTIAL').length

  const byType = { EMAIL: 0, SMS: 0, WHATSAPP: 0 }
  notifications.forEach((n) => {
    if (byType[n.type] !== undefined) byType[n.type]++
  })

  const failedWithErrors = notifications
    .filter((n) => n.status === 'FAILED' && n.errorMessage)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((n) => ({
      title: `${capitalize(n.type)} Failed`,
      detail: `Recipient: ${n.recipient}`,
      time: n.sentAt
        ? new Date(n.sentAt).toLocaleTimeString('fr-FR')
        : new Date(n.createdAt).toLocaleTimeString('fr-FR'),
      error: n.errorMessage,
    }))

  return {
    total,
    sent,
    failed,
    partial,
    successRate: total > 0 ? ((sent / total) * 100).toFixed(1) : '0.0',
    byType,
    failedWithErrors,
  }
}

export function buildVolumeByHour(notifications) {
  const buckets = {}
  for (let h = 0; h < 24; h++) {
    buckets[`${String(h).padStart(2, '0')}h`] = 0
  }
  notifications.forEach((n) => {
    const d = new Date(n.sentAt || n.createdAt)
    const key = `${String(d.getHours()).padStart(2, '0')}h`
    if (buckets[key] !== undefined) buckets[key]++
  })
  return Object.entries(buckets).map(([time, value]) => ({ time, value }))
}

export function buildVolumeByDay(notifications) {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const buckets = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    buckets[days[d.getDay()]] = 0
  }
  notifications.forEach((n) => {
    const d = new Date(n.sentAt || n.createdAt)
    const key = days[d.getDay()]
    if (buckets[key] !== undefined) buckets[key]++
  })
  return Object.entries(buckets).map(([time, value]) => ({ time, value }))
}

export function buildVolumeByMonth(notifications) {
  const buckets = {}
  // Last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
    buckets[key] = 0
  }
  notifications.forEach((n) => {
    const d = new Date(n.sentAt || n.createdAt)
    const key = d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
    if (buckets[key] !== undefined) buckets[key]++
  })
  return Object.entries(buckets).map(([time, value]) => ({ time, value }))
}

export function buildVolumeBy6Months(notifications) {
  const buckets = {}
  // Last 26 weeks
  for (let i = 25; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i * 7)
    const weekStart = new Date(d)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const key = weekStart.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
    buckets[key] = 0
  }
  notifications.forEach((n) => {
    const d = new Date(n.sentAt || n.createdAt)
    const weekStart = new Date(d)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const key = weekStart.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
    if (buckets[key] !== undefined) buckets[key]++
  })
  return Object.entries(buckets).map(([time, value]) => ({ time, value }))
}

export function buildVolumeByYear(notifications) {
  const buckets = {}
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  // Last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`
    buckets[key] = 0
  }
  notifications.forEach((n) => {
    const d = new Date(n.sentAt || n.createdAt)
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`
    if (buckets[key] !== undefined) buckets[key]++
  })
  return Object.entries(buckets).map(([time, value]) => ({ time, value }))
}
