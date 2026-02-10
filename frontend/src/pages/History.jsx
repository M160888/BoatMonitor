import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const History = () => {
  const [selectedMetric, setSelectedMetric] = useState('solar')
  const [timeRange, setTimeRange] = useState('7days')

  const metrics = [
    { id: 'solar', label: 'Solar Yield', icon: '☀️' },
    { id: 'battery', label: 'Battery Status', icon: '🔋' },
    { id: 'fuel', label: 'Fuel Consumption', icon: '⛽' },
    { id: 'engine', label: 'Engine Hours', icon: '🚤' },
  ]

  const timeRanges = [
    { id: '24h', label: '24 Hours' },
    { id: '7days', label: '7 Days' },
    { id: '30days', label: '30 Days' },
    { id: '90days', label: '90 Days' },
  ]

  // Mock data - will be replaced with real API data
  const data = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    value: Math.random() * 100,
  }))

  return (
    <div className="history">
      <h2 className="text-3xl font-bold text-white mb-6">History & Trends</h2>

      {/* Metric Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => (
          <button
            key={metric.id}
            onClick={() => setSelectedMetric(metric.id)}
            className={`p-4 rounded-lg transition-all ${
              selectedMetric === metric.id
                ? 'bg-water-600 shadow-lg scale-105'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <span className="text-3xl mb-2 block">{metric.icon}</span>
            <span className="text-sm">{metric.label}</span>
          </button>
        ))}
      </div>

      {/* Time Range Selection */}
      <div className="flex space-x-2 mb-6">
        {timeRanges.map((range) => (
          <button
            key={range.id}
            onClick={() => setTimeRange(range.id)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              timeRange === range.id
                ? 'bg-water-600'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
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
              dataKey="value"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ fill: '#0ea5e9' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Average</h3>
          <p className="text-3xl font-bold text-nature-500">--</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Peak</h3>
          <p className="text-3xl font-bold text-sun-500">--</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Total</h3>
          <p className="text-3xl font-bold text-water-500">--</p>
        </div>
      </div>
    </div>
  )
}

export default History
