import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')
  const { verifyEmail } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage('No verification token provided')
        return
      }

      try {
        await verifyEmail(token)
        setStatus('success')
        setMessage('Email verified successfully! Redirecting to login...')
        setTimeout(() => navigate('/login'), 2000)
      } catch (err) {
        setStatus('error')
        setMessage(err.response?.data?.error || 'Email verification failed')
      }
    }

    verify()
  }, [searchParams, verifyEmail, navigate])

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Email Verification</h1>
        {status === 'verifying' && <p>Verifying your email...</p>}
        {status === 'success' && <div className="success">{message}</div>}
        {status === 'error' && <div className="error">{message}</div>}
      </div>
    </div>
  )
}
