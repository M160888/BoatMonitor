import { useState } from 'react'
import axios from 'axios'

const Settings = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState('calibration')

  const handleLogin = async () => {
    try {
      // Test authentication
      await axios.get('/api/settings/system', {
        headers: { password }
      })
      setIsAuthenticated(true)
    } catch (error) {
      alert('Invalid password')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-gray-800 rounded-lg p-8 w-96 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-center">🔒 Settings Access</h2>
          <p className="text-gray-400 mb-4 text-center">
            Enter password to access settings
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 bg-gray-700 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-water-500"
            placeholder="Password"
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-water-600 hover:bg-water-700 rounded-lg font-bold transition-colors"
          >
            Unlock Settings
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'calibration', label: 'Sensor Calibration', icon: '🎯' },
    { id: 'hardware', label: 'Hardware', icon: '🔧' },
    { id: 'network', label: 'Network', icon: '📡' },
    { id: 'system', label: 'System', icon: '⚙️' },
  ]

  return (
    <div className="settings">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Settings</h2>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          🔒 Lock
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-water-600'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
        {activeTab === 'calibration' && (
          <div>
            <h3 className="text-xl font-bold mb-4">Sensor Calibration</h3>
            <p className="text-gray-400 mb-4">
              Configure calibration settings for sensors
            </p>
            {/* Calibration form will go here */}
          </div>
        )}

        {activeTab === 'hardware' && (
          <div>
            <h3 className="text-xl font-bold mb-4">Hardware Discovery</h3>
            <button className="px-4 py-2 bg-nature-600 hover:bg-nature-700 rounded-lg mb-4">
              Discover Automation 2040W Boards
            </button>
            <button className="px-4 py-2 bg-water-600 hover:bg-water-700 rounded-lg ml-2">
              Scan Victron Devices
            </button>
          </div>
        )}

        {activeTab === 'network' && (
          <div>
            <h3 className="text-xl font-bold mb-4">Network Configuration</h3>
            <button className="px-4 py-2 bg-water-600 hover:bg-water-700 rounded-lg">
              Scan WiFi Networks
            </button>
          </div>
        )}

        {activeTab === 'system' && (
          <div>
            <h3 className="text-xl font-bold mb-4">System Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Sensor Poll Interval (seconds)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                  defaultValue="0.5"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Simulation Mode
                </label>
                <select className="w-full px-4 py-2 bg-gray-700 rounded-lg">
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings
