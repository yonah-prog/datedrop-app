import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Matches.css'

export default function Matches() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [dropStatus, setDropStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [optingIn, setOptingIn] = useState(false)

  useEffect(() => {
    fetchMatches()
    fetchDropStatus()
  }, [])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/match')
      setMatches(response.data)
    } catch (err) {
      setError('Failed to load matches')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDropStatus = async () => {
    try {
      const response = await axios.get('/api/match/drop/status')
      setDropStatus(response.data)
    } catch (err) {
      console.error('Failed to fetch drop status:', err)
    }
  }

  const handleOptIn = async () => {
    try {
      setOptingIn(true)
      await axios.post('/api/match/drop/optin', { optIn: true })
      fetchDropStatus()
    } catch (err) {
      setError('Failed to opt in')
    } finally {
      setOptingIn(false)
    }
  }

  const handleOptOut = async () => {
    try {
      setOptingIn(true)
      await axios.post('/api/match/drop/optin', { optIn: false })
      fetchDropStatus()
    } catch (err) {
      setError('Failed to opt out')
    } finally {
      setOptingIn(false)
    }
  }

  const handleRespond = async (matchId, action) => {
    try {
      await axios.post(`/api/match/${matchId}/respond`, { action })
      // Refresh matches
      fetchMatches()
    } catch (err) {
      setError(`Failed to ${action} match`)
    }
  }

  if (loading) {
    return <div className="matches-container">Loading...</div>
  }

  const nextDropDate = dropStatus?.nextDrop
    ? new Date(dropStatus.nextDrop.eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Next Sunday 10 AM'

  return (
    <div className="matches-container">
      <div className="matches-header">
        <h1>Your Matches</h1>
        <p>Connect with compatible users</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Drop Status Card */}
      <div className="drop-status-card">
        <div className="drop-info">
          <h3>Weekly Drop</h3>
          <p className="drop-date">{nextDropDate}</p>
          <p className="drop-description">
            Opt in to be matched with compatible users every Sunday at 10 AM
          </p>
        </div>
        <div className="drop-actions">
          {dropStatus?.nextDrop?.optedIn ? (
            <button onClick={handleOptOut} disabled={optingIn} className="btn-secondary">
              {optingIn ? 'Updating...' : 'Opted In ✓'}
            </button>
          ) : (
            <button onClick={handleOptIn} disabled={optingIn} className="btn-primary">
              {optingIn ? 'Opting In...' : 'Opt In'}
            </button>
          )}
        </div>
      </div>

      {/* Matches List */}
      {matches.length === 0 ? (
        <div className="no-matches">
          <div className="no-matches-icon">💔</div>
          <h2>No Matches Yet</h2>
          <p>
            {dropStatus?.nextDrop?.optedIn
              ? 'You're opted in! Matches will appear after the next drop.'
              : 'Opt in to the weekly drop to start getting matched!'}
          </p>
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map((match) => (
            <div key={match.id} className="match-card">
              <div className="match-header">
                <h3>{match.fullName}</h3>
                <span className="match-location">
                  📍 {match.city}, {match.state}
                </span>
              </div>

              <div className="match-about">
                <p>{match.aboutMe || 'No bio added yet'}</p>
              </div>

              <div className="match-dates">
                <small>
                  Matched: {new Date(match.createdAt).toLocaleDateString()}
                </small>
                <small>
                  Expires: {new Date(match.expiresAt).toLocaleDateString()}
                </small>
              </div>

              <div className="match-actions">
                <button
                  onClick={() => navigate('/messages')}
                  className="btn-accept"
                >
                  💬 Message
                </button>
                <button
                  onClick={() => handleRespond(match.id, 'deny')}
                  className="btn-deny"
                >
                  ✕ Pass
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
