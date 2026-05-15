// Données mockées - À remplacer par des appels au microservice Spring Boot
// Endpoint Spring Boot: /api/notifications/stats, /api/notifications, etc.

export const dashboardStats = {
  total: '1.2M',
  totalDelta: '+4.2%',
  success: '1.15M',
  successPct: 95.8,
  failed: '35k',
  failedStatus: 'Critical',
  partial: '15k',
  partialStatus: 'Retry in progress',
  successRate: '95.8%',
  successRateTarget: 'Target: 98.0%',
  recipients: '850k',
  recipientsLabel: 'Unique users',
}

export const channelBreakdown = [
  { name: 'Email', value: 450000, label: '450k', percent: 98.2, color: '#3b82f6' },
  { name: 'WhatsApp', value: 550000, label: '550k', percent: 94.1, color: '#10b981' },
  { name: 'SMS', value: 200000, label: '200k', percent: 91.5, color: '#f97316' },
  { name: 'Push', value: 120000, label: '120k', percent: 96.7, color: '#a855f7' },
]

// Notification volume — 4 time ranges
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

export const recentNotifications = [
  {
    id: '98234-AX',
    initials: 'JD',
    recipient: 'john.doe@enterprise.com',
    channel: 'Email',
    status: 'Sent',
    timestamp: '2 mins ago',
  },
  {
    id: '77211-B6',
    initials: 'SM',
    recipient: '+1 415-555-0123',
    channel: 'WhatsApp',
    status: 'Failed',
    timestamp: '5 mins ago',
  },
  {
    id: '65112-CZ',
    initials: 'AK',
    recipient: '+44 7700 900012',
    channel: 'SMS',
    status: 'Partial',
    timestamp: '12 mins ago',
  },
  {
    id: '44109-DD',
    initials: 'LW',
    recipient: 'lisa.wong@techcorp.io',
    channel: 'Email',
    status: 'Sent',
    timestamp: '18 mins ago',
  },
]

export const criticalErrors = [
  {
    title: 'Provider Timeout: Twilio SMS',
    detail: 'Recipient: +1 415-555-0123',
    time: '14:22:10 UTC',
  },
  {
    title: 'Invalid Email: Domain Blocked',
    detail: 'Recipient: admin@spammy.xyz',
    time: '14:18:45 UTC',
  },
  {
    title: 'WhatsApp Template Mismatch',
    detail: 'Recipient: +44 7700 900551',
    time: '14:15:30 UTC',
  },
  {
    title: 'Rate Limit Exceeded: Tier 1',
    detail: 'System-wide / Broadcast',
    time: '14:02:11 UTC',
  },
  {
    title: 'SSL Handshake Failure',
    detail: 'Recipient: secure.api.endpoint',
    time: '13:55:04 UTC',
  },
]

// Liste complète des notifications (page Notifications)
export const allNotifications = [
  ...recentNotifications,
  {
    id: '33098-EF',
    initials: 'MR',
    recipient: 'maria.rossi@example.it',
    channel: 'WhatsApp',
    status: 'Sent',
    timestamp: '25 mins ago',
  },
  {
    id: '22045-GH',
    initials: 'TY',
    recipient: '+216 22 555 010',
    channel: 'SMS',
    status: 'Sent',
    timestamp: '32 mins ago',
  },
  {
    id: '11876-IJ',
    initials: 'KH',
    recipient: 'karim.hbiri@robocare.tn',
    channel: 'Email',
    status: 'Sent',
    timestamp: '45 mins ago',
  },
  {
    id: '10234-KL',
    initials: 'YS',
    recipient: 'yosr.ben@robocare.tn',
    channel: 'Push',
    status: 'Failed',
    timestamp: '1 hr ago',
  },
]

// Recipients (page Recipients)
export const recipients = [
  {
    id: 'U-1001',
    name: 'John Doe',
    email: 'john.doe@enterprise.com',
    phone: '+1 415-555-0123',
    channels: ['Email', 'SMS'],
    lastActive: '2 mins ago',
  },
  {
    id: 'U-1002',
    name: 'Sarah Miller',
    email: 'sarah.m@techcorp.io',
    phone: '+1 415-555-0145',
    channels: ['WhatsApp', 'Email'],
    lastActive: '15 mins ago',
  },
  {
    id: 'U-1003',
    name: 'Karim Hbiri',
    email: 'karim.hbiri@robocare.tn',
    phone: '+216 20 555 010',
    channels: ['Email', 'SMS', 'Push'],
    lastActive: '1 hr ago',
  },
  {
    id: 'U-1004',
    name: 'Lisa Wong',
    email: 'lisa.wong@techcorp.io',
    phone: '+44 7700 900012',
    channels: ['Email'],
    lastActive: '3 hrs ago',
  },
  {
    id: 'U-1005',
    name: 'Maria Rossi',
    email: 'maria.rossi@example.it',
    phone: '+39 333 555 0102',
    channels: ['WhatsApp'],
    lastActive: '1 day ago',
  },
]

// Templates (page Templates)
export const templates = [
  {
    id: 'TPL-001',
    name: 'Crop Alert - Critical',
    channel: 'SMS',
    language: 'FR',
    updated: '2 days ago',
    status: 'Active',
    content: 'Alerte critique détectée sur votre parcelle. Veuillez intervenir immédiatement.',
  },
  {
    id: 'TPL-002',
    name: 'Weekly Field Report',
    channel: 'Email',
    language: 'FR',
    updated: '5 days ago',
    status: 'Active',
    content: 'Bonjour, voici le rapport hebdomadaire de votre champ. Consultez les données ci-jointes.',
  },
  {
    id: 'TPL-003',
    name: 'Irrigation Reminder',
    channel: 'WhatsApp',
    language: 'FR',
    updated: '1 week ago',
    status: 'Active',
    content: 'Rappel : votre programme d\'irrigation est prévu pour aujourd\'hui. Vérifiez votre système.',
  },
  {
    id: 'TPL-004',
    name: 'Welcome Email',
    channel: 'Email',
    language: 'EN',
    updated: '2 weeks ago',
    status: 'Active',
    content: 'Welcome to RoboCare! Your account is now active. Start monitoring your fields today.',
  },
  {
    id: 'TPL-005',
    name: 'Sensor Failure Alert',
    channel: 'Push',
    language: 'EN',
    updated: '3 weeks ago',
    status: 'Draft',
    content: 'Sensor failure detected. Please check your device and reconnect.',
  },
]

// Channels (page Channels)
export const channelsConfig = [
  {
    id: 'ch-email',
    name: 'Email',
    provider: 'JavaMail / SMTP',
    status: 'Operational',
    sent24h: '450k',
    successRate: '98.2%',
  },
  {
    id: 'ch-whatsapp',
    name: 'WhatsApp',
    provider: 'Meta Business API',
    status: 'Operational',
    sent24h: '550k',
    successRate: '94.1%',
  },
  {
    id: 'ch-sms',
    name: 'SMS',
    provider: 'Orange API (Tunisie)',
    status: 'Degraded',
    sent24h: '200k',
    successRate: '91.5%',
  },
  {
    id: 'ch-push',
    name: 'Push',
    provider: 'Firebase FCM',
    status: 'Operational',
    sent24h: '120k',
    successRate: '96.7%',
  },
]
