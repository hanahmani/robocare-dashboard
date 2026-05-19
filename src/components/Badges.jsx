import { Mail, MessageCircle, MessageSquare } from 'lucide-react'

export function StatusBadge({ status }) {
  const normalized = {
    SENT: 'Sent',
    FAILED: 'Failed',
    PARTIAL: 'Partial',
    PENDING: 'Pending',
    OPERATIONAL: 'Operational',
    DEGRADED: 'Degraded',
    DOWN: 'Down',
    ACTIVE: 'Active',
    DRAFT: 'Draft',
  }[String(status || '').toUpperCase()] || status

  const styleMap = {
      Sent: { background: '#f0fdf4', color: '#10b981', border: '1px solid #bbf7d0' },
      Failed: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
      Partial: { background: '#fff7ed', color: '#d97706', border: '1px solid #ffedd5' },
      Pending: { background: '#f8fafc', color: '#374151', border: '1px solid #e6edf3' },
    Draft: { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' },
  }
  const s = styleMap[normalized] || styleMap.Pending
  return (
    <span
      style={{ background: s.background, color: s.color, border: s.border }}
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full`}
    >
      {normalized}
    </span>
  )
}

const channelMeta = {
  Email: { icon: Mail, color: '#3b82f6' },
  WhatsApp: { icon: MessageCircle, color: '#10b981' },
  SMS: { icon: MessageSquare, color: '#f59e0b' },
}

export function ChannelTag({ channel }) {
  const normalized = {
    EMAIL: 'Email',
    WHATSAPP: 'WhatsApp',
    SMS: 'SMS',
  }[String(channel || '').toUpperCase()] || channel || 'Email'

  const meta = channelMeta[normalized] || channelMeta.Email
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm`}>
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: meta.color }} />
      <span className="text-gray-700">{normalized}</span>
    </span>
  )
}

export function Avatar({ initials }) {
  // Couleurs déterministes basées sur les initiales
  const palette = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
  ]
  const idx = (initials.charCodeAt(0) + initials.charCodeAt(1)) % palette.length
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold ${palette[idx]}`}
    >
      {initials}
    </div>
  )
}
