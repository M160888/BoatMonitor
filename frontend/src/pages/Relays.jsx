import { useState, useEffect } from 'react'
import axios from 'axios'
import RelayEditModal from '../components/RelayEditModal'

const Relays = () => {
  const [relays, setRelays] = useState([])
  const [editingRelay, setEditingRelay] = useState(null)
  const [loading, setLoading] = useState({})
  const [ws, setWs] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadRelays()

    // Connect to WebSocket for real-time updates
    const connectWebSocket = () => {
      try {
        // Use relative WebSocket URL to work through Vite proxy
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${protocol}//${window.location.host}/api/relays/ws`
        console.log('Connecting to WebSocket:', wsUrl)
        const websocket = new WebSocket(wsUrl)

        websocket.onopen = () => {
          console.log('Relay WebSocket connected')
          setWsConnected(true)
          setError(null)
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
          setWsConnected(false)
        }

        websocket.onclose = () => {
          console.log('WebSocket disconnected')
          setWsConnected(false)
          // Retry connection after 3 seconds
          setTimeout(connectWebSocket, 3000)
        }

        setWs(websocket)
      } catch (error) {
        console.error('Failed to create WebSocket:', error)
        setError('Failed to connect to relay updates')
      }
    }

    connectWebSocket()

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [])

  const loadRelays = async () => {
    try {
      const response = await axios.get('/api/relays')
      setRelays(response.data.relays)
      setError(null)
    } catch (error) {
      console.error('Error loading relays:', error)
      setError('Failed to load relays. Is the backend running?')
    }
  }

  const toggleRelay = async (relayId, currentState) => {
    if (loading[relayId]) return

    setLoading({ ...loading, [relayId]: true })

    try {
      const endpoint = currentState ? 'off' : 'on'
      console.log(`Toggling relay ${relayId} to ${endpoint}`)

      const response = await axios.post(`/api/relays/${relayId}/${endpoint}`)
      console.log('Toggle response:', response.data)

      setError(null)
      // WebSocket will update the state automatically, but fallback to refresh
      setTimeout(() => {
        if (!wsConnected) {
          loadRelays()
        }
      }, 500)
    } catch (error) {
      console.error('Error toggling relay:', error)
      setError(`Failed to toggle ${relayId}`)
      alert(`Failed to toggle relay: ${error.message}`)
    } finally {
      setLoading({ ...loading, [relayId]: false })
    }
  }

  const handleSaveConfig = async (relayId, config) => {
    try {
      console.log('Saving config:', relayId, config)
      await axios.put(`/api/relays/${relayId}`, config)
      await loadRelays()
      setEditingRelay(null)
      setError(null)
    } catch (error) {
      console.error('Error updating relay:', error)
      setError(`Failed to update ${relayId}`)
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Relay Control</h2>

        {/* Connection status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              wsConnected ? 'bg-nature-500 animate-pulse' : 'bg-red-500'
            }`}
            title={wsConnected ? 'Live updates active' : 'Reconnecting...'}
          />
          <span className="text-sm text-gray-400">
            {wsConnected ? 'Live' : 'Polling'}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
          <p className="text-red-200">{error}</p>
          <button
            onClick={loadRelays}
            className="mt-2 px-4 py-2 bg-red-700 hover:bg-red-600 rounded text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {relays.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">Loading relays...</p>
          <div className="animate-spin w-8 h-8 border-4 border-water-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
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
                  className="text-gray-400 hover:text-white transition-colors text-2xl"
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
                disabled={!relay.enabled || loading[relay.id]}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  relay.enabled
                    ? relay.state
                      ? 'bg-red-600 hover:bg-red-700 active:scale-95'
                      : 'bg-nature-600 hover:bg-nature-700 active:scale-95'
                    : 'bg-gray-700 cursor-not-allowed'
                } ${loading[relay.id] ? 'opacity-50 cursor-wait' : ''}`}
              >
                {loading[relay.id] ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Working...</span>
                  </div>
                ) : (
                  relay.state ? 'Turn OFF' : 'Turn ON'
                )}
              </button>
            </div>
          ))}
        </div>
      )}

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
