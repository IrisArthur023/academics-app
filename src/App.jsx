import { useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import AIWorkspace from './pages/AIWorkspace.jsx'

export default function App() {
  const [page, setPage] = useState('dashboard')
  return (
    <div className="app">
      <nav className="topnav">
        <span className="brand">Academics</span>
        <div className="navlinks">
          <button className={page === 'dashboard' ? 'on' : ''} onClick={() => setPage('dashboard')}>Dashboard</button>
          <button className={page === 'ai' ? 'on' : ''} onClick={() => setPage('ai')}>AI workspace</button>
        </div>
      </nav>
      {page === 'dashboard' ? <Dashboard goAI={() => setPage('ai')} /> : <AIWorkspace />}
    </div>
  )
}
