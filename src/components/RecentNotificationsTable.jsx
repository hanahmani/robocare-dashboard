import { MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from './Card'
import { Avatar, ChannelTag, StatusBadge } from './Badges'

export default function RecentNotificationsTable({ notifications = [] }) {
  const navigate = useNavigate()

  return (
    <Card padding="p-0">
      <div className="px-5 py-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Recent Notifications</h3>
        <button
          onClick={() => navigate('/notifications')}
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          View All
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-y border-gray-100 bg-gray-50/30">
            <th className="text-left font-medium px-5 py-2">Recipients</th>
            <th className="text-left font-medium px-5 py-2">Channel</th>
            <th className="text-left font-medium px-5 py-2">Status</th>
            <th className="text-left font-medium px-5 py-2">Timestamp</th>
            <th className="text-left font-medium px-5 py-2">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                No notifications match the current filters.
              </td>
            </tr>
          ) : (
            notifications.map((n) => (
              <tr key={n.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar initials={n.initials} />
                    <div>
                      <div className="text-gray-900">{n.recipient}</div>
                      <div className="text-[11px] text-gray-400 font-mono">ID: {n.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <ChannelTag channel={n.channel} />
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={n.status} />
                </td>
                <td className="px-5 py-3 text-gray-600 text-sm">{n.timestamp}</td>
                <td className="px-5 py-3">
                  <button className="p-1 rounded hover:bg-gray-100 text-gray-400">
                    <MoreVertical className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  )
}
