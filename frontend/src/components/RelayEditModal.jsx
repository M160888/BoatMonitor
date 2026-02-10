import { useState } from 'react'

const RelayEditModal = ({ relay, onSave, onClose }) => {
  const [config, setConfig] = useState({
    name: relay.name,
    enabled: relay.enabled,
    mode: relay.mode,
    timed_duration: relay.timed_duration || 60,
  })

  // Convert seconds to hours/minutes/seconds for display
  const [timeUnit, setTimeUnit] = useState(
    config.timed_duration >= 3600 ? 'hours' :
    config.timed_duration >= 60 ? 'minutes' : 'seconds'
  )

  const getTimeValue = () => {
    if (timeUnit === 'hours') return config.timed_duration / 3600
    if (timeUnit === 'minutes') return config.timed_duration / 60
    return config.timed_duration
  }

  const setTimeValue = (value) => {
    let seconds = parseFloat(value) || 0
    if (timeUnit === 'hours') seconds *= 3600
    else if (timeUnit === 'minutes') seconds *= 60
    setConfig({ ...config, timed_duration: seconds })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(relay.id, config)
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold mb-6 text-white">
          Edit Relay Configuration
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Relay Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Relay Name
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-water-500"
              placeholder="e.g., Navigation Lights"
            />
          </div>

          {/* Enabled */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400">Enable Relay</label>
            <button
              type="button"
              onClick={() =>
                setConfig({ ...config, enabled: !config.enabled })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enabled ? 'bg-nature-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'normal' })}
                className={`py-2 px-4 rounded-lg font-semibold transition-colors ${
                  config.mode === 'normal'
                    ? 'bg-water-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'timed' })}
                className={`py-2 px-4 rounded-lg font-semibold transition-colors ${
                  config.mode === 'timed'
                    ? 'bg-sun-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                Auto-Off
              </button>
            </div>
          </div>

          {/* Timed Duration */}
          {config.mode === 'timed' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Auto-Off Duration
              </label>

              {/* Time Unit Selector */}
              <div className="flex gap-2 mb-2">
                {['seconds', 'minutes', 'hours'].map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setTimeUnit(unit)}
                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                      timeUnit === unit
                        ? 'bg-sun-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>

              <input
                type="number"
                step="0.1"
                min="0.1"
                value={getTimeValue()}
                onChange={(e) => setTimeValue(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sun-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Total duration: {formatDuration(config.timed_duration)}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                💡 Relay will turn on, stay on for this duration, then automatically turn off
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-water-600 hover:bg-water-700 rounded-lg font-semibold transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-4 p-3 bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-400">
            <strong>Relay ID:</strong> {relay.id}
            <br />
            <strong>Hardware:</strong> Board {relay.board_id + 1}, Relay{' '}
            {relay.relay_number + 1}
          </p>
        </div>
      </div>
    </div>
  )
}

export default RelayEditModal
