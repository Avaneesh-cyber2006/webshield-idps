import React, { useState, useEffect } from 'react'
import { Plus, Unlock } from 'lucide-react'
import api from '../../services/api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Section } from '../../components/ui/Section'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'

const BlockedSources = () => {
  const [sources, setSources] = useState([])
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockForm, setBlockForm] = useState({ sourceIp: '', reason: '', isTemporary: true })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/blocked-sources')
      setSources(response.data.sources || [])
    } catch (error) {
      console.error('Failed to fetch blocked sources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBlock = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/block-source', blockForm)
      setShowBlockModal(false)
      setBlockForm({ sourceIp: '', reason: '', isTemporary: true })
      fetchSources()
    } catch (error) {
      console.error('Failed to block source:', error)
    }
  }

  const handleUnblock = async (sourceIp) => {
    if (!window.confirm(`Unblock source ${sourceIp}?`)) return
    try {
      await api.delete(`/admin/block-source/${sourceIp}`)
      fetchSources()
    } catch (error) {
      console.error('Failed to unblock source:', error)
    }
  }

  if (loading) {
    return <LoadingState message="Loading blocked sources…" />
  }

  return (
    <div>
      <PageHeader
        title="Blocked Sources"
        subtitle="Manage IP addresses blocked by the IDS/IPS engine"
        actions={
          <Button
            onClick={() => setShowBlockModal(true)}
            iconLeft={<Plus className="w-4 h-4" />}
          >
            Block Source
          </Button>
        }
      />

      <Section>
        {sources.length === 0 ? (
          <EmptyState
            title="No blocked sources"
            description="Blocked IP addresses will appear here when the prevention engine takes action."
          />
        ) : (
          <Table
            columns={[
              { key: 'sourceIp', label: 'Source IP', align: 'left' },
              { key: 'deviceLabel', label: 'Device Label', align: 'left' },
              { key: 'reason', label: 'Reason', align: 'left' },
              { key: 'blockedAt', label: 'Blocked At', align: 'left' },
              { key: 'expiresAt', label: 'Expires', align: 'left' },
              { key: 'status', label: 'Status', align: 'left' },
              { key: 'actions', label: 'Actions', align: 'left' },
            ].map((col) => ({
              ...col,
              render: (row) => {
                if (col.key === 'sourceIp') {
                  return <span className="font-mono text-xs text-base-300">{row.sourceIp}</span>
                }
                if (col.key === 'deviceLabel') {
                  return (
                    <span className="text-xs text-base-300">{row.deviceLabel || '—'}</span>
                  )
                }
                if (col.key === 'reason') {
                  return <span className="text-xs text-base-300">{row.reason}</span>
                }
                if (col.key === 'blockedAt') {
                  return (
                    <span className="text-xs text-base-300">
                      {new Date(row.blockedAt).toLocaleString()}
                    </span>
                  )
                }
                if (col.key === 'expiresAt') {
                  return (
                    <span className="text-xs text-base-300">
                      {row.expiresAt ? new Date(row.expiresAt).toLocaleString() : 'Never'}
                    </span>
                  )
                }
                if (col.key === 'status') {
                  return (
                    <Badge
                      variant="severity"
                      severity={row.active ? 'critical' : 'low'}
                    >
                      {row.active ? 'Active' : 'Inactive'}
                    </Badge>
                  )
                }
                if (col.key === 'actions') {
                  return (
                    <div className="flex items-center gap-2">
                      {row.active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnblock(row.sourceIp)}
                        >
                          <Unlock className="w-3 h-3" />
                          <span className="hidden sm:inline">Unblock</span>
                        </Button>
                      )}
                    </div>
                  )
                }
                return row[col.key]
              },
            }))}
            data={sources}
            rowKey="id"
            emptyMessage="No blocked sources"
          />
        )}
      </Section>

      {showBlockModal && (
        <Modal
          isOpen={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          title="Block Source"
        >
          <form onSubmit={handleBlock} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-300 mb-1.5">
                Source IP
              </label>
              <input
                type="text"
                value={blockForm.sourceIp}
                onChange={(e) => setBlockForm({ ...blockForm, sourceIp: e.target.value })}
                className="w-full bg-base-700 border border-base-600 rounded-lg px-3 py-2 text-base-200 placeholder-base-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                placeholder="192.168.1.100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-base-300 mb-1.5">
                Reason
              </label>
              <input
                type="text"
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                className="w-full bg-base-700 border border-base-600 rounded-lg px-3 py-2 text-base-200 placeholder-base-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                placeholder="Reason for blocking"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="temporary"
                checked={blockForm.isTemporary}
                onChange={(e) => setBlockForm({ ...blockForm, isTemporary: e.target.checked })}
                className="rounded bg-base-700 border-base-600 text-accent-500 focus:ring-accent-500"
              />
              <label htmlFor="temporary" className="text-sm text-base-300">
                Temporary block (5 minutes)
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowBlockModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Block Source</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default BlockedSources
