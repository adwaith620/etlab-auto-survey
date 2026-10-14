/**
 * Storage Abstraction Module
 *
 * Provides persistent storage for user preferences across browser sessions and restarts.
 * Supports chrome.storage.local, browser.storage.local, and graceful fallback to localStorage / in-memory.
 */

import { getBrowser } from './browserApi.js'
import { STORAGE_KEY_SELECTED_MODE, DEFAULT_RATING_MODE } from '../core/constants.js'

// In-memory fallback map if both extension storage and localStorage are unavailable/restricted
const memoryFallback = new Map()

function getLocalStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const testKey = '__storage_test__'
      window.localStorage.setItem(testKey, '1')
      window.localStorage.removeItem(testKey)
      return window.localStorage
    }
  } catch {
    // localStorage restricted or unavailable (e.g. Node 26 without --localstorage-file)
  }
  return null
}

/**
 * Retrieves a stored value by key.
 *
 * @param {string} key
 * @param {any} [defaultValue=null]
 * @returns {Promise<any>}
 */
export async function getStorageItem(key, defaultValue = null) {
  const b = getBrowser()

  // Try WebExtensions / Chrome Storage API
  if (b && b.storage && b.storage.local) {
    if (typeof browser !== 'undefined' && browser.storage && browser.storage.local.get) {
      try {
        const res = await browser.storage.local.get(key)
        if (res && res[key] !== undefined) {
          return res[key]
        }
        return defaultValue
      } catch {
        // Fallback below
      }
    }

    return new Promise((resolve) => {
      try {
        b.storage.local.get([key], (result) => {
          if (b.runtime && b.runtime.lastError) {
            resolve(fallbackGet(key, defaultValue))
            return
          }
          if (result && result[key] !== undefined) {
            resolve(result[key])
          } else {
            resolve(defaultValue)
          }
        })
      } catch {
        resolve(fallbackGet(key, defaultValue))
      }
    })
  }

  return fallbackGet(key, defaultValue)
}

/**
 * Stores a value by key.
 *
 * @param {string} key
 * @param {any} value
 * @returns {Promise<boolean>}
 */
export async function setStorageItem(key, value) {
  const b = getBrowser()

  if (b && b.storage && b.storage.local) {
    if (typeof browser !== 'undefined' && browser.storage && browser.storage.local.set) {
      try {
        await browser.storage.local.set({ [key]: value })
        return true
      } catch {
        // Fallback below
      }
    }

    return new Promise((resolve) => {
      try {
        b.storage.local.set({ [key]: value }, () => {
          if (b.runtime && b.runtime.lastError) {
            fallbackSet(key, value)
            resolve(false)
            return
          }
          resolve(true)
        })
      } catch {
        fallbackSet(key, value)
        resolve(true)
      }
    })
  }

  fallbackSet(key, value)
  return true
}

function fallbackGet(key, defaultValue) {
  const ls = getLocalStorage()
  if (ls) {
    try {
      const val = ls.getItem(key)
      if (val !== null) {
        try {
          return JSON.parse(val)
        } catch {
          return val
        }
      }
    } catch {
      // fallback to memory
    }
  }

  if (memoryFallback.has(key)) {
    return memoryFallback.get(key)
  }

  return defaultValue
}

function fallbackSet(key, value) {
  const ls = getLocalStorage()
  if (ls) {
    try {
      ls.setItem(key, JSON.stringify(value))
      return
    } catch {
      // fallback to memory
    }
  }

  memoryFallback.set(key, value)
}

/**
 * Gets the persisted rating mode, defaulting to 'excellent'
 *
 * @returns {Promise<string>}
 */
export async function getSelectedRatingMode() {
  return await getStorageItem(STORAGE_KEY_SELECTED_MODE, DEFAULT_RATING_MODE)
}

/**
 * Persists the selected rating mode
 *
 * @param {string} mode
 * @returns {Promise<boolean>}
 */
export async function setSelectedRatingMode(mode) {
  return await setStorageItem(STORAGE_KEY_SELECTED_MODE, mode)
}
