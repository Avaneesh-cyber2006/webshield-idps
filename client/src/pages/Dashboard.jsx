import React, { useEffect, useState } from 'react'
import { Shield, Activity, AlertTriangle } from 'lucide-react'
import api from '../services/api'
import { PageHeader } from '../components/ui/PageHeader'
import { Section } from '../components/ui/Section'
import { StatCard } from '../components/ui/StatCard'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/demo/dashboard')
      .then((response) => {
        const data = response.data.data || {}
        setStats({ ...data.stats, mode: data.mode })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-base-400">Loading demo dashboard…</div>
      </div>
    )
  }

  const mode = stats?.mode || 'IDS'
  const isProtected = mode === 'IPS'

  return (
    <div>
      <PageHeader
        title="Demo Dashboard"
        subtitle="Your protected demonstration application monitored by WebShield"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={Shield}
          label="Protection Status"
          value={isProtected ? 'Protected' : 'Monitoring'}
          variant={isProtected ? 'success' : 'warning'}
        />
        <StatCard
          icon={Activity}
          label="Total Requests"
          value={stats?.totalRequests ?? '—'}
          variant="accent"
        />
        <StatCard
          icon={AlertTriangle}
          label="Security Events"
          value={stats?.securityEvents ?? '—'}
          variant="danger"
        />
      </div>

      <Section title="About This Demo">
        <div className="bg-base-800 border border-base-600 rounded-lg p-5">
          <div className="space-y-3 text-base-300 text-sm">
            <p>
              This is a protected demonstration application monitored by the WebShield
              Intrusion Detection and Prevention System.
            </p>
            <p>All requests to this application are inspected for security threats including:</p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>SQL Injection patterns</li>
              <li>Cross-site scripting (XSS) patterns</li>
              <li>Path traversal attempts</li>
              <li>Authentication abuse</li>
              <li>Request rate abuse</li>
              <li>Suspicious user agents</li>
            </ul>
            <p>
              Navigate through the demo features using the sidebar. The admin dashboard
              provides real-time security monitoring and analysis.
            </p>
          </div>
        </div>
      </Section>
    </div>
  )
}

export default Dashboard
