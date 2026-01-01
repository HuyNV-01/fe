import { StateCreator, create } from 'zustand';
import {
  devtools,
  persist,
  createJSONStorage,
  PersistOptions,
  PersistStorage,
} from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { HydrationState } from '@/types/store'; 

export const createPersistedStore = <T>(
  storeCreator: StateCreator<
    T & HydrationState,
    [['zustand/immer', never]],
    [],
    T
  >,
  persistName: string,
  options?: Partial<PersistOptions<T & HydrationState>>,
) => {
  return create<T & HydrationState>()(
    devtools(
      persist(
        immer((set, get, api) => {
          
          const clientStore = storeCreator(set, get, api);
          return {
            ...clientStore,
            _hasHydrated: false,
            setHasHydrated: (status) => {
              set((s: any) => {
                s._hasHydrated = status;
              });
            },
          };
        }),
        {
          name: persistName,
          storage: createJSONStorage(() => localStorage) as PersistStorage<
            T & HydrationState
          >,
          onRehydrateStorage: () => (state) => {
            state?.setHasHydrated(true);
          },
          ...options,
        },
      ),
    ),
  );
};