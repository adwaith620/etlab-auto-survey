/**
 * Survey Engine Module
 *
 * Coordinates survey detection, question discovery, answer mapping,
 * form population, selection verification, and automated submission.
 */

import { STATUS_CODES, RATING_MODES } from './constants.js'
import { mapRatingToOption } from './ratingMapper.js'
import { executeSubmission, isSurveyAlreadySubmitted } from './submitter.js'

/**
 * Validates if the current page is an Etlab survey page.
 *
 * @param {string} url
 * @param {Document} [doc]
 * @returns {boolean}
 */
export function isEtlabSurveyPage(url, doc = typeof document !== 'undefined' ? document : null) {
  if (!url && typeof window !== 'undefined' && window.location) {
    url = window.location.href
  }
  if (!url) return false

  const isEtlabDomain = url.includes('.etlab.in')
  const isSurveyPath =
    url.includes('/survey/') || url.includes('/feedback/') || url.includes('/evaluation/')

  if (isEtlabDomain && isSurveyPath) {
    return true
  }

  // Also check DOM indicators if domain matches
  if (isEtlabDomain && doc) {
    const hasSurveyElements = doc.querySelector('.question, .answer, button[name="submitButton"]')
    if (hasSurveyElements) return true
  }

  return false
}

/**
 * Extracts question and answer options from a survey question container.
 *
 * @param {HTMLElement} item
 * @param {number} index
 * @returns {Object|null}
 */
export function parseQuestionItem(item, index) {
  if (!item) return null

  const questionEl =
    item.querySelector('.question') || item.querySelector('.survey-question') || item
  const questionText = (questionEl.textContent || '').trim()

  const answerDiv = item.querySelector('.answer') || item.querySelector('.options') || item

  // 1. Radio button options
  const radioInputs = Array.from(answerDiv.querySelectorAll('input[type="radio"]'))
  if (radioInputs.length > 0) {
    const options = radioInputs.map((radio, optIdx) => {
      let labelText = ''

      // Check wrapping <label>
      const parentLabel = radio.closest('label')
      if (parentLabel) {
        // Clone and remove the radio input so labelText is just the text
        const clone = parentLabel.cloneNode(true)
        const radioInClone = clone.querySelector('input')
        if (radioInClone) radioInClone.remove()
        labelText = clone.textContent.trim()
      }

      // Check <label for="radio.id">
      if (!labelText && radio.id) {
        const forLabel = item.ownerDocument
          ? item.ownerDocument.querySelector(`label[for="${radio.id}"]`)
          : null
        if (forLabel) {
          labelText = forLabel.textContent.trim()
        }
      }

      // Check sibling text
      if (!labelText && radio.nextSibling) {
        labelText = (radio.nextSibling.textContent || '').trim()
      }

      // Fallback: value attribute
      if (!labelText) {
        labelText = radio.getAttribute('value') || ''
      }

      return {
        element: radio,
        labelText,
        value: radio.value,
        index: optIdx,
      }
    })

    return {
      type: 'radio',
      questionText,
      element: item,
      answerContainer: answerDiv,
      options,
      index,
    }
  }

  // 2. Select dropdown
  const select = answerDiv.querySelector('select')
  if (select) {
    const options = Array.from(select.options)
      // Exclude placeholder options like "Select", "-- Choose --", etc.
      .filter((opt, optIdx) => optIdx > 0 || (opt.value && opt.value !== ''))
      .map((opt, optIdx) => ({
        element: opt,
        parentElement: select,
        labelText: opt.text || opt.label || '',
        value: opt.value,
        index: opt.index,
      }))

    return {
      type: 'select',
      questionText,
      element: item,
      answerContainer: answerDiv,
      selectElement: select,
      options,
      index,
    }
  }

  // 3. Textarea
  const textarea = answerDiv.querySelector('textarea')
  if (textarea) {
    return {
      type: 'textarea',
      questionText,
      element: item,
      answerContainer: answerDiv,
      textareaElement: textarea,
      index,
    }
  }

  return null
}

/**
 * Discovers all survey questions present on the page.
 *
 * @param {Document} doc
 * @returns {Array<Object>}
 */
export function detectSurveyQuestions(doc) {
  if (!doc) return []

  const questions = []

  // Pattern 1: Classic Etlab list items ('li')
  const listItems = doc.querySelectorAll('li')
  listItems.forEach((li, idx) => {
    const qEl = li.querySelector('.question')
    if (qEl) {
      const parsed = parseQuestionItem(li, idx)
      if (parsed) questions.push(parsed)
    }
  })

  // Pattern 2: Standalone selects not inside discovered listItems
  const standaloneSelects = doc.querySelectorAll('select')
  standaloneSelects.forEach((select, idx) => {
    const alreadyIncluded = questions.some((q) => q.selectElement === select)
    if (!alreadyIncluded) {
      const options = Array.from(select.options)
        .filter((opt, optIdx) => optIdx > 0 || (opt.value && opt.value !== ''))
        .map((opt) => ({
          element: opt,
          parentElement: select,
          labelText: opt.text || opt.label || '',
          value: opt.value,
          index: opt.index,
        }))

      if (options.length > 0) {
        questions.push({
          type: 'select',
          questionText: select.getAttribute('name') || `Dropdown ${idx + 1}`,
          element: select,
          answerContainer: select.parentElement,
          selectElement: select,
          options,
          index: questions.length,
        })
      }
    }
  })

  return questions
}

