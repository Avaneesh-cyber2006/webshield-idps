import React, { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'
import api from '../../services/api'
import { PageHeader } from '../../components/ui/PageHeader'
import { Section } from '../../components/ui/Section'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'

const MODE_CONFIG = {
  MONITOR: { label: 'Monitor Mode', color: 'mode-monitor', description: 'Log only — no detection or prevention' },
  IDS: { label: 'IDS Mode', color: 'mode-ids', description: 'Detect, classify, log, and alert — no prevention' },
  IPS: { label: 'IPS Mode', color: 'mode-ips', description: 'Detect, classify, log, alert, and prevent' },
}

const Settings = () => {
  const [settings, setSettings] = useState({})
  const [mode, setMode] = useState('IDS')
  const [deviceLabels, setDeviceLabels] = useState([])
  const [newLabel, setNewLabel] = useState({ sourceIp: '', label: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
    fetchDeviceLabels()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings')
      setSettings(response.data.settings)
      setMode(response.data.settings.idps_mode || 'IDS')
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeviceLabels = async () => {
    try {
      const response = await api.get('/admin/device-labels')
      setDeviceLabels(response.data.labels || [])
    } catch (error) {
      console.error('Failed to fetch device labels:', error)
    }
  }

  const handleModeChange = async (newMode) => {
    try {
      await api.post('/admin/mode', { mode: newMode })
      setMode(newMode)
      fetchSettings()
    } catch (error) {
      console.error('Failed to change mode:', error)
    }
  }

  const handleAddLabel = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/device-label', newLabel)
      setNewLabel({ sourceIp: '', label: '' })
      fetchDeviceLabels()
    } catch (error) {
      console.error('Failed to add label:', error)
    }
  }

  const handleRemoveLabel = async (id) => {
    if (!window.confirm('Remove this device label?')) return
    try {
      await api.delete(`/admin/device-label/${id}`)
      fetchDeviceLabels()
    } catch (error) {
      console.error('Failed to remove label:', error)
    }
  }

  if (loading) {
    return <LoadingState message="Loading settings…" />
  }

  const modeConfig = MODE_CONFIG[mode] || MODE_CONFIG.IDS

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure IDPS operating mode, device labels, and system thresholds"
      />

      <Section title="IDPS Operating Mode">
        <div className="bg-base-800 border border-base-600 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-accent-500" />
            <div>
              <h3 className="text-sm font-semibold text-base-50">{modeConfig.label}</h3>
              <p className="text-xs text-base-400">{modeConfig.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {Object.entries(MODE_CONFIG).map(([key, config]) => (
              <Button
                key={key}
                variant="ghost"
                onClick={() => handleModeChange(key)}
                className={`flex-1 text-left py-3 ${
                  mode === key
                    ? 'bg-accent-500/10 text-accent-400 border border-accent-500/20'
                    : 'text-base-300 hover:bg-base-700 hover:text-base-50'
                }`}
              >
                <div className="font-medium">{config.label}</div>
                <div className="text-xs text-base-500">{config.description}</div>
              </Button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="mode" mode={mode.toLowerCase()}>
              Current mode: {mode}
            </Badge>
          </div>
        </div>
      </Section>

      <Section title="Device Labels">
        <div className="bg-base-800 border border-base-600 rounded-lg p-5">
          <form onSubmit={handleAddLabel} className="space-y-3 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newLabel.sourceIp}
                onChange={(e) => setNewLabel({ ...newLabel, sourceIp: e.target.value })}
                className="bg-base-700 border border-base-600 rounded-lg px-3 py-2 text-base-200 placeholder-base-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                placeholder="192.168.1.100"
                required
              />
              <input
                type="text"
                value={newLabel.label}
                onChange={(e) => setNewLabel({ ...newLabel, label: e.target.value })}
                className="bg-base-700 border border-base-600 rounded-lg px-3 py-2 text-base-200 placeholder-base-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                placeholder="Normal User Laptop"
                required
              />
            </div>
            <Button type="submit" className="w-auto">
              Add Label
            </Button>
          </form>

          <div className="space-y-2">
            {deviceLabels.length === 0 ? (
              <p className="text-xs text-base-500">No device labels configured.</p>
            ) : (
              deviceLabels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-base-700 border border-base-600"
                >
                  <div>
                    <div className="text-xs font-mono text-base-300">{label.sourceIp}</div>
                    <div className="text-[0.7rem] text-base-500">{label.label}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveLabel(label.id)}
                    className="p-1.5 text-base-500 hover:text-severity-critical hover:bg-severity-critical/10 rounded-md transition-colors"
                    aria-label="Remove label"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Section>

      <Section title="System Configuration">
        <div className="bg-base-800 border border-base-600 rounded-lg p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ConfigCard
              label="Rate Limit Threshold"
              value={`${settings.rate_limit_threshold || 50} requests/minute`}
            />
            <ConfigCard
              label="Login Failure Threshold"
              value={`${settings.login_failure_threshold || 5} attempts`}
            />
            <ConfigCard
              label="Max Payload Size"
              value={`${Math.round((settings.max_payload_size || 1048576) / 1024)} KB`}
            />
            <ConfigCard
              label="Temp Block Duration"
              value={`${Math.round((settings.temp_block_duration || 300) / 60)} minutes`}
            />
          </div>
        </div>
      </Section>
    </div>
  )
}

const ConfigCard = ({ label, value }) => (
  <div className="bg-base-700/50 border border-base-600 rounded-lg p-4">
    <div className="text-[0.7rem] font-medium text-base-500 uppercase tracking-tighter mb-1.5">
      {label}
    </div>
    <div className="text-sm font-medium text-base-300">{value}</div>
  </div>
)

export default Settings
