/**
 * ETLAB Auto Survey - Content Script
 *
 * Runs inside Etlab survey pages. Listens for automation commands from
 * the extension popup or background worker, executes the rating-mapping
 * and submission workflow, and reports detailed status.
 */

import { executeSurveyWorkflow, detectSurveyQuestions, isEtlabSurveyPage } from '../core/surveyEngine.js';
import { isSurveyAlreadySubmitted } from '../core/submitter.js';
import { RATING_MODES, STATUS_CODES } from '../core/constants.js';

// Setup message listener
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. Status query
    if (request.action === 'checkSurveyStatus') {
      const isSurvey = isEtlabSurveyPage(window.location.href, document);
      const alreadySubmitted = isSurveyAlreadySubmitted(document);
      const questions = detectSurveyQuestions(document);

      sendResponse({
        isSurvey,
        alreadySubmitted,
        questionCount: questions.length,
      });
      return false;
    }

    // 2. Legacy action compatibility
    let mode = request.mode;
    if (request.action === 'markGood') {
      mode = RATING_MODES.EXCELLENT;
    } else if (request.action === 'markRandom') {
      mode = RATING_MODES.RANDOM;
    }

    // 3. Main survey execution workflow
    if (mode || request.action === 'executeSurvey') {
      const targetMode = mode || RATING_MODES.EXCELLENT;

      executeSurveyWorkflow(targetMode, document)
        .then(result => {
          sendResponse(result);
        })
        .catch(err => {
          sendResponse({
            success: false,
            statusCode: STATUS_CODES.ERROR,
            message: err.message || 'Error occurred while processing survey.',
          });
        });

      return true; // Keep message channel open for async response
    }

    return false;
  });
}
