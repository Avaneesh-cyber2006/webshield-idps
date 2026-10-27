import React from 'react'

const variantStyles = {
  primary:
    'bg-accent-500 text-base-900 font-semibold hover:bg-accent-400 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900 transition-colors active:scale-[0.98]',
  secondary:
    'bg-base-700 text-base-200 font-semibold border border-base-500 hover:bg-base-600 hover:text-base-50 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900 transition-colors active:scale-[0.98]',
  ghost:
    'text-base-300 font-semibold hover:text-base-50 hover:bg-base-700 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900 transition-colors active:scale-[0.98]',
  danger:
    'bg-severity-critical text-base-50 font-semibold hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-severity-critical focus-visible:ring-offset-2 focus-visible:ring-offset-base-900 transition-colors active:scale-[0.98]',
  success:
    'bg-status-online text-base-50 font-semibold hover:bg-green-600 focus-visible:ring-2 focus-visible:ring-status-online focus-visible:ring-offset-2 focus-visible:ring-offset-base-900 transition-colors active:scale-[0.98]',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`rounded-md inline-flex items-center justify-center gap-2 ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export { Button }
