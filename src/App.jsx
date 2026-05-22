import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/LoginPage'
import VerifyPage from './pages/VerifyPage'
import Dashboard from './pages/Dashboard'
import NotificationsPage from './pages/NotificationsPage'
import HistoryPage from './pages/HistoryPage'
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
import UsersPage from './pages/UsersPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  return user?.role === 'ADMIN' ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="send" element={<SendPage />} />
        <Route path="send-whatsapp" element={<SendNotificationPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="recipients" element={<RecipientsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="channels" element={<ChannelsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="api-test" element={<APITestPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
      </Route>
    </Routes>
  )
}
