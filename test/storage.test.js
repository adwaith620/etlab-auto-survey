import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStorageItem,
  setStorageItem,
  getSelectedRatingMode,
  setSelectedRatingMode,
} from '../src/common/storage.js';
import { DEFAULT_RATING_MODE, RATING_MODES, STORAGE_KEY_SELECTED_MODE } from '../src/core/constants.js';

describe('storage module', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    delete globalThis.chrome;
    delete globalThis.browser;
  });

  it('returns DEFAULT_RATING_MODE ("excellent") when no rating has been saved', async () => {
    const mode = await getSelectedRatingMode();
    expect(mode).toBe(DEFAULT_RATING_MODE);
    expect(mode).toBe(RATING_MODES.EXCELLENT);
  });

  it('saves and retrieves rating mode via fallback localStorage', async () => {
    await setSelectedRatingMode(RATING_MODES.VERY_GOOD);
    const retrieved = await getSelectedRatingMode();
    expect(retrieved).toBe(RATING_MODES.VERY_GOOD);
  });

  it('saves and retrieves arbitrary keys', async () => {
    await setStorageItem('custom_flag', { enabled: true, count: 5 });
    const val = await getStorageItem('custom_flag');
    expect(val).toEqual({ enabled: true, count: 5 });
  });

  it('supports chrome.storage.local mock when available', async () => {
    const memoryStore = {};

    globalThis.chrome = {
      runtime: {},
      storage: {
        local: {
          get: (keys, cb) => {
            const key = Array.isArray(keys) ? keys[0] : keys;
            cb({ [key]: memoryStore[key] });
          },
          set: (obj, cb) => {
            Object.assign(memoryStore, obj);
            cb();
          },
        },
      },
    };

    await setSelectedRatingMode(RATING_MODES.AVERAGE);
    expect(memoryStore[STORAGE_KEY_SELECTED_MODE]).toBe(RATING_MODES.AVERAGE);

    const mode = await getSelectedRatingMode();
    expect(mode).toBe(RATING_MODES.AVERAGE);
  });
});
