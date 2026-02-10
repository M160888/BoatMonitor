import { create } from 'zustand'

export const useSensorStore = create((set) => ({
  sensors: {},
  victronData: {},

  updateSensors: (newSensors) => set({ sensors: newSensors }),
  updateVictron: (newVictronData) => set({ victronData: newVictronData }),

  reset: () => set({ sensors: {}, victronData: {} }),
}))
