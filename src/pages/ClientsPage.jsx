import { useMemo } from 'react'
import { recipients as recipientDirectory } from '../data/mockData'
import Card from '../components/Card'
import { ChannelBadge } from '../components/StatusBadge'

export default function ClientsPage() {
  const list = useMemo(() => recipientDirectory || [], [])

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
        <div className="text-sm text-gray-500">{list.length} clients</div>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-100 bg-gray-50/40">
              <th className="text-left font-medium px-5 py-3">Name</th>
              <th className="text-left font-medium px-5 py-3">Email</th>
              <th className="text-left font-medium px-5 py-3">Phone</th>
              <th className="text-left font-medium px-5 py-3">Channels</th>
              <th className="text-left font-medium px-5 py-3">Last active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3">
                  <div className="font-medium text-gray-900">{r.name}</div>
                  <div className="text-xs text-gray-400 font-mono">{r.id}</div>
                </td>
                <td className="px-5 py-3 text-gray-600">{r.email}</td>
                <td className="px-5 py-3 text-gray-600">{r.phone}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {r.channels?.map((c) => (
                      <ChannelBadge key={c} type={c} />
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-500">{r.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
