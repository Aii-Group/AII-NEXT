import { USER_STORAGE_KEY } from '@/constants/storage';
import { readPersistedState } from '@/store/helpers/readPersistedState';
import type { User } from '@/store/user/types';

export interface UserState {
  user: User | null;
}

const hydrated = readPersistedState<Pick<UserState, 'user'>>(USER_STORAGE_KEY, 'local');

export const initialUserState: UserState = {
  user: hydrated?.user ?? null,
};
