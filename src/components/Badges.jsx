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
    Sent: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
    Failed: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
    Partial: { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' },
    Pending: { background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0' },
    Draft: { background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' },
  }
  const s = styleMap[normalized] || styleMap.Pending
  return (
    <span
      style={{ background: s.background, color: s.color, border: s.border }}
      className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full"
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
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="p-1 rounded-md" style={{ backgroundColor: `${meta.color}1A` }}>
        <Icon className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: meta.color }} />
      </span>
      <span className="text-gray-700 font-medium">{normalized}</span>
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
      className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold ${palette[idx]}`}
    >
      {initials}
    </div>
  )
}
