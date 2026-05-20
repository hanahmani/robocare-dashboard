import { useMemo } from 'react'
import { recipients as recipientDirectory } from '../data/mockData'
import Card from '../components/Card'
import { ChannelBadge } from '../components/StatusBadge'

export default function ClientsPage() {
  const list = useMemo(() => recipientDirectory || [], [])

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

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-surface-500 border-b border-surface-100 bg-surface-50/60">
              <th className="text-left font-medium px-5 py-3">Name</th>
              <th className="text-left font-medium px-5 py-3">Email</th>
              <th className="text-left font-medium px-5 py-3">Phone</th>
              <th className="text-left font-medium px-5 py-3">Channels</th>
              <th className="text-left font-medium px-5 py-3">Last active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {list.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3">
                  <div className="font-medium text-surface-900">{r.name}</div>
                  <div className="text-xs text-surface-400 font-mono">{r.id}</div>
                </td>
                <td className="px-5 py-3 text-surface-600">{r.email}</td>
                <td className="px-5 py-3 text-surface-600">{r.phone}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {r.channels?.map((c) => (
                      <ChannelBadge key={c} type={c} />
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3 text-surface-500">{r.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
