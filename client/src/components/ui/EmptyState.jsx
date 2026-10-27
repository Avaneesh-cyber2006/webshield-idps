import React from 'react'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-16 text-center ${className}`}
    >
      {Icon && (
        <div className="p-3 rounded-full bg-base-800 border border-base-600">
          <Icon className="w-8 h-8 text-base-500" />
        </div>
      )}
      <h3 className="text-base font-semibold text-base-300">{title}</h3>
      {description && (
        <p className="text-sm text-base-400 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export { EmptyState }
