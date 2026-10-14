import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isValidSubmitButton,
  findSubmitButton,
  isSurveyAlreadySubmitted,
  hasValidationErrors,
  executeSubmission,
  resetSubmittingState,
} from '../src/core/submitter.js'
import { STATUS_CODES } from '../src/core/constants.js'

describe('submitter - isValidSubmitButton', () => {
  it('identifies Etlab name="submitButton" as authentic', () => {
    const btn = document.createElement('button')
    btn.setAttribute('name', 'submitButton')
    expect(isValidSubmitButton(btn)).toBe(true)
  })

  it('identifies type="submit" buttons and inputs', () => {
    const btn = document.createElement('button')
    btn.type = 'submit'
    expect(isValidSubmitButton(btn)).toBe(true)

    const input = document.createElement('input')
    input.type = 'submit'
    expect(isValidSubmitButton(input)).toBe(true)
  })

  it('identifies text/value matching Submit or Save & Submit', () => {
    const btn1 = document.createElement('button')
    btn1.textContent = 'Submit'
    expect(isValidSubmitButton(btn1)).toBe(true)

    const btn2 = document.createElement('button')
    btn2.textContent = 'Save & Submit'
    expect(isValidSubmitButton(btn2)).toBe(true)

    const input = document.createElement('input')
    input.type = 'button'
    input.value = 'Submit Survey'
    expect(isValidSubmitButton(input)).toBe(true)
  })

  it('strictly rejects disallowed buttons (Cancel, Reset, Logout, Clear, Back, Save Draft)', () => {
    const disallowedNames = [
      'cancel',
      'reset',
      'clear',
      'logout',
      'signout',
      'back',
      'prev',
      'save draft',
    ]

    for (const name of disallowedNames) {
      const btn = document.createElement('button')
      btn.textContent = name
      expect(isValidSubmitButton(btn)).toBe(false)

      const btnName = document.createElement('button')
      btnName.setAttribute('name', name)
      expect(isValidSubmitButton(btnName)).toBe(false)
    }
  })

  it('rejects disabled buttons', () => {
    const btn = document.createElement('button')
    btn.setAttribute('name', 'submitButton')
    btn.disabled = true
    expect(isValidSubmitButton(btn)).toBe(false)
  })
})

describe('submitter - findSubmitButton', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('finds button[name="submitButton"] inside form', () => {
    document.body.innerHTML = `
      <form id="survey-form">
        <button type="button" name="cancelButton">Cancel</button>
        <button type="button" name="submitButton">Submit</button>
      </form>
    `

    const form = document.querySelector('form')
    const submitBtn = findSubmitButton(form, document)
    expect(submitBtn).not.toBeNull()
    expect(submitBtn.getAttribute('name')).toBe('submitButton')
  })

  it('does not select unrelated or disallowed buttons', () => {
    document.body.innerHTML = `
      <form id="survey-form">
        <button type="button" name="cancel">Cancel</button>
        <button type="reset">Reset Form</button>
        <a href="/logout">Logout</a>
      </form>
    `

    const form = document.querySelector('form')
    const submitBtn = findSubmitButton(form, document)
    expect(submitBtn).toBeNull()
  })
})

describe('submitter - isSurveyAlreadySubmitted', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('returns true when completion text is present in the document', () => {
    document.body.innerHTML = `
      <div class="alert alert-info">
        You have already completed this survey. Thank you!
      </div>
    `

    expect(isSurveyAlreadySubmitted(document)).toBe(true)
  })

  it('returns true when all survey radios and submit button are disabled', () => {
    document.body.innerHTML = `
      <form>
        <input type="radio" name="q1" disabled checked />
        <input type="radio" name="q2" disabled />
        <button name="submitButton" disabled>Submit</button>
      </form>
    `

    expect(isSurveyAlreadySubmitted(document)).toBe(true)
  })

  it('returns false for an editable survey', () => {
    document.body.innerHTML = `
      <form>
        <input type="radio" name="q1" />
        <input type="radio" name="q2" />
        <button name="submitButton">Submit</button>
      </form>
    `

    expect(isSurveyAlreadySubmitted(document)).toBe(false)
  })
})

describe('submitter - executeSubmission and duplicate safeguards', () => {
  beforeEach(() => {
    resetSubmittingState()
    document.body.innerHTML = ''
  })

  it('successfully clicks the submit button and reports SUCCESS', async () => {
    document.body.innerHTML = `
      <form id="survey-form" action="/survey/submit" method="post">
        <input type="radio" name="q1" checked />
        <button type="button" name="submitButton">Submit</button>
      </form>
    `

    const form = document.querySelector('form')
    const btn = document.querySelector('button[name="submitButton"]')

    let clicked = false
    btn.addEventListener('click', () => {
      clicked = true
    })

    const result = await executeSubmission(form, document)
    expect(clicked).toBe(true)
    expect(result.submitted).toBe(true)
    expect(result.statusCode).toBe(STATUS_CODES.SUCCESS)
  })

  it('prevents duplicate concurrent submissions', async () => {
    document.body.innerHTML = `
      <form id="survey-form" action="/survey/submit" method="post">
        <button type="button" name="submitButton">Submit</button>
      </form>
    `

    const form = document.querySelector('form')

    // Run first submission
    const promise1 = executeSubmission(form, document)
    // Immediately attempt second submission concurrently
    const promise2 = executeSubmission(form, document)

    const [res1, res2] = await Promise.all([promise1, promise2])

    expect(res1.submitted).toBe(true)
    expect(res2.submitted).toBe(false)
    expect(res2.message).toContain('already in progress')
  })

  it('aborts submission if survey was already submitted', async () => {
    document.body.innerHTML = `
      <div>You have already submitted this survey.</div>
      <form id="survey-form">
        <button name="submitButton">Submit</button>
      </form>
    `

    const form = document.querySelector('form')
    const result = await executeSubmission(form, document)

    expect(result.submitted).toBe(false)
    expect(result.statusCode).toBe(STATUS_CODES.ALREADY_SUBMITTED)
  })

  it('aborts submission and reports error if Submit button cannot be identified safely', async () => {
    document.body.innerHTML = `
      <form id="survey-form">
        <button name="cancelButton">Cancel</button>
      </form>
    `

    const form = document.querySelector('form')
    const result = await executeSubmission(form, document)

    expect(result.submitted).toBe(false)
    expect(result.statusCode).toBe(STATUS_CODES.SUBMIT_BUTTON_NOT_FOUND)
  })
})
