import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <h1>DateDrop</h1>
        <button onClick={handleLogout}>Logout</button>
      </nav>
      <div className="dashboard-content">
        <h2>Welcome, {user?.full_name}</h2>
        <p>Email: {user?.email}</p>
        <div className="dashboard-sections">
          <section className="card">
            <h3>Profile</h3>
            <p>Set up your profile and preferences</p>
            <button onClick={() => navigate('/profile')}>Edit Profile</button>
          </section>
          <section className="card">
            <h3>Survey</h3>
            <p>Complete the 66-question compatibility survey</p>
            <button onClick={() => navigate('/survey')}>Start Survey</button>
          </section>
          <section className="card">
            <h3>Weekly Drop</h3>
            <p>Opt-in for the weekly matching event (Sunday 10 AM)</p>
            <button>View Drop Status</button>
          </section>
          <section className="card">
            <h3>Matches</h3>
            <p>View your matches and manage connections</p>
            <button onClick={() => navigate('/matches')}>View Matches</button>
          </section>
          <section className="card">
            <h3>Messages</h3>
            <p>Chat with your matched users</p>
            <button onClick={() => navigate('/messages')}>View Messages</button>
          </section>
        </div>
      </div>
    </div>
  )
}
