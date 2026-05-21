import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Avatar, Badge, Button, Card, Progress, Table, Typography } from 'antd'
import { MailOutlined, MessageOutlined, ReloadOutlined, WhatsAppOutlined } from '@ant-design/icons'
import {
  BarElement, CategoryScale, Chart as ChartJS, Filler,
  Legend, LineElement, LinearScale, PointElement, Tooltip,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import {
  Cell as RCell, Legend as RLegend, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip,
} from 'recharts'
import { Activity, Zap } from 'lucide-react'
import {
  fetchHealth, fetchSentNotifications, computeStats,
  buildVolumeByDay, buildVolumeByHour, buildVolumeByMonth,
  buildVolumeBy6Months, buildVolumeByYear, normalizeNotification,
} from '../api/Notificationapi'
import { useTheme } from '../context/ThemeContext'
import styles from './Dashboard.module.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler)

const CHANNEL_COLORS = {
  EMAIL: '#185FA5',
  WHATSAPP: '#1D9E75',
  SMS: '#BA7517',
}

const DONUT_COLORS = { Email: '#185FA5', SMS: '#BA7517', WhatsApp: '#1D9E75' }

const STATUS_BADGE_MAP = {
  SENT: 'success', FAILED: 'error', PARTIAL: 'warning', PENDING: 'processing',
}
const STATUS_LABELS = { SENT: 'Sent', FAILED: 'Failed', PARTIAL: 'Partial', PENDING: 'Pending' }

export default function Dashboard() {
  const [allNotifications, setAllNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [healthOnline, setHealthOnline] = useState(false)
  const [volumeMode, setVolumeMode] = useState('24h')
  const [liveRefresh, setLiveRefresh] = useState(true)
  const [lastRefreshTime, setLastRefreshTime] = useState('--:--:--')
  const [responseTime, setResponseTime] = useState(null)
  const hasLoadedRef = useRef(false)
  const intervalRef = useRef(null)
  const { dark } = useTheme()

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      if (!hasLoadedRef.current) setLoading(true)
      else setRefreshing(true)
    }
    const t0 = Date.now()
    try {
      const notifications = await fetchSentNotifications()
      const raw = Array.isArray(notifications) ? notifications : []
      setAllNotifications(raw)
      setError('')
      setResponseTime(Date.now() - t0)
      setLastRefreshTime(
        new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
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
      try { await fetchHealth(); setHealthOnline(true) }
      catch { setHealthOnline(false) }
    }
    checkHealth()
  }, [loadData])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (liveRefresh) {
      intervalRef.current = window.setInterval(() => loadData({ silent: true }), 30_000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [liveRefresh, loadData])

  const stats = useMemo(() => {
    const base = computeStats(allNotifications)
    return {
      ...base,
      failedErrors: base.failedWithErrors || [],
      unique: new Set(allNotifications.map((n) => n.recipient).filter(Boolean)).size,
    }
  }, [allNotifications])

  const channelCounts = stats.byType || { EMAIL: 0, SMS: 0, WHATSAPP: 0 }

  /* ── Today KPI stats ─────────────────────────────────────────── */
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayNots = allNotifications.filter((n) => {
      const d = new Date(n.sentAt || n.createdAt)
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === today
    })
    const total = todayNots.length
    const sent = todayNots.filter((n) => n.status === 'SENT').length
    const failed = todayNots.filter((n) => n.status === 'FAILED').length
    const rate = total > 0 ? ((sent / total) * 100).toFixed(1) : '0.0'
    const counts = { EMAIL: 0, SMS: 0, WHATSAPP: 0 }
    todayNots.forEach((n) => {
      const ch = String(n.type || '').toUpperCase()
      if (counts[ch] !== undefined) counts[ch]++
    })
    const mostUsed = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'EMAIL'
    return { total, sent, failed, rate, counts, mostUsed }
  }, [allNotifications])

  /* ── Insights text ───────────────────────────────────────────── */
  const insights = useMemo(() => {
    const lines = []
    const failRate = stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : '0.0'
    lines.push(`Failure rate is under control at ${failRate}%.`)
    const top = Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0]
    if (top && top[1] > 0) {
      const lbl = top[0] === 'EMAIL' ? 'Email' : top[0] === 'WHATSAPP' ? 'WhatsApp' : 'SMS'
      lines.push(`Most used channel is ${lbl} with ${top[1]} notifications.`)
    }
    if (todayStats.total === 0) {
      lines.push('No traffic recorded today. The dashboard will adapt once new events arrive.')
    } else {
      lines.push(`${todayStats.total} notification${todayStats.total > 1 ? 's' : ''} processed today.`)
    }
    return lines
  }, [stats, channelCounts, todayStats])

  /* ── Donut chart data ────────────────────────────────────────── */
  const donutData = useMemo(() => {
    const raw = [
      { name: 'Email', value: channelCounts.EMAIL || 0 },
      { name: 'SMS', value: channelCounts.SMS || 0 },
      { name: 'WhatsApp', value: channelCounts.WHATSAPP || 0 },
    ].filter((d) => d.value > 0)
    return raw.length > 0 ? raw : [
      { name: 'Email', value: 1 },
      { name: 'SMS', value: 1 },
      { name: 'WhatsApp', value: 1 },
    ]
  }, [channelCounts])

  /* ── Recent rows ─────────────────────────────────────────────── */
  const recentRows = useMemo(
    () =>
      [...allNotifications]
        .sort((a, b) => new Date(b.sentAt || b.createdAt) - new Date(a.sentAt || a.createdAt))
        .slice(0, 8)
        .map((n) => normalizeNotification(n)),
    [allNotifications],
  )

  /* ── Volume chart ────────────────────────────────────────────── */
  const volumeDataset = useMemo(() => {
    const srcMap = {
      '24h': buildVolumeByHour,
      '7d': buildVolumeByDay,
      '1m': buildVolumeByMonth,
      '6m': buildVolumeBy6Months,
      '1y': buildVolumeByYear,
    }
    const source = (srcMap[volumeMode] || buildVolumeByDay)(allNotifications)
    return {
      labels: source.map((d) => d.time),
      datasets: [{
        label: 'Notifications',
        data: source.map((d) => d.value),
        borderColor: '#2d7a1f',
        backgroundColor: 'rgba(45,122,31,0.08)',
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        borderWidth: 2,
      }],
    }
  }, [allNotifications, volumeMode])

  /* ── Success vs failure ──────────────────────────────────────── */
  const successFailureDataset = useMemo(() => {
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return {
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' }),
        success: 0,
        failed: 0,
      }
    })
    allNotifications.forEach((n) => {
      const d = new Date(n.sentAt || n.createdAt)
      if (Number.isNaN(d.getTime())) return
      const b = buckets.find((e) => e.key === d.toISOString().slice(0, 10))
      if (!b) return
      if (n.status === 'FAILED') b.failed++
      else if (n.status === 'SENT') b.success++
    })
    return {
      labels: buckets.map((e) => e.label),
      datasets: [
        { label: 'Success', data: buckets.map((e) => e.success), backgroundColor: 'rgba(45,122,31,0.7)', borderRadius: 6 },
        { label: 'Failed', data: buckets.map((e) => e.failed), backgroundColor: 'rgba(226,75,74,0.6)', borderRadius: 6 },
      ],
    }
  }, [allNotifications])

  /* ── Chart options ───────────────────────────────────────────── */
  const chartText = dark ? '#94a3b8' : '#6b7280'
  const chartGrid = dark ? '#334155' : '#f0f0f0'

  const volumeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } },
    scales: {
      x: { grid: { display: false }, ticks: { color: chartText }, border: { color: chartGrid } },
      y: { beginAtZero: true, ticks: { precision: 0, color: chartText }, grid: { color: chartGrid }, border: { color: 'transparent' } },
    },
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: chartText, boxWidth: 12, padding: 14 } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: chartText }, border: { color: chartGrid } },
      y: { beginAtZero: true, ticks: { precision: 0, color: chartText }, grid: { color: chartGrid }, border: { color: 'transparent' } },
    },
  }

  const getMostUsedLabel = (ch) =>
    ch === 'EMAIL' ? 'Email' : ch === 'WHATSAPP' ? 'WhatsApp' : 'SMS'
  const failRateToday = todayStats.total > 0
    ? ((todayStats.failed / todayStats.total) * 100).toFixed(1)
    : '0.0'

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {error && (
        <Alert className={styles.errorBanner} type="error" showIcon
          message="Unable to refresh notifications" description={error} />
      )}

      {/* ── Hero section ──────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroLabel}>SMART OVERVIEW</div>
          <h1 className={styles.heroTitle}>
            Operational pulse for the<br />notification platform
          </h1>
          <p className={styles.heroSubtitle}>
            Live updates, performance checks, and actionable guidance for the support team.
          </p>
        </div>
        <div className={styles.heroActions}>
          <Button
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={() => loadData()}
            size="middle"
          >
            Refresh
          </Button>
          <Button
            type={liveRefresh ? 'primary' : 'default'}
            icon={<Zap className={styles.zapIcon} />}
            onClick={() => setLiveRefresh((v) => !v)}
            size="middle"
          >
            Live refresh {liveRefresh ? 'on' : 'off'}
          </Button>
        </div>
      </div>

      {/* ── 4 KPI cards ───────────────────────────────────────── */}
      <div className={styles.kpiGrid}>
        <KpiCard
          title="TODAY TOTAL"
          value={todayStats.total}
          desc="Notifications sent today"
          color="#185FA5"
        />
        <KpiCard
          title="SUCCESS RATE"
          value={`${todayStats.rate}%`}
          desc="Same-day delivery performance"
          color="#6b7280"
        />
        <KpiCard
          title="FAILED NOTIFICATIONS"
          value={todayStats.failed}
          desc={`Failure rate ${failRateToday}%`}
          color="#791F1F"
        />
        <KpiCard
          title="MOST USED CHANNEL"
          value={getMostUsedLabel(todayStats.mostUsed)}
          desc={`${todayStats.counts[todayStats.mostUsed] || 0} message(s) today`}
          color="#1D9E75"
          large
        />
      </div>

      {/* ── 3-panel row ───────────────────────────────────────── */}
      <div className={styles.triPanel}>
        {/* Insights */}
        <div className={styles.triCard}>
          <div className={styles.triHeader}>
            <Activity className={styles.triIcon} />
            <span>Insights panel</span>
          </div>
          {insights.map((line, i) => (
            <p key={i} className={styles.insightLine}>{line}</p>
          ))}
        </div>

        {/* Channel distribution donut */}
        <div className={styles.triCard}>
          <div className={styles.triHeader}>
            <span>Channel distribution</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="46%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {donutData.map((entry) => (
                  <RCell key={entry.name} fill={DONUT_COLORS[entry.name] || '#999'} />
                ))}
              </Pie>
              <RTooltip />
              <RLegend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance */}
        <div className={styles.triCard}>
          <div className={styles.triHeader}>
            <span>Performance panel</span>
          </div>
          <div className={styles.perfList}>
            <div className={styles.perfRow}>
              <span className={styles.perfKey}>API status</span>
              <span className={`${styles.perfVal} ${healthOnline ? styles.online : styles.offline}`}>
                <span className={styles.dot} />
                {healthOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className={styles.perfRow}>
              <span className={styles.perfKey}>Response time</span>
              <span className={styles.perfVal}>
                {responseTime != null ? `${responseTime} ms` : '—'}
              </span>
            </div>
            <div className={styles.perfRow}>
              <span className={styles.perfKey}>Last refresh</span>
              <span className={styles.perfVal}>{lastRefreshTime}</span>
            </div>
            <div className={styles.perfRow}>
              <span className={styles.perfKey}>Tracked recipients</span>
              <span className={styles.perfVal}>{stats.unique}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Volume + right panels ─────────────────────────────── */}
      <div className={styles.contentGrid}>
        <section className={styles.leftColumn}>
          {/* Notification volume */}
          <Card
            title="Notification volume"
            extra={
              <div className={styles.toggleGroup}>
                {[
                  { k: '24h', l: '24h' }, { k: '7d', l: '7j' },
                  { k: '1m', l: '1 mo' }, { k: '6m', l: '6 mo' }, { k: '1y', l: '1 an' },
                ].map(({ k, l }) => (
                  <Button key={k} size="small"
                    type={volumeMode === k ? 'primary' : 'default'}
                    onClick={() => setVolumeMode(k)}
                  >
                    {l}
                  </Button>
                ))}
              </div>
            }
            className={styles.panelCard}
          >
            <div className={styles.chartBox}>
              <Line data={volumeDataset} options={volumeOptions} />
            </div>
          </Card>

          {/* Recent notifications */}
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
          {/* Channel breakdown */}
          <Card title="Channel breakdown" className={styles.panelCard}>
            <div className={styles.channelList}>
              {['EMAIL', 'WHATSAPP', 'SMS'].map((ch) => {
                const value = channelCounts[ch] || 0
                const pct = stats.total > 0 ? Math.round((value / stats.total) * 100) : 0
                return (
                  <div key={ch} className={styles.channelRow}>
                    <div className={styles.channelHeader}>
                      <span>{ch === 'EMAIL' ? 'Email' : ch === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}</span>
                      <span>{pct}%</span>
                    </div>
                    <Progress
                      percent={pct}
                      showInfo={false}
                      strokeColor={CHANNEL_COLORS[ch]}
                      trailColor={dark ? '#334155' : '#eef2f7'}
                    />
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Critical errors */}
          <Card title="Critical errors" className={`${styles.panelCard} ${styles.criticalCard}`}>
            <div className={styles.criticalList}>
              {stats.failedErrors.length > 0 ? (
                stats.failedErrors.map((e, i) => (
                  <div key={`${e.title}-${i}`} className={styles.criticalItem}>
                    <div className={styles.criticalTitle}>{e.title}</div>
                    <div className={styles.criticalDetail}>{e.detail}</div>
                    <div className={styles.criticalTime}>{e.time}</div>
                    <div className={styles.criticalError}>{e.error}</div>
                  </div>
                ))
              ) : (
                <Typography.Text type="secondary">No critical errors found.</Typography.Text>
              )}
            </div>
          </Card>

          {/* Success vs failure */}
          <Card title="Success vs failure" className={styles.panelCard}>
            <div className={styles.chartBoxSmall}>
              <Bar data={successFailureDataset} options={barOptions} />
            </div>
          </Card>

          {/* API health */}
          <Card className={styles.healthCard}>
            <div className={styles.healthRow}>
              <Badge status={healthOnline ? 'success' : 'error'} />
              <div>
                <div className={styles.healthLabel}>
                  {healthOnline ? 'API connected' : 'API offline'}
                </div>
                <div className={styles.healthMeta}>RoboCare Service</div>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

/* ── KPI card component ─────────────────────────────────────────── */
function KpiCard({ title, value, desc, color, large = false }) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiBlobWrap} style={{ color }}>
        <svg viewBox="0 0 90 90" className={styles.kpiBlob}>
          <circle cx="55" cy="30" r="28" fill="currentColor" opacity="0.18" />
          <circle cx="67" cy="52" r="20" fill="currentColor" opacity="0.14" />
          <circle cx="46" cy="48" r="16" fill="currentColor" opacity="0.14" />
        </svg>
      </div>
      <div className={styles.kpiTitle}>{title}</div>
      <div className={`${styles.kpiValue} ${large ? styles.kpiValueLg : ''}`}>
        {value}
      </div>
      <div className={styles.kpiDesc}>{desc}</div>
    </div>
  )
}

