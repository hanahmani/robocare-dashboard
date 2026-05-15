import { Mail, MessageCircle, MessageSquare, Bell } from 'lucide-react'

export function StatusBadge({ status }) {
  const styles = {
    Sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Failed: 'bg-red-50 text-red-700 border-red-200',
    Partial: 'bg-amber-50 text-amber-700 border-amber-200',
    Pending: 'bg-gray-50 text-gray-700 border-gray-200',
    Operational: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Degraded: 'bg-amber-50 text-amber-700 border-amber-200',
    Down: 'bg-red-50 text-red-700 border-red-200',
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Draft: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium border rounded ${
        styles[status] || styles.Pending
      }`}
    >
      {status}
    </span>
  )
}

const channelMeta = {
  Email: { icon: Mail, color: 'text-blue-500' },
  WhatsApp: { icon: MessageCircle, color: 'text-emerald-500' },
  SMS: { icon: MessageSquare, color: 'text-orange-500' },
  Push: { icon: Bell, color: 'text-purple-500' },
}

export function ChannelTag({ channel }) {
  const meta = channelMeta[channel] || channelMeta.Email
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${meta.color}`}>
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
      <span className="text-gray-700">{channel}</span>
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
