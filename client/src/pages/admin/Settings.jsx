import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Shield, Network } from 'lucide-react'
import api from '../../services/api'

const Settings = () => {
  const [settings, setSettings] = useState({})
  const [mode, setMode] = useState('IDS')
  const [deviceLabels, setDeviceLabels] = useState([])
  const [newLabel, setNewLabel] = useState({ sourceIp: '', label: '' })

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
    }
  }

  const fetchDeviceLabels = async () => {
    try {
      const response = await api.get('/admin/device-labels')
      setDeviceLabels(response.data.labels)
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

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-accent-500" />
            <h2 className="text-xl font-semibold text-white">IDPS Mode</h2>
          </div>
          <div className="space-y-3">
            <ModeButton
              label="Monitor Mode"
              description="Log only, no detection or prevention"
              mode="MONITOR"
              currentMode={mode}
              onChange={handleModeChange}
            />
            <ModeButton
              label="IDS Mode"
              description="Detect, classify, log, and alert - no prevention"
              mode="IDS"
              currentMode={mode}
              onChange={handleModeChange}
            />
            <ModeButton
              label="IPS Mode"
              description="Detect, classify, log, alert, and prevent"
              mode="IPS"
              currentMode={mode}
              onChange={handleModeChange}
            />
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Network className="w-5 h-5 text-accent-500" />
            <h2 className="text-xl font-semibold text-white">Device Labels</h2>
          </div>

          <form onSubmit={handleAddLabel} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Source IP</label>
              <input
                type="text"
                value={newLabel.sourceIp}
                onChange={(e) => setNewLabel({ ...newLabel, sourceIp: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-500"
                placeholder="192.168.1.100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Label</label>
              <input
                type="text"
                value={newLabel.label}
                onChange={(e) => setNewLabel({ ...newLabel, label: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-500"
                placeholder="Normal User Laptop"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-accent-600 hover:bg-accent-500 text-white py-2 rounded-lg transition-colors"
            >
              Add Label
            </button>
          </form>

          <div className="space-y-2">
            {deviceLabels.map((label) => (
              <div key={label.id} className="bg-dark-700 rounded-lg p-3 border border-dark-600">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-mono text-sm">{label.sourceIp}</div>
                    <div className="text-gray-400 text-sm">{label.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-600 p-6 mt-6">
        <div className="flex items-center space-x-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-accent-500" />
          <h2 className="text-xl font-semibold text-white">System Configuration</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigItem label="Rate Limit Threshold" value={`${settings.rate_limit_threshold || 50} requests/minute`} />
          <ConfigItem label="Login Failure Threshold" value={`${settings.login_failure_threshold || 5} attempts`} />
          <ConfigItem label="Max Payload Size" value={`${(settings.max_payload_size || 1048576) / 1024} KB`} />
          <ConfigItem label="Temp Block Duration" value={`${(settings.temp_block_duration || 300) / 60} minutes`} />
        </div>
      </div>
    </div>
  )
}

const ModeButton = ({ label, description, mode, currentMode, onChange }) => {
  const isActive = currentMode === mode

  return (
    <button
      onClick={() => onChange(mode)}
      className={`w-full text-left p-4 rounded-lg border transition-colors ${
        isActive
          ? 'bg-accent-600 border-accent-500 text-white'
          : 'bg-dark-700 border-dark-600 text-gray-300 hover:bg-dark-600'
      }`}
    >
      <div className="font-semibold mb-1">{label}</div>
      <div className="text-sm opacity-80">{description}</div>
    </button>
  )
}

const ConfigItem = ({ label, value }) => (
  <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
    <div className="text-sm text-gray-400 mb-1">{label}</div>
    <div className="text-white font-semibold">{value}</div>
  </div>
)

export default Settings
