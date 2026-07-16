import { getStorageItem } from '@/utils/storage';

interface PersistedEnvelope<T> {
  state?: T;
}

/** 同步读取 zustand persist 写入的 storage 结构，避免首屏闪烁 */
export function readPersistedState<T>(key: string, type: 'local' | 'session' = 'local'): Partial<T> | null {
  const stored = getStorageItem<PersistedEnvelope<T>>(key, type);
  return stored?.state ?? null;
}
