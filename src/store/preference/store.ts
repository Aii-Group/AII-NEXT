import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { defaultBrandColors } from '@/constants/brand';
import { PREFERENCE_STORAGE_KEY } from '@/constants/storage';
import { applyTheme, resolveHostTheme } from '@/layout/utils/theme-dom';
import { flattenActions, type Bindable } from '@/store/helpers/flattenActions';
import { createPreferenceSlice, type PreferenceAction, type PreferenceStore } from '@/store/preference/actions';
import { initialPreferenceState, resolveInitialBrandColor } from '@/store/preference/initialState';
import type { PreferenceState } from '@/store/preference/types';
import { getMicroGlobalData, isMicroAppEnvironment } from '@/utils/micro';

export const usePreferenceStore = create<PreferenceStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialPreferenceState,
        ...flattenActions<PreferenceAction>([createPreferenceSlice(set, get) as unknown as Bindable]),
      }),
      {
        name: PREFERENCE_STORAGE_KEY,
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          locale: state.locale,
          ...(isMicroAppEnvironment() ? { brandColor: state.brandColor } : { theme: state.theme }),
        }),
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<PreferenceState> | undefined;
          const merged = { ...currentState, ...persisted };

          merged.brandColor = resolveInitialBrandColor(persisted?.brandColor);

          return merged;
        },
        onRehydrateStorage: () => (state) => {
          if (!state) return;

          if (!isMicroAppEnvironment()) {
            state.brandColor = { ...defaultBrandColors };
          } else {
            const hostTheme = resolveHostTheme(getMicroGlobalData()?.theme);
            if (hostTheme) {
              state.theme = hostTheme;
            }
          }

          applyTheme(state.theme);
        },
      },
    ),
    { name: 'PreferenceStore' },
  ),
);
