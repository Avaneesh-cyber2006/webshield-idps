import React, { useState, useEffect } from 'react'
import { Lock, Unlock } from 'lucide-react'
import api from '../../services/api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Section } from '../../components/ui/Section'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'

const SecurityRules = () => {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/security-rules')
      setRules(response.data.rules || [])
    } catch (error) {
      console.error('Failed to fetch rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRule = async (id, enabled) => {
    try {
      await api.put(`/admin/security-rules/${id}`, { enabled: !enabled })
      fetchRules()
    } catch (error) {
      console.error('Failed to toggle rule:', error)
    }
  }

  if (loading) {
    return <LoadingState message="Loading security rules…" />
  }

  const enabledCount = rules.filter((r) => r.enabled).length

  return (
    <div>
      <PageHeader
        title="Security Rules"
        subtitle={`Detection rules governing threat classification. ${enabledCount} of ${rules.length} rules enabled`}
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-700/50 border border-base-600">
            <span className="text-xs font-medium text-base-400">{enabledCount} enabled</span>
          </div>
        }
      />

      <Section>
        {rules.length === 0 ? (
          <EmptyState
            title="No security rules"
            description="Detection rules will appear here once configured."
          />
        ) : (
          <Table
            columns={[
              { key: 'name', label: 'Rule Name', align: 'left' },
              { key: 'category', label: 'Category', align: 'left' },
              { key: 'severity', label: 'Severity', align: 'left' },
              { key: 'score', label: 'Risk Score', align: 'center' },
              { key: 'description', label: 'Description', align: 'left' },
              { key: 'status', label: 'Status', align: 'left' },
              { key: 'actions', label: 'Actions', align: 'left' },
            ].map((col) => ({
              ...col,
              render: (row) => {
                if (col.key === 'name') {
                  return (
                    <span className="text-sm font-medium text-base-300">{row.name}</span>
                  )
                }
                if (col.key === 'category') {
                  return <span className="text-xs text-base-400">{row.category}</span>
                }
                if (col.key === 'severity') {
                  return (
                    <Badge variant="severity" severity={row.severity.toLowerCase()}>
                      {row.severity}
                    </Badge>
                  )
                }
                if (col.key === 'score') {
                  return <span className="font-mono text-xs text-base-300">{row.score}</span>
                }
                if (col.key === 'description') {
                  return (
                    <span className="text-xs text-base-400 truncate max-w-xs" title={row.description}>
                      {row.description}
                    </span>
                  )
                }
                if (col.key === 'status') {
                  return (
                    <Badge
                      variant="severity"
                      severity={row.enabled ? 'low' : 'medium'}
                    >
                      {row.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  )
                }
                if (col.key === 'actions') {
                  return (
                    <Button
                      variant={row.enabled ? 'danger' : 'ghost'}
                      size="sm"
                      className="p-1.5"
                      onClick={() => toggleRule(row.id, row.enabled)}
                      aria-label={row.enabled ? 'Disable rule' : 'Enable rule'}
                    >
                      {row.enabled ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                    </Button>
                  )
                }
                return row[col.key]
              },
            }))}
            data={rules}
            rowKey="id"
            emptyMessage="No security rules"
          />
        )}
      </Section>
    </div>
  )
}

export default SecurityRules
