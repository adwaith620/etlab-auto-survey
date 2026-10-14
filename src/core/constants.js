/**
 * ETLAB Auto Survey - Constants and Types
 */

export const RATING_MODES = {
  EXCELLENT: 'excellent',
  VERY_GOOD: 'very_good',
  GOOD: 'good',
  AVERAGE: 'average',
  POOR: 'poor',
  VERY_POOR: 'very_poor',
  RANDOM: 'random',
}

export const DEFAULT_RATING_MODE = RATING_MODES.EXCELLENT

export const RATING_LABELS = {
  [RATING_MODES.EXCELLENT]: 'Excellent',
  [RATING_MODES.VERY_GOOD]: 'Very Good',
  [RATING_MODES.GOOD]: 'Good',
  [RATING_MODES.AVERAGE]: 'Average',
  [RATING_MODES.POOR]: 'Poor',
  [RATING_MODES.VERY_POOR]: 'Very Poor',
  [RATING_MODES.RANDOM]: 'Random',
}

export const STATUS_CODES = {
  IDLE: 'IDLE',
  PROCESSING: 'PROCESSING',
  SUBMITTING: 'SUBMITTING',
  SUCCESS: 'SUCCESS',
  UNSUPPORTED_PAGE: 'UNSUPPORTED_PAGE',
  PARTIAL_MAPPING: 'PARTIAL_MAPPING',
  SUBMISSION_FAILED: 'SUBMISSION_FAILED',
  ALREADY_SUBMITTED: 'ALREADY_SUBMITTED',
  NO_QUESTIONS: 'NO_QUESTIONS',
  SUBMIT_BUTTON_NOT_FOUND: 'SUBMIT_BUTTON_NOT_FOUND',
  UNKNOWN_RESULT: 'UNKNOWN_RESULT',
  ERROR: 'ERROR',
}

export const STATUS_MESSAGES = {
  [STATUS_CODES.IDLE]: '',
  [STATUS_CODES.PROCESSING]: 'Processing survey...',
  [STATUS_CODES.SUBMITTING]: 'Responses selected. Submitting survey...',
  [STATUS_CODES.SUCCESS]: 'Survey submitted successfully.',
  [STATUS_CODES.UNSUPPORTED_PAGE]: 'Unsupported page. Open an Etlab survey first.',
  [STATUS_CODES.PARTIAL_MAPPING]: 'Some questions could not be mapped. Survey was not submitted.',
  [STATUS_CODES.SUBMISSION_FAILED]: 'Submission failed. Please review the survey manually.',
  [STATUS_CODES.ALREADY_SUBMITTED]: 'Survey appears to have already been submitted.',
  [STATUS_CODES.NO_QUESTIONS]: 'No survey questions detected on this page.',
  [STATUS_CODES.SUBMIT_BUTTON_NOT_FOUND]: 'Survey Submit button could not be identified safely.',
  [STATUS_CODES.UNKNOWN_RESULT]: 'Survey submitted, but confirmation could not be verified.',
  [STATUS_CODES.ERROR]: 'An unexpected error occurred.',
}

/**
 * Semantic synonyms for rating scales across various institutional Etlab surveys.
 * Supports standard descriptive ratings, agreement/Likert scales, and numeric scales.
 */
export const RATING_SYNONYMS = {
  [RATING_MODES.EXCELLENT]: [
    'excellent',
    'outstanding',
    'exceptional',
    'strongly agree',
    'very high',
    'very satisfied',
    'highest',
    'always',
    'great',
    '5',
    '10',
  ],
  [RATING_MODES.VERY_GOOD]: [
    'very good',
    'very well',
    'agree',
    'satisfied',
    'above average',
    'mostly',
    'high',
    '4',
    '8',
  ],
  [RATING_MODES.GOOD]: [
    'good',
    'well',
    'fairly good',
    'moderately agree',
    'somewhat agree',
    'often',
    'competent',
    '3',
    '7',
  ],
  [RATING_MODES.AVERAGE]: [
    'average',
    'moderate',
    'neutral',
    'satisfactory',
    'undecided',
    'neither agree nor disagree',
    'fair',
    'sometimes',
    'medium',
    'adequate',
    '3',
    '5',
    '6',
  ],
  [RATING_MODES.POOR]: [
    'poor',
    'disagree',
    'below average',
    'unsatisfactory',
    'dissatisfied',
    'rarely',
    'low',
    'inadequate',
    '2',
    '4',
  ],
  [RATING_MODES.VERY_POOR]: [
    'very poor',
    'strongly disagree',
    'lowest',
    'very low',
    'very dissatisfied',
    'never',
    'unacceptable',
    'extremely poor',
    '1',
  ],
}

export const STORAGE_KEY_SELECTED_MODE = 'etlab_selected_rating_mode'
