import axios from 'axios'

// Use relative URLs for same-origin access (works on localhost and LAN)
const API_URL = '/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = ['/auth/me', '/auth/login'].includes(error.config?.url)
    if (!isAuthRequest) {
      window.dispatchEvent(new CustomEvent('api-error', { detail: error.response?.data?.message || 'Cannot reach the server. Please try again.' }))
    }
    if (error.response?.status === 401 && !isAuthRequest && window.location.pathname !== '/login') {
      // Session checks and failed sign-ins are handled by their callers.
      // Never reload the login page in response to an unauthorized request.
      window.location.replace('/login')
    }
    return Promise.reject(error)
  }
)

export default api
