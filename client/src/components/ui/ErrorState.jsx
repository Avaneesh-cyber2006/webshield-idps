import React from 'react'

export default function ErrorState({
  title = 'Unable to load',
  message,
  onRetry,
  retryLabel = 'Try again',
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-12 text-center ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="w-10 h-10 rounded-full bg-severity-critical/10 flex items-center justify-center">
        <span className="text-severity-critical font-bold text-lg">!</span>
      </div>
      <h3 className="text-base font-semibold text-base-300">{title}</h3>
      {message && <p className="text-sm text-base-400 max-w-xs">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-accent-500 text-base-900 hover:bg-accent-400 transition-colors"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}

export { ErrorState }
