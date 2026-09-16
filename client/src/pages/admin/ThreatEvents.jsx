import React, { useState, useEffect } from 'react'
import { Calendar, Search, Filter } from 'lucide-react'
import api from '../../services/api'

const ThreatEvents = () => {
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState({ severity: '', category: '', source: '', date: '' })
  const [selectedEvent, setSelectedEvent] = useState(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await api.get('/admin/security-events', { params: filter })
      setEvents(response.data.events)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const getSeverityBadge = (severity) => {
    const styles = {
      LOW: 'bg-blue-500/10 text-blue-500 border-blue-500',
      MEDIUM: 'bg-warning-500/10 text-warning-500 border-warning-500',
      HIGH: 'bg-orange-500/10 text-orange-500 border-orange-500',
      CRITICAL: 'bg-danger-500/10 text-danger-500 border-danger-500'
    }
    return styles[severity] || 'bg-gray-500/10 text-gray-500 border-gray-500'
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Threat Events</h1>

      <div className="bg-dark-800 rounded-lg border border-dark-600 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filter.severity}
            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-500"
          >
            <option value="">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <input
            type="text"
            placeholder="Category"
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-500"
          />
          <input
            type="text"
            placeholder="Source IP"
            value={filter.source}
            onChange={(e) => setFilter({ ...filter, source: e.target.value })}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-500"
          />
          <input
            type="date"
            value={filter.date}
            onChange={(e) => setFilter({ ...filter, date: e.target.value })}
            className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-500"
          />
          <button
            onClick={fetchEvents}
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Source IP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Method</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Endpoint</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Detection</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Risk Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-600">
            {events.map((event) => (
              <tr
                key={event.id}
                className="hover:bg-dark-700 cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <td className="px-4 py-3 text-sm text-gray-300">
                  {new Date(event.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">{event.sourceIp}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{event.method}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{event.path}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{event.attackType}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded border ${getSeverityBadge(event.severity)}`}>
                    {event.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">{event.riskScore}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{event.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-800 rounded-lg border border-dark-600 p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Event Details</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <DetailRow label="Request ID" value={selectedEvent.requestId} />
              <DetailRow label="Timestamp" value={new Date(selectedEvent.timestamp).toLocaleString()} />
              <DetailRow label="Source IP" value={selectedEvent.sourceIp} />
              <DetailRow label="Method" value={selectedEvent.method} />
              <DetailRow label="Path" value={selectedEvent.path} />
              <DetailRow label="Attack Type" value={selectedEvent.attackType} />
              <DetailRow label="Severity" value={selectedEvent.severity} />
              <DetailRow label="Risk Score" value={selectedEvent.riskScore} />
              <DetailRow label="Action" value={selectedEvent.action} />
              <DetailRow label="Description" value={selectedEvent.description} />
              <DetailRow label="User Agent" value={selectedEvent.userAgent} />
              <DetailRow label="Blocked" value={selectedEvent.blocked ? 'Yes' : 'No'} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const DetailRow = ({ label, value }) => (
  <div className="flex">
    <span className="text-gray-400 w-32 flex-shrink-0">{label}:</span>
    <span className="text-white">{value}</span>
  </div>
)

export default ThreatEvents
