import { describe, it, expect, beforeEach } from 'vitest'
import {
  getBrowser,
  getActiveTab,
  sendMessageToTab,
  sendMessageToRuntime,
} from '../src/common/browserApi.js'

describe('browserApi compatibility module', () => {
  beforeEach(() => {
    delete globalThis.chrome
    delete globalThis.browser
  })

  it('detects available browser object (chrome or browser)', () => {
    expect(getBrowser()).toBeNull()

    globalThis.chrome = { runtime: {} }
    expect(getBrowser()).toBe(globalThis.chrome)

    globalThis.browser = { runtime: {} }
    expect(getBrowser()).toBe(globalThis.browser)
  })

  it('getActiveTab queries active tab in window', async () => {
    globalThis.chrome = {
      runtime: {},
      tabs: {
        query: (queryInfo, cb) => {
          expect(queryInfo.active).toBe(true)
          cb([{ id: 42, url: 'https://cet.etlab.in/survey/user/answer' }])
        },
      },
    }

    const tab = await getActiveTab()
    expect(tab).not.toBeNull()
    expect(tab.id).toBe(42)
    expect(tab.url).toContain('.etlab.in')
  })

  it('getActiveTab returns null gracefully if no tabs or tabs API missing', async () => {
    const tab = await getActiveTab()
    expect(tab).toBeNull()
  })

  it('sendMessageToTab communicates with active tab and handles response', async () => {
    globalThis.chrome = {
      runtime: {},
      tabs: {
        sendMessage: (tabId, msg, cb) => {
          expect(tabId).toBe(101)
          expect(msg.action).toBe('executeSurvey')
          cb({ success: true, count: 5 })
        },
      },
    }

    const response = await sendMessageToTab(101, { action: 'executeSurvey' })
    expect(response.success).toBe(true)
    expect(response.count).toBe(5)
  })

  it('sendMessageToTab handles runtime.lastError without crashing', async () => {
    globalThis.chrome = {
      runtime: {
        lastError: { message: 'Could not establish connection. Receiving end does not exist.' },
      },
      tabs: {
        sendMessage: (tabId, msg, cb) => {
          cb(null)
        },
      },
    }

    const response = await sendMessageToTab(999, { action: 'test' })
    expect(response.success).toBe(false)
    expect(response.message).toContain('Could not establish connection')
  })

  it('sendMessageToRuntime communicates with background', async () => {
    globalThis.chrome = {
      runtime: {
        sendMessage: (msg, cb) => {
          expect(msg.action).toBe('ping')
          cb({ pong: true })
        },
      },
    }

    const res = await sendMessageToRuntime({ action: 'ping' })
    expect(res.pong).toBe(true)
  })
})
