import { useState, useEffect } from 'react'
import axios from 'axios'

const ThresholdSettings = () => {
  const [thresholds, setThresholds] = useState({
    engine_rpm_max: 3000,
    oil_pressure_min: 20,
    oil_pressure_max: 80,
    coolant_temp_max: 95,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadThresholds()
  }, [])

  const loadThresholds = async () => {
    try {
      const response = await axios.get('/api/thresholds')
      setThresholds(response.data)
    } catch (error) {
      console.error('Error loading thresholds:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    try {
      await axios.put('/api/thresholds', thresholds)
      setMessage('✅ Thresholds saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving thresholds:', error)
      setMessage('❌ Failed to save thresholds')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Reset all thresholds to default values?')) return

    setLoading(true)
    try {
      const response = await axios.post('/api/thresholds/reset')
      setThresholds(response.data.thresholds)
      setMessage('✅ Thresholds reset to defaults')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error resetting thresholds:', error)
      setMessage('❌ Failed to reset thresholds')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Sensor Warning Thresholds</h3>
        <p className="text-gray-400 text-sm mb-6">
          Configure when sensors display warning colors. Values in{' '}
          <span className="text-orange-400">orange</span> are approaching limits,{' '}
          <span className="text-red-400">red</span> means exceeded.
        </p>
      </div>

      {/* Engine RPM */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🚤</span>
          <h4 className="text-lg font-semibold">Engine RPM</h4>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Maximum Safe RPM
            </label>
            <input
              type="number"
              step="100"
              value={thresholds.engine_rpm_max}
              onChange={(e) =>
                setThresholds({
                  ...thresholds,
                  engine_rpm_max: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Warning at 90%, danger above this value
            </p>
          </div>
        </div>
      </div>

      {/* Oil Pressure */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🛢️</span>
          <h4 className="text-lg font-semibold">Oil Pressure</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Minimum PSI
            </label>
            <input
              type="number"
              step="1"
              value={thresholds.oil_pressure_min}
              onChange={(e) =>
                setThresholds({
                  ...thresholds,
                  oil_pressure_min: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Danger below this</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Maximum PSI
            </label>
            <input
              type="number"
              step="1"
              value={thresholds.oil_pressure_max}
              onChange={(e) =>
                setThresholds({
                  ...thresholds,
                  oil_pressure_max: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Danger above this</p>
          </div>
        </div>
      </div>

      {/* Coolant Temperature */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🌡️</span>
          <h4 className="text-lg font-semibold">Coolant Temperature</h4>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Maximum Safe Temperature (°C)
            </label>
            <input
              type="number"
              step="1"
              value={thresholds.coolant_temp_max}
              onChange={(e) =>
                setThresholds({
                  ...thresholds,
                  coolant_temp_max: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Warning at 95%, danger above this value
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="text-center py-2 text-sm font-semibold">{message}</div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          disabled={loading}
          className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 py-3 bg-water-600 hover:bg-water-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Thresholds'}
        </button>
      </div>

      {/* Preview */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-2 text-gray-400">
          Current Thresholds:
        </h4>
        <div className="text-xs text-gray-500 space-y-1">
          <div>🚤 RPM: Max {thresholds.engine_rpm_max}</div>
          <div>
            🛢️ Oil: {thresholds.oil_pressure_min} - {thresholds.oil_pressure_max}{' '}
            PSI
          </div>
          <div>🌡️ Coolant: Max {thresholds.coolant_temp_max}°C</div>
        </div>
      </div>
    </div>
  )
}

export default ThresholdSettings
