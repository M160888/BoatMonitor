import { useEffect, useRef } from 'react'
import { useSensorStore } from './store'

export const useWebSocket = (url, options = {}) => {
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const { updateSensors, updateVictron } = useSensorStore()

  useEffect(() => {
    const connect = () => {
      try {
        // Convert relative URLs to work with current host (for Codespaces compatibility)
        let wsUrl = url
        if (url.startsWith('ws://localhost')) {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
          // Extract path from URL
          const urlObj = new URL(url)
          wsUrl = `${protocol}//${window.location.host}${urlObj.pathname}`
          console.log('WebSocket URL converted:', url, '→', wsUrl)
        }
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          console.log('WebSocket connected:', url)
          if (options.onOpen) options.onOpen()
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)

            if (message.type === 'sensor_update') {
              updateSensors(message.data)
            } else if (message.type === 'victron_update') {
              updateVictron(message.data)
            }

            if (options.onMessage) options.onMessage(message)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          if (options.onError) options.onError(error)
        }

        ws.onclose = () => {
          console.log('WebSocket disconnected, reconnecting...')
          if (options.onClose) options.onClose()

          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 3000)
        }
      } catch (error) {
        console.error('Error creating WebSocket:', error)
      }
    }

    connect()

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [url])

  return wsRef.current
}
