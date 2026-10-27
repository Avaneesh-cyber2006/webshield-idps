import React, { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Section } from '../../components/ui/Section'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'
import { useSocket } from '../../contexts/SocketContext'
import { RefreshCw } from 'lucide-react'

const ACTION_COLORS = {
  ALLOW: 'status-online',
  ALERT: 'status-warning',
  BLOCK: 'severity-critical',
  RATE_LIMIT: 'status-warning',
  TEMP_BLOCK: 'severity-critical',
}

const LiveTraffic = () => {
  const [traffic, setTraffic] = useState([])
  const [filter, setFilter] = useState({ method: '', blocked: '' })
  const [loading, setLoading] = useState(true)
  const { socket } = useSocket()

  const fetchTraffic = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/traffic', { params: filter })
      setTraffic(response.data.events || [])
    } catch (error) {
      console.error('Failed to fetch traffic:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchTraffic()

    if (socket) {
      socket.on('traffic:new', (newEvent) => {
        if (filter.method && newEvent.method !== filter.method) return
        const blocked = [403, 429].includes(newEvent.status)
        if (filter.blocked && blocked !== filter.blocked === 'true') return
        setTraffic((prev) => {
          const next = [newEvent, ...prev.filter((e) => e.requestId !== newEvent.requestId)]
          return next.slice(0, 100)
        })
      })
    }

    return () => {
      if (socket) socket.off('traffic:new')
    }
  }, [socket, fetchTraffic, filter])

  const columns = [
    { key: 'time', label: 'Time', align: 'left' },
    { key: 'requestId', label: 'Request ID', align: 'left' },
    { key: 'sourceIp', label: 'Source IP', align: 'left' },
    { key: 'method', label: 'Method', align: 'center' },
    { key: 'path', label: 'Path', align: 'left' },
    { key: 'status', label: 'Status', align: 'center' },
    { key: 'riskScore', label: 'Risk', align: 'center' },
    { key: 'action', label: 'Action', align: 'left' },
  ]

  if (loading) {
    return <LoadingState message="Loading live traffic…" />
  }

  if (traffic.length === 0) {
    return (
      <div>
        <PageHeader
          title="Live Traffic"
          subtitle="Real-time stream of inspected HTTP requests"
          actions={
            <Button onClick={fetchTraffic} iconLeft={<RefreshCw className="w-4 h-4" />}>
              Refresh
            </Button>
          }
        />
        <EmptyState
          title="No traffic recorded"
          description="Requests will appear here as they are inspected by the IDPS engine."
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Live Traffic"
        subtitle="Real-time stream of inspected HTTP requests"
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={fetchTraffic} size="sm" iconLeft={<RefreshCw className="w-4 h-4" />}>
              Refresh
            </Button>
          </div>
        }
      />

      <Section>
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filter.method}
            onChange={(e) => setFilter({ ...filter, method: e.target.value })}
            className="bg-base-700 border border-base-600 rounded-lg px-3 py-2 text-sm text-base-200 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
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
            className="bg-base-700 border border-base-600 rounded-lg px-3 py-2 text-sm text-base-200 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
          >
            <option value="">All Actions</option>
            <option value="true">Blocked</option>
            <option value="false">Allowed</option>
          </select>
          <Button onClick={fetchTraffic} size="sm">
            Apply Filter
          </Button>
        </div>
      </Section>

      <Section>
        <Table
          columns={columns.map((col) => ({
            ...col,
            render: (row) => {
              if (col.key === 'time') {
                return new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              }
              if (col.key === 'status') {
                const isBlocked = [403, 429].includes(row.status)
                return (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                    isBlocked
                      ? 'bg-severity-critical/10 text-severity-critical border border-severity-critical/20'
                      : 'bg-status-online/10 text-status-online border border-status-online/20'
                  }`}
                  >
                    {row.status}
                  </span>
                )
              }
              if (col.key === 'riskScore') {
                const score = row.riskScore || 0
                const severity =
                  score >= 70 ? 'critical' : score >= 40 ? 'high' : score >= 15 ? 'medium' : 'low'
                return (
                  <Badge variant="severity" severity={severity}>
                    {score}
                  </Badge>
                )
              }
              if (col.key === 'action') {
                const color = ACTION_COLORS[row.action] || 'base-400'
                return (
                  <Badge variant="severity" severity={color}>
                    {row.action}
                  </Badge>
                )
              }
              if (col.key === 'requestId' || col.key === 'sourceIp' || col.key === 'path') {
                return (
                  <span className="font-mono text-xs text-base-300">{row[col.key]}</span>
                )
              }
              return row[col.key]
            },
          }))}
          data={traffic}
          rowKey="requestId"
        />
      </Section>
    </div>
  )
}

export default LiveTraffic
