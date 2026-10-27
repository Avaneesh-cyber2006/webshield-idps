import React, { useState, useEffect } from 'react'
import { Server, Laptop, Smartphone, Wifi, RouterIcon } from 'lucide-react'
import api from '../../services/api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Section } from '../../components/ui/Section'
import { StatusIndicator } from '../../components/ui/StatusIndicator'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { useSocket } from '../../contexts/SocketContext'

const MODE_CONFIG = {
  MONITOR: { label: 'Monitor', color: 'mode-monitor' },
  IDS: { label: 'IDS', color: 'mode-ids' },
  IPS: { label: 'IPS', color: 'mode-ips' },
}

const NetworkDemo = () => {
  const [serverAddress, setServerAddress] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [idpsMode, setIdpsMode] = useState('IDS')
  const [loading, setLoading] = useState(true)
  const { connected } = useSocket()

  useEffect(() => {
    fetchNetworkInfo()
  }, [])

  const fetchNetworkInfo = async () => {
    setLoading(true)
    try {
      setServerAddress(window.location.host)
      const response = await api.get('/admin/client-ip')
      setClientAddress(response.data.clientIp || 'Unknown')
    } catch (error) {
      console.error('Failed to fetch network info:', error)
      setClientAddress('Error fetching IP')
    } finally {
      setLoading(false)
    }
  }

  const fetchMode = async () => {
    try {
      const response = await api.get('/admin/settings')
      setIdpsMode(response.data.settings.idps_mode || 'IDS')
    } catch (error) {
      console.error('Failed to fetch mode:', error)
    }
  }

  useEffect(() => {
    fetchMode()
  }, [])

  if (loading) {
    return <LoadingState message="Loading network information…" />
  }

  return (
    <div>
      <PageHeader
        title="Network Demonstration"
        subtitle="Server address, client details, and multi-computer LAN demo setup"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Section title="WebShield Server">
          <div className="bg-base-800 border border-base-600 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-5 h-5 text-accent-500" />
              <h3 className="text-sm font-semibold text-base-50">WebShield Server</h3>
            </div>
            <div className="space-y-3">
              <InfoRow label="Server Address" value={serverAddress || '—'} />
              <InfoRow
                label="Status"
                value="Online"
                status="online"
              />
              <InfoRow
                label="Socket.IO"
                value={connected ? 'Connected' : 'Disconnected'}
                status={connected ? 'online' : 'disconnected'}
              />
              <InfoRow
                label="IDPS Mode"
                value={idpsMode}
                status={idpsMode.toLowerCase()}
                mode
              />
            </div>
          </div>
        </Section>

        <Section title="Current Client">
          <div className="bg-base-800 border border-base-600 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <Laptop className="w-5 h-5 text-accent-500" />
              <h3 className="text-sm font-semibold text-base-50">Current Client</h3>
            </div>
            <div className="space-y-3">
              <InfoRow label="Client Address" value={clientAddress || '—'} />
              <InfoRow label="Device Type" value="Computer" />
              <InfoRow label="Connection" value="LAN" />
              <InfoRow label="User Agent" value={navigator.userAgent} />
            </div>
          </div>
        </Section>
      </div>

      <Section title="Multi-Computer Demo Setup">
        <div className="bg-base-800 border border-base-600 rounded-lg p-5">
          <div className="space-y-4 text-base-300">
            <p className="text-sm">
              To demonstrate WebShield across multiple computers on the same LAN:
            </p>
            <div className="space-y-3">
              <StepCard
                number={1}
                icon={<Server className="w-5 h-5 text-base-300" />}
                title="Computer 1 — WebShield Server"
                description="Run the WebShield server. Find your LAN IP using ipconfig (Windows) or ifconfig (Linux/Mac)."
              />
              <StepCard
                number={2}
                icon={<Laptop className="w-5 h-5 text-base-300" />}
                title="Computer 2 — Normal User"
                description="Access the demo application from: http://SERVER_LAN_IP:3000/demo"
              />
              <StepCard
                number={3}
                icon={<Smartphone className="w-5 h-5 text-base-300" />}
                title="Computer 3 — Security Test Client"
                description="Access the Test Lab from: http://SERVER_LAN_IP:3000/admin/test-lab"
              />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Finding Your LAN IP">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PlatformCard
            title="Windows"
            command="ipconfig"
            hint="Look for IPv4 Address under your network adapter"
            icon={<Wifi className="w-5 h-5 text-accent-500" />}
          />
          <PlatformCard
            title="Linux / Mac"
            command="ifconfig"
            hint="Look for inet address under your network interface"
            icon={<RouterIcon className="w-5 h-5 text-accent-500" />}
          />
        </div>
      </Section>
    </div>
  )
}

const InfoRow = ({ label, value, status, mode }) => {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-base-400">{label}</span>
      <div className="flex items-center gap-2">
        {status === 'online' && (
          <StatusIndicator status="online" label="" size="sm" />
        )}
        {status === 'disconnected' && (
          <StatusIndicator status="disconnected" label="" size="sm" />
        )}
        {mode && (
          <Badge variant="mode" mode={mode}>
            {MODE_CONFIG[mode.toUpperCase()]?.label || mode}
          </Badge>
        )}
        {!status && !mode && (
          <span className="text-base-300 font-mono text-xs truncate max-w-xs" title={value}>
            {value}
          </span>
        )}
      </div>
    </div>
  )
}

const StepCard = ({ number, icon, title, description }) => (
  <div className="bg-base-700/50 border border-base-600 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-500/10 text-accent-400 flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <div className="text-sm font-medium text-base-50">{title}</div>
        </div>
        <div className="text-xs text-base-500">{description}</div>
      </div>
    </div>
  </div>
)

const PlatformCard = ({ title, command, hint, icon }) => (
  <div className="bg-base-700/50 border border-base-600 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <div className="text-sm font-medium text-base-50">{title}</div>
    </div>
    <div className="text-xs font-mono text-accent-400 mb-1">{command}</div>
    <div className="text-[0.65rem] text-base-500">{hint}</div>
  </div>
)

export default NetworkDemo
