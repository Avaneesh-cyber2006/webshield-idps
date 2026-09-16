import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Search from './pages/Search'
import Contact from './pages/Contact'
import AdminDashboard from './pages/admin/Dashboard'
import LiveTraffic from './pages/admin/LiveTraffic'
import ThreatEvents from './pages/admin/ThreatEvents'
import BlockedSources from './pages/admin/BlockedSources'
import SecurityRules from './pages/admin/SecurityRules'
import Analytics from './pages/admin/Analytics'
import TestLab from './pages/admin/TestLab'
import SystemLogs from './pages/admin/SystemLogs'
import Settings from './pages/admin/Settings'
import NetworkDemo from './pages/admin/NetworkDemo'
import AdminLayout from './layouts/AdminLayout'
import DemoLayout from './layouts/DemoLayout'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Demo application routes */}
            <Route path="/demo" element={<DemoLayout />}>
              <Route index element={<Navigate to="/demo/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="search" element={<Search />} />
              <Route path="contact" element={<Contact />} />
            </Route>

            {/* Admin dashboard routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/overview" replace />} />
              <Route path="overview" element={<AdminDashboard />} />
              <Route path="live-traffic" element={<LiveTraffic />} />
              <Route path="threat-events" element={<ThreatEvents />} />
              <Route path="blocked-sources" element={<BlockedSources />} />
              <Route path="security-rules" element={<SecurityRules />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="test-lab" element={<TestLab />} />
              <Route path="system-logs" element={<SystemLogs />} />
              <Route path="settings" element={<Settings />} />
              <Route path="network-demo" element={<NetworkDemo />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
