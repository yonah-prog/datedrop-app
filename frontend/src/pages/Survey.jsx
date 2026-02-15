import { useState, useEffect } from 'react'
import axios from 'axios'
import SurveySection from '../components/SurveySection'
import './Survey.css'

const SECTION_TITLES = {
  1: 'Religious Practice & Observance',
  2: 'Hashkafa & Values',
  3: 'Learning, Career & Ambition',
  4: 'Lifestyle & Personality',
  5: 'Marriage, Home & Family Vision',
  6: 'Compatibility & Reflection',
}

export default function Survey() {
  const [currentSection, setCurrentSection] = useState(1)
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/survey/progress')
      setProgress(response.data)
    } catch (err) {
      setError('Failed to load survey progress')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSectionSave = () => {
    fetchProgress()
  }

  const handleNext = () => {
    if (currentSection < 6) {
      setCurrentSection(currentSection + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1)
      window.scrollTo(0, 0)
    }
  }

  const getProgressPercentage = () => {
    let total = 0
    let answered = 0
    Object.values(progress).forEach((sec) => {
      answered += sec.answered
      total += sec.total
    })
    return total === 0 ? 0 : Math.round((answered / total) * 100)
  }

  if (loading) {
    return <div className="survey-container">Loading...</div>
  }

  const isCompleted = progress[currentSection]?.answered === progress[currentSection]?.total

  return (
    <div className="survey-container">
      <div className="survey-header">
        <h1>Compatibility Survey</h1>
        <p>Complete the 66-question survey at your own pace</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="survey-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${getProgressPercentage()}%` }} />
        </div>
        <div className="progress-text">{getProgressPercentage()}% Complete</div>
      </div>

      <div className="section-tabs">
        {Object.entries(SECTION_TITLES).map(([num, title]) => {
          const sec = parseInt(num)
          const sectionProgress = progress[sec] || { answered: 0, total: 0 }
          const isActive = sec === currentSection
          const isFilled = sectionProgress.answered > 0

          return (
            <button
              key={sec}
              className={`tab ${isActive ? 'active' : ''} ${isFilled ? 'filled' : ''}`}
              onClick={() => setCurrentSection(sec)}
            >
              <span className="tab-number">{sec}</span>
              <span className="tab-title">{title.split(' ')[0]}...</span>
              <span className="tab-progress">
                {sectionProgress.answered}/{sectionProgress.total}
              </span>
            </button>
          )
        })}
      </div>

      <div className="survey-content">
        <SurveySection
          section={currentSection}
          onSave={handleSectionSave}
          onBack={handleBack}
          onNext={handleNext}
        />
      </div>

      <div className="section-navigation">
        <div className="section-info">
          Section {currentSection} of 6
          {isCompleted && <span className="completed-badge">✓ Completed</span>}
        </div>
        <div className="nav-buttons">
          <button onClick={handleBack} disabled={currentSection === 1} className="nav-btn">
            ← Previous Section
          </button>
          <button
            onClick={handleNext}
            disabled={currentSection === 6}
            className="nav-btn primary"
          >
            Next Section →
          </button>
        </div>
      </div>
    </div>
  )
}
