import React, { useState, useEffect } from 'react'
import { Network, Server, Laptop, Smartphone, Shield, CheckCircle, XCircle } from 'lucide-react'
import api from '../../services/api'
import { useSocket } from '../../contexts/SocketContext'

const NetworkDemo = () => {
  const [serverAddress, setServerAddress] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [socketStatus, setSocketStatus] = useState(false)
  const [idpsMode, setIdpsMode] = useState('IDS')
  const { connected } = useSocket()

  useEffect(() => {
    fetchNetworkInfo()
  }, [])

  const fetchNetworkInfo = async () => {
    try {
      // Get server address from window location
      setServerAddress(window.location.host)

      // Get client IP from API
      const response = await api.get('/admin/client-ip')
      setClientAddress(response.data.clientIp)

      setSocketStatus(connected)
    } catch (error) {
      console.error('Failed to fetch network info:', error)
      setClientAddress('Error fetching IP')
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

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Network Demonstration</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Server className="w-5 h-5 text-accent-500" />
            <h2 className="text-xl font-semibold text-white">WebShield Server</h2>
          </div>
          <div className="space-y-3">
            <InfoRow label="Server Address" value={serverAddress} />
            <InfoRow label="Status" value="Online" status="success" />
            <InfoRow label="Socket.IO" value={socketStatus ? 'Connected' : 'Disconnected'} status={socketStatus ? 'success' : 'error'} />
            <InfoRow label="IDPS Mode" value={idpsMode} />
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Laptop className="w-5 h-5 text-accent-500" />
            <h2 className="text-xl font-semibold text-white">Current Client</h2>
          </div>
          <div className="space-y-3">
            <InfoRow label="Client Address" value={clientAddress} />
            <InfoRow label="Device Type" value="Computer" />
            <InfoRow label="Connection" value="LAN" />
            <InfoRow label="User Agent" value={navigator.userAgent.substring(0, 50) + '...'} />
          </div>
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-600 p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Network className="w-5 h-5 text-accent-500" />
          <h2 className="text-xl font-semibold text-white">Multi-Computer Demo Setup</h2>
        </div>
        <div className="space-y-4 text-gray-300">
          <p>
            To demonstrate WebShield across multiple computers on the same LAN:
          </p>
          <div className="space-y-3">
            <StepCard
              number={1}
              icon={<Server className="w-5 h-5" />}
              title="Computer 1 - WebShield Server"
              description="Run the WebShield server. Find your LAN IP using ipconfig (Windows) or ifconfig (Linux/Mac)."
            />
            <StepCard
              number={2}
              icon={<Laptop className="w-5 h-5" />}
              title="Computer 2 - Normal User"
              description="Access the demo application from: http://SERVER_LAN_IP:8080/demo"
            />
            <StepCard
              number={3}
              icon={<Smartphone className="w-5 h-5" />}
              title="Computer 3 - Security Test Client"
              description="Access the Test Lab from: http://SERVER_LAN_IP:8080/admin/test-lab"
            />
          </div>
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-5 h-5 text-accent-500" />
          <h2 className="text-xl font-semibold text-white">Finding Your LAN IP</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
            <div className="text-white font-semibold mb-2">Windows</div>
            <code className="text-accent-500">ipconfig</code>
            <div className="text-sm text-gray-400 mt-2">Look for "IPv4 Address" under your network adapter</div>
          </div>
          <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
            <div className="text-white font-semibold mb-2">Linux/Mac</div>
            <code className="text-accent-500">ifconfig</code>
            <div className="text-sm text-gray-400 mt-2">Look for "inet" address under your network interface</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const InfoRow = ({ label, value, status }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-400">{label}</span>
    <div className="flex items-center space-x-2">
      {status === 'success' && <CheckCircle className="w-4 h-4 text-success-500" />}
      {status === 'error' && <XCircle className="w-4 h-4 text-danger-500" />}
      <span className="text-white font-semibold">{value}</span>
    </div>
  </div>
)

const StepCard = ({ number, icon, title, description }) => (
  <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 w-8 h-8 bg-accent-600 rounded-full flex items-center justify-center text-white font-bold">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          {icon}
          <div className="text-white font-semibold">{title}</div>
        </div>
        <div className="text-sm text-gray-400">{description}</div>
      </div>
    </div>
  </div>
)

export default NetworkDemo
