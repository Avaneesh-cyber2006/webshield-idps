import React, { useEffect } from 'react'
import { Outlet, Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import api from '../services/api'
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  ShieldAlert,
  Shield,
  Settings,
  FlaskConical,
  FileText,
  Network,
  Lock,
  LogOut,
} from 'lucide-react'

const AdminLayout = () => {
  const { user, loading, logout } = useAuth()
  const { connected, joinAdminRoom, leaveAdminRoom } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (loading || user?.role !== 'admin') return
    let active = true
    const joinRoom = async () => {
      try {
        const response = await api.get('/auth/socket-token')
        if (active && connected) joinAdminRoom(response.data.token)
      } catch (error) {
        console.error('Failed to get socket token:', error)
      }
    }
    joinRoom()
    return () => { active = false; leaveAdminRoom() }
  }, [joinAdminRoom, leaveAdminRoom, connected, loading, user?.role])

  if (loading) return <div className="text-base-50">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/demo/dashboard" replace />

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const menuItems = [
    { path: '/admin/overview', icon: LayoutDashboard, label: 'Overview' },
    { path: '/admin/live-traffic', icon: Activity, label: 'Live Traffic' },
    { path: '/admin/threat-events', icon: AlertTriangle, label: 'Threat Events' },
    { path: '/admin/blocked-sources', icon: ShieldAlert, label: 'Blocked Sources' },
    { path: '/admin/security-rules', icon: Lock, label: 'Security Rules' },
    { path: '/admin/analytics', icon: FileText, label: 'Analytics' },
    { path: '/admin/test-lab', icon: FlaskConical, label: 'Test Lab' },
    { path: '/admin/system-logs', icon: FileText, label: 'System Logs' },
    { path: '/admin/network-demo', icon: Network, label: 'Network Demo' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-base-900 text-base-50">
      {/* Header */}
      <header className="border-b border-base-600 bg-base-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-accent-500" />
              <div>
                <span className="font-semibold text-base-50 tracking-tight">WebShield</span>
                <span className="text-[0.7rem] text-base-500 font-medium tracking-tighter ml-1 uppercase">admin</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    connected
                      ? 'bg-status-online/10 text-status-online border border-status-online/20'
                      : 'bg-base-400/10 text-base-400 border border-base-600/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      connected ? 'bg-status-online' : 'bg-base-400'
                    } animate-pulse`}
                  />
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <span className="text-sm text-base-300 hidden sm:inline">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-base-400 hover:text-base-50 hover:bg-base-700 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-base-600 bg-base-800 flex-shrink-0 hidden lg:block">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-accent-500/10 text-accent-400 border border-accent-500/20'
                      : 'text-base-300 hover:bg-base-700 hover:text-base-50'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
