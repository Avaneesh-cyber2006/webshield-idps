import React, { useState, useEffect } from 'react'
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  Lock,
  TrendingUp
} from 'lucide-react'
import api from '../../services/api'
import { useSocket } from '../../contexts/SocketContext'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { socket } = useSocket()

  useEffect(() => {
    fetchStats()

    if (socket) {
      socket.on('metrics:update', fetchStats)
    }

    return () => {
      if (socket) {
        socket.off('metrics:update', fetchStats)
      }
    }
  }, [socket])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/overview')
      setStats(response.data.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-white">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Overview</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Mode:</span>
          <span className="px-3 py-1 bg-accent-600 text-white text-sm font-semibold rounded">
            {stats?.currentMode || 'IDS'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          icon={Activity}
          label="Total Requests"
          value={stats?.totalRequests || 0}
          color="accent"
        />
        <StatCard
          icon={AlertTriangle}
          label="Threats Detected"
          value={stats?.threatsDetected || 0}
          color="warning"
        />
        <StatCard
          icon={ShieldAlert}
          label="Requests Blocked"
          value={stats?.requestsBlocked || 0}
          color="danger"
        />
        <StatCard
          icon={Lock}
          label="Active Blocks"
          value={stats?.activeBlocks || 0}
          color="danger"
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical Threats"
          value={stats?.criticalThreats || 0}
          color="danger"
        />
        <StatCard
          icon={TrendingUp}
          label="Detection Rate"
          value={`${stats?.detectionRate || 0}%`}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
          <div className="space-y-3">
            <StatusItem label="Server Status" status="Online" />
            <StatusItem label="Database" status="Connected" />
            <StatusItem label="IDPS Engine" status="Active" />
            <StatusItem label="Protection" status="Enabled" />
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full bg-accent-600 hover:bg-accent-500 text-white font-semibold py-2 px-4 rounded transition-colors">
              View Live Traffic
            </button>
            <button className="w-full bg-dark-700 hover:bg-dark-600 text-white font-semibold py-2 px-4 rounded transition-colors">
              Run Security Tests
            </button>
            <button className="w-full bg-dark-700 hover:bg-dark-600 text-white font-semibold py-2 px-4 rounded transition-colors">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    accent: 'text-accent-500',
    warning: 'text-warning-500',
    danger: 'text-danger-500',
    success: 'text-success-500'
  }

  return (
    <div className="bg-dark-800 rounded-lg border border-dark-600 p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-6 h-6 ${colorClasses[color]}`} />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}

const StatusItem = ({ label, status }) => {
  const isOnline = status === 'Online' || status === 'Connected' || status === 'Active' || status === 'Enabled'

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-300">{label}</span>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success-500' : 'bg-danger-500'}`} />
        <span className={`text-sm ${isOnline ? 'text-success-500' : 'text-danger-500'}`}>{status}</span>
      </div>
    </div>
  )
}

export default AdminDashboard
