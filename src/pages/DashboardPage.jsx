import { useState, useMemo } from 'react'
import FilterBar from '../components/FilterBar'
import StatCard from '../components/StatCard'
import NotificationVolumeChart from '../components/NotificationVolumeChart'
import RecentNotificationsTable from '../components/RecentNotificationsTable'
import ChannelBreakdownPanel from '../components/ChannelBreakdownPanel'
import CriticalErrorsPanel from '../components/CriticalErrorsPanel'
import SuccessFailureChart from '../components/SuccessFailureChart'
import { dashboardStats, recentNotifications } from '../data/mockData'

const DEFAULT_FILTERS = {
  date: 'Last 24 Hours',
  channel: 'All Channels',
  status: 'All Statuses',
  search: '',
}

export default function DashboardPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const filteredNotifications = useMemo(() => {
    return recentNotifications.filter((n) => {
      if (filters.channel !== 'All Channels' && n.channel !== filters.channel) return false
      if (filters.status !== 'All Statuses' && n.status !== filters.status) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!n.recipient.toLowerCase().includes(q) && !n.id.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [filters])

  return (
    <div className="p-6">
      <FilterBar filters={filters} onFilterChange={setFilters} />

      <div className="grid grid-cols-12 gap-5">
        {/* Colonne principale */}
        <div className="col-span-12 xl:col-span-9 space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label="Total"
              value={dashboardStats.total}
              delta={dashboardStats.totalDelta}
              deltaPositive={true}
            />
            <StatCard
              label="Success"
              value={dashboardStats.success}
              bar={{ percent: 95.8, color: '#10b981' }}
            />
            <StatCard
              label="Failed"
              value={dashboardStats.failed}
              valueColor="text-red-600"
              subtitle={dashboardStats.failedStatus}
              subtitleIcon="alert"
              subtitleColor="text-red-600"
            />
            <StatCard
              label="Partial"
              value={dashboardStats.partial}
              valueColor="text-amber-600"
              subtitle={dashboardStats.partialStatus}
              subtitleColor="text-amber-600"
            />
            <StatCard
              label="Success Rate"
              value={dashboardStats.successRate}
              valueColor="text-brand-600"
              subtitle={dashboardStats.successRateTarget}
            />
          </div>

          <NotificationVolumeChart dateFilter={filters.date} />
          <RecentNotificationsTable notifications={filteredNotifications} />
        </div>

        {/* Sidebar droite */}
        <div className="col-span-12 xl:col-span-3 space-y-5">
          <ChannelBreakdownPanel channelFilter={filters.channel} />
          <CriticalErrorsPanel />
          <SuccessFailureChart />
        </div>
      </div>
    </div>
  )
}
