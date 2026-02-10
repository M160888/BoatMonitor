import { useState, useEffect } from 'react'
import axios from 'axios'
import { useSensorStore } from '../utils/store'

const RealTimeAlert = () => {
  const { sensors } = useSensorStore()
  const [thresholds, setThresholds] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    loadThresholds()
    const interval = setInterval(loadThresholds, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (thresholds && sensors) {
      checkAlerts()
    }
  }, [sensors, thresholds])

  const loadThresholds = async () => {
    try {
      const response = await axios.get('/api/thresholds')
      setThresholds(response.data)
    } catch (error) {
      console.error('Error loading thresholds:', error)
    }
  }

  const checkAlerts = () => {
    const newAlerts = []

    // Check RPM
    if (sensors.engine_rpm > thresholds.engine_rpm_max) {
      newAlerts.push({
        severity: 'critical',
        sensor: 'RPM',
        message: `Engine RPM is ${sensors.engine_rpm.toFixed(0)} (max: ${thresholds.engine_rpm_max})`,
        icon: '🚨',
        value: sensors.engine_rpm,
        threshold: thresholds.engine_rpm_max
      })
    }

    // Check oil pressure (low)
    if (sensors.oil_pressure > 0 && sensors.oil_pressure < thresholds.oil_pressure_min) {
      newAlerts.push({
        severity: 'critical',
        sensor: 'Oil Pressure',
        message: `Oil pressure is LOW: ${sensors.oil_pressure.toFixed(1)} PSI (min: ${thresholds.oil_pressure_min})`,
        icon: '🚨',
        value: sensors.oil_pressure,
        threshold: thresholds.oil_pressure_min
      })
    }

    // Check oil pressure (high)
    if (sensors.oil_pressure > thresholds.oil_pressure_max) {
      newAlerts.push({
        severity: 'warning',
        sensor: 'Oil Pressure',
        message: `Oil pressure is HIGH: ${sensors.oil_pressure.toFixed(1)} PSI (max: ${thresholds.oil_pressure_max})`,
        icon: '⚠️',
        value: sensors.oil_pressure,
        threshold: thresholds.oil_pressure_max
      })
    }

    // Check coolant temperature
    if (sensors.coolant_temp > thresholds.coolant_temp_max) {
      newAlerts.push({
        severity: 'critical',
        sensor: 'Coolant Temperature',
        message: `Coolant temperature is HIGH: ${sensors.coolant_temp.toFixed(1)}°C (max: ${thresholds.coolant_temp_max})`,
        icon: '🚨',
        value: sensors.coolant_temp,
        threshold: thresholds.coolant_temp_max
      })
    }

    setAlerts(newAlerts)

    // Reset dismissed state if there are new alerts
    if (newAlerts.length > 0 && alerts.length === 0) {
      setDismissed(false)
    }
  }

  if (alerts.length === 0 || dismissed) {
    return null
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className={`rounded-lg shadow-2xl p-4 ${
        alerts.some(a => a.severity === 'critical')
          ? 'bg-red-900/95 border-2 border-red-500'
          : 'bg-yellow-900/95 border-2 border-yellow-500'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl animate-pulse">
                {alerts.some(a => a.severity === 'critical') ? '🚨' : '⚠️'}
              </span>
              <h3 className="text-xl font-bold text-white">
                {alerts.length} Active Alert{alerts.length > 1 ? 's' : ''}
              </h3>
            </div>
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xl">{alert.icon}</span>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{alert.sensor}</p>
                    <p className="text-sm text-white/90">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

export default RealTimeAlert
