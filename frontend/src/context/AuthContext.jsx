import React, { createContext, useState, useEffect } from 'react'
import axios from 'axios'

// Configure axios base URL for API calls
const apiBaseURL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000'
axios.defaults.baseURL = apiBaseURL
axios.defaults.headers.post['Content-Type'] = 'application/json'
axios.defaults.timeout = 10000

// Log configuration on app load
console.log('🔧 API Configuration:')
console.log('  Base URL:', apiBaseURL)
console.log('  Environment:', import.meta.env.MODE)
console.log('  REACT_APP_API_URL:', import.meta.env.REACT_APP_API_URL)

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      setUser(response.data)
    } catch (err) {
      console.error('Failed to fetch user:', err)
      localStorage.removeItem('token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      console.log('🔐 Login request:', { email })
      const response = await axios.post('/api/auth/login', { email, password })
      const { token } = response.data
      console.log('✅ Login successful')
      localStorage.setItem('token', token)
      setToken(token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      await fetchUser()
    } catch (error) {
      console.error('❌ Login error:', error.message, error.response?.data)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const signup = async (email, password, full_name, date_of_birth, terms_accepted) => {
    try {
      console.log('Signup request to:', `${apiBaseURL}/api/auth/signup`)
      const response = await axios.post('/api/auth/signup', {
        email,
        password,
        full_name,
        date_of_birth,
        terms_accepted,
      })
      console.log('Signup response:', response.data)
      return response.data
    } catch (error) {
      console.error('Signup API error:', error.message, error.response?.data)
      throw error
    }
  }

  const verifyEmail = async (verificationToken) => {
    const response = await axios.post('/api/auth/verify-email', {
      token: verificationToken,
    })
    return response.data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, verifyEmail, token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
