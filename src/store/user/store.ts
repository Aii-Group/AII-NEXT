import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { USER_STORAGE_KEY } from '@/constants/storage';
import { flattenActions, type Bindable } from '@/store/helpers/flattenActions';
import { createUserSlice, type UserAction, type UserStore } from '@/store/user/actions';
import { initialUserState } from '@/store/user/initialState';
import type { User } from '@/store/user/types';

function toPersistedUser(user: User | null | undefined): User | undefined {
  if (!user) return undefined;
  const safeUser = { ...user };
  delete safeUser.token;
  return safeUser;
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialUserState,
        ...flattenActions<UserAction>([createUserSlice(set) as unknown as Bindable]),
      }),
      {
        name: USER_STORAGE_KEY,
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({ user: toPersistedUser(state.user) }),
      },
    ),
    { name: 'UserStore' },
  ),
);
