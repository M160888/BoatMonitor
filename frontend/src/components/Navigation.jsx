import { NavLink } from 'react-router-dom'

const Navigation = ({ isConnected }) => {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/history', label: 'History', icon: '📈' },
    { path: '/relays', label: 'Relays', icon: '⚡' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <nav className="bg-gray-800 shadow-lg border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⛵</span>
            <h1 className="text-xl font-bold text-white">BoatMonitor</h1>
            <span className="text-sm text-gray-400">Shannon</span>
          </div>

          <div className="flex space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-water-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <span className="mr-2">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-nature-500' : 'bg-red-500'
              } animate-pulse`}
              title={isConnected ? 'Connected' : 'Disconnected'}
            />
            <span className="ml-2 text-sm text-gray-400">
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
