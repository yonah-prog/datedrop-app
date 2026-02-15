import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './MessageThread.css'

export default function MessageThread({ matchId, onMessageSent }) {
  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchMessages()
    // Poll for new messages every 2 seconds
    const interval = setInterval(fetchMessages, 2000)
    return () => clearInterval(interval)
  }, [matchId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/message/${matchId}`)
      setMessages(response.data.messages)
      setOtherUser(response.data.otherUser)
      setLoading(false)
    } catch (err) {
      if (err.response?.status === 403) {
        setError('This conversation has ended')
      } else {
        setError('Failed to load messages')
      }
      console.error(err)
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    try {
      setSending(true)
      setError('')

      await axios.post(`/api/message/${matchId}/send`, {
        content: newMessage.trim(),
      })

      setNewMessage('')
      await fetchMessages()
      onMessageSent()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="message-thread-loading">Loading...</div>
  }

  if (error && error.includes('ended')) {
    return (
      <div className="message-thread-container">
        <div className="conversation-ended">
          <p>💔 This conversation has ended</p>
        </div>
      </div>
    )
  }

  return (
    <div className="message-thread-container">
      {/* Thread header */}
      <div className="thread-header">
        <div className="header-info">
          <h3>{otherUser?.full_name}</h3>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-list">
        {error && <div className="error-message">{error}</div>}

        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`message ${message.isOwn ? 'own' : 'other'}`}
            >
              <div className="message-bubble">
                <p>{message.content}</p>
                <small className="message-time">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </small>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          maxLength="1000"
          className="message-input"
        />
        <button type="submit" disabled={sending || !newMessage.trim()} className="send-btn">
          {sending ? '...' : '📤'}
        </button>
      </form>
    </div>
  )
}
