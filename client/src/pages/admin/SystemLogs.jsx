import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Section } from '../../components/ui/Section'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'

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
        api.get('/admin/traffic-events'),
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
        <PageHeader title="System Logs" subtitle="Recent traffic and security event logs" />
        <LoadingState message="Loading logs…" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="System Logs" subtitle="Recent traffic and security event logs" />

      <Section title="Recent Traffic Events">
        <div className="bg-base-800 border border-base-600 rounded-lg overflow-hidden">
          {trafficEvents.length === 0 ? (
            <EmptyState title="No traffic events" description="Traffic events will appear here as they are inspected." className="p-8" />
          ) : (
            <Table
              columns={[
                { key: 'time', label: 'Time', align: 'left' },
                { key: 'method', label: 'Method', align: 'center' },
                { key: 'path', label: 'Path', align: 'left' },
                { key: 'source', label: 'Source IP', align: 'left' },
                { key: 'status', label: 'Status', align: 'center' },
                { key: 'risk', label: 'Risk', align: 'center' },
                { key: 'action', label: 'Action', align: 'left' },
              ].map((col) => ({
                ...col,
                render: (row) => {
                  if (col.key === 'time') {
                    return (
                      <span className="text-xs font-mono text-base-400">
                        {new Date(row.createdAt || row.timestamp).toLocaleTimeString()}
                      </span>
                    )
                  }
                  if (col.key === 'method' || col.key === 'path' || col.key === 'source') {
                    return (
                      <span className="text-xs text-base-300 font-mono">{row[col.key]}</span>
                    )
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
                  if (col.key === 'risk') {
                    return <span className="text-xs font-mono text-base-300">{row.riskScore}</span>
                  }
                  if (col.key === 'action') {
                    return (
                      <span className="text-xs text-base-300">{row.action}</span>
                    )
                  }
                  return row[col.key]
                },
              }))}
              data={trafficEvents.slice(0, 20)}
              rowKey="id"
            />
          )}
        </div>
      </Section>

      <Section title="Security Event Logs">
        <div className="bg-base-800 border border-base-600 rounded-lg overflow-hidden">
          {securityEvents.length === 0 ? (
            <EmptyState title="No security events" description="Security events will appear here when threats are detected." className="p-8" />
          ) : (
            <Table
              columns={[
                { key: 'time', label: 'Time', align: 'left' },
                { key: 'type', label: 'Attack Type', align: 'left' },
                { key: 'source', label: 'Source IP', align: 'left' },
                { key: 'severity', label: 'Severity', align: 'center' },
                { key: 'risk', label: 'Risk Score', align: 'center' },
                { key: 'action', label: 'Action', align: 'left' },
              ].map((col) => ({
                ...col,
                render: (row) => {
                  if (col.key === 'time') {
                    return (
                      <span className="text-xs font-mono text-base-400">
                        {new Date(row.createdAt || row.timestamp).toLocaleTimeString()}
                      </span>
                    )
                  }
                  if (col.key === 'type' || col.key === 'source') {
                    return (
                      <span className="text-xs text-base-300 font-mono">{row[col.key]}</span>
                    )
                  }
                  if (col.key === 'severity') {
                    return (
                      <Badge variant="severity" severity={row.severity.toLowerCase()}>
                        {row.severity}
                      </Badge>
                    )
                  }
                  if (col.key === 'risk') {
                    return <span className="text-xs font-mono text-base-300">{row.riskScore}</span>
                  }
                  if (col.key === 'action') {
                    return (
                      <span className="text-xs text-base-300">{row.action}</span>
                    )
                  }
                  return row[col.key]
                },
              }))}
              data={securityEvents.slice(0, 20)}
              rowKey="id"
            />
          )}
        </div>
      </Section>
    </div>
  )
}

export default SystemLogs
