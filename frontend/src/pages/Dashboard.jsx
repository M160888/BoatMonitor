import { useState, useEffect } from 'react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import SensorCard from '../components/SensorCard'
import VictronCard from '../components/VictronCard'
import { useSensorStore } from '../utils/store'

const Dashboard = () => {
  const { sensors, victronData } = useSensorStore()

  const defaultLayout = [
    { i: 'engine_rpm', x: 0, y: 0, w: 2, h: 2 },
    { i: 'oil_pressure', x: 2, y: 0, w: 2, h: 2 },
    { i: 'coolant_temp', x: 4, y: 0, w: 2, h: 2 },
    { i: 'fuel-tank', x: 0, y: 2, w: 2, h: 2 },
    { i: 'water-tank', x: 2, y: 2, w: 2, h: 2 },
    { i: 'waste-tank', x: 4, y: 2, w: 2, h: 2 },
    { i: 'battery-leisure', x: 0, y: 4, w: 3, h: 2 },
    { i: 'battery-starter', x: 3, y: 4, w: 3, h: 2 },
    { i: 'solar', x: 0, y: 6, w: 6, h: 2 },
  ]

  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('dashboard-layout')
    return saved ? JSON.parse(saved) : defaultLayout
  })

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout)
    localStorage.setItem('dashboard-layout', JSON.stringify(newLayout))
  }

  const resetLayout = () => {
    setLayout(defaultLayout)
    localStorage.setItem('dashboard-layout', JSON.stringify(defaultLayout))
  }

  const widgets = [
    {
      id: 'engine_rpm',
      title: 'Engine RPM',
      value: sensors.engine_rpm || 0,
      unit: 'RPM',
      icon: '🚤',
      color: 'water',
    },
    {
      id: 'oil_pressure',
      title: 'Oil Pressure',
      value: sensors.oil_pressure || 0,
      unit: 'PSI',
      icon: '🛢️',
      color: 'sun',
    },
    {
      id: 'coolant_temp',
      title: 'Coolant Temp',
      value: sensors.coolant_temp || 0,
      unit: '°C',
      icon: '🌡️',
      color: 'sun',
    },
    {
      id: 'fuel-tank',
      title: 'Fuel Tank',
      value: sensors.fuel_tank || 0,
      unit: '%',
      icon: '⛽',
      color: 'sun',
      type: 'tank',
    },
    {
      id: 'water-tank',
      title: 'Water Tank',
      value: sensors.water_tank || 0,
      unit: '%',
      icon: '💧',
      color: 'water',
      type: 'tank',
    },
    {
      id: 'waste-tank',
      title: 'Waste Tank',
      value: sensors.waste_tank || 0,
      unit: '%',
      icon: '🚽',
      color: 'nature',
      type: 'tank',
    },
  ]

  return (
    <div className="dashboard">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Dashboard</h2>
        <button
          onClick={resetLayout}
          className="px-4 py-2 bg-water-600 hover:bg-water-700 rounded-lg transition-colors"
        >
          Reset Layout
        </button>
      </div>

      <GridLayout
        className="layout"
        layout={layout}
        cols={6}
        rowHeight={100}
        width={1200}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="widget-container">
            <SensorCard {...widget} />
          </div>
        ))}

        <div key="battery-leisure">
          <VictronCard
            title="Leisure Battery"
            device="smartshunt_leisure"
            data={victronData.smartshunt_leisure}
            icon="🔋"
            color="nature"
          />
        </div>

        <div key="battery-starter">
          <VictronCard
            title="Starter Battery"
            device="smartshunt_starter"
            data={victronData.smartshunt_starter}
            icon="🔋"
            color="water"
          />
        </div>

        <div key="solar">
          <VictronCard
            title="Solar Charge"
            device="mppt_solar"
            data={victronData.mppt_solar}
            icon="☀️"
            color="sun"
          />
        </div>
      </GridLayout>
    </div>
  )
}

export default Dashboard
