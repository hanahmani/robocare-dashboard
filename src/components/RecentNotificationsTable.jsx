import { MoreVertical } from 'lucide-react'
import Card from './Card'
import { ChannelTag, StatusBadge, Avatar } from './Badges'
export default function RecentNotificationsTable({
notifications,
loading,
}) {
if (loading) {
return (
<Card>
<div className="p-5">Chargement...</div>
</Card>
)
}

const formatRecipient = (notification) =>
	notification.recipient || (Array.isArray(notification.to) ? notification.to.join(', ') : notification.to) || 'Unknown'

const getInitials = (n) => n.initials || ((n.recipient || '').split(/[@\s\.\-\+]/).filter(Boolean).map(s => s[0]?.toUpperCase()).slice(0,2).join('') || '??')

const getDisplayName = (n) => {
	const r = n.recipient || ''
	if (r.includes('@')) return r.split('@')[0]
	return r
}

const formatChannel = (notification) => notification.channel || notification.type || 'Unknown'

const formatTimestamp = (notification) =>
	notification.timestamp || notification.sentAt || notification.createdAt || '—'

	return (
		<Card padding="p-0">
			<div className="px-5 py-4 flex items-center justify-between">
				<h3 className="text-sm font-semibold text-gray-900">Recent Notifications</h3>
				<a className="text-sm text-brand-600 font-medium" href="/notifications">View All</a>
			</div>
			<table className="w-full text-sm">
				<thead>
					<tr className="text-[11px] uppercase tracking-wider text-gray-500">
						<th className="text-left font-medium px-5 py-2">Recipient</th>
						<th className="text-left font-medium px-5 py-2">Channel</th>
						<th className="text-left font-medium px-5 py-2">Status</th>
						<th className="text-left font-medium px-5 py-2">Timestamp</th>
						<th className="text-left font-medium px-5 py-2">Action</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-100">
					{notifications.map((n) => (
						<tr key={n.id} className="hover:bg-gray-50 transition-colors">
							<td className="px-5 py-3">
								<div className="flex items-center gap-3">
									<Avatar initials={getInitials(n)} />
									<div>
										<div className="font-medium text-gray-800">{getDisplayName(n)}</div>
										<div className="text-xs text-gray-500">ID: {n.id}</div>
									</div>
								</div>
							</td>
							<td className="px-5 py-3">
								<ChannelTag channel={formatChannel(n)} />
							</td>
							<td className="px-5 py-3">
								<StatusBadge status={n.status || 'Pending'} />
							</td>
							<td className="px-5 py-3 text-gray-600 text-sm">{formatTimestamp(n)}</td>
							<td className="px-5 py-3">
								<button className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
									<MoreVertical className="w-4 h-4" />
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</Card>
	)
}
