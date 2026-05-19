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
  MailOutlined,
  MessageOutlined,
  ReloadOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons'
import {
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
import { Bar, Line } from 'react-chartjs-2'
import { fetchHealth, fetchSentNotifications, computeStats, buildVolumeByDay, buildVolumeByHour, normalizeNotification } from '../api/Notificationapi'
import styles from './Dashboard.module.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler)

const RANGE_OPTIONS = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
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
  EMAIL: '#185FA5',
  WHATSAPP: '#1D9E75',
  SMS: '#BA7517',
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

export default function Dashboard() {
  const [allNotifications, setAllNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [healthOnline, setHealthOnline] = useState(false)
  const [rangeFilter, setRangeFilter] = useState('24h')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [volumeMode, setVolumeMode] = useState('24h')
  const hasLoadedRef = useRef(false)

  const loadData = useCallback(async ({ silent = false } = {}) => {
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
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load notifications')
    } finally {
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
      loadData({ silent: true })
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [loadData])

  const stats = useMemo(() => {
    const baseStats = computeStats(allNotifications)
    return {
      ...baseStats,
      failedErrors: baseStats.failedWithErrors || [],
      unique: new Set(allNotifications.map((notification) => notification.recipient).filter(Boolean)).size,
    }
  }, [allNotifications])

  const filteredNotifications = useMemo(() => {
    const search = searchQuery.trim().toLowerCase()
    const now = Date.now()
    const rangeMs = rangeFilter === '24h' ? 24 * 60 * 60 * 1000 : rangeFilter === '7d' ? 7 * 24 * 60 * 60 * 1000 : null
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
          borderColor: '#185FA5',
          backgroundColor: 'rgba(24,95,165,0.08)',
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
          backgroundColor: 'rgba(99,153,34,0.7)',
          borderRadius: 6,
        },
        {
          label: 'Failed',
          data: buckets.map((entry) => entry.failed),
          backgroundColor: 'rgba(226,75,74,0.6)',
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