import React, { useState, useEffect } from 'react'
import { Lock, Unlock } from 'lucide-react'
import api from '../../services/api'

const SecurityRules = () => {
  const [rules, setRules] = useState([])

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await api.get('/admin/security-rules')
      setRules(response.data.rules)
    } catch (error) {
      console.error('Failed to fetch rules:', error)
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
      <h1 className="text-3xl font-bold text-white mb-8">Security Rules</h1>

      <div className="bg-dark-800 rounded-lg border border-dark-600 overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Rule Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Risk Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-600">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-dark-700">
                <td className="px-4 py-3 text-sm text-white font-semibold">{rule.name}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{rule.category}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded border ${getSeverityBadge(rule.severity)}`}>
                    {rule.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">{rule.score}</td>
                <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{rule.description}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    rule.enabled
                      ? 'bg-success-500/10 text-success-500 border border-success-500'
                      : 'bg-gray-500/10 text-gray-500 border border-gray-500'
                  }`}>
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleRule(rule.id, rule.enabled)}
                    className={`p-2 rounded-lg transition-colors ${
                      rule.enabled
                        ? 'bg-danger-500/10 text-danger-500 hover:bg-danger-500/20'
                        : 'bg-success-500/10 text-success-500 hover:bg-success-500/20'
                    }`}
                  >
                    {rule.enabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SecurityRules
