import { describe, it, expect, beforeEach } from 'vitest';
import {
  isEtlabSurveyPage,
  detectSurveyQuestions,
  handleSurveyTextarea,
  executeSurveyWorkflow,
} from '../src/core/surveyEngine.js';
import { resetSubmittingState } from '../src/core/submitter.js';
import { RATING_MODES, STATUS_CODES } from '../src/core/constants.js';

describe('surveyEngine - isEtlabSurveyPage', () => {
  it('returns true for Etlab survey and feedback URLs', () => {
    expect(isEtlabSurveyPage('https://cet.etlab.in/survey/user/answer?id=45')).toBe(true);
    expect(isEtlabSurveyPage('http://rit.etlab.in/survey/fill/12')).toBe(true);
    expect(isEtlabSurveyPage('https://gecw.etlab.in/feedback/faculty')).toBe(true);
  });

  it('returns false for non-Etlab or unrelated URLs', () => {
    expect(isEtlabSurveyPage('https://google.com')).toBe(false);
    expect(isEtlabSurveyPage('https://example.com/survey/user/answer')).toBe(false);
    expect(isEtlabSurveyPage('https://cet.etlab.in/student/attendance')).toBe(false);
  });
});

describe('surveyEngine - Question Detection and Textarea handling', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('detects list items with questions, radios, and selects', () => {
    document.body.innerHTML = `
      <form id="survey">
        <ul>
          <li>
            <div class="question">1. Clarity of instruction</div>
            <div class="answer">
              <label><input type="radio" name="q1" value="5"> Excellent</label>
              <label><input type="radio" name="q1" value="4"> Very Good</label>
              <label><input type="radio" name="q1" value="3"> Good</label>
              <label><input type="radio" name="q1" value="2"> Average</label>
              <label><input type="radio" name="q1" value="1"> Poor</label>
            </div>
          </li>
          <li>
            <div class="question">2. Punctuality</div>
            <div class="answer">
              <select name="q2">
                <option value="">-- Choose --</option>
                <option value="5">Excellent</option>
                <option value="3">Good</option>
                <option value="1">Poor</option>
              </select>
            </div>
          </li>
        </ul>
      </form>
    `;

    const questions = detectSurveyQuestions(document);
    expect(questions.length).toBe(2);
    expect(questions[0].type).toBe('radio');
    expect(questions[0].options.length).toBe(5);
    expect(questions[1].type).toBe('select');
    expect(questions[1].options.length).toBe(3);
  });

  it('fills textareas with appropriate responses for age and observation questions', () => {
    const ageTextarea = document.createElement('textarea');
    handleSurveyTextarea(ageTextarea, 'Enter your age in years');
    const ageVal = parseInt(ageTextarea.value, 10);
    expect(ageVal).toBeGreaterThanOrEqual(20);
    expect(ageVal).toBeLessThanOrEqual(25);

    const obsTextarea = document.createElement('textarea');
    handleSurveyTextarea(obsTextarea, 'Any observation or suggestions for improvement?');
    expect(obsTextarea.value).toBe('Nothing');
  });
});

describe('surveyEngine - Full workflow and safeguards', () => {
  beforeEach(() => {
    resetSubmittingState();
    document.body.innerHTML = '';
  });

  function setupSampleEtlabDOM() {
    document.body.innerHTML = `
      <form id="surveyForm" action="/survey/submit" method="post">
        <ul>
          <li>
            <div class="question">1. Faculty knowledge of subject</div>
            <div class="answer">
              <label><input type="radio" name="q1" value="5"> Excellent</label>
              <label><input type="radio" name="q1" value="4"> Very Good</label>
              <label><input type="radio" name="q1" value="3"> Good</label>
              <label><input type="radio" name="q1" value="2"> Average</label>
              <label><input type="radio" name="q1" value="1"> Poor</label>
              <label><input type="radio" name="q1" value="0"> Very Poor</label>
            </div>
          </li>
          <li>
            <div class="question">2. Communication skills</div>
            <div class="answer">
              <label><input type="radio" name="q2" value="5"> Excellent</label>
              <label><input type="radio" name="q2" value="4"> Very Good</label>
              <label><input type="radio" name="q2" value="3"> Good</label>
              <label><input type="radio" name="q2" value="2"> Average</label>
              <label><input type="radio" name="q2" value="1"> Poor</label>
              <label><input type="radio" name="q2" value="0"> Very Poor</label>
            </div>
          </li>
          <li>
            <div class="question">3. Suggestions for improvement</div>
            <div class="answer">
              <textarea name="remarks"></textarea>
            </div>
          </li>
        </ul>
        <button type="button" name="submitButton">Submit Survey</button>
      </form>
    `;
  }

  it('successfully selects answers for Excellent and submits survey automatically', async () => {
    setupSampleEtlabDOM();

    let submitted = false;
    const submitBtn = document.querySelector('button[name="submitButton"]');
    submitBtn.addEventListener('click', () => {
      submitted = true;
    });

    const result = await executeSurveyWorkflow(RATING_MODES.EXCELLENT, document);

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(STATUS_CODES.SUCCESS);
    expect(submitted).toBe(true);

    const q1Radio = document.querySelector('input[name="q1"][value="5"]');
    const q2Radio = document.querySelector('input[name="q2"][value="5"]');
    expect(q1Radio.checked).toBe(true);
    expect(q2Radio.checked).toBe(true);

    const remarks = document.querySelector('textarea[name="remarks"]');
    expect(remarks.value).toBe('Nothing');
  });

  it('successfully selects answers for Poor and submits survey', async () => {
    setupSampleEtlabDOM();

    const result = await executeSurveyWorkflow(RATING_MODES.POOR, document);

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(STATUS_CODES.SUCCESS);

    const q1Radio = document.querySelector('input[name="q1"][value="1"]');
    expect(q1Radio.checked).toBe(true);
  });

  it('safeguard: prevents submission if any question cannot be mapped reliably', async () => {
    // Missing 'Very Poor' option in this survey scale
    document.body.innerHTML = `
      <form id="surveyForm">
        <ul>
          <li>
            <div class="question">1. Faculty knowledge of subject</div>
            <div class="answer">
              <label><input type="radio" name="q1" value="3"> High</label>
              <label><input type="radio" name="q1" value="2"> Moderate</label>
              <label><input type="radio" name="q1" value="1"> Low</label>
            </div>
          </li>
        </ul>
        <button type="button" name="submitButton">Submit</button>
      </form>
    `;

    let submitted = false;
    document.querySelector('button[name="submitButton"]').addEventListener('click', () => {
      submitted = true;
    });

    // Requesting Very Poor on a High/Moderate/Low scale
    const result = await executeSurveyWorkflow(RATING_MODES.VERY_POOR, document);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(STATUS_CODES.PARTIAL_MAPPING);
    expect(submitted).toBe(false); // Safeguard: must NOT submit partial/unmapped
  });

  it('safeguard: prevents submission if survey has already been completed', async () => {
    document.body.innerHTML = `
      <div class="alert">You have already completed this survey.</div>
      <form>
        <button name="submitButton">Submit</button>
      </form>
    `;

    const result = await executeSurveyWorkflow(RATING_MODES.EXCELLENT, document);
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(STATUS_CODES.ALREADY_SUBMITTED);
  });

  it('safeguard: reports NO_QUESTIONS when no questions are present on the page', async () => {
    document.body.innerHTML = `<div>Welcome to Etlab Student Portal</div>`;

    const result = await executeSurveyWorkflow(RATING_MODES.EXCELLENT, document);
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(STATUS_CODES.NO_QUESTIONS);
  });
});
