/**
 * Rating Mapper Module
 *
 * Provides label normalization, scale detection, and semantic mapping
 * between requested rating modes and actual survey answer options.
 */

import { RATING_MODES, RATING_SYNONYMS } from './constants.js';

/**
 * Normalizes label text by stripping leading enumerations, punctuation,
 * collapsing whitespace, and converting to lowercase.
 *
 * Examples:
 *   " 1. Excellent! " -> "excellent"
 *   "(A) Very Good" -> "very good"
 *   "Strongly Agree (5)" -> "strongly agree"
 *
 * @param {string} text
 * @returns {string}
 */
export function normalizeLabel(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    .toLowerCase()
    // Remove leading numbering or bullets like "1.", "1)", "(1)", "[1]", "A.", "a)"
    .replace(/^[\s(\[]*([0-9]+|[a-z])[\s.)\]\-:]+/i, '')
    // Remove trailing parenthetical scores like "(5)", "(score: 5)" if text precedes it
    .replace(/\s*\([0-9a-z\s:]+\)\s*$/i, '')
    // Replace non-alphanumeric (except spaces) with space
    .replace(/[^a-z0-9\s]/g, ' ')
    // Collapse multiple whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a control element is visible and enabled.
 *
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export function isValidControl(element) {
  if (!element) return false;
  if (element.disabled) return false;

  // Check hidden inputs
  if (element.type === 'hidden') return false;

  // Check style visibility
  if (typeof window !== 'undefined' && element.ownerDocument && element.ownerDocument.defaultView) {
    const style = element.ownerDocument.defaultView.getComputedStyle(element);
    if (style && (style.display === 'none' || style.visibility === 'hidden')) {
      return false;
    }
  }

  // Check aria-hidden
  if (element.getAttribute('aria-hidden') === 'true') return false;

  return true;
}

/**
 * Maps a target rating mode to the best matching answer option from an array of options.
 *
 * @param {string} mode - The requested rating mode (e.g. 'excellent', 'random', etc.)
 * @param {Array<{element: HTMLElement, labelText: string, value?: string, index?: number}>} options
 * @param {Object} [optionsConfig] - Optional configuration (e.g. randomFn for testing)
 * @returns {{success: boolean, option?: Object, reason?: string}}
 */
export function mapRatingToOption(mode, options, optionsConfig = {}) {
  if (!Array.isArray(options) || options.length === 0) {
    return { success: false, reason: 'No answer options provided' };
  }

  // Filter for valid (enabled and visible) controls
  const validOptions = options.filter(opt => {
    if (!opt) return false;
    if (opt.element && !isValidControl(opt.element)) return false;
    return true;
  });

  if (validOptions.length === 0) {
    return { success: false, reason: 'All available answer options are disabled or hidden' };
  }

  // Handle Random mode
  if (mode === RATING_MODES.RANDOM) {
    const randomFn = optionsConfig.randomFn || Math.random;
    const randomIndex = Math.floor(randomFn() * validOptions.length);
    const chosen = validOptions[randomIndex];
    return {
      success: true,
      option: chosen,
      mode: RATING_MODES.RANDOM,
    };
  }

  const synonyms = RATING_SYNONYMS[mode];
  if (!synonyms) {
    return { success: false, reason: `Unknown rating mode: ${mode}` };
  }

  // Step 1: Direct exact match on normalized label
  for (const opt of validOptions) {
    const norm = normalizeLabel(opt.labelText);
    if (norm === mode) {
      return { success: true, option: opt, mode };
    }
  }

  // Step 2: Exact synonym match on normalized label
  for (const synonym of synonyms) {
    for (const opt of validOptions) {
      const norm = normalizeLabel(opt.labelText);
      if (norm === synonym) {
        return { success: true, option: opt, mode };
      }
    }
  }

  // Step 3: Check if normalized label contains the synonym as a discrete phrase
  for (const synonym of synonyms) {
    // Avoid short numeric or 1-word substring false positives
    if (synonym.length < 3 || /^[0-9]+$/.test(synonym)) continue;

    for (const opt of validOptions) {
      const norm = normalizeLabel(opt.labelText);
      const regex = new RegExp(`\\b${synonym}\\b`, 'i');
      if (regex.test(norm)) {
        return { success: true, option: opt, mode };
      }
    }
  }

  // Step 4: Numeric scale evaluation
  // If options are purely numeric (e.g. 5, 4, 3, 2, 1 or 1, 2, 3, 4, 5)
  const isAllNumeric = validOptions.every(opt => {
    const norm = normalizeLabel(opt.labelText) || String(opt.value || '').trim();
    return /^[0-9]+$/.test(norm);
  });

  if (isAllNumeric) {
    const numericValues = validOptions.map(opt => {
      const norm = normalizeLabel(opt.labelText) || String(opt.value || '').trim();
      return parseInt(norm, 10);
    });

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);

    // Etlab and academic surveys standard: higher number = better rating (e.g. 5 is Excellent, 1 is Poor)
    // Check if mode has a corresponding numeric score
    let targetNum = null;
    if (max === 5 && min === 1) {
      // 5-point scale
      if (mode === RATING_MODES.EXCELLENT) targetNum = 5;
      else if (mode === RATING_MODES.VERY_GOOD) targetNum = 4;
      else if (mode === RATING_MODES.GOOD) targetNum = 3;
      else if (mode === RATING_MODES.AVERAGE) targetNum = 3;
      else if (mode === RATING_MODES.POOR) targetNum = 2;
      else if (mode === RATING_MODES.VERY_POOR) targetNum = 1;
    } else if (max === 10 && min === 1) {
      // 10-point scale
      if (mode === RATING_MODES.EXCELLENT) targetNum = 10;
      else if (mode === RATING_MODES.VERY_GOOD) targetNum = 8;
      else if (mode === RATING_MODES.GOOD) targetNum = 6;
      else if (mode === RATING_MODES.AVERAGE) targetNum = 5;
      else if (mode === RATING_MODES.POOR) targetNum = 3;
      else if (mode === RATING_MODES.VERY_POOR) targetNum = 1;
    }

    if (targetNum !== null) {
      const match = validOptions.find(opt => {
        const norm = normalizeLabel(opt.labelText) || String(opt.value || '').trim();
        return parseInt(norm, 10) === targetNum;
      });
      if (match) {
        return { success: true, option: match, mode };
      }
    }
  }

  // Could not map reliably.
  // Requirement: "If a rating cannot be mapped reliably, report the issue rather than silently selecting another rating."
  const availableLabels = validOptions.map(o => `"${o.labelText || o.value || 'unlabeled'}"`).join(', ');
  return {
    success: false,
    reason: `Rating mode "${mode}" could not be mapped reliably to available options: [${availableLabels}]`,
  };
}
