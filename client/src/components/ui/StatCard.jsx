import React from 'react'

export default function StatCard({
  icon: Icon,
  label,
  value,
  variant = 'accent',
  trend,
  trendLabel,
}) {
  const colorMap = {
    accent: 'text-accent-500',
    success: 'text-status-online',
    warning: 'text-status-warning',
    danger: 'text-severity-critical',
    muted: 'text-base-400',
  }

  return (
    <div className="bg-base-800 border border-base-600 rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-base-400 font-medium">{label}</p>
          <div className="mt-1">
            <span className={`text-2xl font-bold ${colorMap[variant] || colorMap.accent}`}>
              {value}
            </span>
          </div>
        </div>
        {Icon && (
          <div className="p-2 bg-base-700 rounded-md text-base-300">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={`text-xs font-semibold rounded-md px-2 py-0.5 ${
              trend >= 0 ? 'bg-status-online/10 text-status-online' : 'bg-severity-critical/10 text-severity-critical'
            }`}
          >
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-base-400">{trendLabel}</span>
        </div>
      )}
    </div>
  )
}

export { StatCard }
