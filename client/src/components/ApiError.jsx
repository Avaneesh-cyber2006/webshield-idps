import React, { useEffect, useState } from 'react'

export default function ApiError() {
  const [message, setMessage] = useState('')
  useEffect(() => {
    const show = event => setMessage(event.detail)
    window.addEventListener('api-error', show)
    return () => window.removeEventListener('api-error', show)
  }, [])
  if (!message) return null
  return <div role="alert" className="fixed bottom-4 right-4 z-50 max-w-lg bg-dark-800 border border-danger-500 text-white p-4 rounded">
    {message} <button onClick={() => setMessage('')} className="ml-4 underline">Dismiss</button>
  </div>
}
