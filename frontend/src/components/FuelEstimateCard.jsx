import { useState, useEffect } from 'react'
import axios from 'axios'
import { useSensorStore } from '../utils/store'

const FuelEstimateCard = () => {
  const { sensors } = useSensorStore()
  const [unit, setUnit] = useState(() => localStorage.getItem('fuel-unit') || 'lph')
  const [fuelRate, setFuelRate] = useState(0)
  const [tripFuel, setTripFuel] = useState(0)
  const [tripStart, setTripStart] = useState(null)

  useEffect(() => {
    // Calculate fuel consumption rate based on RPM
    // Basic formula: ~0.1 LPH per 100 RPM (rough estimate for marine diesel)
    // This will be more accurate once you have a flow meter
    const rpm = sensors.engine_rpm || 0

    if (rpm > 500) {
      // Engine is running
      const lph = (rpm / 100) * 0.12 // Rough estimate
      setFuelRate(lph)

      // Track trip fuel consumption
      if (tripStart) {
        const elapsedHours = (Date.now() - tripStart) / (1000 * 60 * 60)
        setTripFuel(prev => prev + (lph * (1/3600))) // Add fuel per second
      } else {
        // Auto-start trip when engine starts
        setTripStart(Date.now())
      }
    } else {
      setFuelRate(0)
    }
  }, [sensors.engine_rpm, tripStart])

  const toggleUnit = () => {
    const newUnit = unit === 'lph' ? 'gph' : 'lph'
    setUnit(newUnit)
    localStorage.setItem('fuel-unit', newUnit)
  }

  const resetTrip = () => {
    setTripFuel(0)
    setTripStart(sensors.engine_rpm > 500 ? Date.now() : null)
  }

  const convertToGallons = (liters) => liters * 0.264172

  const displayRate = unit === 'gph' ? convertToGallons(fuelRate) : fuelRate
  const displayTrip = unit === 'gph' ? convertToGallons(tripFuel) : tripFuel

  return (
    <div className="h-full bg-gradient-to-br from-sun-600 to-sun-700 rounded-lg p-4 shadow-xl">
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-3xl">⛽</span>
            <h3 className="text-sm font-semibold text-white/90">Fuel Estimate</h3>
          </div>
          <button
            onClick={toggleUnit}
            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors text-white font-semibold"
          >
            {unit.toUpperCase()}
          </button>
        </div>

        <div className="flex-1 space-y-3">
          {/* Current Rate */}
          <div className="text-center bg-black/20 rounded-lg p-2">
            <div className="text-xs text-white/70 mb-1">Current Rate</div>
            <div className="text-2xl font-bold text-white">
              {displayRate.toFixed(2)}
              <span className="text-sm ml-1">{unit.toUpperCase()}</span>
            </div>
          </div>

          {/* Trip Fuel */}
          <div className="text-center bg-black/20 rounded-lg p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-white/70">Trip Fuel</div>
              <button
                onClick={resetTrip}
                className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="text-2xl font-bold text-white">
              {displayTrip.toFixed(2)}
              <span className="text-sm ml-1">{unit === 'lph' ? 'L' : 'gal'}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="text-xs text-white/60 text-center">
            ⚠️ Estimate only. Install flow meter for accuracy.
          </div>
        </div>
      </div>
    </div>
  )
}

export default FuelEstimateCard
