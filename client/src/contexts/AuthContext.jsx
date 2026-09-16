import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
      // Token is stored in httpOnly cookie, we don't have direct access
      // For Socket.IO auth, we'll need to fetch a temporary token
    } catch (error) {
      setUser(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    setUser(response.data.user)
    // Token is stored in httpOnly cookie
    return response.data
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
    setToken(null)
  }

  const value = {
    user,
    loading,
    token,
    login,
    logout,
    checkAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
