const STATUS_CONFIG = {
  SENT:    { label: 'Sent',    dot: 'bg-green-500', bg: 'bg-green-50 text-green-700' },
  FAILED:  { label: 'Failed',  dot: 'bg-red-500',   bg: 'bg-red-50 text-red-700' },
  PARTIAL: { label: 'Partial', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700' },
  PENDING: { label: 'Pending', dot: 'bg-blue-400',  bg: 'bg-blue-50 text-blue-700' },
}

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status?.toUpperCase()] || { label: status, dot: 'bg-gray-400', bg: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

const CHANNEL_CONFIG = {
  EMAIL:    { label: 'Email',     bg: 'bg-blue-50 text-blue-700' },
  SMS:      { label: 'SMS',       bg: 'bg-amber-50 text-amber-700' },
  WHATSAPP: { label: 'WhatsApp',  bg: 'bg-green-50 text-green-700' },
}

export function ChannelBadge({ type }) {
  const cfg = CHANNEL_CONFIG[type?.toUpperCase()] || { label: type, bg: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg}`}>
      {cfg.label}
    </span>
  )
}
