import React from 'react'
import { Outlet, Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Home, User, Search, MessageSquare, LogOut, Shield } from 'lucide-react'

const DemoLayout = () => {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  if (loading) return <div className="text-base-50">Loading…</div>
  if (!user) return <Navigate to="/login" replace />

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-base-900 text-base-50">
      {/* Header */}
      <header className="border-b border-base-600 bg-base-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-accent-500" />
              <span className="font-semibold text-base-50 tracking-tight">WebShield</span>
              <span className="text-[0.7rem] text-base-500 font-medium tracking-tighter ml-1 uppercase">demo</span>
            </div>
            <div className="flex items-center gap-4">
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
            <Link
              to="/demo/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-base-300 hover:bg-base-700 hover:text-base-50"
            >
              <Home className="w-5 h-5 shrink-0" />
              Dashboard
            </Link>
            <Link
              to="/demo/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-base-300 hover:bg-base-700 hover:text-base-50"
            >
              <User className="w-5 h-5 shrink-0" />
              Profile
            </Link>
            <Link
              to="/demo/search"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-base-300 hover:bg-base-700 hover:text-base-50"
            >
              <Search className="w-5 h-5 shrink-0" />
              Search
            </Link>
            <Link
              to="/demo/contact"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-base-300 hover:bg-base-700 hover:text-base-50"
            >
              <MessageSquare className="w-5 h-5 shrink-0" />
              Contact
            </Link>
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

export default DemoLayout
