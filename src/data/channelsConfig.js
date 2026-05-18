// Channel configuration - Static data for RoboCare notification microservice
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
]
