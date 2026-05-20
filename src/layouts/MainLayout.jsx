import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Bell,
  Users,
  FileText,
  Share2,
  Settings,
  RefreshCw,
  Send,
  Inbox,
  MoonStar,
  SunMedium,
  BarChart2,
  Activity,
  Terminal,
  ChevronRight,
  Menu,
  Sparkles,
  X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'
import { fetchReceivedWhatsApp } from '../api/Notificationapi'
import roboCareLogoLight from '../assets/robocare-logo-light.svg'
import roboCareLogoDark from '../assets/robocare-logo-dark.svg'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, badge: null },
  { to: '/notifications', label: 'Notifications', icon: Bell, badge: 12 },
  { to: '/send', label: 'Send', icon: Send, badge: null },
  { to: '/inbox', label: 'Inbox', icon: Inbox, badge: null },
  { to: '/clients', label: 'Clients', icon: Users, badge: null },
  { to: '/templates', label: 'Templates', icon: FileText, badge: null },
  { to: '/channels', label: 'Channels', icon: Share2, badge: null },
  { to: '/analytics', label: 'Analytics', icon: BarChart2, badge: null },
  { to: '/performance', label: 'Performance', icon: Activity, badge: null },
  { to: '/api-test', label: 'API Test', icon: Terminal, badge: null },
  { to: '/settings', label: 'Settings', icon: Settings, badge: null },
]

function SidebarItem({ item, isActive, onClick }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-4 py-3 mx-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-brand-50 text-brand-700 shadow-sm shadow-brand-100'
            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
        }`
      }
    >
      <div className={`relative p-1.5 rounded-lg transition-colors ${
        isActive ? 'bg-brand-100' : 'bg-surface-100 group-hover:bg-surface-200'
      }`}>
        <Icon size={18} className={isActive ? 'text-brand-600' : 'text-surface-500'} />
        {item.badge && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-alert-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {item.badge}
          </span>
        )}
      </div>
      <span className="flex-1">{item.label}</span>
      {isActive && <ChevronRight size={14} className="text-brand-400" />}
    </NavLink>
  )
}

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [dark, setDark] = useDarkMode()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [scheduledCount, setScheduledCount] = useState(0)
  const [incomingList, setIncomingList] = useState([])
  const [bellOpen, setBellOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const syncScheduledCount = () => {
      try {
        const queue = JSON.parse(localStorage.getItem('robocare.notificationSchedules') || '[]')
        setScheduledCount(Array.isArray(queue) ? queue.length : 0)
      } catch {
        setScheduledCount(0)
      }
    }

    syncScheduledCount()
    window.addEventListener('storage', syncScheduledCount)
    const timer = window.setInterval(syncScheduledCount, 10000)

    return () => {
      window.removeEventListener('storage', syncScheduledCount)
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const pullIncoming = async () => {
      try {
        const rec = await fetchReceivedWhatsApp()
        if (!cancelled) {
          setIncomingList(Array.isArray(rec) ? rec : [])
        }
      } catch {
        if (!cancelled) {
          setIncomingList([])
        }
      }
    }

    pullIncoming()
    const timer = window.setInterval(pullIncoming, 15000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const current = navItems.find(
    (n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))
  )
  const pageTitle = current?.label || 'Dashboard'
  const notificationCount = incomingList.length > 0 ? incomingList.length : scheduledCount

  return (
    <div className="min-h-screen bg-surface-50 flex relative">
      {/* decorative blobs */}
      <div className="decor-blobs pointer-events-none">
        <div className="blob brand" aria-hidden />
        <div className="blob purple" aria-hidden />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-surface-200/80 
        flex flex-col transition-transform duration-300 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <img
              src={dark ? roboCareLogoDark : roboCareLogoLight}
              alt="RoboCare logo"
              className="h-12 w-auto object-contain"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          <div className="px-4 mb-2">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider px-2">Main Menu</p>
          </div>
          {navItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              item={item} 
              isActive={current?.to === item.to}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-surface-100">
          <div className="bg-gradient-to-br from-brand-50 to-medical-50 rounded-xl p-4 border border-brand-100/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-brand-500" />
              <span className="text-xs font-semibold text-brand-700">System Status</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-medical-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-medical-500"></span>
              </span>
              <span className="text-xs text-surface-600">All systems operational</span>
            </div>
            {!dark && (
              <div className="mt-3 rounded-lg border border-white/70 bg-white/70 p-3">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-surface-400">Logo palette</div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <span className="h-4 w-full rounded-full bg-brand-600" />
                    <span className="text-[10px] text-surface-500">Green</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="h-4 w-full rounded-full bg-medical-500" />
                    <span className="text-[10px] text-surface-500">Leaf</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="h-4 w-full rounded-full bg-alert-500" />
                    <span className="text-[10px] text-surface-500">Red</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="h-4 w-full rounded-full bg-surface-900" />
                    <span className="text-[10px] text-surface-500">Charcoal</span>
                  </div>
                </div>
              </div>
            )}
            <p className="text-[10px] text-surface-400 mt-1.5">
              Last sync: {currentTime.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className={`
          sticky top-0 z-30 px-4 sm:px-8 py-4 flex items-center justify-between transition-all duration-200
          ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-surface-200/50' : 'bg-transparent'}
        `}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-surface-100 rounded-lg text-surface-600"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-surface-900">{pageTitle}</h2>
              <p className="text-sm text-surface-500 hidden sm:block">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            <button
              type="button"
              className="p-2.5 text-surface-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all duration-200 relative"
              aria-label="Open notifications"
              onClick={() => setBellOpen((v) => !v)}
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-alert-500 text-white text-[10px] leading-4 text-center font-bold border border-white">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-12 z-40 w-[320px] rounded-2xl border border-surface-200 bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
                  <p className="text-sm font-semibold text-surface-900">Notifications</p>
                  <button
                    type="button"
                    onClick={() => setBellOpen(false)}
                    className="p-1.5 rounded-md hover:bg-surface-100 text-surface-500"
                    aria-label="Close notifications"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="max-h-72 overflow-auto">
                  {incomingList.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-surface-500">No new incoming messages.</div>
                  ) : (
                    incomingList.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="px-4 py-3 border-b border-surface-100 last:border-b-0">
                        <div className="text-xs font-semibold text-surface-800">
                          {item.from || item.sender || item.recipient || 'Unknown sender'}
                        </div>
                        <div className="text-xs text-surface-500 mt-1 truncate">
                          {item.text || item.body || item.message || 'Incoming message'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-3 border-t border-surface-100 flex items-center justify-between">
                  <span className="text-xs text-surface-500">Scheduled: {scheduledCount}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBellOpen(false)
                      navigate('/notifications')
                    }}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View all
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('robocare:refresh'))}
              className="p-2.5 text-surface-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all duration-200"
              aria-label="Refresh data"
            >
              <RefreshCw size={20} />
            </button>
            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              className="p-2.5 text-surface-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all duration-200"
              aria-label="Toggle theme"
            >
              {dark ? <SunMedium size={20} /> : <MoonStar size={20} />}
            </button>
            <div className="h-6 w-px bg-surface-200 mx-1 hidden sm:block"></div>
            <div className="flex items-center gap-3 pl-1">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-glow">
                AD
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-surface-900">Admin User</p>
                <p className="text-xs text-surface-500">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-8 py-6 overflow-y-auto">
          <div className="page-shell animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
