import React, { useState, useEffect } from 'react'
import { ShieldAlert, Lock, Unlock, Plus } from 'lucide-react'
import api from '../../services/api'

const BlockedSources = () => {
  const [sources, setSources] = useState([])
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockForm, setBlockForm] = useState({ sourceIp: '', reason: '', isTemporary: true })

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    try {
      const response = await api.get('/admin/blocked-sources')
      setSources(response.data.sources)
    } catch (error) {
      console.error('Failed to fetch blocked sources:', error)
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
    try {
      await api.delete(`/admin/block-source/${sourceIp}`)
      fetchSources()
    } catch (error) {
      console.error('Failed to unblock source:', error)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Blocked Sources</h1>
        <button
          onClick={() => setShowBlockModal(true)}
          className="bg-accent-600 hover:bg-accent-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Block Source</span>
        </button>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-600 overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Source IP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Device Label</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Blocked At</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Expires</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-600">
            {sources.map((source) => (
              <tr key={source.id} className="hover:bg-dark-700">
                <td className="px-4 py-3 text-sm text-white font-mono">{source.sourceIp}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{source.deviceLabel || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{source.reason}</td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  {new Date(source.blockedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  {source.expiresAt ? new Date(source.expiresAt).toLocaleString() : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    source.active
                      ? 'bg-danger-500/10 text-danger-500 border border-danger-500'
                      : 'bg-success-500/10 text-success-500 border border-success-500'
                  }`}>
                    {source.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {source.active && (
                    <button
                      onClick={() => handleUnblock(source.sourceIp)}
                      className="text-accent-500 hover:text-accent-400 flex items-center space-x-1"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Unblock</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-800 rounded-lg border border-dark-600 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Block Source</h2>
              <button
                onClick={() => setShowBlockModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleBlock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Source IP</label>
                <input
                  type="text"
                  value={blockForm.sourceIp}
                  onChange={(e) => setBlockForm({ ...blockForm, sourceIp: e.target.value })}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-500"
                  placeholder="192.168.1.100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
                <input
                  type="text"
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-500"
                  placeholder="Reason for blocking"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="temporary"
                  checked={blockForm.isTemporary}
                  onChange={(e) => setBlockForm({ ...blockForm, isTemporary: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="temporary" className="text-sm text-gray-300">Temporary block (5 minutes)</label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="flex-1 bg-dark-700 hover:bg-dark-600 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-accent-600 hover:bg-accent-500 text-white py-2 rounded-lg transition-colors"
                >
                  Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlockedSources
