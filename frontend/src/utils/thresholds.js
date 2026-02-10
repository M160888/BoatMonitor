/**
 * Threshold utilities for sensor warning colors
 */

export const getStatusColor = (sensorType, value, thresholds) => {
  if (!thresholds || value === null || value === undefined) {
    return 'normal'
  }

  switch (sensorType) {
    case 'engine_rpm':
      if (value > thresholds.engine_rpm_max) return 'danger'
      if (value > thresholds.engine_rpm_max * 0.9) return 'warning'
      return 'normal'

    case 'oil_pressure':
      if (value < thresholds.oil_pressure_min || value > thresholds.oil_pressure_max) {
        return 'danger'
      }
      if (value < thresholds.oil_pressure_min * 1.1 || value > thresholds.oil_pressure_max * 0.9) {
        return 'warning'
      }
      return 'normal'

    case 'coolant_temp':
      if (value > thresholds.coolant_temp_max) return 'danger'
      if (value > thresholds.coolant_temp_max * 0.95) return 'warning'
      return 'normal'

    default:
      return 'normal'
  }
}

export const getColorClasses = (status, baseColor) => {
  switch (status) {
    case 'danger':
      return 'from-red-600 to-red-700 shadow-red-500/30 animate-pulse'
    case 'warning':
      return 'from-orange-600 to-orange-700 shadow-orange-500/30'
    case 'normal':
    default:
      const colors = {
        nature: 'from-nature-600 to-nature-700 shadow-nature-500/20',
        water: 'from-water-600 to-water-700 shadow-water-500/20',
        sun: 'from-sun-600 to-sun-700 shadow-sun-500/20',
      }
      return colors[baseColor] || colors.water
  }
}

export const getWarningIcon = (status) => {
  switch (status) {
    case 'danger':
      return '🚨'
    case 'warning':
      return '⚠️'
    default:
      return null
  }
}
