import { describe, it, expect } from 'vitest'
import { normalizeLabel, isValidControl, mapRatingToOption } from '../src/core/ratingMapper.js'
import { RATING_MODES } from '../src/core/constants.js'

describe('ratingMapper - normalizeLabel', () => {
  it('handles null, undefined, and non-string inputs', () => {
    expect(normalizeLabel(null)).toBe('')
    expect(normalizeLabel(undefined)).toBe('')
    expect(normalizeLabel(123)).toBe('')
  })

  it('normalizes simple text to lowercase with trimmed whitespace', () => {
    expect(normalizeLabel('  Excellent  ')).toBe('excellent')
    expect(normalizeLabel('VERY GOOD')).toBe('very good')
  })

  it('strips leading numbers, bullets, and numbering formats', () => {
    expect(normalizeLabel('1. Excellent')).toBe('excellent')
    expect(normalizeLabel('2) Very Good')).toBe('very good')
    expect(normalizeLabel('(3) Good')).toBe('good')
    expect(normalizeLabel('[4] Average')).toBe('average')
    expect(normalizeLabel('A. Poor')).toBe('poor')
    expect(normalizeLabel('b) Very Poor')).toBe('very poor')
  })

  it('strips trailing parenthetical scores', () => {
    expect(normalizeLabel('Excellent (5)')).toBe('excellent')
    expect(normalizeLabel('Strongly Agree (score: 5)')).toBe('strongly agree')
  })

  it('replaces special characters and collapses whitespace', () => {
    expect(normalizeLabel('Very-Good / Satisfactory!')).toBe('very good satisfactory')
  })
})

describe('ratingMapper - isValidControl', () => {
  it('returns false for null or undefined element', () => {
    expect(isValidControl(null)).toBe(false)
    expect(isValidControl(undefined)).toBe(false)
  })

  it('returns false for disabled controls', () => {
    const input = document.createElement('input')
    input.disabled = true
    expect(isValidControl(input)).toBe(false)
  })

  it('returns false for hidden input types or aria-hidden', () => {
    const hiddenInput = document.createElement('input')
    hiddenInput.type = 'hidden'
    expect(isValidControl(hiddenInput)).toBe(false)

    const ariaHiddenInput = document.createElement('input')
    ariaHiddenInput.setAttribute('aria-hidden', 'true')
    expect(isValidControl(ariaHiddenInput)).toBe(false)
  })

  it('returns true for normal, visible controls', () => {
    const radio = document.createElement('input')
    radio.type = 'radio'
    expect(isValidControl(radio)).toBe(true)
  })
})

