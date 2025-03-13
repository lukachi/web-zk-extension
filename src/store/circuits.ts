import { create } from 'zustand'
import { combine, persist } from 'zustand/middleware'

export type Circuit = {
  iconUrl: string
  name: string
  zKeyUrl: string
  wasmUrl: string
  description: string
  timeAdded: number
  timeUpdated: number
  tag: string
}

type StoreState = {
  circuits: Circuit[]

  _hasHydrated: boolean
}

const useCircuitsStore = create(
  persist(
    combine(
      {
        circuits: [],

        _hasHydrated: false,
      } as StoreState,
      set => ({
        setHasHydrated: (value: boolean) => {
          set({
            _hasHydrated: value,
          })
        },

        addCircuit: (circuit: Circuit): void => {
          set(state => ({
            circuits: [...state.circuits, circuit],
          }))
        },

        clearStoredKeys: (): void => {
          set({
            circuits: [],
          })
        },
      }),
    ),
    {
      name: 'circuits',
      version: 1,

      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true)
      },

      partialize: state => ({
        privateKeyHexList: state.circuits,
      }),
    },
  ),
)

export const circuitsStore = {
  useCircuitsStore: useCircuitsStore,
}
