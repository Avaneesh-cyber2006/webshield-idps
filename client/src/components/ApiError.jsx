import React, { useEffect, useState } from 'react'

export default function ApiError() {
  const [message, setMessage] = useState('')
  useEffect(() => {
    const show = (event) => setMessage(event.detail)
    window.addEventListener('api-error', show)
    return () => window.removeEventListener('api-error', show)
  }, [])
  if (!message) return null
  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 max-w-lg bg-base-800 border border-severity-critical/50 rounded-lg p-4 shadow-lg animate-slide-up"
    >
      <div className="flex items-start gap-2">
        <span className="text-severity-critical font-bold text-lg">!</span>
        <div>
          <p className="text-sm text-base-200 font-medium">{message}</p>
          <button
            onClick={() => setMessage('')}
            className="mt-1.5 text-xs font-medium text-accent-500 underline underline-offset-4 hover:text-accent-400"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
