import React from 'react'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`bg-base-800 border border-base-600 rounded-xl w-full max-w-lg p-6 shadow-lg max-h-[90vh] overflow-y-auto animate-fade-in ${className}`}
        role="document"
      >
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2
              id="modal-title"
              className="text-xl font-semibold text-base-50 tracking-tight"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-base-400 hover:text-base-50 hover:bg-base-700 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export { Modal }
