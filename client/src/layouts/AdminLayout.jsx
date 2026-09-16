import React, { useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import api from '../services/api'
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  ShieldAlert,
  Settings,
  FlaskConical,
  FileText,
  Network,
  Lock,
  LogOut,
  Shield
} from 'lucide-react'

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const { connected, joinAdminRoom, leaveAdminRoom } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const joinRoom = async () => {
      try {
        const response = await api.get('/auth/socket-token')
        joinAdminRoom(response.data.token)
      } catch (error) {
        console.error('Failed to get socket token:', error)
      }
    }
    joinRoom()
    return () => leaveAdminRoom()
  }, [joinAdminRoom, leaveAdminRoom])

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
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-600">
        <div className="max-w-full mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-accent-500 mr-3" />
              <span className="text-xl font-bold text-white">WebShield Admin</span>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success-500' : 'bg-danger-500'}`} />
                <span className="text-sm text-gray-400">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <span className="text-gray-300">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-dark-800 border-r border-dark-600 min-h-screen">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-accent-600 text-white'
                      : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
