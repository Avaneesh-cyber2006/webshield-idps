import React from 'react'

const severityStyles = {
  low: 'bg-severity-low/10 text-severity-low border border-severity-low/50',
  medium: 'bg-severity-medium/10 text-severity-medium border border-severity-medium/50',
  high: 'bg-severity-high/10 text-severity-high border border-severity-high/50',
  critical: 'bg-severity-critical/10 text-severity-critical border border-severity-critical/50',
}

const statusStyles = {
  online: 'bg-status-online/10 text-status-online border border-status-online/50',
  offline: 'bg-status-offline/10 text-status-offline border border-status-offline/50',
  warning: 'bg-status-warning/10 text-status-warning border border-status-warning/50',
  disconnected: 'bg-status-disconnected/10 text-status-disconnected border border-status-disconnected/50',
}

const modeStyles = {
  monitor: 'bg-mode-monitor/10 text-mode-monitor border border-mode-monitor/50',
  ids: 'bg-mode-ids/10 text-mode-ids border border-mode-ids/50',
  ips: 'bg-mode-ips/10 text-mode-ips border border-mode-ips/50',
}

export default function Badge({
  children,
  variant = 'severity',
  severity,
  status,
  mode,
  className = '',
}) {
  let key
  let styleSet

  if (variant === 'severity') {
    key = severity || 'low'
    styleSet = severityStyles
  } else if (variant === 'status') {
    key = status || 'offline'
    styleSet = statusStyles
  } else if (variant === 'mode') {
    key = mode || 'monitor'
    styleSet = modeStyles
  } else {
    key = variant
    styleSet = severityStyles
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[0.7rem] font-semibold tracking-tight uppercase ${styleSet[key] || styleSet.low} ${className}`}
    >
      {children}
    </span>
  )
}

export { Badge }
