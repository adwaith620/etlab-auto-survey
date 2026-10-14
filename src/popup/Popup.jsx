import React, { useEffect, useState, useCallback } from 'react';
import './Popup.css';
import {
  RATING_MODES,
  RATING_LABELS,
  DEFAULT_RATING_MODE,
  STATUS_CODES,
  STATUS_MESSAGES,
} from '../core/constants.js';
import { getActiveTab, sendMessageToTab } from '../common/browserApi.js';
import { getSelectedRatingMode, setSelectedRatingMode } from '../common/storage.js';
import { isEtlabSurveyPage } from '../core/surveyEngine.js';

const RATING_BUTTONS = [
  { mode: RATING_MODES.EXCELLENT, colorClass: 'btn-excellent' },
  { mode: RATING_MODES.VERY_GOOD, colorClass: 'btn-very-good' },
  { mode: RATING_MODES.GOOD, colorClass: 'btn-good' },
  { mode: RATING_MODES.AVERAGE, colorClass: 'btn-average' },
  { mode: RATING_MODES.POOR, colorClass: 'btn-poor' },
  { mode: RATING_MODES.VERY_POOR, colorClass: 'btn-very-poor' },
  { mode: RATING_MODES.RANDOM, colorClass: 'btn-random' },
];

export default function Popup() {
  const [selectedMode, setSelectedMode] = useState(DEFAULT_RATING_MODE);
  const [isSupportedPage, setIsSupportedPage] = useState(null); // null = checking, true/false
  const [statusMessage, setStatusMessage] = useState('');
  const [statusCode, setStatusCode] = useState(STATUS_CODES.IDLE);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  // Initialize: load stored mode and check active tab
  useEffect(() => {
    let isMounted = true;

    async function init() {
      // 1. Restore stored selection
      const stored = await getSelectedRatingMode();
      if (isMounted && stored) {
        setSelectedMode(stored);
      }

      // 2. Validate current tab
      const tab = await getActiveTab();
      if (!isMounted) return;

      if (!tab || !tab.url) {
        setIsSupportedPage(false);
        setStatusCode(STATUS_CODES.UNSUPPORTED_PAGE);
        setStatusMessage(STATUS_MESSAGES[STATUS_CODES.UNSUPPORTED_PAGE]);
        return;
      }

      setActiveTab(tab);
      const isSurvey = isEtlabSurveyPage(tab.url);
      setIsSupportedPage(isSurvey);

      if (!isSurvey) {
        setStatusCode(STATUS_CODES.UNSUPPORTED_PAGE);
        setStatusMessage(STATUS_MESSAGES[STATUS_CODES.UNSUPPORTED_PAGE]);
      } else {
        // Query status from content script to see if already submitted
        try {
          const statusRes = await sendMessageToTab(tab.id, { action: 'checkSurveyStatus' });
          if (isMounted && statusRes && statusRes.alreadySubmitted) {
            setStatusCode(STATUS_CODES.ALREADY_SUBMITTED);
            setStatusMessage(STATUS_MESSAGES[STATUS_CODES.ALREADY_SUBMITTED]);
          }
        } catch {
          // Content script may not have injected yet if page was already loaded
        }
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Immediate-action workflow:
   * Clicking a rating option persists the choice and immediately initiates
   * survey fill and automatic submission without any secondary prompt.
   */
  const handleRatingClick = useCallback(
    async mode => {
      if (isExecuting) return; // Prevent duplicate concurrent runs

      setSelectedMode(mode);
      setSelectedRatingMode(mode); // Persist across sessions

      if (!isSupportedPage || !activeTab) {
        setStatusCode(STATUS_CODES.UNSUPPORTED_PAGE);
        setStatusMessage(STATUS_MESSAGES[STATUS_CODES.UNSUPPORTED_PAGE]);
        return;
      }

      setIsExecuting(true);
      setStatusCode(STATUS_CODES.PROCESSING);
      setStatusMessage(STATUS_MESSAGES[STATUS_CODES.PROCESSING]);

      try {
        const response = await sendMessageToTab(activeTab.id, {
          action: 'executeSurvey',
          mode,
        });

        if (!response) {
          setStatusCode(STATUS_CODES.SUBMISSION_FAILED);
          setStatusMessage(STATUS_MESSAGES[STATUS_CODES.SUBMISSION_FAILED]);
          return;
        }

        if (response.success) {
          setStatusCode(STATUS_CODES.SUCCESS);
          setStatusMessage(STATUS_MESSAGES[STATUS_CODES.SUCCESS]);
        } else {
          const code = response.statusCode || STATUS_CODES.SUBMISSION_FAILED;
          setStatusCode(code);
          setStatusMessage(response.message || STATUS_MESSAGES[code] || STATUS_MESSAGES[STATUS_CODES.SUBMISSION_FAILED]);
        }
      } catch (err) {
        setStatusCode(STATUS_CODES.SUBMISSION_FAILED);
        setStatusMessage(err.message || STATUS_MESSAGES[STATUS_CODES.SUBMISSION_FAILED]);
      } finally {
        setIsExecuting(false);
      }
    },
    [isExecuting, isSupportedPage, activeTab]
  );

  return (
    <main className="etlab-popup" role="region" aria-label="ETLAB Auto Survey Filler">
      <header className="popup-header">
        <img src="/img/logo-34.png" alt="" className="popup-logo" aria-hidden="true" />
        <h1 className="popup-title">ETLAB Auto Survey</h1>
      </header>

      {isSupportedPage === false ? (
        <div className="unsupported-container" role="alert">
          <div className="status-icon warning" aria-hidden="true">⚠️</div>
          <p className="unsupported-msg">Unsupported page. Open an Etlab survey first.</p>
          <span className="unsupported-hint">Navigate to your college's Etlab survey page to use this tool.</span>
        </div>
      ) : (
        <>
          <p className="section-label" id="rating-group-label">
            Select rating to fill and submit immediately:
          </p>

          <div
            className="ratings-grid"
            role="group"
            aria-labelledby="rating-group-label"
          >
            {RATING_BUTTONS.map(({ mode, colorClass }) => {
              const isSelected = selectedMode === mode;
              const label = RATING_LABELS[mode];

              return (
                <button
                  key={mode}
                  type="button"
                  className={`rating-btn ${colorClass} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleRatingClick(mode)}
                  disabled={isExecuting}
                  aria-pressed={isSelected}
                  title={`Immediately fill and submit survey as ${label}`}
                >
                  <span className="btn-label">{label}</span>
                  {isSelected && <span className="selected-indicator" aria-label="Default rating">✓</span>}
                </button>
              );
            })}
          </div>

          <div
            className={`status-area ${statusCode.toLowerCase()} ${isExecuting ? 'loading' : ''}`}
            aria-live="polite"
            role="status"
          >
            {isExecuting && <span className="spinner" aria-hidden="true" />}
            <span className="status-text">{statusMessage || (selectedMode ? `Ready (${RATING_LABELS[selectedMode]} selected)` : 'Ready')}</span>
          </div>
        </>
      )}
    </main>
  );
}
