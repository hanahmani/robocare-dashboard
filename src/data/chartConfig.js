// Chart and panel configuration data - Static backup for unused dashboard components
export const channelBreakdown = [
  { name: 'Email', value: 450000, label: '450k', percent: 98.2, color: '#3b82f6' },
  { name: 'WhatsApp', value: 550000, label: '550k', percent: 94.1, color: '#10b981' },
  { name: 'SMS', value: 200000, label: '200k', percent: 91.5, color: '#f97316' },
]

export const dashboardStats = {
  total: 1200000,
  totalDelta: '+4.2%',
  sent: 1150000,
  successPct: 95.8,
  failed: 35000,
  failedStatus: 'Critical',
  partial: 15000,
  partialStatus: 'Retry in progress',
  successRate: 95.8,
  successRateTarget: 'Target: 98.0%',
  recipients: 850000,
  recipientsLabel: 'Unique users',
}

export const notificationVolume = [
  { time: '00h', value: 35000 },
  { time: '03h', value: 28000 },
  { time: '06h', value: 42000 },
  { time: '09h', value: 68000 },
  { time: '12h', value: 95000 },
  { time: '15h', value: 88000 },
  { time: '18h', value: 130000 },
  { time: '21h', value: 110000 },
]

export const notificationVolume7d = [
  { time: 'Mon', value: 280000 },
  { time: 'Tue', value: 340000 },
  { time: 'Wed', value: 310000 },
  { time: 'Thu', value: 360000 },
  { time: 'Fri', value: 420000 },
  { time: 'Sat', value: 180000 },
  { time: 'Sun', value: 150000 },
]

export const notificationVolume30d = [
  { time: 'Apr 1', value: 900000 },
  { time: 'Apr 5', value: 1100000 },
  { time: 'Apr 10', value: 980000 },
  { time: 'Apr 15', value: 1250000 },
  { time: 'Apr 20', value: 1400000 },
  { time: 'Apr 25', value: 1200000 },
  { time: 'Apr 29', value: 1350000 },
]

export const notificationVolume3m = [
  { time: 'Feb W1', value: 2800000 },
  { time: 'Feb W2', value: 3200000 },
  { time: 'Feb W3', value: 3000000 },
  { time: 'Feb W4', value: 3500000 },
  { time: 'Mar W1', value: 3800000 },
  { time: 'Mar W2', value: 4100000 },
  { time: 'Mar W3', value: 3900000 },
  { time: 'Mar W4', value: 4300000 },
  { time: 'Apr W1', value: 4500000 },
  { time: 'Apr W2', value: 4800000 },
  { time: 'Apr W3', value: 5100000 },
  { time: 'Apr W4', value: 4900000 },
]

export const successFailureWeek = [
  { day: 'MON', success: 280000, failure: 12000 },
  { day: 'TUE', success: 340000, failure: 18000 },
  { day: 'WED', success: 310000, failure: 14000 },
  { day: 'THU', success: 360000, failure: 16000 },
]

export const criticalErrors = [
  {
    title: 'Email Service Timeout',
    detail: 'SMTP connection timeout on mail.enterprise.com',
    time: '2025-05-18 14:32:18',
  },
  {
    title: 'WhatsApp Rate Limit',
    detail: 'Meta API rate limit exceeded. Retrying in 5 minutes.',
    time: '2025-05-18 14:25:43',
  },
  {
    title: 'Database Connection Error',
    detail: 'Lost connection to notification queue (DB timeout)',
    time: '2025-05-18 14:15:09',
  },
]
