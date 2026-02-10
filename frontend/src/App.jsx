import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import SwipeIndicator from './components/SwipeIndicator'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Relays from './pages/Relays'
import Settings from './pages/Settings'
import { useWebSocket } from './utils/websocket'
import { useSwipeable } from 'react-swipeable'

function AppContent() {
  const [isConnected, setIsConnected] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Connect to WebSocket for real-time data
  useWebSocket('ws://localhost:8000/api/sensors/ws', {
    onOpen: () => setIsConnected(true),
    onClose: () => setIsConnected(false),
  })

  // Define page order for swipe navigation
  const pages = ['/dashboard', '/history', '/relays', '/settings']
  const currentIndex = pages.indexOf(location.pathname)

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // Swipe left = next page
      if (currentIndex < pages.length - 1) {
        navigate(pages[currentIndex + 1])
      }
    },
    onSwipedRight: () => {
      // Swipe right = previous page
      if (currentIndex > 0) {
        navigate(pages[currentIndex - 1])
      }
    },
    trackMouse: false, // Only track touch, not mouse
    preventScrollOnSwipe: false, // Allow vertical scrolling
    delta: 50, // Minimum swipe distance
  })

  return (
    <div {...handlers} className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Navigation isConnected={isConnected} />
      <main className="container mx-auto px-4 py-6 pb-24">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/relays" element={<Relays />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      {/* Swipe indicator */}
      <SwipeIndicator currentPage={currentIndex} totalPages={pages.length} />
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
