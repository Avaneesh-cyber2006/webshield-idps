import React, { useState, useEffect } from 'react'
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  Lock,
} from 'lucide-react'
import api from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../../contexts/SocketContext'
import { StatCard } from '../../components/ui/StatCard'
import { Section } from '../../components/ui/Section'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

const MODE_CONFIG = {
  MONITOR: { label: 'Monitor', color: 'mode-monitor', description: 'Log only — no detection or prevention' },
  IDS: { label: 'Intrusion Detection', color: 'mode-ids', description: 'Detect, classify, log, and alert — no prevention' },
  IPS: { label: 'Intrusion Prevention', color: 'mode-ips', description: 'Detect, classify, log, alert, and prevent' },
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { socket } = useSocket()

  useEffect(() => {
    fetchStats()

    if (socket) {
      socket.on('metrics:update', fetchStats)
    }

    return () => {
      if (socket) socket.off('metrics:update', fetchStats)
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
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-base-400">Loading overview…</div>
      </div>
    )
  }

  const mode = stats?.currentMode || 'IDS'
  const modeConfig = MODE_CONFIG[mode] || MODE_CONFIG.IDS

  return (
    <div>
      <PageHeader
        title="Security Overview"
        subtitle="Real-time summary of traffic, threats, and protection status"
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-700/50 border border-base-600">
            <span className="text-xs font-medium text-base-400">Mode</span>
            <Badge variant="mode" mode={mode.toLowerCase()}>
              {modeConfig.label}
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Activity}
          label="Total Requests"
          value={stats?.totalRequests || 0}
          variant="accent"
        />
        <StatCard
          icon={AlertTriangle}
          label="Threats Detected"
          value={stats?.threatsDetected || 0}
          variant="warning"
        />
        <StatCard
          icon={ShieldAlert}
          label="Requests Blocked"
          value={stats?.requestsBlocked || 0}
          variant="danger"
        />
        <StatCard
          icon={Lock}
          label="Active Blocks"
          value={stats?.activeBlocks || 0}
          variant="danger"
          trend={stats?.activeBlocks || 0 > 0 ? 12 : 0}
          trendLabel="since last hour"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Section title="System Status">
          <div className="space-y-3">
            <StatusRow
              label="Server"
              status="Online"
              value="Operational"
            />
            <StatusRow
              label="Database"
              status="Connected"
              value="Reachable"
            />
            <StatusRow
              label="IDPS Engine"
              status="Active"
              value="Inspecting traffic"
            />
            <StatusRow
              label="Protection"
              status={mode === 'IPS' ? 'Enabled' : 'Monitoring'}
              value={modeConfig.description}
            />
          </div>
        </Section>

        <Section title="Mode &amp; Detection">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-base-700/50 border border-base-600">
              <div>
                <div className="text-sm font-medium text-base-300">{modeConfig.label}</div>
                <div className="text-xs text-base-500">{modeConfig.description}</div>
              </div>
              <Badge variant="mode" mode={mode.toLowerCase()}>
                {mode}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-base-700/50 border border-base-600">
              <div>
                <div className="text-sm font-medium text-base-300">Detection Rate</div>
                <div className="text-xs text-base-500">Threats ÷ total requests</div>
              </div>
              <span className="text-lg font-bold text-base-50">
                {stats?.detectionRate || 0}%
              </span>
            </div>
          </div>
        </Section>

        <Section title="Quick Actions">
          <div className="space-y-2">
            <Button
              onClick={() => navigate('/admin/live-traffic')}
              className="w-full text-left"
            >
              View Live Traffic
            </Button>
            <Button variant="ghost" onClick={() => navigate('/admin/test-lab')} className="w-full text-left">
              Run Security Tests
            </Button>
            <Button variant="ghost" onClick={() => navigate('/admin/analytics')} className="w-full text-left">
              View Analytics
            </Button>
          </div>
        </Section>
      </div>
    </div>
  )
}

const StatusRow = ({ label, status, value }) => {
  const isPositive =
    status === 'Online' ||
    status === 'Connected' ||
    status === 'Active' ||
    status === 'Enabled'

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-base-700/50 border border-base-600">
      <div className="flex items-center gap-2">
        <span
          className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-status-online' : 'bg-base-500'} animate-pulse`}
        />
        <span className="text-sm font-medium text-base-300">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 text-right">
        <span className="text-xs font-medium">{status}</span>
        <span className="text-xs text-base-500">{value}</span>
      </div>
    </div>
  )
}

export default AdminDashboard
