import { useState, useEffect } from 'react'
import axios from 'axios'

const WeatherTimeCard = () => {
  const [time, setTime] = useState(new Date())
  const [weather, setWeather] = useState(null)
  const [weatherSource, setWeatherSource] = useState('none') // 'internet', 'hat', 'none'

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    // Try to load weather
    loadWeather()
    const weatherInterval = setInterval(loadWeather, 600000) // Update every 10 minutes

    return () => {
      clearInterval(timeInterval)
      clearInterval(weatherInterval)
    }
  }, [])

  const loadWeather = async () => {
    // Try internet weather first (if available)
    try {
      // TODO: When internet is available, call a weather API
      // For now, check if we have a local weather endpoint from weather hat
      const response = await axios.get('/api/weather/current', { timeout: 2000 })
      setWeather(response.data)
      setWeatherSource(response.data.source || 'hat')
    } catch (error) {
      // No weather data available
      setWeather(null)
      setWeatherSource('none')
    }
  }

  const formatTime = () => {
    return time.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const formatDate = () => {
    return time.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getWeatherIcon = () => {
    if (!weather) return '🌡️'

    // Map weather conditions to emojis
    if (weather.condition?.includes('rain')) return '🌧️'
    if (weather.condition?.includes('cloud')) return '☁️'
    if (weather.condition?.includes('sun') || weather.condition?.includes('clear')) return '☀️'
    if (weather.condition?.includes('storm')) return '⛈️'
    return '🌡️'
  }

  return (
    <div className="h-full bg-gradient-to-br from-water-600 to-water-700 rounded-lg p-4 shadow-xl">
      <div className="flex flex-col h-full justify-between">
        {/* Time */}
        <div className="text-center mb-3">
          <div className="text-4xl font-bold text-white font-mono tracking-wider">
            {formatTime()}
          </div>
          <div className="text-sm text-white/80 mt-1">
            {formatDate()}
          </div>
        </div>

        {/* Weather */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {weather ? (
            <div className="text-center">
              <div className="text-5xl mb-2">{getWeatherIcon()}</div>
              <div className="text-3xl font-bold text-white">
                {weather.temperature ? `${weather.temperature.toFixed(1)}°C` : '--'}
              </div>
              {weather.humidity && (
                <div className="text-sm text-white/80 mt-1">
                  💧 {weather.humidity}% humidity
                </div>
              )}
              {weather.pressure && (
                <div className="text-sm text-white/80">
                  🔻 {weather.pressure} hPa
                </div>
              )}
              {weather.condition && (
                <div className="text-xs text-white/70 mt-2 capitalize">
                  {weather.condition}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-2">🌡️</div>
              <div className="text-sm text-white/60">
                Weather data unavailable
              </div>
            </div>
          )}
        </div>

        {/* Source indicator */}
        {weatherSource !== 'none' && (
          <div className="text-xs text-white/50 text-center mt-2">
            {weatherSource === 'internet' ? '📡 Internet' : '🎩 Weather HAT'}
          </div>
        )}
      </div>
    </div>
  )
}

export default WeatherTimeCard
