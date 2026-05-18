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
    Sent: { background: '#f0fdf4', color: '#52c41a', border: '1px solid #bbf7d0' },
    Failed: { background: '#fff1f0', color: '#ff4d4f', border: '1px solid #ffccc7' },
    Partial: { background: '#fff7ed', color: '#fa8c16', border: '1px solid #ffe7c2' },
    Pending: { background: '#f8fafc', color: '#374151', border: '1px solid #e6edf3' },
    Draft: { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' },
  }
  const s = styleMap[normalized] || styleMap.Pending
  return (
    <span
      style={{ background: s.background, color: s.color, border: s.border }}
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded`}
    >
      {normalized}
    </span>
  )
}

const channelMeta = {
  Email: { icon: Mail, color: '#1677ff' },
  WhatsApp: { icon: MessageCircle, color: '#52c41a' },
  SMS: { icon: MessageSquare, color: '#fa8c16' },
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
