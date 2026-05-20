import { Mail, MessageCircle, MessageSquare, Settings as SettingsIcon } from 'lucide-react'
import Card from '../components/Card'
import { StatusBadge } from '../components/Badges'
import { channelsConfig } from '../data/channelsConfig'

const channelIcons = {
  Email: { Icon: Mail, bg: 'bg-blue-50', color: 'text-blue-600' },
  WhatsApp: { Icon: MessageCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  SMS: { Icon: MessageSquare, bg: 'bg-orange-50', color: 'text-orange-600' },
}

export default function ChannelsPage() {
  return (
    <div className="page-shell px-4 sm:px-8 py-6 space-y-6">
      <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-medical-50 p-6 shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-700">Delivery channels</p>
        <h1 className="mt-2 text-3xl font-extrabold text-surface-900">Channels</h1>
        <p className="mt-2 max-w-2xl text-sm text-surface-500">
          Configure and monitor delivery channels for the RoboCare notification platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channelsConfig.map((c) => {
          const meta = channelIcons[c.name]
          const Icon = meta.Icon
          return (
            <Card key={c.id} className="overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg}`}>
                    <Icon className={`w-5 h-5 ${meta.color}`} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900">{c.name}</h3>
                    <p className="text-xs text-surface-500">{c.provider}</p>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-surface-100">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-surface-400 mb-1">
                    Sent (24h)
                  </div>
                  <div className="text-lg font-semibold text-surface-900">{c.sent24h}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-surface-400 mb-1">
                    Success Rate
                  </div>
                  <div className="text-lg font-semibold text-medical-700">{c.successRate}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-100 flex items-center justify-end">
                <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-600 hover:text-brand-700">
                  <SettingsIcon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Configure
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
