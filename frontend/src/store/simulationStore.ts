import { create } from 'zustand';
import { api } from '../api/client';

interface SimulationState {
  isRunning: boolean;
  speed: number;
  speedMultiplier: number;
  isLoading: boolean;
  fetchStatus: () => Promise<void>;
  toggle: () => Promise<void>;
  setRunning: (running: boolean) => void;
  setSpeed: (speed: number) => Promise<void>;
  setSpeedMultiplier: (speed: number) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  isRunning: true,
  speed: 1.0,
  speedMultiplier: 1.0,
  isLoading: false,
  setRunning: (running: boolean) => set({ isRunning: running }),
  setSpeedMultiplier: (speed: number) => set({ speed, speedMultiplier: speed }),

  fetchStatus: async () => {
    try {
      const data = await api.getSimulationStatus();
      set({ isRunning: data.is_running, speed: data.speed_multiplier });
    } catch {
      // Fallback local status
    }
  },

  toggle: async () => {
    const nextState = !get().isRunning;
    set({ isRunning: nextState });
    try {
      await api.toggleSimulation(nextState);
    } catch {
      // Revert if error
      set({ isRunning: !nextState });
    }
  },

  setSpeed: async (newSpeed: number) => {
    set({ speed: newSpeed });
    try {
      await api.setSimulationSpeed(newSpeed);
    } catch {
      // Ignore fallback
    }
  },
}));
