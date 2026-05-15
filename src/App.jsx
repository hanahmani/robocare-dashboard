import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/DashboardPage'
import NotificationsPage from './pages/NotificationsPage'
import RecipientsPage from './pages/RecipientsPage'
import TemplatesPage from './pages/TemplatesPage'
import ChannelsPage from './pages/ChannelsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="recipients" element={<RecipientsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="channels" element={<ChannelsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
