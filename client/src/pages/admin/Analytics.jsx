import React, { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../../services/api'

const Analytics = () => {
  const [data, setData] = useState(null)
  const [timeframe, setTimeframe] = useState('24h')

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics', { params: { timeframe } })
      setData(response.data.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6']

  if (!data) {
    return <div className="text-white">Loading...</div>
  }

  const threatsByTimeData = Object.entries(data.threatsByTime || {}).map(([hour, count]) => ({
    hour: `${hour}:00`,
    threats: count
  }))

  const threatsByCategoryData = Object.entries(data.threatsByCategory || {}).map(([category, count]) => ({
    category,
    count
  }))

  const threatsBySeverityData = Object.entries(data.threatsBySeverity || {}).map(([severity, count]) => ({
    severity,
    count
  }))

  const allowedBlockedData = [
    { name: 'Allowed', value: data.allowed || 0 },
    { name: 'Blocked', value: data.blocked || 0 }
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-500"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Threats Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={threatsByTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                itemStyle={{ color: '#e5e7eb' }}
              />
              <Legend />
              <Line type="monotone" dataKey="threats" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Threats by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={threatsByCategoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="category" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                itemStyle={{ color: '#e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Threats by Severity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={threatsBySeverityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ severity, percent }) => `${severity} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {threatsBySeverityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                itemStyle={{ color: '#e5e7eb' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Allowed vs Blocked</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={allowedBlockedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                itemStyle={{ color: '#e5e7eb' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Analytics
