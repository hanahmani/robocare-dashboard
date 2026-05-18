import { useEffect, useState } from 'react'
import {
  getSentNotifications,
  getReceivedNotifications,
  getEmails
} from '../services/notificationService'

import StatCard from '../components/StatCard'
import RecentNotificationsTable from '../components/RecentNotificationsTable'

export default function DashboardPage() {

  const [sent, setSent] = useState([])
  const [received, setReceived] = useState([])
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const sentData = await getSentNotifications()
      const receivedData = await getReceivedNotifications()
      const emailData = await getEmails()

      setSent(sentData)
      setReceived(receivedData)
      setEmails(emailData)

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const whatsappCount = sent.filter(n => n.type === 'WHATSAPP').length
  const emailCount = sent.filter(n => n.type === 'EMAIL').length
  const failedCount = sent.filter(n => n.status === 'FAILED').length
  const criticalErrors = sent.filter(n => n.status === 'FAILED' && n.errorMessage).slice(0, 5)

  if (loading) {
    return (
      <div className="text-white text-xl">
        Chargement du dashboard...
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-white">
          RoboCare Notification Center
        </h1>

        <p className="text-gray-400 mt-2">
          Monitoring temps réel des notifications WhatsApp et Email
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <StatCard
          title="Notifications envoyées"
          value={sent.length}
        />

        <StatCard
          title="Messages WhatsApp"
          value={whatsappCount}
        />

        <StatCard
          title="Emails"
          value={emailCount}
        />

        <StatCard
          title="Erreurs"
          value={failedCount}
        />

      </div>

      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">

        <h2 className="text-xl font-semibold text-white mb-4">
          Dernières notifications
        </h2>

        <RecentNotificationsTable notifications={sent} />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h2 className="text-white text-xl font-semibold mb-4">
            Réponses WhatsApp
          </h2>

          <div className="space-y-3 max-h-[400px] overflow-auto">

            {received.map(item => (
              <div
                key={item.id}
                className="bg-slate-800 p-4 rounded-lg"
              >
                <div className="text-white font-medium">
                  {item.sender}
                </div>

                <div className="text-gray-400 text-sm mt-1">
                  {item.message}
                </div>
              </div>
            ))}

          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">

          <h2 className="text-white text-xl font-semibold mb-4">
            Emails reçus
          </h2>

          <div className="space-y-3 max-h-[400px] overflow-auto">

            {emails.map(email => (
              <div
                key={email.id}
                className="bg-slate-800 p-4 rounded-lg"
              >
                <div className="text-white font-medium">
                  {email.fromEmail}
                </div>

                <div className="text-gray-400 text-sm mt-1">
                  {email.subject}
                </div>
              </div>
            ))}

          </div>

        </div>

      </div>

      {criticalErrors.length > 0 && (
        <div className="bg-red-900/20 rounded-xl p-6 border border-red-800">
          <h2 className="text-red-400 text-xl font-semibold mb-4">
            Erreurs critiques ({failedCount})
          </h2>
          <div className="space-y-3 max-h-[300px] overflow-auto">
            {criticalErrors.map(error => (
              <div
                key={error.id}
                className="bg-red-950 p-4 rounded-lg border border-red-800"
              >
                <div className="text-red-200 font-medium text-sm">
                  {error.recipient} • {error.type}
                </div>
                <div className="text-red-400 text-xs mt-1">
                  {error.errorMessage}
                </div>
                {error.timestamp && (
                  <div className="text-red-500/60 text-xs mt-2">
                    {error.timestamp}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
