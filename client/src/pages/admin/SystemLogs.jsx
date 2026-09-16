import React from 'react'
import { FileText } from 'lucide-react'

const SystemLogs = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">System Logs</h1>

      <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-accent-500" />
          <h2 className="text-xl font-semibold text-white">Server Logs</h2>
        </div>
        <div className="bg-dark-900 rounded-lg p-4 font-mono text-sm text-gray-300 max-h-96 overflow-auto">
          <div className="space-y-1">
            <div>[2026-09-16 19:00:00] INFO: WebShield server started on port 5000</div>
            <div>[2026-09-16 19:00:00] INFO: Database connected successfully</div>
            <div>[2026-09-16 19:00:00] INFO: Socket.IO server initialized</div>
            <div>[2026-09-16 19:00:00] INFO: IDPS inspector initialized</div>
            <div>[2026-09-16 19:00:01] INFO: IDPS mode set to IDS</div>
            <div>[2026-09-16 19:05:23] INFO: New connection from 192.168.1.15</div>
            <div>[2026-09-16 19:05:24] INFO: Request GET /api/admin/overview from 192.168.1.15</div>
            <div>[2026-09-16 19:05:25] INFO: Security event detected: SQL_INJECTION (risk: 40)</div>
            <div>[2026-09-16 19:05:26] INFO: Action taken: ALERT</div>
            <div>[2026-09-16 19:10:00] INFO: Client disconnected</div>
          </div>
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg border border-dark-600 p-6 mt-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-accent-500" />
          <h2 className="text-xl font-semibold text-white">Security Event Logs</h2>
        </div>
        <div className="bg-dark-900 rounded-lg p-4 font-mono text-sm text-gray-300 max-h-96 overflow-auto">
          <div className="space-y-1">
            <div>[2026-09-16 19:05:25] SECURITY: SQL_INJECTION detected from 192.168.1.15</div>
            <div>[2026-09-16 19:05:25] SECURITY: Severity: HIGH, Risk Score: 40</div>
            <div>[2026-09-16 19:05:25] SECURITY: Action: ALERT</div>
            <div>[2026-09-16 19:06:00] SECURITY: XSS pattern detected from 192.168.1.16</div>
            <div>[2026-09-16 19:06:00] SECURITY: Severity: HIGH, Risk Score: 35</div>
            <div>[2026-09-16 19:06:00] SECURITY: Action: ALERT</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemLogs
