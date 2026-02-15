import { useState, useEffect } from 'react'
import axios from 'axios'
import MessageThread from '../components/MessageThread'
import './Messages.css'

export default function Messages() {
  const [threads, setThreads] = useState([])
  const [selectedThreadId, setSelectedThreadId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchThreads()
  }, [])

  const fetchThreads = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/message')
      setThreads(response.data)
    } catch (err) {
      setError('Failed to load messages')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMessageSent = () => {
    fetchThreads()
  }

  if (loading) {
    return <div className="messages-container">Loading...</div>
  }

  return (
    <div className="messages-container">
      <div className="messages-layout">
        {/* Left sidebar - conversation list */}
        <div className="threads-sidebar">
          <h2>Messages</h2>
          {error && <div className="error-banner">{error}</div>}

          {threads.length === 0 ? (
            <div className="no-threads">
              <p>No conversations yet. Start messaging your matches!</p>
            </div>
          ) : (
            <div className="threads-list">
              {threads.map(thread => (
                <button
                  key={thread.matchId}
                  className={`thread-item ${selectedThreadId === thread.matchId ? 'active' : ''}`}
                  onClick={() => setSelectedThreadId(thread.matchId)}
                >
                  <div className="thread-header">
                    <h4>{thread.otherUserName}</h4>
                    <span className="thread-location">📍 {thread.otherUserLocation}</span>
                  </div>
                  <p className="thread-preview">{thread.lastMessage}</p>
                  {thread.lastMessageTime && (
                    <small className="thread-time">
                      {new Date(thread.lastMessageTime).toLocaleDateString()}
                    </small>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right side - chat window */}
        <div className="messages-main">
          {selectedThreadId ? (
            <MessageThread
              matchId={selectedThreadId}
              onMessageSent={handleMessageSent}
            />
          ) : (
            <div className="no-thread-selected">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
