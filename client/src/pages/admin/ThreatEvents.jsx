import React, { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Section } from '../../components/ui/Section'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { useSocket } from '../../contexts/SocketContext'

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

const ThreatEvents = () => {
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState({ severity: '', category: '', source: '', date: '' })
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const { socket } = useSocket()

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/security-events', { params: filter })
      const data = response.data.events || []
      setDataSorted(data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  const setDataSorted = (data) => {
    const sorted = [...data].sort((a, b) => {
      const sa = SEVERITY_ORDER[a.severity] ?? 99
      const sb = SEVERITY_ORDER[b.severity] ?? 99
      if (sa !== sb) return sa - sb
      return new Date(b.timestamp) - new Date(a.timestamp)
    })
    setEvents(sorted)
  }

  useEffect(() => {
    fetchEvents()

    if (socket) {
      socket.on('security:new', () => {
        fetchEvents()
      })
    }

    return () => {
      if (socket) socket.off('security:new')
    }
  }, [socket, fetchEvents])

  const columns = [
    { key: 'time', label: 'Time', align: 'left' },
    { key: 'sourceIp', label: 'Source IP', align: 'left' },
    { key: 'method', label: 'Method', align: 'center' },
    { key: 'path', label: 'Endpoint', align: 'left' },
    { key: 'attackType', label: 'Detection', align: 'left' },
    { key: 'severity', label: 'Severity', align: 'left' },
    { key: 'riskScore', label: 'Risk Score', align: 'center' },
    { key: 'action', label: 'Action', align: 'left' },
  ]

  if (loading) {
    return <LoadingState message="Loading threat events…" />
  }

  const detail = events.find((e) => e.id === selectedEvent)

  return (
    <div>
      <PageHeader
        title="Threat Events"
        subtitle="Detected security incidents classified by type and severity"
        actions={
          <Button onClick={fetchEvents} size="sm">
            Refresh
          </Button>
        }
      />

      <Section>
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filter.severity}
            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
            className="bg-base-700 border border-base-600 rounded-lg px-3 py-2 text-sm text-base-200 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
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
            className="bg-base-700 border border-base-600 rounded-lg px-3 py-2 text-sm text-base-200 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
          />
          <input
            type="text"
            placeholder="Source IP"
            value={filter.source}
            onChange={(e) => setFilter({ ...filter, source: e.target.value })}
            className="bg-base-700 border border-base-600 rounded-lg px-3 py-2 text-sm text-base-200 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
          />
          <input
            type="date"
            value={filter.date}
            onChange={(e) => setFilter({ ...filter, date: e.target.value })}
            className="bg-base-700 border border-base-600 rounded-lg px-3 py-2 text-sm text-base-200 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
          />
          <Button onClick={fetchEvents} size="sm">
            Apply Filter
          </Button>
        </div>
      </Section>

      <Section>
        {events.length === 0 ? (
          <EmptyState
            title="No threat events"
            description="Detected incidents will appear here with severity, source, and action taken."
          />
        ) : (
          <Table
            columns={columns.map((col) => ({
              ...col,
              render: (row) => {
                if (col.key === 'time') {
                  return new Date(row.timestamp).toLocaleString()
                }
                if (col.key === 'severity') {
                  return (
                    <Badge variant="severity" severity={row.severity.toLowerCase()}>
                      {row.severity}
                    </Badge>
                  )
                }
                if (col.key === 'riskScore') {
                  return (
                    <span className="font-mono text-xs text-base-300">{row.riskScore}</span>
                  )
                }
                if (col.key === 'action') {
                  const isBlocked = ['BLOCK', 'TEMP_BLOCK', 'RATE_LIMIT'].includes(row.action)
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                      isBlocked
                        ? 'bg-severity-critical/10 text-severity-critical border border-severity-critical/20'
                        : 'bg-status-online/10 text-status-online border border-status-online/20'
                    }`}
                    >
                      {row.action}
                    </span>
                  )
                }
                if (col.key === 'sourceIp' || col.key === 'path' || col.key === 'attackType') {
                  return (
                    <span className="text-xs text-base-300">{row[col.key]}</span>
                  )
                }
                return row[col.key]
              },
              onClick: (row) => setSelectedEvent(row.id),
            }))}
            data={events}
            rowKey="id"
          />
        )}
      </Section>

      {detail && (
        <Modal
          isOpen={!!detail}
          onClose={() => setSelectedEvent(null)}
          title="Event Details"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow label="Request ID" value={detail.requestId} />
            <DetailRow label="Timestamp" value={new Date(detail.timestamp).toLocaleString()} />
            <DetailRow label="Source IP" value={detail.sourceIp} />
            <DetailRow label="Method" value={detail.method} />
            <DetailRow label="Path" value={detail.path} />
            <DetailRow label="Attack Type" value={detail.attackType} />
            <DetailRow label="Severity" value={detail.severity} />
            <DetailRow label="Risk Score" value={detail.riskScore} />
            <DetailRow label="Action" value={detail.action} />
            <DetailRow label="Blocked" value={detail.blocked ? 'Yes' : 'No'} />
            <DetailRow label="Description" value={detail.description} />
            <DetailRow label="User Agent" value={detail.userAgent} />
          </div>
        </Modal>
      )}
    </div>
  )
}

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[0.7rem] font-medium text-base-500 uppercase tracking-tighter">{label}</span>
    <span className="text-sm text-base-300 font-mono">{value === null || value === undefined ? '—' : value}</span>
  </div>
)

export default ThreatEvents
