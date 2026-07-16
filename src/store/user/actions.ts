import type { StoreSetter } from '@/store/types';
import type { UserState } from '@/store/user/initialState';
import type { User } from '@/store/user/types';

export type UserStore = UserState & UserAction;

type Setter = StoreSetter<UserStore>;

export class UserActionImpl {
  readonly #set: Setter;

  constructor(set: Setter) {
    this.#set = set;
  }

  setUser = (user: User) => {
    this.#set({ user });
  };

  updateUser = (partial: Partial<User>) => {
    this.#set((state) => ({
      user: state.user ? { ...state.user, ...partial } : { ...partial },
    }));
  };

  setToken = (token: string) => {
    this.#set((state) => ({
      user: state.user ? { ...state.user, token } : { token },
    }));
  };

  clearUser = () => {
    this.#set({ user: null });
  };
}

export type UserAction = Pick<UserActionImpl, keyof UserActionImpl>;

export const createUserSlice = (set: Setter) => new UserActionImpl(set);