/* ── Table columns ──────────────────────────────────────────────── */
const recentColumns = [
  {
    title: 'Recipient',
    dataIndex: 'recipient',
    key: 'recipient',
    render: (_, n) => {
      const initials = getInitials(n.recipient)
      return (
        <div className={styles.recipientCell}>
          <Avatar className={styles.recipientAvatar} style={{ backgroundColor: getAvatarColor(n.recipient) }}>
            {initials}
          </Avatar>
          <div>
            <div className={styles.recipientPrimary}>{n.recipient || 'Unknown recipient'}</div>
            <div className={styles.recipientSecondary}>ID {n.id}</div>
          </div>
        </div>
      )
    },
  },
  {
    title: 'Channel',
    dataIndex: 'channel',
    key: 'channel',
    render: (_, n) => {
      const ch = String(n.type || '').toUpperCase()
      const cfg = getChannelConfig(ch)
      const Icon = cfg.icon
      return (
        <div className={styles.channelCell}>
          <Icon style={{ color: cfg.color }} />
          <span>{cfg.label}</span>
        </div>
      )
    },
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (_, n) => {
      const s = String(n.status || 'PENDING').toUpperCase()
      return <Badge status={STATUS_BADGE_MAP[s] || 'default'} text={STATUS_LABELS[s] || s} />
    },
  },
  {
    title: 'Timestamp',
    dataIndex: 'timestamp',
    key: 'timestamp',
    render: (_, n) => formatTimestamp(n.sentAt || n.createdAt),
  },
]

/* ── Helpers ────────────────────────────────────────────────────── */
function getChannelConfig(channel) {
  if (channel === 'SMS') return { label: 'SMS', color: '#BA7517', icon: MessageOutlined }
  if (channel === 'WHATSAPP') return { label: 'WhatsApp', color: '#1D9E75', icon: WhatsAppOutlined }
  return { label: 'Email', color: '#185FA5', icon: MailOutlined }
}

function formatTimestamp(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function getInitials(recipient = '') {
  const text = String(recipient)
    .replace(/[+\d\s-]/g, '')
    .split(/[@.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
  return text || recipient.slice(0, 2).toUpperCase() || '??'
}

function getAvatarColor(recipient = '') {
  const palette = ['#185FA5', '#1D9E75', '#BA7517', '#791F1F', '#5A67D8', '#0F766E']
  const hash = String(recipient).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return palette[hash % palette.length]
}
