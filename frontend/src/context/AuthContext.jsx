import React, { createContext, useState, useEffect } from 'react'
import axios from 'axios'

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
    const response = await axios.post('/api/auth/login', { email, password })
    const { token } = response.data
    localStorage.setItem('token', token)
    setToken(token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    await fetchUser()
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const signup = async (email, password, full_name, date_of_birth, terms_accepted) => {
    const response = await axios.post('/api/auth/signup', {
      email,
      password,
      full_name,
      date_of_birth,
      terms_accepted,
    })
    return response.data
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
