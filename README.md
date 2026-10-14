# ETLAB Auto Survey — Cross-Browser Edition

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](package.json)
[![Tests](https://img.shields.io/badge/tests-54%20passed-brightgreen.svg)](test)

A polished, cross-browser extension and automation tool for completing institutional **ETLAB** faculty, course, and institutional evaluations instantly with selectable ratings, semantic option mapping, and verified automatic submission.

Originally created by [Vivek K J](https://github.com/vivekkj123/etlab-auto-survey) (`@vivekkj123/etlab-auto-survey`), extended into a cross-browser, immediate-action edition.

---

## Key Features

- **7 Selectable Rating Modes**:
  1. **Excellent** (Default)
  2. **Very Good**
  3. **Good**
  4. **Average**
  5. **Poor**
  6. **Very Poor**
  7. **Random** (selects randomly among valid available options)
- **Immediate-Action Execution**:
  - One-click authorization: Clicking any rating option executes the complete workflow immediately.
  - **No intermediate confirmation dialogs, no separate "Fill" or "Apply" buttons.**
- **Intelligent Semantic Rating Mapping**:
  - Normalizes answer labels (handles punctuation, leading numbers like `1.`, `(A)`, whitespace, and case).
  - Never assumes the first radio button is "Excellent" or "Good".
  - Understands 6-point, 5-point, 4-point, 3-point, Likert agreement scales, and numeric scales.
  - Skips hidden, disabled, or invalid controls.
- **Robust Automatic Submission & Safeguards**:
  - Verifies all questions were answered before submitting.
  - **Never submits partially completed surveys**: If a rating cannot be mapped reliably, submission is aborted and an issue is reported.
  - Authenticates submit buttons (`name="submitButton"`, `type="submit"`) while strictly rejecting dangerous buttons (`Cancel`, `Reset`, `Logout`, `Save Draft`, `Back`).
  - Guards against concurrent/duplicate submissions.
  - Detects if a survey was already completed or submitted.
- **Cross-Browser Compatibility**:
  - **Google Chrome**, **Microsoft Edge**, **Opera**, and **Mozilla Firefox**.
  - Dynamic Manifest V3 architecture with Gecko-specific background script support.
- **Persistent Preferences**:
  - Persists the selected rating mode across popup closures and browser restarts.
- **Mobile Compatibility & Userscript**:
  - Support for Chromium Android browsers (Kiwi Browser, Lemur) and Firefox for Android.
  - Includes a dedicated Userscript (`userscript/etlab-auto-survey.user.js`) for mobile environments where extensions cannot be sideloaded.

---

## Architecture & Workflow Trace

```
[User Clicks Rating Button (e.g. Excellent)]
                  │
                  ▼
   1. Persist mode to browser.storage
   2. Validate active tab (verify *.etlab.in survey URL)
   3. Content script scans DOM for questions & options
   4. Normalize option labels and map semantic mode
   5. Select verified controls & fill textareas (age / suggestions)
   6. Verify that all selections were applied
   7. Identify authentic Submit button (reject cancel/reset/logout)
   8. Automatically submit survey
   9. Report verified status back to popup
```

---

## Installation & Browser Setup

### 1. Google Chrome
1. Download or clone this repository.
2. Run `npm install && npm run build` (or `npm run build:chrome`).
3. Open Chrome and navigate to `chrome://extensions`.
4. Toggle **Developer mode** in the top-right corner.
5. Click **Load unpacked** and select the `build` directory.
6. Navigate to your college's Etlab survey page and click the extension icon.

### 2. Microsoft Edge
1. Build the extension via `npm run build`.
2. Open Edge and navigate to `edge://extensions`.
3. Enable **Developer mode** in the left sidebar.
4. Click **Load unpacked** and select the `build` directory.

### 3. Opera / Opera GX
1. Build the extension via `npm run build`.
2. Open Opera and navigate to `opera://extensions`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the `build` directory.

### 4. Mozilla Firefox
1. Build the Firefox-specific bundle via `npm run build:firefox` (generates `build-firefox/` and `package/etlab-auto-survey-firefox-v2.0.0.zip`).
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**.
4. Select `build-firefox/manifest.json`.

---

## Mobile Compatibility Assessment

| Platform / Browser | Support Status | Method | Notes |
| :--- | :--- | :--- | :--- |
| **Kiwi Browser (Android)** | Fully Supported | Load Unpacked / Zip | Full Chromium extension API and popup support. |
| **Lemur Browser (Android)** | Fully Supported | Load Unpacked / Zip | Supports desktop Chrome extensions directly. |
| **Firefox for Android** | Supported via Add-on Collection | WebExtensions (MV3) | Requires Firefox Nightly / Beta custom add-on collection. |
| **Chrome for Android** | Extension Not Supported | Userscript Alternative | Google Chrome for Android does not support browser extensions. Use the provided Userscript (`userscript/etlab-auto-survey.user.js`) via Tampermonkey/AdGuard. |
| **iOS Safari** | Restricted | Userscript Alternative | Sideloading unpacked extensions is restricted by Apple. Use Userscripts extension or Orion Browser with the userscript. |

### Using the Userscript Alternative
Install `userscript/etlab-auto-survey.user.js` in Tampermonkey, Violentmonkey, or the Userscripts extension on iOS/Android to get a floating quick-action survey toolbar directly on Etlab pages.

---

## Permissions & Purposes

| Permission | Purpose |
| :--- | :--- |
| `activeTab` | Grants temporary access to the active survey tab when the user clicks the extension popup. |
| `storage` | Persists user rating preferences (e.g., Default Rating Mode) across sessions and restarts. |
| `tabs` | Validates the URL of the active tab to confirm an Etlab survey is loaded before execution. |
| `*://*.etlab.in/*` | Restricts content script execution strictly to verified institutional Etlab domains. |

---

## Development & Testing

```shell
# Clone the repository
git clone https://github.com/vivekkj123/etlab-auto-survey.git
cd etlab-auto-survey

# Install dependencies
npm install

# Run automated unit and integration tests
npm test

# Build for Chrome, Edge, and Opera
npm run build:chrome

# Build for Firefox
npm run build:firefox

# Build for all supported browsers simultaneously
npm run build:all
```

---

## Test Coverage

The test suite contains **54 automated unit & integration tests** covering:
- Semantic label normalization and punctuation handling.
- Every fixed rating mode (Excellent, Very Good, Good, Average, Poor, Very Poor).
- Random selection among valid, enabled controls.
- Prevention of silent guessing when ratings cannot be mapped reliably.
- Multi-scale support (6-point, 5-point, 4-point, 3-point, Likert, numeric).
- Disabled and hidden control exclusion.
- Submitter safeguard verification (disallowed button rejection, duplicate prevention).
- SurveyEngine end-to-end simulation.
- React Popup UI immediate one-click execution and accessibility.
- Cross-browser storage abstraction and memory fallback.

---

## Known Limitations

1. **Non-Standard Survey Forms**: If an Etlab institution injects custom CAPTCHA verification prior to submission, the extension will populate the responses and wait for manual CAPTCHA entry.
2. **First-5 Questions in Student Satisfaction Survey**: On institutional surveys titled "Student Satisfaction Survey", the first five demographic questions (e.g. personal student information) are left for manual completion as per Etlab institutional guidelines.
3. **Network Latency & Server Errors**: If the Etlab server encounters an internal error (500) during form processing, the extension surfaces an accurate status message instructing the user to review the survey manually.

---

## License & Attribution

This project is open-source software licensed under the [MIT License](LICENSE).

- **Original Author**: [Vivek K J](https://github.com/vivekkj123)
- **Contributors**: AlertHub Developer, Antigravity
