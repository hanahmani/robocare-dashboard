import {
  fetchSentNotifications,
  fetchReceivedWhatsApp,
  fetchReceivedEmails,
  sendEmail,
  sendWhatsApp,
  sendSms,
  normalizeNotification,
  computeStats,
} from '../api/Notificationapi'

export async function getSentNotifications(type = null) {
  return fetchSentNotifications(type)
}

export async function getDashboardStats() {
  const notifications = await fetchSentNotifications()
  const list = Array.isArray(notifications) ? notifications : []
  return computeStats(list)
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
  computeStats,
}