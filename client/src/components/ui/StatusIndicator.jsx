import React from 'react'

export default function StatusIndicator({ status, label, size = 'sm' }) {
  const colorMap = {
    online: 'bg-status-online',
    offline: 'bg-severity-critical',
    warning: 'bg-status-warning',
    disconnected: 'bg-base-400',
  }

  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`rounded-full ${sizeMap[size]} animate-pulse ${colorMap[status] || colorMap.disconnected}`}
        aria-label={`${label}: ${status}`}
      />
      <span className={`text-sm ${label ? 'text-base-300' : 'text-base-400'}`}>
        {label}
      </span>
    </div>
  )
}

export { StatusIndicator }
