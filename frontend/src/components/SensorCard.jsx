import { useState, useEffect } from 'react'
import axios from 'axios'
import { getStatusColor, getColorClasses, getWarningIcon } from '../utils/thresholds'

const SensorCard = ({ id, title, value, unit, icon, color, type }) => {
  const [thresholds, setThresholds] = useState(null)

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

  const status = getStatusColor(id, value, thresholds)
  const warningIcon = getWarningIcon(status)

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toFixed(1)
    }
    return val || '--'
  }

  return (
    <div
      className={`h-full bg-gradient-to-br ${getColorClasses(
        status,
        color
      )} rounded-lg p-4 shadow-xl hover:scale-105 transition-transform cursor-move relative`}
    >
      {/* Drag Handle */}
      <div className="drag-handle absolute top-2 right-2 text-white/50 hover:text-white cursor-grab active:cursor-grabbing">
        ⋮⋮
      </div>

      <div className="flex flex-col h-full justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-3xl">{icon}</span>
            <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          </div>
          {warningIcon && (
            <span className="text-2xl animate-pulse">{warningIcon}</span>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center">
          {type === 'tank' ? (
            // Tank level visualization
            <div className="w-full">
              <div className="text-4xl font-bold text-white text-center mb-2">
                {formatValue(value)}
                <span className="text-xl ml-1">{unit}</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ) : (
            // Normal value display
            <div className="text-center">
              <div className="text-5xl font-bold text-white">
                {formatValue(value)}
              </div>
              <div className="text-lg text-white/80 mt-1">{unit}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SensorCard
