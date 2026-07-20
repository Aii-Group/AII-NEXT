import { USER_STORAGE_KEY } from '@/constants/storage';
import { readPersistedState } from '@/store/helpers/readPersistedState';
import type { User } from '@/store/user/types';

export interface UserState {
  user: User | null;
}

function stripPersistedToken(user: User | null | undefined): User | null {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.token;
  return safeUser;
}

const hydrated = readPersistedState<Pick<UserState, 'user'>>(USER_STORAGE_KEY, 'session');

export const initialUserState: UserState = {
  user: stripPersistedToken(hydrated?.user),
};
