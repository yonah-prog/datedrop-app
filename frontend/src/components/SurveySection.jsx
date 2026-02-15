import { useState, useEffect } from 'react'
import axios from 'axios'
import './SurveySection.css'

export default function SurveySection({ section, onSave, onBack, onNext }) {
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSection()
  }, [section])

  const fetchSection = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/survey/section/${section}`)
      setQuestions(response.data.questions)
      setResponses(response.data.responses || {})
    } catch (err) {
      setError('Failed to load survey section')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (questionId, value, type = 'value') => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [type]: value,
      },
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')

      // Only save non-empty responses
      const filteredResponses = {}
      Object.entries(responses).forEach(([key, val]) => {
        if (val.value !== undefined && val.value !== null && val.value !== '') {
          filteredResponses[key] = val
        }
      })

      await axios.post(`/api/survey/section/${section}`, { responses: filteredResponses })
      onSave()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save responses')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="survey-loading">Loading section...</div>
  }

  return (
    <div className="survey-section">
      <h2>{questions[0]?.section_title || `Section ${section}`}</h2>

      {error && <div className="error">{error}</div>}

      <div className="survey-questions">
        {questions.map((q) => (
          <div key={q.id} className="survey-question">
            <label className="question-text">
              {q.id}. {q.question}
            </label>

            {/* Enum type - radio buttons */}
            {q.type === 'enum' && (
              <div className="options enum-options">
                {q.options.map((opt) => (
                  <label key={opt.value} className="option">
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      value={opt.value}
                      checked={responses[q.id]?.value === opt.value}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Likert type - scale 1-7 */}
            {q.type === 'likert' && (
              <div className="likert-scale">
                <div className="likert-labels">
                  <span>{q.labels[0]}</span>
                  <span>{q.labels[1]}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={q.scale}
                  value={responses[q.id]?.value || 4}
                  onChange={(e) => handleChange(q.id, parseInt(e.target.value))}
                  className="likert-slider"
                />
                <div className="likert-value">{responses[q.id]?.value || 4}</div>
              </div>
            )}

            {/* Multiselect type - checkboxes */}
            {q.type === 'multiselect' && (
              <div className="options multiselect-options">
                {q.options.map((opt) => (
                  <label key={opt.value} className="option">
                    <input
                      type="checkbox"
                      value={opt.value}
                      checked={(responses[q.id]?.value || []).includes(opt.value)}
                      onChange={(e) => {
                        const current = responses[q.id]?.value || []
                        if (e.target.checked) {
                          handleChange(q.id, [...current, opt.value])
                        } else {
                          handleChange(q.id, current.filter((v) => v !== opt.value))
                        }
                      }}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Text type - textarea */}
            {q.type === 'text' && (
              <textarea
                value={responses[q.id]?.value || ''}
                onChange={(e) => handleChange(q.id, e.target.value)}
                placeholder="Enter your response..."
                maxLength={q.maxLength || 500}
                className="survey-textarea"
              />
            )}

            {/* Importance weight selector */}
            <div className="importance-selector">
              <label>How important is this to you?</label>
              <select
                value={responses[q.id]?.importance_weight || 'somewhat'}
                onChange={(e) => handleChange(q.id, e.target.value, 'importance_weight')}
              >
                <option value="not_important">Not important</option>
                <option value="somewhat">Somewhat important</option>
                <option value="important">Important</option>
                <option value="dealbreaker">Dealbreaker</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="survey-actions">
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}
