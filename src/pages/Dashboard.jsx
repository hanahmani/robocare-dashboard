import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  Progress,
  Select,
  Spin,
  Statistic,
  Table,
  Typography,
} from 'antd'
import {
  ExclamationCircleOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ThunderboltOutlined,
  MailOutlined,
  MessageOutlined,
  ReloadOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { fetchHealth, fetchSentNotifications, computeStats, buildVolumeByDay, buildVolumeByHour, normalizeNotification } from '../api/Notificationapi'
import styles from './Dashboard.module.css'

ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, LineElement, PointElement, Tooltip, Legend, Filler)

const RANGE_OPTIONS = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All time' },
]

const CHANNEL_OPTIONS = [
  { value: 'ALL', label: 'All Channels' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
]

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SENT', label: 'Sent' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'PARTIAL', label: 'Partial' },
]

const CHANNEL_COLORS = {
  EMAIL: '#65a30d',
  WHATSAPP: '#16a34a',
  SMS: '#d97706',
}

const STATUS_BADGE_MAP = {
  SENT: 'success',
  FAILED: 'error',
  PARTIAL: 'warning',
  PENDING: 'processing',
}

const STATUS_LABELS = {
  SENT: 'Sent',
  FAILED: 'Failed',
  PARTIAL: 'Partial',
  PENDING: 'Pending',
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const FAILURE_ALERT_THRESHOLD = 12
const AUTO_REFRESH_MS = 30000

export default function Dashboard() {
  const [allNotifications, setAllNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [healthOnline, setHealthOnline] = useState(false)
  const [rangeFilter, setRangeFilter] = useState('day')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [volumeMode, setVolumeMode] = useState('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [responseTime, setResponseTime] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const hasLoadedRef = useRef(false)

  const loadData = useCallback(async ({ silent = false } = {}) => {
    const startedAt = window.performance?.now?.() || Date.now()
    if (!silent) {
      if (!hasLoadedRef.current) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
    }

    try {
      const notifications = await fetchSentNotifications()
      const rawNotifications = Array.isArray(notifications) ? notifications : []
      setAllNotifications(rawNotifications)
      setError('')
      setLastUpdated(new Date())
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load notifications')
    } finally {
      const endedAt = window.performance?.now?.() || Date.now()
      setResponseTime(Math.max(0, Math.round(endedAt - startedAt)))
      if (!silent) {
        hasLoadedRef.current = true
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    loadData()

    const checkHealth = async () => {
      try {
        await fetchHealth()
        setHealthOnline(true)
      } catch {
        setHealthOnline(false)
      }
    }

    checkHealth()

    const intervalId = window.setInterval(() => {
      if (autoRefresh) {
        loadData({ silent: true })
      }
    }, AUTO_REFRESH_MS)

    return () => window.clearInterval(intervalId)
  }, [autoRefresh, loadData])

  const stats = useMemo(() => {
    const baseStats = computeStats(allNotifications)
    return {
      ...baseStats,
      failedErrors: baseStats.failedWithErrors || [],
      unique: new Set(allNotifications.map((notification) => notification.recipient).filter(Boolean)).size,
    }
  }, [allNotifications])

  const todayMetrics = useMemo(() => {
    const now = new Date()
    const isSameDay = (value) => {
      const date = new Date(value)
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
    }

    const todayItems = allNotifications.filter((item) => isSameDay(item.sentAt || item.createdAt))
    const todaySent = todayItems.filter((item) => item.status === 'SENT').length
    const todayFailed = todayItems.filter((item) => item.status === 'FAILED').length
    const topChannelEntry = ['EMAIL', 'SMS', 'WHATSAPP']
      .map((channel) => ({
        channel,
        count: todayItems.filter((item) => item.type === channel).length,
      }))
      .sort((left, right) => right.count - left.count)[0] || { channel: 'EMAIL', count: 0 }

    return {
      total: todayItems.length,
      successRate: todayItems.length > 0 ? Math.round((todaySent / todayItems.length) * 100) : 0,
      failed: todayFailed,
      topChannel: topChannelEntry,
    }
  }, [allNotifications])

  const channelPieData = useMemo(() => ({
    labels: ['Email', 'SMS', 'WhatsApp'],
    datasets: [
      {
        data: ['EMAIL', 'SMS', 'WHATSAPP'].map((channel) => stats.byType?.[channel] || 0),
        backgroundColor: [CHANNEL_COLORS.EMAIL, CHANNEL_COLORS.SMS, CHANNEL_COLORS.WHATSAPP],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }), [stats.byType])

  const channelPieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
  }

  const insights = useMemo(() => {
    const failureRate = stats.total > 0 ? (stats.failed / stats.total) * 100 : 0
    const mostUsedChannel = ['EMAIL', 'SMS', 'WHATSAPP']
      .map((channel) => ({ channel, count: stats.byType?.[channel] || 0 }))
      .sort((left, right) => right.count - left.count)[0]

    const channelLabel = mostUsedChannel?.channel === 'WHATSAPP' ? 'WhatsApp' : mostUsedChannel?.channel === 'SMS' ? 'SMS' : 'Email'

    return [
      failureRate >= FAILURE_ALERT_THRESHOLD
        ? `High failure rate detected (${failureRate.toFixed(1)}%). Review the latest critical errors and retry queue.`
        : `Failure rate is under control at ${failureRate.toFixed(1)}%.`,
      mostUsedChannel
        ? `Most used channel is ${channelLabel} with ${mostUsedChannel.count} notification${mostUsedChannel.count === 1 ? '' : 's'}.`
        : 'No channel activity yet. Send a notification to activate live insights.',
      todayMetrics.topChannel.count > 0
        ? `Today, ${todayMetrics.topChannel.channel === 'WHATSAPP' ? 'WhatsApp' : todayMetrics.topChannel.channel === 'SMS' ? 'SMS' : 'Email'} leads the traffic.`
        : 'No traffic recorded today. The dashboard will adapt once new events arrive.',
    ]
  }, [stats.byType, stats.failed, stats.total, todayMetrics.topChannel])

  const filteredNotifications = useMemo(() => {
    const search = searchQuery.trim().toLowerCase()
    const now = Date.now()
    const rangeMs =
      rangeFilter === 'day'
        ? 24 * 60 * 60 * 1000
        : rangeFilter === 'week'
          ? 7 * 24 * 60 * 60 * 1000
          : rangeFilter === 'month'
            ? 30 * 24 * 60 * 60 * 1000
            : null
    const lowerBound = rangeMs ? now - rangeMs : null

    return allNotifications
      .filter((notification) => {
        const timestamp = new Date(notification.sentAt || notification.createdAt).getTime()

        if (lowerBound && Number.isFinite(timestamp) && timestamp < lowerBound) return false
        if (channelFilter !== 'ALL' && notification.type !== channelFilter) return false
        if (statusFilter !== 'ALL' && notification.status !== statusFilter) return false
        if (search) {
          const haystack = [notification.recipient, notification.id, notification.subject, notification.message]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(search)) return false
        }

        return true
      })
      .sort((left, right) => new Date(right.sentAt || right.createdAt) - new Date(left.sentAt || left.createdAt))
  }, [allNotifications, channelFilter, rangeFilter, searchQuery, statusFilter])

  const recentRows = useMemo(() => filteredNotifications.slice(0, 8).map((notification) => normalizeNotification(notification)), [filteredNotifications])

  const volumeDataset = useMemo(() => {
    const source = volumeMode === '7d' ? buildVolumeByDay(allNotifications) : buildVolumeByHour(allNotifications)

    return {
      labels: source.map((item) => item.time),
      datasets: [
        {
          label: 'Notifications',
          data: source.map((item) => item.value),
          borderColor: '#65a30d',
          backgroundColor: 'rgba(101,163,13,0.08)',
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.4,
          borderWidth: 2,
        },
      ],
    }
  }, [allNotifications, volumeMode])

  const successFailureDataset = useMemo(() => {
    const buckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))

      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' }),
        success: 0,
        failed: 0,
      }
    })

    allNotifications.forEach((notification) => {
      const date = new Date(notification.sentAt || notification.createdAt)
      if (Number.isNaN(date.getTime())) return

      const key = date.toISOString().slice(0, 10)
      const bucket = buckets.find((entry) => entry.key === key)
      if (!bucket) return

      if (notification.status === 'FAILED') {
        bucket.failed += 1
      } else if (notification.status === 'SENT') {
        bucket.success += 1
      }
    })

    return {
      labels: buckets.map((entry) => entry.label),
      datasets: [
        {
          label: 'Success',
          data: buckets.map((entry) => entry.success),
          backgroundColor: 'rgba(101,163,13,0.72)',
          borderRadius: 6,
        },
        {
          label: 'Failed',
          data: buckets.map((entry) => entry.failed),
          backgroundColor: 'rgba(239,68,68,0.6)',
          borderRadius: 6,
        },
      ],
    }
  }, [allNotifications])

  const volumeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        intersect: false,
        mode: 'index',
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { position: 'bottom' },
    },
  }

  const groupedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
    scales: {
      x: { stacked: false, grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  }

  const total = allNotifications.length || 1
  const channelCounts = stats.byType || { EMAIL: 0, SMS: 0, WHATSAPP: 0 }
  const failureRate = stats.total > 0 ? (stats.failed / stats.total) * 100 : 0

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className={styles.dashboardPage}>
      {error ? <Alert className={styles.errorBanner} type="error" showIcon message="Unable to refresh notifications" description={error} /> : null}

      <Card className={styles.panelCard}>
        <div className={styles.insightHeader}>
          <div>
            <div className={styles.sectionEyebrow}>Smart overview</div>
            <div className={styles.sectionTitle}>Operational pulse for the notification platform</div>
            <div className={styles.sectionMeta}>
              Live updates, performance checks, and actionable guidance for the support team.
            </div>
          </div>
          <div className={styles.smartActions}>
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={() => loadData()}
              size="large"
            >
              Refresh
            </Button>
            <Button
              type={autoRefresh ? 'primary' : 'default'}
              icon={<ThunderboltOutlined />}
              onClick={() => setAutoRefresh((value) => !value)}
              size="large"
            >
              {autoRefresh ? 'Live refresh on' : 'Live refresh off'}
            </Button>
          </div>
        </div>

        <div className={styles.smartKpis}>
          <div className={styles.smartKpiCard}>
            <div className={styles.kpiLabel}>Today total</div>
            <div className={styles.kpiValue}>{todayMetrics.total}</div>
            <div className={styles.kpiMeta}>Notifications sent today</div>
          </div>
          <div className={styles.smartKpiCard}>
            <div className={styles.kpiLabel}>Success rate</div>
            <div className={styles.kpiValue}>{todayMetrics.successRate}%</div>
            <div className={styles.kpiMeta}>Same-day delivery performance</div>
          </div>
          <div className={`${styles.smartKpiCard} ${failureRate >= FAILURE_ALERT_THRESHOLD ? styles.kpiDanger : ''}`}>
            <div className={styles.kpiLabel}>Failed notifications</div>
            <div className={styles.kpiValue}>{todayMetrics.failed}</div>
            <div className={styles.kpiMeta}>Failure rate {failureRate.toFixed(1)}%</div>
          </div>
          <div className={styles.smartKpiCard}>
            <div className={styles.kpiLabel}>Most used channel</div>
            <div className={styles.kpiValue}>
              {todayMetrics.topChannel.channel === 'WHATSAPP' ? 'WhatsApp' : todayMetrics.topChannel.channel === 'SMS' ? 'SMS' : 'Email'}
            </div>
            <div className={styles.kpiMeta}>{todayMetrics.topChannel.count} message(s) today</div>
          </div>
        </div>

        <div className={styles.insightGrid}>
          <div className={styles.insightPanel}>
            <div className={styles.panelHeading}>
              <LineChartOutlined />
              Insights panel
            </div>
            <ul className={styles.insightList}>
              {insights.map((insight) => (
                <li key={insight} className={styles.insightItem}>
                  {insight}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.insightPanel}>
            <div className={styles.panelHeading}>
              <PieChartOutlined />
              Channel distribution
            </div>
            <div className={styles.chartBoxSmall}>
              <Doughnut data={channelPieData} options={doughnutOptions} />
            </div>
          </div>

          <div className={styles.insightPanel}>
            <div className={styles.panelHeading}>
              <ExclamationCircleOutlined />
              Performance panel
            </div>
            <div className={styles.performanceList}>
              <div className={styles.performanceRow}>
                <span>API status</span>
                <Badge status={healthOnline ? 'success' : 'error'} text={healthOnline ? 'Online' : 'Offline'} />
              </div>
              <div className={styles.performanceRow}>
                <span>Response time</span>
                <strong>{responseTime === null ? '—' : `${responseTime} ms`}</strong>
              </div>
              <div className={styles.performanceRow}>
                <span>Last refresh</span>
                <strong>{lastUpdated ? lastUpdated.toLocaleTimeString('fr-FR') : '—'}</strong>
              </div>
              <div className={styles.performanceRow}>
                <span>Tracked recipients</span>
                <strong>{stats.unique}</strong>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className={styles.filterBar}>
        <Select
          className={styles.filterSelect}
          value={rangeFilter}
          options={RANGE_OPTIONS}
          onChange={setRangeFilter}
          size="large"
        />

        <Select
          className={styles.filterSelect}
          value={channelFilter}
          options={CHANNEL_OPTIONS}
          onChange={setChannelFilter}
          size="large"
        />

        <Select
          className={styles.filterSelect}
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
          size="large"
        />

        <Input.Search
          className={styles.searchInput}
          placeholder="Search recipients or IDs…"
          allowClear
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          size="large"
        />

        <Button className={styles.refreshButton} icon={<ReloadOutlined spin={refreshing} />} onClick={() => loadData()} size="large">
          Refresh
        </Button>
      </div>

      <div className={styles.metricGrid}>
        <Card className={styles.metricCard}>
          <Statistic title={<span className={styles.metricLabel}>Total</span>} value={stats.total} valueStyle={{ color: '#185FA5' }} />
        </Card>

        <Card className={styles.metricCard}>
          <Statistic title={<span className={styles.metricLabel}>Success</span>} value={stats.sent} valueStyle={{ color: '#27500A' }} />
        </Card>

        <Card className={styles.metricCard}>
          <Statistic
            title={<span className={styles.metricLabel}>Failed</span>}
            value={stats.failed}
            suffix={stats.failed > 0 ? 'Critical' : ''}
            valueStyle={{ color: '#791F1F' }}
          />
        </Card>

        <Card className={styles.metricCard}>
          <Statistic title={<span className={styles.metricLabel}>Partial</span>} value={stats.partial} valueStyle={{ color: '#633806' }} />
        </Card>

        <Card className={styles.metricCard}>
          <Statistic title={<span className={styles.metricLabel}>Success Rate</span>} value={`${stats.successRate}%`} valueStyle={{ color: '#185FA5' }} />
        </Card>

        <Card className={styles.metricCard}>
          <Statistic title={<span className={styles.metricLabel}>Recipients</span>} value={stats.unique} suffix="unique users" valueStyle={{ color: '#185FA5' }} />
        </Card>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.leftColumn}>
          <Card
            title="Notification volume"
            extra={
              <div className={styles.toggleGroup}>
                <Button type={volumeMode === '24h' ? 'primary' : 'default'} onClick={() => setVolumeMode('24h')}>
                  24h
                </Button>
                <Button type={volumeMode === '7d' ? 'primary' : 'default'} onClick={() => setVolumeMode('7d')}>
                  7j
                </Button>
              </div>
            }
            className={styles.panelCard}
          >
            <div className={styles.chartBox}>
              <Line data={volumeDataset} options={volumeOptions} />
            </div>
          </Card>

          <Card
            title="Recent notifications"
            extra={<Link className={styles.viewAllLink} to="/notifications">View all</Link>}
            className={styles.panelCard}
          >
            <Table
              columns={recentColumns}
              dataSource={recentRows}
              pagination={false}
              rowKey="id"
              size="middle"
              className={styles.recentTable}
            />
          </Card>
        </section>

        <aside className={styles.rightColumn}>
          <Card title="Channel breakdown" className={styles.panelCard}>
            <div className={styles.channelList}>
              {['EMAIL', 'WHATSAPP', 'SMS'].map((channel) => {
                const value = channelCounts[channel] || 0
                const percent = stats.total > 0 ? Math.round((value / stats.total) * 100) : 0

                return (
                  <div key={channel} className={styles.channelRow}>
                    <div className={styles.channelHeader}>
                      <span>{channel === 'EMAIL' ? 'Email' : channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}</span>
                      <span>{percent}%</span>
                    </div>
                    <Progress percent={percent} showInfo={false} strokeColor={CHANNEL_COLORS[channel]} trailColor="#eef2f7" />
                  </div>
                )
              })}
            </div>
          </Card>

          <Card title="Critical errors" className={`${styles.panelCard} ${styles.criticalCard}`}>
            <div className={styles.criticalList}>
              {stats.failedErrors.length > 0 ? (
                stats.failedErrors.map((errorItem, index) => (
                  <div key={`${errorItem.title}-${index}`} className={styles.criticalItem}>
                    <div className={styles.criticalTitle}>{errorItem.title}</div>
                    <div className={styles.criticalDetail}>{errorItem.detail}</div>
                    <div className={styles.criticalTime}>{errorItem.time}</div>
                    <div className={styles.criticalError}>{errorItem.error}</div>
                  </div>
                ))
              ) : (
                <Typography.Text type="secondary">No critical errors found.</Typography.Text>
              )}
            </div>
          </Card>

          <Card title="Success vs failure" className={styles.panelCard}>
            <div className={styles.chartBoxSmall}>
              <Bar data={successFailureDataset} options={groupedBarOptions} />
            </div>
          </Card>

          <Card className={styles.healthCard}>
            <div className={styles.healthRow}>
              <Badge status={healthOnline ? 'success' : 'error'} />
              <div>
                <div className={styles.healthLabel}>{healthOnline ? 'API connected' : 'API offline'}</div>
                <div className={styles.healthMeta}>RoboCare Service</div>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

const recentColumns = [
  {
    title: 'Recipient',
    dataIndex: 'recipient',
    key: 'recipient',
    render: (_, notification) => {
      const initials = getInitials(notification.recipient)
      return (
        <div className={styles.recipientCell}>
          <Avatar className={styles.recipientAvatar} style={{ backgroundColor: getAvatarColor(notification.recipient) }}>
            {initials}
          </Avatar>
          <div>
            <div className={styles.recipientPrimary}>{notification.recipient || 'Unknown recipient'}</div>
            <div className={styles.recipientSecondary}>ID {notification.id}</div>
          </div>
        </div>
      )
    },
  },
  {
    title: 'Channel',
    dataIndex: 'channel',
    key: 'channel',
    render: (_, notification) => {
      const channel = String(notification.type || '').toUpperCase()
      const config = getChannelConfig(channel)
      const Icon = config.icon
      return (
        <div className={styles.channelCell}>
          <Icon style={{ color: config.color }} />
          <span>{config.label}</span>
        </div>
      )
    },
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (_, notification) => {
      const status = String(notification.status || 'PENDING').toUpperCase()
      return <Badge status={STATUS_BADGE_MAP[status] || 'default'} text={STATUS_LABELS[status] || status} />
    },
  },
  {
    title: 'Timestamp',
    dataIndex: 'timestamp',
    key: 'timestamp',
    render: (_, notification) => formatTimestamp(notification.sentAt || notification.createdAt),
  },
]

function getChannelConfig(channel) {
  if (channel === 'SMS') {
    return { label: 'SMS', color: CHANNEL_COLORS.SMS, icon: MessageOutlined }
  }

  if (channel === 'WHATSAPP') {
    return { label: 'WhatsApp', color: CHANNEL_COLORS.WHATSAPP, icon: WhatsAppOutlined }
  }

  return { label: 'Email', color: CHANNEL_COLORS.EMAIL, icon: MailOutlined }
}

function formatTimestamp(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInitials(recipient = '') {
  const text = String(recipient)
    .replace(/[+\d\s-]/g, '')
    .split(/[@.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')

  return text || recipient.slice(0, 2).toUpperCase() || '??'
}

function getAvatarColor(recipient = '') {
  const palette = ['#185FA5', '#1D9E75', '#BA7517', '#791F1F', '#5A67D8', '#0F766E']
  const hash = String(recipient).split('').reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0)
  return palette[hash % palette.length]
}