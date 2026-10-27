import React from 'react'

export default function LoadingState({ message = 'Loading…', className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-12 text-base-400 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="w-8 h-8 border-2 border-base-600 border-t-accent-500 rounded-full animate-[spin_1s_linear_infinite]" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}

export { LoadingState }
