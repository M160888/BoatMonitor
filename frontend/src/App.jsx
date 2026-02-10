import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Relays from './pages/Relays'
import Settings from './pages/Settings'
import { useWebSocket } from './utils/websocket'

function App() {
  const [isConnected, setIsConnected] = useState(false)

  // Connect to WebSocket for real-time data
  useWebSocket('ws://localhost:8000/api/sensors/ws', {
    onOpen: () => setIsConnected(true),
    onClose: () => setIsConnected(false),
  })

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <Navigation isConnected={isConnected} />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/relays" element={<Relays />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