describe('ratingMapper - mapRatingToOption', () => {
  const standard6PointOptions = [
    { labelText: 'Excellent', value: '6' },
    { labelText: 'Very Good', value: '5' },
    { labelText: 'Good', value: '4' },
    { labelText: 'Average', value: '3' },
    { labelText: 'Poor', value: '2' },
    { labelText: 'Very Poor', value: '1' },
  ]

  it('maps all 6 fixed rating modes accurately on a 6-point scale', () => {
    const modes = [
      { mode: RATING_MODES.EXCELLENT, expected: 'Excellent' },
      { mode: RATING_MODES.VERY_GOOD, expected: 'Very Good' },
      { mode: RATING_MODES.GOOD, expected: 'Good' },
      { mode: RATING_MODES.AVERAGE, expected: 'Average' },
      { mode: RATING_MODES.POOR, expected: 'Poor' },
      { mode: RATING_MODES.VERY_POOR, expected: 'Very Poor' },
    ]

    for (const { mode, expected } of modes) {
      const result = mapRatingToOption(mode, standard6PointOptions)
      expect(result.success).toBe(true)
      expect(result.option.labelText).toBe(expected)
      expect(result.mode).toBe(mode)
    }
  })

  it('handles Random mode by selecting among valid options', () => {
    // Custom randomFn returning 0 (first item)
    const result0 = mapRatingToOption(RATING_MODES.RANDOM, standard6PointOptions, {
      randomFn: () => 0,
    })
    expect(result0.success).toBe(true)
    expect(result0.option.labelText).toBe('Excellent')

    // Custom randomFn returning 0.99 (last item)
    const resultLast = mapRatingToOption(RATING_MODES.RANDOM, standard6PointOptions, {
      randomFn: () => 0.99,
    })
    expect(resultLast.success).toBe(true)
    expect(resultLast.option.labelText).toBe('Very Poor')
  })

  it('does NOT assume first radio is Excellent when options are in reverse order (Poor -> Excellent)', () => {
    const ascendingOptions = [
      { labelText: 'Poor', value: '1' },
      { labelText: 'Average', value: '2' },
      { labelText: 'Good', value: '3' },
      { labelText: 'Very Good', value: '4' },
      { labelText: 'Excellent', value: '5' },
    ]

    const result = mapRatingToOption(RATING_MODES.EXCELLENT, ascendingOptions)
    expect(result.success).toBe(true)
    expect(result.option.labelText).toBe('Excellent')
    expect(result.option.value).toBe('5')
  })

  it('reports failure when requested mode cannot be mapped reliably (does not guess silently)', () => {
    // 5-point scale missing 'Very Poor'
    const standard5PointOptions = [
      { labelText: 'Excellent', value: '5' },
      { labelText: 'Very Good', value: '4' },
      { labelText: 'Good', value: '3' },
      { labelText: 'Average', value: '2' },
      { labelText: 'Poor', value: '1' },
    ]

    const result = mapRatingToOption(RATING_MODES.VERY_POOR, standard5PointOptions)
    expect(result.success).toBe(false)
    expect(result.reason).toContain('could not be mapped reliably')
  })

  it('maps Likert agreement scales correctly', () => {
    const likertOptions = [
      { labelText: 'Strongly Agree', value: '5' },
      { labelText: 'Agree', value: '4' },
      { labelText: 'Neutral', value: '3' },
      { labelText: 'Disagree', value: '2' },
      { labelText: 'Strongly Disagree', value: '1' },
    ]

    expect(mapRatingToOption(RATING_MODES.EXCELLENT, likertOptions).option.labelText).toBe(
      'Strongly Agree',
    )
    expect(mapRatingToOption(RATING_MODES.VERY_GOOD, likertOptions).option.labelText).toBe('Agree')
    expect(mapRatingToOption(RATING_MODES.AVERAGE, likertOptions).option.labelText).toBe('Neutral')
    expect(mapRatingToOption(RATING_MODES.POOR, likertOptions).option.labelText).toBe('Disagree')
    expect(mapRatingToOption(RATING_MODES.VERY_POOR, likertOptions).option.labelText).toBe(
      'Strongly Disagree',
    )
  })

  it('maps numeric scales (1 to 5) based on higher = better standard', () => {
    const numericOptions = [
      { labelText: '5', value: '5' },
      { labelText: '4', value: '4' },
      { labelText: '3', value: '3' },
      { labelText: '2', value: '2' },
      { labelText: '1', value: '1' },
    ]

    expect(mapRatingToOption(RATING_MODES.EXCELLENT, numericOptions).option.labelText).toBe('5')
    expect(mapRatingToOption(RATING_MODES.VERY_GOOD, numericOptions).option.labelText).toBe('4')
    expect(mapRatingToOption(RATING_MODES.GOOD, numericOptions).option.labelText).toBe('3')
    expect(mapRatingToOption(RATING_MODES.POOR, numericOptions).option.labelText).toBe('2')
    expect(mapRatingToOption(RATING_MODES.VERY_POOR, numericOptions).option.labelText).toBe('1')
  })

  it('skips disabled and invalid controls during mapping', () => {
    const radioDisabled = document.createElement('input')
    radioDisabled.disabled = true

    const radioActive = document.createElement('input')

    const options = [
      { element: radioDisabled, labelText: 'Excellent', value: '5' },
      { element: radioActive, labelText: 'Good', value: '3' },
    ]

    // Excellent is disabled, so mapping to Excellent should fail because no enabled Excellent exists
    const resExcellent = mapRatingToOption(RATING_MODES.EXCELLENT, options)
    expect(resExcellent.success).toBe(false)

    // Good is active and valid
    const resGood = mapRatingToOption(RATING_MODES.GOOD, options)
    expect(resGood.success).toBe(true)
    expect(resGood.option.labelText).toBe('Good')
  })

  it('handles empty or all-disabled options array', () => {
    expect(mapRatingToOption(RATING_MODES.EXCELLENT, []).success).toBe(false)

    const disabledRadio = document.createElement('input')
    disabledRadio.disabled = true
    const allDisabled = [{ element: disabledRadio, labelText: 'Excellent' }]
    expect(mapRatingToOption(RATING_MODES.EXCELLENT, allDisabled).success).toBe(false)
  })
})
