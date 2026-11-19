import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  saveOfflineQueue,
  getOfflineQueue,
  removeOfflineQueueItem,
  clearOfflineQueue,
  saveDraft,
  getDraft,
} from '../src/lib/offline-storage';

describe('Task 6: PWA Offline Support & Local Queue Storage', () => {
  describe('PWA Manifest & Service Worker Assets', () => {
    it('has valid public/manifest.json with PWA configuration', () => {
      const manifestPath = path.join(process.cwd(), 'public/manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifest.name).toContain('SisaBerkah');
      expect(manifest.short_name).toBe('SisaBerkah');
      expect(manifest.display).toBe('standalone');
      expect(manifest.theme_color).toBe('#059669');
    });

    it('has public/sw.js service worker with fetch and cache handlers', () => {
      const swPath = path.join(process.cwd(), 'public/sw.js');
      expect(fs.existsSync(swPath)).toBe(true);

      const content = fs.readFileSync(swPath, 'utf-8');
      expect(content).toContain('CACHE_NAME');
      expect(content).toContain('addEventListener');
      expect(content).toContain('fetch');
    });
  });

  describe('Offline Queue & Draft Storage Utilities', () => {
    // In-memory mock for localStorage in test environment
    const storageMock: Record<string, string> = {};
    const originalLocalStorage = globalThis.localStorage;

    beforeAll(() => {
      globalThis.localStorage = {
        getItem: (key: string) => storageMock[key] || null,
        setItem: (key: string, value: string) => {
          storageMock[key] = value;
        },
        removeItem: (key: string) => {
          delete storageMock[key];
        },
        clear: () => {
          for (const key of Object.keys(storageMock)) {
            delete storageMock[key];
          }
        },
        length: 0,
        key: () => null,
      };
    });

    afterAll(() => {
      globalThis.localStorage = originalLocalStorage;
    });

    beforeEach(() => {
      clearOfflineQueue();
    });

    it('saves items to offline queue and retrieves them with unique IDs', () => {
      saveOfflineQueue({
        type: 'INBOUND_FOOD',
        payload: { name: 'Nasi Bungkus Offline', quantity: 20 },
      });

      const queue = getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('INBOUND_FOOD');
      expect(queue[0].payload).toEqual({ name: 'Nasi Bungkus Offline', quantity: 20 });
      expect(queue[0].id).toBeDefined();
    });

    it('removes specific item from queue', () => {
      saveOfflineQueue({ type: 'A', payload: 1 });
      saveOfflineQueue({ type: 'B', payload: 2 });

      let queue = getOfflineQueue();
      expect(queue).toHaveLength(2);

      const firstId = queue[0].id;
      removeOfflineQueueItem(firstId);

      queue = getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('B');
    });

    it('saves and retrieves form draft data cleanly', () => {
      saveDraft('inbound_draft', { notes: 'Catatan draft offline' });
      const draft = getDraft<{ notes: string }>('inbound_draft');
      expect(draft?.notes).toBe('Catatan draft offline');
    });
  });

  describe('UI Integration in src/app/layout.tsx', () => {
    it('verifies manifest link and OfflineIndicator in layout', () => {
      const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
      const content = fs.readFileSync(layoutPath, 'utf-8');

      expect(content).toContain('manifest.json');
      expect(content).toContain('OfflineIndicator');
    });
  });
});
