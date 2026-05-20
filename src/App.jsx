import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import NotificationsPage from './pages/NotificationsPage'
import InboxPage from './pages/InboxPage'
import TemplatesPage from './pages/TemplatesPage'
import ChannelsPage from './pages/ChannelsPage'
import SettingsPage from './pages/SettingsPage'
import SendNotificationPage from './pages/SendWhatsappPage'
import AnalyticsPage from './pages/AnalyticsPage'
import PerformancePage from './pages/PerformancePage'
import ApiTestPage from './pages/ApiTestPage'
import { ToastProvider } from './components/ToastSystem'
import ClientsPage from './pages/ClientsPage'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="send" element={<SendNotificationPage />} />
          <Route path="send-whatsapp" element={<SendNotificationPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="channels" element={<ChannelsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="api-test" element={<ApiTestPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
