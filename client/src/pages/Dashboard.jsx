import React from 'react'
import { Shield, Activity, AlertTriangle } from 'lucide-react'

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Welcome to WebShield Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-8 h-8 text-accent-500" />
            <span className="text-sm text-gray-400">Status</span>
          </div>
          <div className="text-2xl font-bold text-white">Protected</div>
          <div className="text-sm text-gray-400 mt-1">IDPS Active</div>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-success-500" />
            <span className="text-sm text-gray-400">Requests</span>
          </div>
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-sm text-gray-400 mt-1">Total requests</div>
        </div>

        <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-warning-500" />
            <span className="text-sm text-gray-400">Threats</span>
          </div>
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-sm text-gray-400 mt-1">Security events</div>
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">About This Demo</h2>
        <div className="space-y-4 text-gray-300">
          <p>
            This is a protected demonstration application that is monitored by the WebShield
            Intrusion Detection and Prevention System.
          </p>
          <p>
            All requests to this application are inspected for security threats including:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
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
    </div>
  )
}

export default Dashboard
