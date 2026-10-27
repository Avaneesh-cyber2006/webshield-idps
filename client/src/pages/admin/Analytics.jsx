import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import api from '../../services/api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Section } from '../../components/ui/Section'
import { StatCard } from '../../components/ui/StatCard'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'

const Analytics = () => {
  const [data, setData] = useState(null)
  const [timeframe, setTimeframe] = useState('24h')
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/analytics', { params: { timeframe } })
      setData(response.data.data || {})
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [timeframe])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return <LoadingState message="Loading analytics…" />
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Security metrics and trend analysis" />
        <EmptyState
          title="No analytics data"
          description="Metrics will appear here as traffic is inspected."
        />
      </div>
    )
  }

  const threatsByTimeData = Object.entries(data.threatsByTime || {}).map(([hour, count]) => ({
    hour: new Date(hour).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    threats: count,
  }))

  const threatsByCategoryData = Object.entries(data.threatsByCategory || {}).map(([category, count]) => ({
    category,
    count,
  }))

  const threatsBySeverityData = Object.entries(data.threatsBySeverity || {}).map(([severity, count]) => ({
    severity,
    count,
  }))

  const allowedBlockedData = [
    { name: 'Allowed', value: data.allowed || 0 },
    { name: 'Blocked', value: data.blocked || 0 },
  ]

  const SEVERITY_COLORS = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#3b82f6',
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Security metrics, threat trends, and prevention outcomes"
        actions={
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-base-700 border border-base-600 rounded-lg px-3 py-2 text-sm text-base-200 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={null} label="Total Events" value={data.totalEvents || 0} variant="accent" />
        <StatCard icon={null} label="Allowed" value={data.allowed || 0} variant="success" />
        <StatCard icon={null} label="Blocked" value={data.blocked || 0} variant="danger" />
        <StatCard
          icon={null}
          label="Block Rate"
          value={
            data.totalEvents
              ? Math.round((data.blocked / data.totalEvents) * 100)
              : 0
          }
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Section title="Threats Over Time">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={threatsByTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#64748b" tick={10} />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="threats"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Threats by Category">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={threatsByCategoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="category" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend />
                <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Threats by Severity">
          <div className="h-[280px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={threatsBySeverityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name }) => name}
                  outerRadius={80}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {threatsBySeverityData.map((entry) => (
                    <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Allowed vs Blocked">
          <div className="h-[280px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allowedBlockedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>
    </div>
  )
}

export default Analytics
