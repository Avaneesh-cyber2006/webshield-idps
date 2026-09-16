import React, { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import api from '../../services/api'

const SystemLogs = () => {
  const [securityEvents, setSecurityEvents] = useState([])
  const [trafficEvents, setTrafficEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const [securityRes, trafficRes] = await Promise.all([
        api.get('/admin/security-events'),
        api.get('/admin/traffic-events')
      ])
      setSecurityEvents(securityRes.data.events || [])
      setTrafficEvents(trafficRes.data.events || [])
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-white mb-8">System Logs</h1>
        <div className="text-gray-400">Loading logs...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">System Logs</h1>

      <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-accent-500" />
          <h2 className="text-xl font-semibold text-white">Recent Traffic Events</h2>
        </div>
        <div className="bg-dark-900 rounded-lg p-4 font-mono text-sm text-gray-300 max-h-96 overflow-auto">
          {trafficEvents.length === 0 ? (
            <div className="text-gray-500">No traffic events recorded yet</div>
          ) : (
            <div className="space-y-1">
              {trafficEvents.slice(0, 20).map(event => (
                <div key={event.id}>
                  [{new Date(event.createdAt).toISOString()}] {event.method} {event.path} from {event.sourceIp} - Status: {event.status}, Risk: {event.riskScore}, Action: {event.action}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-600 p-6 mt-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-accent-500" />
          <h2 className="text-xl font-semibold text-white">Security Event Logs</h2>
        </div>
        <div className="bg-dark-900 rounded-lg p-4 font-mono text-sm text-gray-300 max-h-96 overflow-auto">
          {securityEvents.length === 0 ? (
            <div className="text-gray-500">No security events recorded yet</div>
          ) : (
            <div className="space-y-1">
              {securityEvents.slice(0, 20).map(event => (
                <div key={event.id}>
                  [{new Date(event.createdAt).toISOString()}] SECURITY: {event.attackType} detected from {event.sourceIp} - Severity: {event.severity}, Risk Score: {event.riskScore}, Action: {event.action}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SystemLogs
