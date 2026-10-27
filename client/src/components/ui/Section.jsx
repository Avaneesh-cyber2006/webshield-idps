import React from 'react'

export default function Section({ children, title, className = '' }) {
  return (
    <div className={`mb-8 ${className}`}>
      {title && (
        <h2 className="text-lg font-semibold text-base-50 mb-3 tracking-tight">
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}

export { Section }
