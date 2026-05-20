import {
  fetchSentNotifications,
  fetchReceivedWhatsApp,
  fetchReceivedEmails,
  sendEmail,
  sendWhatsApp,
  sendSms,
  normalizeNotification,
  fetchClients as apiFetchClients,
  fetchCriticalErrors as apiFetchCriticalErrors,
} from '../api/notificationApi'

export async function getSentNotifications(type = null) {
  return fetchSentNotifications(type)
}

export async function getDashboardStats() {
  const notifications = await fetchSentNotifications()
  // computeStats is exported from the lower-level API helper
  if (typeof computeStats === 'function') {
    return computeStats(Array.isArray(notifications) ? notifications : [])
  }
  // fallback
  return {
    total: Array.isArray(notifications) ? notifications.length : 0,
    sent: Array.isArray(notifications) ? notifications.filter(n => n.status === 'SENT').length : 0,
    failed: Array.isArray(notifications) ? notifications.filter(n => n.status === 'FAILED').length : 0,
    partial: Array.isArray(notifications) ? notifications.filter(n => n.status === 'PARTIAL').length : 0,
    successRate: Array.isArray(notifications) && notifications.length > 0 ? (((notifications.filter(n => n.status === 'SENT').length) / notifications.length) * 100).toFixed(1) : '0.0',
    byType: {},
    failedWithErrors: [],
  }
}

export async function getReceivedNotifications() {
  return fetchReceivedWhatsApp()
}

export async function getEmails() {
  return fetchReceivedEmails()
}

export async function getInboxNotifications() {
  const [whatsapp, emails, sent] = await Promise.all([
    fetchReceivedWhatsApp(),
    fetchReceivedEmails(),
    fetchSentNotifications(),
  ])

  return {
    whatsapp: Array.isArray(whatsapp) ? whatsapp : [],
    emails: Array.isArray(emails) ? emails : [],
    sent: Array.isArray(sent) ? sent : [],
  }
}

export async function sendEmailNotification(payload) {
  return sendEmail(payload)
}

export async function sendSmsNotification(payload) {
  return sendSms(payload)
}

export async function sendWhatsAppNotification(payload) {
  return sendWhatsApp(payload)
}

export async function sendWhatsappNotification(payload) {
  return sendWhatsApp(payload)
}

export {
  fetchSentNotifications,
  fetchReceivedWhatsApp,
  fetchReceivedEmails,
  sendEmail,
  sendWhatsApp,
  sendSms,
  normalizeNotification,
  apiFetchClients as fetchClients,
  apiFetchCriticalErrors as fetchCriticalErrors,
}