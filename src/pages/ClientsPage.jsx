import { useMemo, useState, useEffect } from 'react'
import Card from '../components/Card'
import { ChannelBadge } from '../components/StatusBadge'
import { recipients as fallbackRecipients } from '../data/mockData'
import { templates as templateLibrary } from '../data/templatesConfig'
import { fetchClients } from '../api/Notificationapi'

const CHANNEL_THEME_FALLBACKS = {
  Email: 'Weekly Field Report',
  WhatsApp: 'Irrigation Reminder',
  SMS: 'Crop Alert - Critical',
  Push: 'SMS Alert - Sensor Failure',
}

function getRelatedMessages(client) {
  const channelNames = Array.isArray(client.channels) ? client.channels : []
  const matches = channelNames
    .map((channel) => {
      const template = templateLibrary.find((item) => item.channel === channel)
      const fallbackName = CHANNEL_THEME_FALLBACKS[channel] || `${channel} Update`
      return {
        channel,
        title: template?.name || fallbackName,
        content: template?.content || `Automated ${channel.toLowerCase()} update for ${client.name}.`,
      }
    })
    .slice(0, 3)

  return matches.length > 0
    ? matches
    : [{ channel: 'General', title: 'Welcome Email', content: `Hello ${client.name}, your account is active.` }]
}

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadClients() {
      try {
        const data = await fetchClients()
        setClients(Array.isArray(data) ? data : fallbackRecipients)
      } catch (err) {
        console.error('Failed to fetch clients:', err)
        setClients(fallbackRecipients)
      } finally {
        setLoading(false)
      }
    }

    loadClients()
  }, [])

  const list = useMemo(() => clients || [], [clients])
  const summary = useMemo(() => {
    const total = list.length
    const emailEnabled = list.filter((client) => client.channels?.includes('Email')).length
    const whatsappEnabled = list.filter((client) => client.channels?.includes('WhatsApp')).length
    const smsEnabled = list.filter((client) => client.channels?.includes('SMS')).length

    return [
      { label: 'Total clients', value: total },
      { label: 'Email ready', value: emailEnabled },
      { label: 'WhatsApp ready', value: whatsappEnabled },
      { label: 'SMS ready', value: smsEnabled },
    ]
  }, [list])

  return (
    <div className="page-shell px-4 sm:px-8 py-6 space-y-6">
      <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-medical-50 p-6 shadow-card">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-700">Audience directory</p>
        <h1 className="mt-2 text-3xl font-extrabold text-surface-900">Clients</h1>
        <p className="mt-2 max-w-2xl text-sm text-surface-500">
          Manage recipient records and their active delivery channels in the same visual system.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-surface-500">{list.length} clients</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summary.map((item) => (
          <Card key={item.label}>
            <div className="text-[11px] uppercase tracking-wider text-surface-400">{item.label}</div>
            <div className="mt-2 text-3xl font-extrabold text-surface-900">{item.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {list.map((client) => {
          const relatedMessages = getRelatedMessages(client)
          return (
            <Card key={client.id} className="space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-surface-900">{client.name}</h2>
                    <span className="rounded-full bg-surface-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                      {client.id}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {client.channels?.map((channel) => (
                      <ChannelBadge key={channel} type={channel} />
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3 text-right">
                  <div className="text-[11px] uppercase tracking-wider text-surface-400">Last active</div>
                  <div className="mt-1 text-sm font-semibold text-surface-900">{client.lastActive}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-surface-200 bg-white p-4 space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-surface-400">Contacts</div>
                  <div className="text-surface-700">
                    <div>{client.email}</div>
                    <div className="text-surface-500">{client.phone}</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-surface-200 bg-white p-4 space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-surface-400">Statistics</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-surface-600">
                    <div className="rounded-xl bg-surface-50 px-3 py-2">
                      <div className="text-surface-400">Channels</div>
                      <div className="mt-1 font-semibold text-surface-900">{client.channels?.length || 0}</div>
                    </div>
                    <div className="rounded-xl bg-surface-50 px-3 py-2">
                      <div className="text-surface-400">Primary</div>
                      <div className="mt-1 font-semibold text-surface-900">{client.channels?.[0] || 'General'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-surface-900">Related messages</div>
                <div className="space-y-3">
                  {relatedMessages.map((message) => (
                    <div key={`${client.id}-${message.channel}-${message.title}`} className="rounded-2xl border border-surface-200 bg-surface-50/60 p-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="font-medium text-surface-900">{message.title}</div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                          {message.channel}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-surface-600 leading-6">{message.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
