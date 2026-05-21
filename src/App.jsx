import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import NotificationsPage from './pages/NotificationsPage'
import InboxPage from './pages/InboxPage'
import TemplatesPage from './pages/TemplatesPage'
import ChannelsPage from './pages/ChannelsPage'
import SettingsPage from './pages/SettingsPage'
import SendPage from './pages/SendPage'
import SendNotificationPage from './pages/SendWhatsappPage'
import RecipientsPage from './pages/RecipientsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import PerformancePage from './pages/PerformancePage'
import APITestPage from './pages/APITestPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="send" element={<SendPage />} />
        <Route path="send-whatsapp" element={<SendNotificationPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="recipients" element={<RecipientsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="channels" element={<ChannelsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="api-test" element={<APITestPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
