import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Popup from '../src/popup/Popup.jsx'
import { RATING_MODES, STATUS_CODES, STATUS_MESSAGES } from '../src/core/constants.js'

describe('Popup Component', () => {
  beforeEach(() => {
    delete globalThis.chrome
    delete globalThis.browser
  })

  it('renders unsupported page state when not on an Etlab survey page', async () => {
    globalThis.chrome = {
      runtime: {},
      tabs: {
        query: (queryInfo, cb) => {
          cb([{ id: 1, url: 'https://google.com' }])
        },
      },
      storage: {
        local: {
          get: (keys, cb) => cb({}),
          set: (obj, cb) => cb && cb(),
        },
      },
    }

    render(<Popup />)

    await waitFor(() => {
      expect(screen.getByText(/Unsupported page\. Open an Etlab survey first\./i)).toBeDefined()
    })
  })

  it('renders 6 rating buttons on supported Etlab survey page with Excellent selected by default', async () => {
    globalThis.chrome = {
      runtime: {},
      tabs: {
        query: (queryInfo, cb) => {
          cb([{ id: 10, url: 'https://cet.etlab.in/survey/user/answer' }])
        },
        sendMessage: (tabId, msg, cb) => {
          if (msg.action === 'checkSurveyStatus') {
            cb({ isSurvey: true, alreadySubmitted: false })
          }
        },
      },
      storage: {
        local: {
          get: (keys, cb) => cb({}),
          set: (obj, cb) => cb && cb(),
        },
      },
    }

    render(<Popup />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Excellent/i })).toBeDefined()
    })

    const buttons = ['^Excellent', '^Very Good', '^Good', '^Poor', '^Very Poor', '^Random']

    for (const pattern of buttons) {
      expect(screen.getByRole('button', { name: new RegExp(pattern, 'i') })).toBeDefined()
    }

    // Verify Average is NOT rendered
    expect(screen.queryByRole('button', { name: /^Average/i })).toBeNull()

    // Excellent is selected by default
    const excellentBtn = screen.getByRole('button', { name: /^Excellent/i })
    expect(excellentBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('immediate execution: clicking a rating option initiates workflow immediately with no confirmation', async () => {
    let sentMessage = null

    globalThis.chrome = {
      runtime: {},
      tabs: {
        query: (queryInfo, cb) => {
          cb([{ id: 10, url: 'https://cet.etlab.in/survey/user/answer' }])
        },
        sendMessage: (tabId, msg, cb) => {
          if (msg.action === 'checkSurveyStatus') {
            cb({ isSurvey: true, alreadySubmitted: false })
          } else if (msg.action === 'executeSurvey') {
            sentMessage = msg
            cb({
              success: true,
              statusCode: STATUS_CODES.SUCCESS,
              message: STATUS_MESSAGES[STATUS_CODES.SUCCESS],
            })
          }
        },
      },
      storage: {
        local: {
          get: (keys, cb) => cb({}),
          set: (obj, cb) => cb && cb(),
        },
      },
    }

    render(<Popup />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Very Good/i })).toBeDefined()
    })

    const veryGoodBtn = screen.getByRole('button', { name: /^Very Good/i })

    // Single click executes immediately
    fireEvent.click(veryGoodBtn)

    expect(sentMessage).not.toBeNull()
    expect(sentMessage.action).toBe('executeSurvey')
    expect(sentMessage.mode).toBe(RATING_MODES.VERY_GOOD)

    await waitFor(() => {
      expect(screen.getByText(/Survey submitted successfully\./i)).toBeDefined()
    })

    // Very Good should now be marked selected
    expect(veryGoodBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('displays accurate status message when submission fails or partially maps', async () => {
    globalThis.chrome = {
      runtime: {},
      tabs: {
        query: (queryInfo, cb) => {
          cb([{ id: 10, url: 'https://cet.etlab.in/survey/user/answer' }])
        },
        sendMessage: (tabId, msg, cb) => {
          if (msg.action === 'checkSurveyStatus') {
            cb({ isSurvey: true, alreadySubmitted: false })
          } else if (msg.action === 'executeSurvey') {
            cb({
              success: false,
              statusCode: STATUS_CODES.PARTIAL_MAPPING,
              message: STATUS_MESSAGES[STATUS_CODES.PARTIAL_MAPPING],
            })
          }
        },
      },
      storage: {
        local: {
          get: (keys, cb) => cb({}),
          set: (obj, cb) => cb && cb(),
        },
      },
    }

    render(<Popup />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Poor/i })).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: /^Poor/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/Some questions could not be mapped\. Survey was not submitted\./i),
      ).toBeDefined()
    })
  })
})
