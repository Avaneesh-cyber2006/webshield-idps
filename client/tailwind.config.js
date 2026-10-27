/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base slate-like cybersecurity palette (flat, no gradients/glows)
        base: {
          900: '#0a0e1a',   // background - deep navy-black
          800: '#111827',   // surface (cards, panels)
          700: '#1f2937',   // surface-hover / elevated
          600: '#334155',   // border
          500: '#475569',   // border-hover / secondary border
          400: '#64748b',   // text-muted
          300: '#94a3b8',   // text-secondary
          200: '#cbd5e1',   // text-secondary-emphasis
          100: '#e2e8f0',   // text-primary on dark accents
          50: '#f8fafc',    // text-primary / inverse text
        },
        accent: {
          500: '#22d3ee',   // primary action (cyan - classic SOC)
          400: '#06b6d4',   // accent hover / active
        },
        // Severity palette (meaningful, consistent across tables/badges/charts)
        severity: {
          low: '#3b82f6',      // blue
          medium: '#eab308',   // amber
          high: '#f97316',     // orange
          critical: '#ef4444', // red
        },
        // Status palette
        status: {
          online: '#22c55e',     // green
          offline: '#ef4444',    // red
          warning: '#f59e0b',    // amber
          disconnected: '#64748b', // slate
        },
        // Operating mode distinction (MONITOR / IDS / IPS)
        mode: {
          monitor: '#64748b',   // slate
          ids: '#3b82f6',       // blue
          ips: '#ef4444',       // red
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.01em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.01em' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
      },
      spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
