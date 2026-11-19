/**
 * SisaBerkah Offline Storage & Queue Helper
 * Menyediakan antrean lokal di localStorage untuk relawan saat kehilangan sinyal internet
 */

export interface OfflineQueueItem {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

const OFFLINE_QUEUE_KEY = 'sb_offline_queue';
const OFFLINE_DRAFT_PREFIX = 'sb_draft_';

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
    return (globalThis as unknown as { localStorage: Storage }).localStorage;
  }
  return null;
}

/**
 * Menyimpan aksi ke antrean offline lokal
 */
export function saveOfflineQueue(action: { type: string; payload: unknown; timestamp?: number }): OfflineQueueItem {
  const currentQueue = getOfflineQueue();
  const newItem: OfflineQueueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: action.type,
    payload: action.payload,
    timestamp: action.timestamp || Date.now(),
  };

  const updated = [...currentQueue, newItem];
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Gagal menyimpan ke localStorage offline queue:', e);
    }
  }

  return newItem;
}

/**
 * Mengambil seluruh daftar antrean aksi offline
 */
export function getOfflineQueue(): OfflineQueueItem[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }
  try {
    const raw = storage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Gagal membaca localStorage offline queue:', e);
    return [];
  }
}

/**
 * Menghapus satu item dari antrean setelah berhasil disinkronkan ke server
 */
export function removeOfflineQueueItem(id: string): void {
  const currentQueue = getOfflineQueue();
  const filtered = currentQueue.filter((item) => item.id !== id);
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Gagal memperbarui offline queue:', e);
    }
  }
}

/**
 * Mengosongkan seluruh antrean offline
 */
export function clearOfflineQueue(): void {
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(OFFLINE_QUEUE_KEY);
    } catch (e) {
      console.warn('Gagal mengosongkan offline queue:', e);
    }
  }
}

/**
 * Menyimpan draft formulir lokal agar relawan tidak kehilangan data saat berpindah tempat
 */
export function saveDraft(key: string, data: unknown): void {
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(OFFLINE_DRAFT_PREFIX + key, JSON.stringify(data));
    } catch (e) {
      console.warn('Gagal menyimpan draft:', e);
    }
  }
}

/**
 * Mengambil draft formulir yang tersimpan
 */
export function getDraft<T>(key: string): T | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(OFFLINE_DRAFT_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Menghapus draft setelah form berhasil dikirim
 */
export function removeDraft(key: string): void {
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(OFFLINE_DRAFT_PREFIX + key);
    } catch (e) {
      console.warn('Gagal menghapus draft:', e);
    }
  }
}
