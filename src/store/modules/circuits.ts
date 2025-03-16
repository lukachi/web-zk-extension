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
          // Try to find an existing circuit by name.
          const index = state.circuits.findIndex(c => c.name === circuit.name)
          if (index >= 0) {
            // If the circuit exists, update it only if the version of either file has changed.
            const existing = state.circuits[index]
            if (
              existing.zKey.version !== circuit.zKey.version ||
              existing.wasm.version !== circuit.wasm.version
            ) {
              const updatedCircuit = {
                ...existing,
                ...circuit,
                timeUpdated: Date.now(),
              }
              const newCircuits = [...state.circuits]
              newCircuits[index] = updatedCircuit
              return { circuits: newCircuits }
            } else {
              // No version change; do nothing.
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
              },
            ],
          }
        })
      },
      getCircuitByName: (name: string): Circuit | undefined => {
        return get().circuits.find(circuit => circuit.name === name)
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
