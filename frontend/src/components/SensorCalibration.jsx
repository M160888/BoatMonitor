import { useState, useEffect } from 'react'
import axios from 'axios'
import { useSensorStore } from '../utils/store'

const SensorCalibration = ({ password }) => {
  const { sensors } = useSensorStore()
  const [calibration, setCalibration] = useState(null)
  const [saving, setSaving] = useState(false)
  const [testMode, setTestMode] = useState(false)

  useEffect(() => {
    loadCalibration()
  }, [])

  const loadCalibration = async () => {
    try {
      const response = await axios.get('/api/calibration', {
        headers: { password }
      })
      setCalibration(response.data)
    } catch (error) {
      console.error('Error loading calibration:', error)
      // Set defaults if none exist
      setCalibration({
        fuel_tank: { min: 0, max: 4095, offset: 0, scale: 1 },
        water_tank: { min: 0, max: 4095, offset: 0, scale: 1 },
        waste_tank: { min: 0, max: 4095, offset: 0, scale: 1 },
        oil_pressure: { offset: 0, scale: 1 },
        coolant_temp: { offset: 0, scale: 1 },
        engine_rpm: { offset: 0, scale: 1 }
      })
    }
  }

  const saveCalibration = async () => {
    setSaving(true)
    try {
      await axios.put('/api/calibration', calibration, {
        headers: { password }
      })
      alert('Calibration saved successfully!')
    } catch (error) {
      console.error('Error saving calibration:', error)
      alert('Failed to save calibration: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  const updateCalibration = (sensor, field, value) => {
    setCalibration(prev => ({
      ...prev,
      [sensor]: {
        ...prev[sensor],
        [field]: parseFloat(value) || 0
      }
    }))
  }

  const setCurrentAsMin = (sensor) => {
    if (!sensors[sensor]) {
      alert('No current reading available')
      return
    }
    // Get raw ADC value (would need to be exposed by backend)
    // For now, use percentage as proxy
    updateCalibration(sensor, 'min', sensors[sensor])
  }

  const setCurrentAsMax = (sensor) => {
    if (!sensors[sensor]) {
      alert('No current reading available')
      return
    }
    updateCalibration(sensor, 'max', sensors[sensor])
  }

  if (!calibration) {
    return <div className="text-center py-8">Loading calibration data...</div>
  }

  const TankCalibration = ({ sensor, title, icon }) => (
    <div className="bg-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{icon}</span>
        <h4 className="text-lg font-bold">{title}</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Empty (0%) Calibration */}
        <div className="bg-gray-800 rounded p-3">
          <label className="block text-sm text-gray-400 mb-2">
            Empty (0%) - Raw ADC Value
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={calibration[sensor]?.min || 0}
              onChange={(e) => updateCalibration(sensor, 'min', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-900 rounded"
              min="0"
              max="4095"
            />
            <button
              onClick={() => setCurrentAsMin(sensor)}
              className="px-3 py-2 bg-water-600 hover:bg-water-700 rounded text-sm whitespace-nowrap"
            >
              Use Current
            </button>
          </div>
        </div>

        {/* Full (100%) Calibration */}
        <div className="bg-gray-800 rounded p-3">
          <label className="block text-sm text-gray-400 mb-2">
            Full (100%) - Raw ADC Value
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={calibration[sensor]?.max || 4095}
              onChange={(e) => updateCalibration(sensor, 'max', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-900 rounded"
              min="0"
              max="4095"
            />
            <button
              onClick={() => setCurrentAsMax(sensor)}
              className="px-3 py-2 bg-water-600 hover:bg-water-700 rounded text-sm whitespace-nowrap"
            >
              Use Current
            </button>
          </div>
        </div>
      </div>

      {/* Current Reading Display */}
      {testMode && (
        <div className="mt-3 p-3 bg-gray-800 rounded">
          <div className="text-sm text-gray-400">Current Reading:</div>
          <div className="text-2xl font-bold text-water-400">
            {sensors[sensor]?.toFixed(1) || '--'}%
          </div>
        </div>
      )}
    </div>
  )

  const AnalogCalibration = ({ sensor, title, icon, unit }) => (
    <div className="bg-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{icon}</span>
        <h4 className="text-lg font-bold">{title}</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Offset */}
        <div className="bg-gray-800 rounded p-3">
          <label className="block text-sm text-gray-400 mb-2">
            Offset ({unit})
          </label>
          <input
            type="number"
            step="0.1"
            value={calibration[sensor]?.offset || 0}
            onChange={(e) => updateCalibration(sensor, 'offset', e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Added to raw value
          </p>
        </div>

        {/* Scale */}
        <div className="bg-gray-800 rounded p-3">
          <label className="block text-sm text-gray-400 mb-2">
            Scale Factor
          </label>
          <input
            type="number"
            step="0.01"
            value={calibration[sensor]?.scale || 1}
            onChange={(e) => updateCalibration(sensor, 'scale', e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Multiplied with raw value
          </p>
        </div>
      </div>

      {/* Current Reading Display */}
      {testMode && (
        <div className="mt-3 p-3 bg-gray-800 rounded">
          <div className="text-sm text-gray-400">Current Reading:</div>
          <div className="text-2xl font-bold text-sun-400">
            {sensors[sensor]?.toFixed(1) || '--'} {unit}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold">Sensor Calibration</h3>
          <p className="text-sm text-gray-400 mt-1">
            Calibrate sensors to match actual physical values
          </p>
        </div>
        <button
          onClick={() => setTestMode(!testMode)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            testMode
              ? 'bg-nature-600 hover:bg-nature-700'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {testMode ? '✓ Test Mode ON' : 'Test Mode'}
        </button>
      </div>

      {testMode && (
        <div className="bg-water-900/30 border border-water-500 rounded-lg p-3 mb-4">
          <p className="text-sm text-water-200">
            🔴 <strong>Test Mode Active:</strong> Current sensor readings are displayed below each sensor.
            Adjust tanks/sensors and use "Use Current" buttons to calibrate.
          </p>
        </div>
      )}

      {/* Tank Sensors */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-water-400 mb-3">Tank Level Sensors</h4>
        <TankCalibration sensor="fuel_tank" title="Fuel Tank" icon="⛽" />
        <TankCalibration sensor="water_tank" title="Water Tank" icon="💧" />
        <TankCalibration sensor="waste_tank" title="Waste Tank" icon="🚽" />
      </div>

      {/* Analog Sensors */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-sun-400 mb-3">Analog Sensors</h4>
        <AnalogCalibration sensor="oil_pressure" title="Oil Pressure" icon="🛢️" unit="PSI" />
        <AnalogCalibration sensor="coolant_temp" title="Coolant Temperature" icon="🌡️" unit="°C" />
        <AnalogCalibration sensor="engine_rpm" title="Engine RPM" icon="🚤" unit="RPM" />
      </div>

      {/* Calibration Guide */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <h4 className="text-lg font-bold mb-2">📚 Calibration Guide</h4>
        <div className="space-y-2 text-sm text-gray-300">
          <p><strong>Tank Sensors:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Enable "Test Mode" to see live readings</li>
            <li>Empty the tank completely, click "Use Current" for 0%</li>
            <li>Fill the tank completely, click "Use Current" for 100%</li>
            <li>Save calibration</li>
          </ol>
          <p className="mt-3"><strong>Analog Sensors:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Offset:</strong> Add/subtract a fixed value (e.g., sensor reads 5 PSI when should be 0)</li>
            <li><strong>Scale:</strong> Multiply readings (e.g., 0.5 to halve values, 2.0 to double)</li>
            <li>Formula: <code className="bg-gray-800 px-1">final_value = (raw_value * scale) + offset</code></li>
          </ul>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={loadCalibration}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold"
        >
          Reset
        </button>
        <button
          onClick={saveCalibration}
          disabled={saving}
          className="px-6 py-3 bg-nature-600 hover:bg-nature-700 disabled:bg-gray-700 rounded-lg font-semibold"
        >
          {saving ? 'Saving...' : '💾 Save Calibration'}
        </button>
      </div>
    </div>
  )
}

export default SensorCalibration
