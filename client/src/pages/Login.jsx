import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Shield, Lock, User } from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)

      if (email.includes('admin')) {
        navigate('/admin/overview')
      } else {
        navigate('/demo/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-accent-500" />
          </div>
          <h1 className="text-3xl font-bold text-base-50 mb-1 tracking-tight">WebShield</h1>
          <p className="text-sm text-base-400">Intrusion Detection &amp; Prevention System</p>
        </div>

        <div className="bg-base-800 border border-base-600 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-base-50 mb-5 tracking-tight">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-severity-critical/10 border border-severity-critical/20 text-sm text-severity-critical">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-base-700 border border-base-600 rounded-lg py-2.5 pl-9 pr-4 text-base-200 placeholder-base-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-base-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-base-700 border border-base-600 rounded-lg py-2.5 pl-9 pr-4 text-base-200 placeholder-base-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-base font-semibold rounded-lg bg-accent-500 text-base-900 hover:bg-accent-400 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-5 text-xs text-base-500 text-center">
            Use the account configured by your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