/**
 * Handles automatic input for open-ended textareas (e.g. age, observation, suggestions).
 * Preserves original Etlab logic and dispatches standard input/change events.
 *
 * @param {HTMLTextAreaElement} textarea
 * @param {string} questionText
 */
export function handleSurveyTextarea(textarea, questionText = '') {
  if (!textarea) return

  const lowerQ = questionText.toLowerCase()

  if (lowerQ.includes('age')) {
    const randomAge = Math.floor(Math.random() * 5) + 20 // 20 - 24
    textarea.value = String(randomAge)
  } else if (
    lowerQ.includes('observation') ||
    lowerQ.includes('suggestion') ||
    lowerQ.includes('feedback') ||
    lowerQ.includes('remarks')
  ) {
    textarea.value = 'Nothing'
  } else {
    textarea.value = 'N/A'
  }

  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.dispatchEvent(new Event('change', { bubbles: true }))
}

/**
 * Executes survey population for a given rating mode, validates results,
 * and triggers automatic submission if all questions are mapped reliably.
 *
 * @param {string} mode - The requested rating mode (e.g. 'excellent', 'random', etc.)
 * @param {Document} [doc] - The document context
 * @param {Object} [optionsConfig] - Optional test hooks
 * @returns {Promise<{success: boolean, statusCode: string, message: string, details?: Object}>}
 */
export async function executeSurveyWorkflow(
  mode,
  doc = typeof document !== 'undefined' ? document : null,
  optionsConfig = {},
) {
  if (!doc) {
    return {
      success: false,
      statusCode: STATUS_CODES.ERROR,
      message: 'Invalid DOM document context.',
    }
  }

  // 1. Check if survey has already been submitted
  if (isSurveyAlreadySubmitted(doc)) {
    return {
      success: false,
      statusCode: STATUS_CODES.ALREADY_SUBMITTED,
      message: 'Survey appears to have already been submitted.',
    }
  }

  // 2. Discover survey questions
  const questions = detectSurveyQuestions(doc)

  if (questions.length === 0) {
    return {
      success: false,
      statusCode: STATUS_CODES.NO_QUESTIONS,
      message: 'No survey questions detected on this page.',
    }
  }

  // 3. Handle original 'Student Satisfaction Survey' edge case
  const surveyTitle = doc.querySelector('h5')
  const isStudentSatisfaction =
    surveyTitle && surveyTitle.textContent.trim() === 'Student Satisfaction Survey'

  // 4. Map and apply ratings
  const unmappedQuestions = []
  const appliedSelections = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]

    // Original logic: in Student Satisfaction Survey, first 5 questions are personal demographics
    if (isStudentSatisfaction && i < 5) {
      continue
    }

    if (q.type === 'radio') {
      const mapping = mapRatingToOption(mode, q.options, optionsConfig)
      if (!mapping.success) {
        unmappedQuestions.push({
          questionIndex: i + 1,
          questionText: q.questionText,
          reason: mapping.reason,
        })
        continue
      }

      const radio = mapping.option.element
      radio.click()
      radio.checked = true
      radio.dispatchEvent(new Event('change', { bubbles: true }))

      // Verification: ensure radio is indeed checked
      if (radio.checked) {
        appliedSelections.push({ questionIndex: i + 1, type: 'radio', value: radio.value })
      } else {
        unmappedQuestions.push({
          questionIndex: i + 1,
          questionText: q.questionText,
          reason: 'Radio selection failed verification.',
        })
      }

      // Check if there is an accompanying textarea in answer container
      const textarea = q.answerContainer ? q.answerContainer.querySelector('textarea') : null
      if (textarea) {
        handleSurveyTextarea(textarea, q.questionText)
      }
    } else if (q.type === 'select') {
      const mapping = mapRatingToOption(mode, q.options, optionsConfig)
      if (!mapping.success) {
        // Fallback for select if mode couldn't map:
        if (mode === RATING_MODES.RANDOM && q.options.length > 0) {
          const randomIndex = Math.floor(Math.random() * q.options.length)
          q.selectElement.selectedIndex = q.options[randomIndex].index
        } else {
          unmappedQuestions.push({
            questionIndex: i + 1,
            questionText: q.questionText,
            reason: mapping.reason,
          })
          continue
        }
      } else {
        q.selectElement.selectedIndex = mapping.option.index
      }

      q.selectElement.dispatchEvent(new Event('change', { bubbles: true }))
      appliedSelections.push({
        questionIndex: i + 1,
        type: 'select',
        index: q.selectElement.selectedIndex,
      })
    } else if (q.type === 'textarea') {
      handleSurveyTextarea(q.textareaElement, q.questionText)
      appliedSelections.push({ questionIndex: i + 1, type: 'textarea' })
    }
  }

  // 5. Verification Safeguard:
  // If required questions could not be mapped, DO NOT SUBMIT
  if (unmappedQuestions.length > 0) {
    return {
      success: false,
      statusCode: STATUS_CODES.PARTIAL_MAPPING,
      message: 'Some questions could not be mapped. Survey was not submitted.',
      details: { unmappedQuestions },
    }
  }

  // 6. Identify Form and execute automatic submission
  const form = doc.querySelector('form')
  const submissionResult = await executeSubmission(form, doc)

  return {
    success: submissionResult.submitted,
    statusCode: submissionResult.statusCode,
    message: submissionResult.message,
    details: {
      questionsAnswered: appliedSelections.length,
    },
  }
}
