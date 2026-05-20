import { useMemo } from 'react'

const KEYWORDS = {
  status: { failed: 'FAILED', sent: 'SENT', partial: 'PARTIAL', pending: 'PENDING' },
  channel: { email: 'EMAIL', sms: 'SMS', whatsapp: 'WHATSAPP' },
}

export function useSmartSearch(data, query) {
  return useMemo(() => {
    if (!query?.trim()) return data
    const q = query.toLowerCase().trim()

    const matchedStatus = Object.entries(KEYWORDS.status).find(([k]) => q.includes(k))?.[1]
    const matchedChannel = Object.entries(KEYWORDS.channel).find(([k]) => q.includes(k))?.[1]
    const isYesterday = q.includes('yesterday')
    const isToday = q.includes('today')
    const isWeek = q.includes('week') || q.includes('7d')

    const keywordTokens = [...Object.keys(KEYWORDS.status), ...Object.keys(KEYWORDS.channel), 'yesterday', 'today', 'week', '7d']
    const freeText = q.split(/\s+/).filter(t => !keywordTokens.includes(t)).join(' ')

    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const yesterdayStr = new Date(now - 86400000).toISOString().slice(0, 10)
    const weekAgo = new Date(now - 7 * 86400000)

    return data.filter(n => {
      if (matchedStatus && n.status !== matchedStatus) return false
      if (matchedChannel && n.type !== matchedChannel) return false

      const ts = n.sentAt || n.createdAt || ''
      if (isToday && !ts.startsWith(todayStr)) return false
      if (isYesterday && !ts.startsWith(yesterdayStr)) return false
      if (isWeek && new Date(ts) < weekAgo) return false

      if (freeText) {
        const haystack = [n.recipient, String(n.id), n.subject, n.message]
          .filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(freeText)) return false
      }

      return true
    })
  }, [data, query])
}
