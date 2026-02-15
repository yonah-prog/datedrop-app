import { useState, useEffect } from 'react'
import axios from 'axios'
import './Profile.css'

export default function Profile() {
  const [profile, setProfile] = useState({
    where_from: '',
    where_live: '',
    high_school: '',
    college: '',
    yeshiva_seminary: '',
    about_me: '',
    location_radius: 50,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/profile')
      setProfile(response.data || {
        where_from: '',
        where_live: '',
        high_school: '',
        college: '',
        yeshiva_seminary: '',
        about_me: '',
        location_radius: 50,
      })
    } catch (err) {
      setError('Failed to load profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({
      ...prev,
      [name]: name === 'location_radius' ? parseInt(value) : value,
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      await axios.post('/api/profile', profile)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="profile-container">Loading...</div>
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Your Profile</h1>
        <p>Set up your public profile that matches will see</p>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <form className="profile-form" onSubmit={handleSave}>
        <div className="form-section">
          <h2>Location Information</h2>
          <div className="form-group">
            <label htmlFor="where_from">Where are you from? *</label>
            <input
              type="text"
              id="where_from"
              name="where_from"
              value={profile.where_from || ''}
              onChange={handleChange}
              placeholder="City, State (e.g., New York, NY)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="where_live">Where do you currently live? *</label>
            <input
              type="text"
              id="where_live"
              name="where_live"
              value={profile.where_live || ''}
              onChange={handleChange}
              placeholder="City, State (e.g., Los Angeles, CA)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="location_radius">
              How far are you willing to go? (miles)
            </label>
            <div className="range-input">
              <input
                type="range"
                id="location_radius"
                name="location_radius"
                min="5"
                max="500"
                value={profile.location_radius || 50}
                onChange={handleChange}
                className="radius-slider"
              />
              <span className="radius-value">{profile.location_radius || 50} miles</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Education</h2>
          <div className="form-group">
            <label htmlFor="high_school">High School</label>
            <input
              type="text"
              id="high_school"
              name="high_school"
              value={profile.high_school || ''}
              onChange={handleChange}
              placeholder="School name (optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="college">College/University</label>
            <input
              type="text"
              id="college"
              name="college"
              value={profile.college || ''}
              onChange={handleChange}
              placeholder="School name (optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="yeshiva_seminary">Yeshiva/Seminary</label>
            <input
              type="text"
              id="yeshiva_seminary"
              name="yeshiva_seminary"
              value={profile.yeshiva_seminary || ''}
              onChange={handleChange}
              placeholder="Institution name (optional)"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>About You</h2>
          <div className="form-group">
            <label htmlFor="about_me">About Me</label>
            <textarea
              id="about_me"
              name="about_me"
              value={profile.about_me || ''}
              onChange={handleChange}
              placeholder="Tell matches about yourself... (max 500 characters)"
              maxLength="500"
              rows="6"
            />
            <small className="char-count">
              {(profile.about_me || '').length}/500 characters
            </small>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving} className="btn-save">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      <div className="profile-info">
        <h3>📋 Profile Tips</h3>
        <ul>
          <li>Be authentic - matches can see your real information</li>
          <li>Location is visible to matches only, never public</li>
          <li>Your "About Me" should reflect your personality and values</li>
          <li>Mention what's important to you (community, learning, family, etc.)</li>
          <li>Be honest about your location preferences</li>
        </ul>
      </div>
    </div>
  )
}
