/**
 * Cross-Browser Extension API Polyfill & Compatibility Layer
 *
 * Provides a unified, Promise-based abstraction over Chrome, Edge,
 * Opera (Chromium chrome.* APIs), and Firefox (WebExtensions browser.* APIs).
 */

export function getBrowser() {
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser
  }
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome
  }
  return null
}

/**
 * Queries the currently active tab in the current window.
 *
 * @returns {Promise<chrome.tabs.Tab|browser.tabs.Tab|null>}
 */
export async function getActiveTab() {
  const b = getBrowser()
  if (!b || !b.tabs) {
    return null
  }

  // Firefox browser.tabs.query returns a Promise
  if (typeof browser !== 'undefined' && browser.tabs && browser.tabs.query) {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true })
      return tabs && tabs.length > 0 ? tabs[0] : null
    } catch {
      // Fallback to chrome callback below
    }
  }

  // Standard Chrome callback or Promise
  return new Promise((resolve) => {
    try {
      b.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (b.runtime && b.runtime.lastError) {
          resolve(null)
          return
        }
        resolve(tabs && tabs.length > 0 ? tabs[0] : null)
      })
    } catch {
      resolve(null)
    }
  })
}

/**
 * Sends a message to a specific tab.
 *
 * @param {number} tabId
 * @param {Object} message
 * @returns {Promise<any>}
 */
export async function sendMessageToTab(tabId, message) {
  const b = getBrowser()
  if (!b || !b.tabs || !tabId) {
    return { success: false, message: 'Tabs API not available' }
  }

  if (typeof browser !== 'undefined' && browser.tabs && browser.tabs.sendMessage) {
    try {
      return await browser.tabs.sendMessage(tabId, message)
    } catch (err) {
      // fallback
    }
  }

  return new Promise((resolve) => {
    try {
      b.tabs.sendMessage(tabId, message, (response) => {
        if (b.runtime && b.runtime.lastError) {
          resolve({
            success: false,
            message: b.runtime.lastError.message || 'Failed to communicate with tab content script',
          })
          return
        }
        resolve(response)
      })
    } catch (err) {
      resolve({ success: false, message: err.message })
    }
  })
}

/**
 * Sends a message from popup to background or content script.
 *
 * @param {Object} message
 * @returns {Promise<any>}
 */
export async function sendMessageToRuntime(message) {
  const b = getBrowser()
  if (!b || !b.runtime) {
    return { success: false, message: 'Runtime API not available' }
  }

  if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
    try {
      return await browser.runtime.sendMessage(message)
    } catch (err) {
      // fallback
    }
  }

  return new Promise((resolve) => {
    try {
      b.runtime.sendMessage(message, (response) => {
        if (b.runtime && b.runtime.lastError) {
          resolve({
            success: false,
            message: b.runtime.lastError.message || 'Failed to send runtime message',
          })
          return
        }
        resolve(response)
      })
    } catch (err) {
      resolve({ success: false, message: err.message })
    }
  })
}
