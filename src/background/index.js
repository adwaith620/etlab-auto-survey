/**
 * ETLAB Auto Survey - Background Service Worker / Script
 *
 * Handles message routing between extension components across Chrome and Firefox.
 */

const b = typeof browser !== 'undefined' ? browser : typeof chrome !== 'undefined' ? chrome : null

if (b && b.runtime && b.runtime.onMessage) {
  b.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // If the message is intended for active tab
    if (
      request.forwardToTab ||
      request.action === 'markGood' ||
      request.action === 'markRandom' ||
      request.action === 'executeSurvey'
    ) {
      b.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
          sendResponse({ success: false, message: 'No active tab found' })
          return
        }

        b.tabs.sendMessage(tabs[0].id, request, (response) => {
          if (b.runtime.lastError) {
            sendResponse({ success: false, message: b.runtime.lastError.message })
            return
          }
          sendResponse(response)
        })
      })
      return true // Keep port open for async response
    }
  })
}
