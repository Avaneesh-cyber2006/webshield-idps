import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Home, User, Search, MessageSquare, LogOut, Shield } from 'lucide-react'

const DemoLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-accent-500 mr-3" />
              <span className="text-xl font-bold text-white">WebShield Demo</span>
            </div>
            <div className="flex items-center space-x-4">
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
          <nav className="p-4 space-y-2">
            <Link
              to="/demo/dashboard"
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-dark-700 hover:text-white rounded-lg transition-colors"
            >
              <Home className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link
              to="/demo/profile"
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-dark-700 hover:text-white rounded-lg transition-colors"
            >
              <User className="w-5 h-5 mr-3" />
              Profile
            </Link>
            <Link
              to="/demo/search"
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-dark-700 hover:text-white rounded-lg transition-colors"
            >
              <Search className="w-5 h-5 mr-3" />
              Search
            </Link>
            <Link
              to="/demo/contact"
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-dark-700 hover:text-white rounded-lg transition-colors"
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              Contact
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DemoLayout
