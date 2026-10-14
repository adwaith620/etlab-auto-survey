# ETLAB Auto Survey — Cross-Browser Edition

Desktop browser extension for automating ETLAB surveys with six rating modes and automatic form submission.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](package.json)
[![Tests](https://img.shields.io/badge/tests-54%20passed-brightgreen.svg)](test)
[![Release](https://img.shields.io/badge/release-v2.0.0-blue.svg)](https://github.com/adwaith620/etlab-auto-survey/releases)

---

> [!WARNING]
>
> ### ⚠️ IMPORTANT NOTICE: PC / DESKTOP ONLY
>
> **This browser extension is strictly intended for PC / desktop and laptop web browsers.**
>
> It is **not supported** on Android mobile devices, iPhones, iPads, tablets, or standard mobile browser applications. Do not attempt to install these browser extension archives on mobile devices. A compatible desktop browser running on Windows, macOS, or Linux is required.
>
> _(For users who cannot run desktop extensions, an optional Userscript alternative is provided for userscript managers; see the [Optional Userscript Alternative](#optional-userscript-alternative) section below)._

---

## Overview

At the conclusion of academic semesters, engineering and arts college students using the **ETLAB Academic Management System** are required to submit extensive faculty, course, and institutional feedback surveys before accessing attendance records or examination results.

**ETLAB Auto Survey** automates this repetitive process on desktop browsers with a single click. When you click any of the 6 available rating options, the extension detects the survey questions, semantically matches the requested rating scale, verifies that selections were applied, and immediately submits the survey.

Originally created by [Vivek K J](https://github.com/vivekkj123/etlab-auto-survey) (`@vivekkj123/etlab-auto-survey`), this enhanced edition adds cross-browser support, semantic rating mapping, robust submission safeguards, and immediate execution.

---

## Features

### 1. Six Selectable Rating Modes

Every rating option executes the complete workflow immediately upon selection:

1. **Excellent**: Selects the highest positive rating (e.g. _Excellent_, _Outstanding_, _Strongly Agree_, score `5` or `10`).
2. **Very Good**: Selects high positive rating (e.g. _Very Good_, _Agree_, score `4` or `8`).
3. **Good**: Selects standard positive rating (e.g. _Good_, _Moderately Agree_, score `3` or `7`).
4. **Poor**: Selects low rating (e.g. _Poor_, _Disagree_, _Below Average_, score `2` or `4`).
5. **Very Poor**: Selects lowest rating (e.g. _Very Poor_, _Strongly Disagree_, _Lowest_, score `1`).
6. **Random**: Randomly selects among valid, enabled options for each question.

> [!IMPORTANT] > **Immediate Execution**: Clicking any rating option initiates immediate survey filling and automatic submission. **There is no secondary confirmation step, "Fill" button, or "Apply" prompt.** Select your desired rating carefully.

### 2. Semantic Rating Mapping

- Normalizes label text by removing numbering prefixes (`1.`, `2)`, `(A)`), trailing score parentheses (`(5)`), and extraneous whitespace.
- Never blindly assumes the first radio button is "Good" or "Excellent" (safely handling reversed or inverted rating scales).
- Adapts to 6-point, 5-point, 4-point, 3-point, Likert agreement scales, and numeric scales.
- Skips disabled, hidden, and `aria-hidden` form controls.

### 3. Automatic Submission & Safety Safeguards

- **No Partial Submissions**: If a question cannot be mapped reliably to the requested rating mode, submission is aborted and an issue is reported in the popup.
- **Submit Target Authentication**: Discovers authentic submit targets (`button[name="submitButton"]`, `button[type="submit"]`, `input[type="submit"]`).
- **Disallowed Button Protection**: Strictly ignores and never clicks unrelated controls (`Cancel`, `Reset`, `Clear`, `Logout`, `Sign out`, `Back`, `Save Draft`).
- **Duplicate Protection**: Concurrency locks prevent duplicate submissions from repeated clicks or duplicate events.
- **Pre-submission Detection**: Detects if the survey was already completed or submitted.
- **Verification**: Checks for client-side validation errors before reporting success.

---

## Downloads

Official release packages are published on [GitHub Releases](https://github.com/adwaith620/etlab-auto-survey/releases/tag/v2.0.0). Download the archive corresponding to your desktop browser:

| Browser              | Package Name                           | Direct Download                                                                                                           |
| :------------------- | :------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Google Chrome**    | `etlab-auto-survey-chrome-v2.0.0.zip`  | [Download](https://github.com/adwaith620/etlab-auto-survey/releases/download/v2.0.0/etlab-auto-survey-chrome-v2.0.0.zip)  |
| **Microsoft Edge**   | `etlab-auto-survey-edge-v2.0.0.zip`    | [Download](https://github.com/adwaith620/etlab-auto-survey/releases/download/v2.0.0/etlab-auto-survey-edge-v2.0.0.zip)    |
| **Opera / Opera GX** | `etlab-auto-survey-opera-v2.0.0.zip`   | [Download](https://github.com/adwaith620/etlab-auto-survey/releases/download/v2.0.0/etlab-auto-survey-opera-v2.0.0.zip)   |
| **Mozilla Firefox**  | `etlab-auto-survey-firefox-v2.0.0.zip` | [Download](https://github.com/adwaith620/etlab-auto-survey/releases/download/v2.0.0/etlab-auto-survey-firefox-v2.0.0.zip) |

_Always extract the downloaded ZIP file into a folder before loading._

---

## Step-by-Step Installation Instructions

### Google Chrome (Desktop)

1. Download [`etlab-auto-survey-chrome-v2.0.0.zip`](https://github.com/adwaith620/etlab-auto-survey/releases/download/v2.0.0/etlab-auto-survey-chrome-v2.0.0.zip) and extract it to a folder on your computer.
2. In Chrome, open a new tab and navigate to `chrome://extensions`.
3. In the top-right corner, turn on the **Developer mode** toggle.
4. Click the **Load unpacked** button in the top-left toolbar.
5. Select the extracted folder containing `manifest.json`.
6. Verify that **ETLAB Auto Survey — Cross-Browser Edition** appears in your extensions list without errors.

### Microsoft Edge (Desktop)

1. Download [`etlab-auto-survey-edge-v2.0.0.zip`](https://github.com/adwaith620/etlab-auto-survey/releases/download/v2.0.0/etlab-auto-survey-edge-v2.0.0.zip) and extract it to a folder.
2. In Edge, open a new tab and navigate to `edge://extensions`.
3. In the left sidebar, turn on the **Developer mode** toggle.
4. Click the **Load unpacked** button.
5. Select the extracted folder containing `manifest.json`.
6. Confirm that the extension is active and enabled.

### Opera / Opera GX (Desktop)

1. Download [`etlab-auto-survey-opera-v2.0.0.zip`](https://github.com/adwaith620/etlab-auto-survey/releases/download/v2.0.0/etlab-auto-survey-opera-v2.0.0.zip) and extract it.
2. In Opera, open a new tab and navigate to `opera://extensions`.
3. In the top-right corner, turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted folder containing `manifest.json`.
6. Verify that the extension loads successfully.

### Mozilla Firefox (Desktop)

1. Download [`etlab-auto-survey-firefox-v2.0.0.zip`](https://github.com/adwaith620/etlab-auto-survey/releases/download/v2.0.0/etlab-auto-survey-firefox-v2.0.0.zip) and extract it.
2. In Firefox, open a new tab and navigate to `about:debugging#/runtime/this-firefox`.
3. Under the **Temporary Extensions** section, click **Load Temporary Add-on...**.
4. Navigate into the extracted folder and select the `manifest.json` file.
5. Confirm that **ETLAB Auto Survey — Cross-Browser Edition** appears under Temporary Extensions.

> [!NOTE] > **Temporary vs. Permanent Firefox Installation**: Unpacked extensions loaded via `about:debugging` remain active for your current Firefox session and are unloaded when Firefox restarts. Under Mozilla's extension signing policy, permanent installation in release Firefox builds requires packaged extensions to be signed via Mozilla Add-ons (AMO). For persistent developer installations across restarts, use Firefox Developer Edition or Firefox Nightly with `xpinstall.signatures.required` disabled in `about:config`.

---

## How to Use

1. **Sign in to ETLAB**: Open your institutional ETLAB portal (e.g. `https://college.etlab.in`) in your desktop browser and log in with your student credentials.
2. **Navigate to the Survey**: Go to the active survey or evaluation page (e.g. `https://college.etlab.in/survey/user/answer?id=...`).
3. **Open the Extension**: Click the ETLAB Auto Survey icon in your browser toolbar.
4. **Choose a Rating**: Click one of the 6 rating buttons:
   - _Excellent_
   - _Very Good_
   - _Good_
   - _Poor_
   - _Very Poor_
   - _Random_
5. **Immediate Automated Execution**: The extension immediately selects the corresponding answers, populates standard text responses (e.g., student age and improvement observations), verifies the selections, and submits the form.
6. **Review Status**: The popup displays real-time execution feedback:
   - `Processing survey...`
   - `Responses selected. Submitting survey...`
   - `Survey submitted successfully.`

---

## Troubleshooting

| Issue                                                               | Cause                                                                            | Solution                                                                                                                                                                   |
| :------------------------------------------------------------------ | :------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **"Unsupported page. Open an Etlab survey first."**                 | The active tab is not an ETLAB survey URL.                                       | Navigate to an ETLAB survey URL matching `*.etlab.in/survey/*` or `*.etlab.in/feedback/*` before opening the popup.                                                        |
| **"Manifest file is missing or unreadable"**                        | You selected the parent folder instead of the folder containing `manifest.json`. | Extract the ZIP completely and ensure you select the root folder that directly contains `manifest.json`.                                                                   |
| **"Some questions could not be mapped. Survey was not submitted."** | The survey scale does not contain an equivalent option for the selected rating.  | The extension's safeguard prevented a partial submission. Choose a different rating that matches the survey scale (e.g. _Good_ instead of _Very Poor_ on a 3-point scale). |
| **"Survey appears to have already been submitted."**                | The survey was already completed or the form controls are read-only.             | No further action is required; your responses were already recorded by ETLAB.                                                                                              |
| **"Survey Submit button could not be identified safely."**          | The submit button does not match standard ETLAB naming patterns.                 | The extension safely aborted to avoid clicking unrelated controls. Complete and submit the survey manually.                                                                |
| **Extension icon not visible in toolbar**                           | The browser pinned state is disabled.                                            | Click the puzzle piece / Extensions icon in your browser toolbar and pin ETLAB Auto Survey.                                                                                |

---

## Privacy & Permissions

ETLAB Auto Survey requests only the minimal permissions necessary to operate:

- **`activeTab`**: Used only when you click the extension popup to interact with the current ETLAB tab.
- **`storage`**: Stores your preferred default rating mode locally in your browser across sessions.
- **`tabs`**: Checks the URL of the active tab to confirm an ETLAB survey is loaded before executing.
- **`*://*.etlab.in/*`**: Restricts content script execution strictly to verified ETLAB institutional domains.

**Zero Data Collection**: This extension does not track you, does not include analytics or telemetry, does not transmit personal data, and does not communicate with external servers. All operations occur strictly locally within your browser.

---

## Technical Verification & Testing

The extension's business logic, semantic rating mapper, submitter safeguards, and popup UI are verified by **54 automated unit & integration tests** executed with Vitest and JSDOM:

- Label normalization, punctuation stripping, and numbering prefix removal.
- All six rating modes across 6-point, 5-point, 4-point, 3-point, Likert, and numeric scales.
- Random selection among valid, enabled options.
- Prevention of partial or silent submissions when options are missing.
- Verification that disabled and hidden controls are skipped.
- Safe submit button identification and strict rejection of disallowed buttons (`Cancel`, `Reset`, `Logout`).
- Prevention of duplicate and concurrent submissions.
- Browser storage persistence and in-memory fallbacks.
- Immediate execution without secondary prompts.

```shell
# Run automated tests
npm test

# Build packages for all supported browsers
npm run build:all
```

> [!NOTE] > **Live ETLAB Submission Note**: Tests use simulated ETLAB DOM structures and an interactive mock fixture (`pages/page.html`). Live submissions on production ETLAB portals were not tested with fake student responses, as real institutional survey submissions are irreversible.

---

## Optional Userscript Alternative

For environments where browser extensions cannot be installed (such as mobile browsers with userscript support), an optional standalone userscript is provided at [`userscript/etlab-auto-survey.user.js`](userscript/etlab-auto-survey.user.js).

- Requires a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
- Adds a floating mobile-friendly action bar directly to ETLAB pages.
- Note: This userscript is an independent alternative and is completely separate from the desktop browser extension packages.

---

## Upstream Attribution & License

- **Original Project**: [etlab-auto-survey](https://github.com/vivekkj123/etlab-auto-survey) by [Vivek K J](https://github.com/vivekkj123)
- **Fork / Target Repository**: [adwaith620/etlab-auto-survey](https://github.com/adwaith620/etlab-auto-survey)
- **License**: [MIT License](LICENSE)
