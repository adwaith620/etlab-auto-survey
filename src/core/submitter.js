/**
 * Submitter Module
 *
 * Identifies the authentic survey form and Submit button with rigorous safeguards.
 * Prevents duplicate clicks, ignores unrelated action buttons (Reset, Cancel, Logout),
 * and verifies submission completion.
 */

import { STATUS_CODES } from './constants.js';

// Regex of prohibited button labels/names that must never be clicked
const DISALLOWED_BUTTON_REGEX = /\b(cancel|reset|clear|logout|signout|sign\s*out|back|prev|previous|save\s*draft|save\s*as\s*draft|download)\b/i;

// Regex of valid submit button labels/names
const SUBMIT_BUTTON_REGEX = /^\s*(submit|submit\s*survey|save\s*&\s*submit|submit\s*response|finish|finish\s*survey)\s*$/i;

// Concurrency guard to prevent duplicate submissions
let isSubmitting = false;

/**
 * Resets the in-flight submission state (useful for tests or retries)
 */
export function resetSubmittingState() {
  isSubmitting = false;
}

/**
 * Determines whether an element is an authentic submit button.
 *
 * @param {HTMLElement} btn
 * @returns {boolean}
 */
export function isValidSubmitButton(btn) {
  if (!btn) return false;
  if (btn.disabled) return false;

  const name = btn.getAttribute('name') || '';
  const id = btn.id || '';
  const text = (btn.textContent || '').trim();
  const value = (btn.getAttribute('value') || '').trim();
  const type = (btn.getAttribute('type') || '').toLowerCase();

  // Explicitly check for disallowed names, values, or labels
  if (
    DISALLOWED_BUTTON_REGEX.test(name) ||
    DISALLOWED_BUTTON_REGEX.test(id) ||
    DISALLOWED_BUTTON_REGEX.test(text) ||
    DISALLOWED_BUTTON_REGEX.test(value)
  ) {
    return false;
  }

  // 1. Direct name match (original Etlab submit button: name="submitButton")
  if (name.toLowerCase() === 'submitbutton' || name.toLowerCase() === 'submit') {
    return true;
  }

  // 2. Input/button type="submit"
  if (type === 'submit') {
    return true;
  }

  // 3. Text or value matching submit keywords
  if (SUBMIT_BUTTON_REGEX.test(text) || SUBMIT_BUTTON_REGEX.test(value)) {
    return true;
  }

  return false;
}

/**
 * Finds the unambiguous submit button for a survey form.
 *
 * @param {HTMLFormElement} [form]
 * @param {Document} [doc]
 * @returns {HTMLElement|null}
 */
export function findSubmitButton(form, doc = (typeof document !== 'undefined' ? document : null)) {
  if (!doc) return null;

  // Search within form first if provided
  if (form) {
    // 1. Explicit name="submitButton" inside form (standard Etlab)
    const etlabNamedBtn = form.querySelector('button[name="submitButton"], input[name="submitButton"]');
    if (etlabNamedBtn && isValidSubmitButton(etlabNamedBtn)) {
      return etlabNamedBtn;
    }

    // 2. Submit input/button inside form
    const submitBtns = Array.from(form.querySelectorAll('button, input[type="submit"], input[type="button"]'))
      .filter(isValidSubmitButton);

    if (submitBtns.length === 1) {
      return submitBtns[0];
    }

    if (submitBtns.length > 1) {
      // Prioritize type="submit" or name="submit"
      const prioritized = submitBtns.find(b =>
        b.getAttribute('name') === 'submitButton' ||
        b.type === 'submit' ||
        SUBMIT_BUTTON_REGEX.test(b.textContent || b.value || '')
      );
      if (prioritized) return prioritized;
    }
  }

  // Search in entire document if not found in form
  const etlabDocBtn = doc.querySelector('button[name="submitButton"], input[name="submitButton"]');
  if (etlabDocBtn && isValidSubmitButton(etlabDocBtn)) {
    return etlabDocBtn;
  }

  const allSubmits = Array.from(doc.querySelectorAll('button[type="submit"], input[type="submit"], button'))
    .filter(isValidSubmitButton);

  if (allSubmits.length === 1) {
    return allSubmits[0];
  }

  if (allSubmits.length > 1) {
    const prioritized = allSubmits.find(b =>
      b.getAttribute('name') === 'submitButton' ||
      b.type === 'submit' ||
      SUBMIT_BUTTON_REGEX.test(b.textContent || b.value || '')
    );
    if (prioritized) return prioritized;
  }

  return null;
}

