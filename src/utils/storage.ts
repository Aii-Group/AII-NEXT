import { isNil } from 'lodash-es';

type StorageType = 'local' | 'session';

function getStorage(type: StorageType): Storage | null {
  if (typeof window === 'undefined') return null;
  return type === 'local' ? window.localStorage : window.sessionStorage;
}

/** 从 localStorage / sessionStorage 读取并 JSON 反序列化 */
export function getStorageItem<T>(key: string, type: StorageType = 'local'): T | null {
  const storage = getStorage(type);
  if (isNil(storage)) return null;

  const raw = storage.getItem(key);
  if (isNil(raw)) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 将值 JSON 序列化后写入 localStorage / sessionStorage */
export function setStorageItem<T>(key: string, value: T, type: StorageType = 'local'): boolean {
  const storage = getStorage(type);
  if (isNil(storage)) return false;

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** 移除指定 key */
export function removeStorageItem(key: string, type: StorageType = 'local'): boolean {
  const storage = getStorage(type);
  if (isNil(storage)) return false;

  storage.removeItem(key);
  return true;
}

/** 清空 storage（可选前缀过滤） */
export function clearStorage(type: StorageType = 'local', prefix?: string): boolean {
  const storage = getStorage(type);
  if (isNil(storage)) return false;

  if (isNil(prefix)) {
    storage.clear();
    return true;
  }

  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!isNil(key) && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
  return true;
}
