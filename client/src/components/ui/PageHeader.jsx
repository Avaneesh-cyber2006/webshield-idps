import React from 'react'

export default function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-base-600 pb-6">
      <div>
        {breadcrumb && (
          <div className="flex items-center gap-1 text-xs text-base-400 mb-2">
            {breadcrumb.map((cr, i) => (
              <React.Fragment key={cr.label}>
                {i > 0 && <span className="mx-1">/</span>}
                <span className="font-medium text-base-300">{cr.label}</span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="text-2xl font-bold text-base-50 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-base-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export { PageHeader }
