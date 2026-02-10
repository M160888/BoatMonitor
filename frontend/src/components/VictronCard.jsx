const VictronCard = ({ title, device, data, icon, color }) => {
  const getColorClasses = (color) => {
    const colors = {
      nature: 'from-nature-600 to-nature-700 border-nature-500',
      water: 'from-water-600 to-water-700 border-water-500',
      sun: 'from-sun-600 to-sun-700 border-sun-500',
    }
    return colors[color] || colors.water
  }

  const formatValue = (val, decimals = 1) => {
    if (typeof val === 'number') {
      return val.toFixed(decimals)
    }
    return val || '--'
  }

  if (!data) {
    return (
      <div className="h-full bg-gray-800 rounded-lg p-4 flex items-center justify-center">
        <span className="text-gray-500">No data available</span>
      </div>
    )
  }

  return (
    <div
      className={`h-full bg-gradient-to-br ${getColorClasses(
        color
      )} rounded-lg p-4 shadow-xl border-2 cursor-move relative`}
    >
      <div className="drag-handle absolute top-2 right-2 text-white/50 hover:text-white cursor-grab active:cursor-grabbing">
        ⋮⋮
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <span className="text-3xl">{icon}</span>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>

      {/* SmartShunt / BMV Display */}
      {(device.includes('smartshunt') || device.includes('bmv')) && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-white/70">Voltage</div>
            <div className="text-2xl font-bold text-white">
              {formatValue(data.voltage)}V
            </div>
          </div>
          <div>
            <div className="text-sm text-white/70">Current</div>
            <div className="text-2xl font-bold text-white">
              {formatValue(data.current)}A
            </div>
          </div>
          <div>
            <div className="text-sm text-white/70">State of Charge</div>
            <div className="text-2xl font-bold text-white">
              {formatValue(data.soc, 0)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-white/70">Power</div>
            <div className="text-2xl font-bold text-white">
              {formatValue(data.power)}W
            </div>
          </div>
        </div>
      )}

      {/* MPPT Display */}
      {device.includes('mppt') && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/70">State</span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
              {data.state}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-white/70">Solar Power</div>
              <div className="text-2xl font-bold text-white">
                {formatValue(data.solar_power)}W
              </div>
            </div>
            <div>
              <div className="text-sm text-white/70">Today</div>
              <div className="text-2xl font-bold text-white">
                {formatValue(data.yield_today)}kWh
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inverter Display */}
      {device.includes('inverter') && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/70">Status</span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
              {data.state}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-white/70">AC Voltage</div>
              <div className="text-2xl font-bold text-white">
                {formatValue(data.ac_voltage, 0)}V
              </div>
            </div>
            <div>
              <div className="text-sm text-white/70">AC Power</div>
              <div className="text-2xl font-bold text-white">
                {formatValue(data.ac_power, 0)}W
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VictronCard
