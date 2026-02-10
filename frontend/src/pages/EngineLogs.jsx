import { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const EngineLogs = () => {
  const [timeRange, setTimeRange] = useState(7)
  const [stats, setStats] = useState(null)
  const [usageSummary, setUsageSummary] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [rpmHistory, setRpmHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    // Refresh every minute
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [timeRange])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load statistics
      const statsRes = await axios.get('/api/engine/statistics')
      setStats(statsRes.data)

      // Load usage summary
      const usageRes = await axios.get(`/api/engine/usage-summary?days=${timeRange}`)
      setUsageSummary(usageRes.data)

      // Load alerts
      const alertsRes = await axios.get(`/api/engine/alerts?days=${timeRange}`)
      setAlerts(alertsRes.data.alerts || [])

      // Load RPM history for chart
      const historyRes = await axios.get(`/api/history/sensors/engine_rpm?limit=100`)
      const chartData = historyRes.data.data.map(d => ({
        time: new Date(d.timestamp).toLocaleTimeString(),
        rpm: d.value
      }))
      setRpmHistory(chartData)

    } catch (error) {
      console.error('Error loading engine data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, unit, icon, color = 'water' }) => (
    <div className={`bg-gradient-to-br from-${color}-600 to-${color}-700 rounded-lg p-6 shadow-xl`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-4xl">{icon}</span>
        <span className="text-sm text-white/70">{title}</span>
      </div>
      <div className="text-3xl font-bold text-white">
        {value}
        <span className="text-lg ml-2 text-white/80">{unit}</span>
      </div>
    </div>
  )

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-water-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading engine logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="engine-logs space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Engine Logs</h2>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {[1, 7, 30].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === days
                  ? 'bg-water-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {days === 1 ? 'Today' : `${days} Days`}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
          <h3 className="text-lg font-bold text-red-200 mb-2">
            ⚠️ {alerts.length} Alert{alerts.length > 1 ? 's' : ''} Detected
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-2 text-red-200">
                <span className="text-xl">
                  {alert.severity === 'critical' ? '🚨' : '⚠️'}
                </span>
                <div>
                  <p className="font-semibold">{alert.message}</p>
                  <p className="text-sm text-red-300">
                    {alert.type} • Count: {alert.count}
                    {alert.max_value && ` • Max: ${alert.max_value.toFixed(1)}`}
                    {alert.min_value && ` • Min: ${alert.min_value.toFixed(1)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Statistics */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Engine Hours"
              value={stats.engine.engine_hours.toFixed(2)}
              unit="hrs"
              icon="⏱️"
              color="water"
            />
            <StatCard
              title="Max RPM"
              value={Math.round(stats.engine.max_rpm)}
              unit="RPM"
              icon="🚤"
              color="sun"
            />
            <StatCard
              title="Avg RPM"
              value={Math.round(stats.engine.avg_rpm)}
              unit="RPM"
              icon="📊"
              color="nature"
            />
            <StatCard
              title="Total Readings"
              value={stats.engine.total_readings}
              unit="logs"
              icon="📝"
              color="water"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-4 text-water-400">Oil Pressure</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Max:</span>
                  <span className="font-bold">{stats.oil_pressure.max.toFixed(1)} PSI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg:</span>
                  <span className="font-bold">{stats.oil_pressure.avg.toFixed(1)} PSI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Min:</span>
                  <span className={stats.oil_pressure.min < 20 ? 'text-red-500 font-bold' : 'font-bold'}>
                    {stats.oil_pressure.min.toFixed(1)} PSI
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-4 text-sun-400">Coolant Temperature</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Max:</span>
                  <span className={stats.coolant_temperature.max > 95 ? 'text-red-500 font-bold' : 'font-bold'}>
                    {stats.coolant_temperature.max.toFixed(1)} °C
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg:</span>
                  <span className="font-bold">{stats.coolant_temperature.avg.toFixed(1)} °C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Min:</span>
                  <span className="font-bold">{stats.coolant_temperature.min.toFixed(1)} °C</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-4 text-nature-400">Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Alerts:</span>
                  <span className={`font-bold ${alerts.length > 0 ? 'text-red-500' : 'text-nature-500'}`}>
                    {alerts.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Logs:</span>
                  <span className="font-bold">{stats.engine.total_readings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Period:</span>
                  <span className="font-bold">{timeRange}d</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* RPM Chart */}
      {rpmHistory.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-white">Recent RPM History</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rpmHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="time" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="rpm"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 3 }}
                name="Engine RPM"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily Usage Breakdown */}
      {usageSummary && usageSummary.daily_usage.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-white">Daily Usage</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-2 text-gray-400">Date</th>
                  <th className="pb-2 text-gray-400">Hours</th>
                  <th className="pb-2 text-gray-400">Max RPM</th>
                  <th className="pb-2 text-gray-400">Avg RPM</th>
                  <th className="pb-2 text-gray-400">Readings</th>
                </tr>
              </thead>
              <tbody>
                {usageSummary.daily_usage.map((day, idx) => (
                  <tr key={idx} className="border-b border-gray-700/50">
                    <td className="py-3">{day.date}</td>
                    <td className="py-3 font-bold text-water-400">{day.estimated_hours}h</td>
                    <td className="py-3">{Math.round(day.max_rpm)}</td>
                    <td className="py-3">{Math.round(day.avg_rpm)}</td>
                    <td className="py-3 text-gray-400">{day.readings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="bg-gray-800/50 rounded-lg p-4 text-center text-gray-400 text-sm">
        <p>
          📝 Data is logged every 60 seconds when the system is running.
          Engine hours are estimated based on logged RPM readings.
        </p>
      </div>
    </div>
  )
}

export default EngineLogs
