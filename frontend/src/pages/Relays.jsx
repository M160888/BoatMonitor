import { useState, useEffect } from 'react'
import axios from 'axios'

const Relays = () => {
  const [relays, setRelays] = useState([])
  const [editingRelay, setEditingRelay] = useState(null)

  useEffect(() => {
    loadRelays()
  }, [])

  const loadRelays = async () => {
    try {
      const response = await axios.get('/api/relays')
      setRelays(response.data.relays)
    } catch (error) {
      console.error('Error loading relays:', error)
    }
  }

  const toggleRelay = async (relayId) => {
    try {
      await axios.post(`/api/relays/${relayId}/toggle`)
      loadRelays()
    } catch (error) {
      console.error('Error toggling relay:', error)
    }
  }

  const updateRelay = async (relayId, config) => {
    try {
      await axios.put(`/api/relays/${relayId}`, config)
      loadRelays()
      setEditingRelay(null)
    } catch (error) {
      console.error('Error updating relay:', error)
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
                ? 'border-nature-500'
                : 'border-gray-700'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{relay.name}</h3>
                <p className="text-sm text-gray-400">
                  Board {relay.board_id + 1} • Relay {relay.relay_number + 1}
                </p>
              </div>
              <button
                onClick={() => setEditingRelay(relay.id)}
                className="text-gray-400 hover:text-white"
              >
                ⚙️
              </button>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-center my-6">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${
                  relay.state
                    ? 'bg-nature-500 shadow-lg shadow-nature-500/50'
                    : 'bg-gray-700'
                }`}
              >
                {relay.state ? '⚡' : '○'}
              </div>
            </div>

            {/* Mode Badge */}
            {relay.mode === 'flash' && (
              <div className="text-center mb-4">
                <span className="px-3 py-1 bg-sun-600 rounded-full text-sm">
                  Flash Mode • {relay.flash_interval}s
                </span>
              </div>
            )}

            {/* Control Button */}
            <button
              onClick={() => toggleRelay(relay.id)}
              disabled={!relay.enabled}
              className={`w-full py-3 rounded-lg font-bold transition-all ${
                relay.enabled
                  ? relay.state
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-nature-600 hover:bg-nature-700'
                  : 'bg-gray-700 cursor-not-allowed'
              }`}
            >
              {relay.state ? 'Turn OFF' : 'Turn ON'}
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingRelay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Edit Relay</h3>
            {/* Edit form will go here */}
            <button
              onClick={() => setEditingRelay(null)}
              className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Relays
