import {
  initPegasusZustandStoreBackend,
  pegasusZustandStoreReady,
} from '@webext-pegasus/store-zustand'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

export type Circuit = {
  iconUrl: string
  name: string
  zKey: {
    url: string
    version: string
  }
  wasm: {
    url: string
    version: string
  }
  description: string
  timeAdded: number
  timeUpdated: number
  tag: string
  // New fields for loading state:
  loading?: boolean
  zKeyProgress?: number // 0-100
  wasmProgress?: number // 0-100
  loadError?: string | null
}

type StoreState = {
  circuits: Circuit[]

  _hasHydrated: boolean
}

const STORE_NAME = 'circuits'

const useCircuitsStore = create(
  combine(
    {
      circuits: [],
      _hasHydrated: false,
    } as StoreState,
    (set, get) => ({
      setHasHydrated: (value: boolean) => set({ _hasHydrated: value }),
      addCircuit: (circuit: Circuit): void => {
        set(state => {
          const index = state.circuits.findIndex(c => c.name === circuit.name)
          if (index >= 0) {
            const existing = state.circuits[index]
            if (
              existing.zKey.version !== circuit.zKey.version ||
              existing.wasm.version !== circuit.wasm.version
            ) {
              const updatedCircuit = {
                ...existing,
                ...circuit,
                timeUpdated: Date.now(),
                loading: true, // mark as loading
                zKeyProgress: 0,
                wasmProgress: 0,
                loadError: null,
              }
              const newCircuits = [...state.circuits]
              newCircuits[index] = updatedCircuit
              return { circuits: newCircuits }
            } else {
              return {}
            }
          }

          return {
            circuits: [
              ...state.circuits,
              {
                ...circuit,
                timeAdded: Date.now(),
                timeUpdated: Date.now(),
                loading: true,
                zKeyProgress: 0,
                wasmProgress: 0,
                loadError: null,
              },
            ],
          }
        })
      },
      getCircuitByName: (name: string): Circuit | undefined => {
        return get().circuits.find(circuit => circuit.name === name)
      },
      updateCircuit: (
        name: string,
        updates: Partial<Omit<Circuit, 'name'>>,
      ): void => {
        set(state => {
          const index = state.circuits.findIndex(c => c.name === name)
          if (index === -1) return {}
          const updated = { ...state.circuits[index], ...updates }
          const newCircuits = [...state.circuits]
          newCircuits[index] = updated
          return { circuits: newCircuits }
        })
      },
      clearStoredKeys: (): void => set({ circuits: [] }),
    }),
  ),
)

export const backendReady = () =>
  initPegasusZustandStoreBackend(STORE_NAME, useCircuitsStore, {
    storageStrategy: 'local',
  })
export const ready = () =>
  pegasusZustandStoreReady(STORE_NAME, useCircuitsStore)

export const circuitsStore = { useCircuitsStore, backendReady, ready }