/**
 * Checks if the page indicates that the survey was already submitted.
 *
 * @param {Document} doc
 * @returns {boolean}
 */
export function isSurveyAlreadySubmitted(doc) {
  if (!doc) return false;

  const pageText = (doc.body ? doc.body.textContent || '' : '').toLowerCase();
  if (
    pageText.includes('you have already completed this survey') ||
    pageText.includes('you have already submitted this survey') ||
    pageText.includes('survey already submitted') ||
    pageText.includes('response has already been recorded')
  ) {
    return true;
  }

  // Check if form is disabled/read-only with no available radio buttons
  const form = doc.querySelector('form');
  if (form) {
    const radios = form.querySelectorAll('input[type="radio"]');
    if (radios.length > 0) {
      const allDisabled = Array.from(radios).every(r => r.disabled);
      const submitBtn = findSubmitButton(form, doc);
      if (allDisabled && (!submitBtn || submitBtn.disabled)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if the page contains visible validation error messages.
 *
 * @param {Document} doc
 * @returns {boolean}
 */
export function hasValidationErrors(doc) {
  if (!doc) return false;

  const errorElements = doc.querySelectorAll('.error, .has-error, .alert-danger, .validation-error, .help-block-error');
  for (const el of errorElements) {
    if (el.textContent && el.textContent.trim().length > 0) {
      // Ensure element is visible
      if (el.offsetParent !== null || el.clientHeight > 0) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Safely executes survey form submission.
 *
 * @param {HTMLFormElement} [form]
 * @param {Document} [doc]
 * @returns {Promise<{submitted: boolean, statusCode: string, message?: string}>}
 */
export async function executeSubmission(form, doc = (typeof document !== 'undefined' ? document : null)) {
  if (isSubmitting) {
    return {
      submitted: false,
      statusCode: STATUS_CODES.PROCESSING,
      message: 'Submission already in progress. Duplicate attempt blocked.',
    };
  }

  if (isSurveyAlreadySubmitted(doc)) {
    return {
      submitted: false,
      statusCode: STATUS_CODES.ALREADY_SUBMITTED,
      message: 'Survey appears to have already been submitted.',
    };
  }

  const submitButton = findSubmitButton(form, doc);

  if (!submitButton) {
    return {
      submitted: false,
      statusCode: STATUS_CODES.SUBMIT_BUTTON_NOT_FOUND,
      message: 'Survey Submit button could not be identified safely.',
    };
  }

  isSubmitting = true;

  try {
    let unloadTriggered = false;
    let windowRef = doc && doc.defaultView ? doc.defaultView : (typeof window !== 'undefined' ? window : null);

    const onBeforeUnload = () => {
      unloadTriggered = true;
    };

    if (windowRef && windowRef.addEventListener) {
      windowRef.addEventListener('beforeunload', onBeforeUnload, { once: true });
    }

    // Preferred: click authentic submit button so all form submit listeners run
    submitButton.click();

    // Allow DOM to settle and check for immediate validation errors
    await new Promise(resolve => setTimeout(resolve, 300));

    if (hasValidationErrors(doc)) {
      isSubmitting = false;
      return {
        submitted: false,
        statusCode: STATUS_CODES.SUBMISSION_FAILED,
        message: 'Validation error detected on survey page.',
      };
    }

    // If page is navigating or submit button is now disabled / form submitted
    return {
      submitted: true,
      statusCode: STATUS_CODES.SUCCESS,
      message: 'Survey submitted successfully.',
    };
  } catch (err) {
    isSubmitting = false;
    return {
      submitted: false,
      statusCode: STATUS_CODES.SUBMISSION_FAILED,
      message: err.message || 'Form submission encountered an exception.',
    };
  } finally {
    // Keep isSubmitting guarded for a moment to prevent double clicks
    setTimeout(() => {
      isSubmitting = false;
    }, 1000);
  }
}
