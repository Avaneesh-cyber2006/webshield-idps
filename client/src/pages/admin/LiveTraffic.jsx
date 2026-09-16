import React, { useState, useEffect } from 'react'
import { Clock, Globe, ArrowRight, Shield, AlertTriangle } from 'lucide-react'
import api from '../../services/api'
import { useSocket } from '../../contexts/SocketContext'

const LiveTraffic = () => {
  const [traffic, setTraffic] = useState([])
  const [filter, setFilter] = useState({ method: '', blocked: '' })
  const { socket } = useSocket()

  useEffect(() => {
    fetchTraffic()

    if (socket) {
      socket.on('traffic:new', (newEvent) => {
        setTraffic(prev => [newEvent, ...prev].slice(0, 100))
      })
    }

    return () => {
      if (socket) {
        socket.off('traffic:new')
      }
    }
  }, [socket])

  const fetchTraffic = async () => {
    try {
      const response = await api.get('/admin/traffic', { params: filter })
      setTraffic(response.data.events)
    } catch (error) {
      console.error('Failed to fetch traffic:', error)
    }
  }

  const getActionBadge = (action) => {
    const styles = {
      ALLOW: 'bg-success-500/10 text-success-500 border-success-500',
      ALERT: 'bg-warning-500/10 text-warning-500 border-warning-500',
      BLOCK: 'bg-danger-500/10 text-danger-500 border-danger-500',
      RATE_LIMIT: 'bg-warning-500/10 text-warning-500 border-warning-500',
      TEMP_BLOCK: 'bg-danger-500/10 text-danger-500 border-danger-500'
    }
    return styles[action] || 'bg-gray-500/10 text-gray-500 border-gray-500'
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Live Traffic</h1>

      <div className="bg-dark-800 rounded-lg border border-dark-600 p-4 mb-6">
        <div className="flex space-x-4">
          <select
            value={filter.method}
            onChange={(e) => setFilter({ ...filter, method: e.target.value })}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-500"
          >
            <option value="">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
          <select
            value={filter.blocked}
            onChange={(e) => setFilter({ ...filter, blocked: e.target.value })}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-500"
          >
            <option value="">All Actions</option>
            <option value="true">Blocked</option>
            <option value="false">Allowed</option>
          </select>
          <button
            onClick={fetchTraffic}
            className="bg-accent-600 hover:bg-accent-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Apply Filter
          </button>
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-600 overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Request ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Source IP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Method</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Path</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Risk</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-600">
            {traffic.map((event) => (
              <tr key={event.id} className="hover:bg-dark-700">
                <td className="px-4 py-3 text-sm text-gray-300">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                  {event.requestId}
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">{event.sourceIp}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{event.method}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{event.path}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{event.status}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{event.riskScore}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded border ${getActionBadge(event.action)}`}>
                    {event.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LiveTraffic
