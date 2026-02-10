import { useState, useEffect } from 'react'
import axios from 'axios'
import RelayEditModal from '../components/RelayEditModal'

const Relays = () => {
  const [relays, setRelays] = useState([])
  const [editingRelay, setEditingRelay] = useState(null)
  const [loading, setLoading] = useState(false)
  const [ws, setWs] = useState(null)

  useEffect(() => {
    loadRelays()

    // Connect to WebSocket for real-time updates
    const websocket = new WebSocket('ws://localhost:8000/api/relays/ws')

    websocket.onopen = () => {
      console.log('Relay WebSocket connected')
    }

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.type === 'relay_update' && message.data) {
          setRelays(Object.values(message.data))
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    websocket.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...')
      setTimeout(() => {
        // Reconnect after 3 seconds
        window.location.reload()
      }, 3000)
    }

    setWs(websocket)

    return () => {
      if (websocket) {
        websocket.close()
      }
    }
  }, [])

  const loadRelays = async () => {
    try {
      const response = await axios.get('/api/relays')
      setRelays(response.data.relays)
    } catch (error) {
      console.error('Error loading relays:', error)
    }
  }

  const toggleRelay = async (relayId, currentState) => {
    if (loading) return
    setLoading(true)

    try {
      const endpoint = currentState ? 'off' : 'on'
      await axios.post(`/api/relays/${relayId}/${endpoint}`)
      // WebSocket will update the state automatically
    } catch (error) {
      console.error('Error toggling relay:', error)
      alert('Failed to toggle relay')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async (relayId, config) => {
    try {
      await axios.put(`/api/relays/${relayId}`, config)
      await loadRelays()
      setEditingRelay(null)
    } catch (error) {
      console.error('Error updating relay:', error)
      alert('Failed to update relay configuration')
    }
  }

  const formatDuration = (seconds) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    } else if (seconds >= 60) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
    } else {
      return `${seconds}s`
    }
  }

  return (
    <div className="relays">
      <h2 className="text-3xl font-bold text-white mb-6">Relay Control</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relays.map((relay) => (
          <div
            key={relay.id}
            className={`bg-gray-800 rounded-lg p-6 shadow-xl border-2 transition-all ${
              relay.state
                ? 'border-nature-500 shadow-nature-500/30'
                : 'border-gray-700'
            } ${!relay.enabled ? 'opacity-50' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold">{relay.name}</h3>
                <p className="text-sm text-gray-400">
                  Board {relay.board_id + 1} • Relay {relay.relay_number + 1}
                </p>
              </div>
              <button
                onClick={() => setEditingRelay(relay)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Edit relay settings"
              >
                ⚙️
              </button>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-center my-6">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-all ${
                  relay.state
                    ? 'bg-nature-500 shadow-lg shadow-nature-500/50'
                    : 'bg-gray-700'
                }`}
              >
                {relay.state ? '⚡' : '○'}
              </div>
            </div>

            {/* Mode Badge */}
            <div className="flex justify-center gap-2 mb-4 min-h-[32px]">
              {relay.mode === 'timed' && (
                <span className="px-3 py-1 bg-sun-600 rounded-full text-sm">
                  Auto-Off • {formatDuration(relay.timed_duration)}
                </span>
              )}
              {!relay.enabled && (
                <span className="px-3 py-1 bg-gray-600 rounded-full text-sm">
                  Disabled
                </span>
              )}
            </div>

            {/* Control Button */}
            <button
              onClick={() => toggleRelay(relay.id, relay.state)}
              disabled={!relay.enabled || loading}
              className={`w-full py-3 rounded-lg font-bold transition-all ${
                relay.enabled
                  ? relay.state
                    ? 'bg-red-600 hover:bg-red-700 active:scale-95'
                    : 'bg-nature-600 hover:bg-nature-700 active:scale-95'
                  : 'bg-gray-700 cursor-not-allowed'
              } ${loading ? 'opacity-50 cursor-wait' : ''}`}
            >
              {loading ? '...' : relay.state ? 'Turn OFF' : 'Turn ON'}
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingRelay && (
        <RelayEditModal
          relay={editingRelay}
          onSave={handleSaveConfig}
          onClose={() => setEditingRelay(null)}
        />
      )}
    </div>
  )
}

export default Relays
