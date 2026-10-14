// ==UserScript==
// @name         ETLAB Auto Survey — Mobile & Userscript Edition
// @namespace    https://github.com/vivekkj123/etlab-auto-survey
// @version      2.0.0
// @description  Automated survey and feedback filler for ETLAB with selectable ratings and instant submission on mobile and desktop.
// @author       Vivek K J & Antigravity
// @match        *://*.etlab.in/survey/*
// @match        *://*.etlab.in/feedback/*
// @match        *://*.etlab.in/evaluation/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

;(function () {
  'use strict'

  // Floating mobile quick-action bar
  const container = document.createElement('div')
  container.id = 'etlab-auto-survey-bar'
  container.innerHTML = `
    <style>
      #etlab-auto-survey-bar {
        position: fixed;
        bottom: 12px;
        right: 12px;
        left: 12px;
        max-width: 450px;
        margin: 0 auto;
        background: #1e293b;
        color: #f8fafc;
        padding: 10px 14px;
        border-radius: 12px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.25);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .eas-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
      }
      .eas-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .eas-btn {
        flex: 1 1 30%;
        background: #334155;
        color: #fff;
        border: 1px solid #475569;
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        text-align: center;
      }
      .eas-btn:active { background: #475569; }
      .eas-btn.excellent { border-left: 3px solid #16a34a; }
      .eas-btn.very-good { border-left: 3px solid #059669; }
      .eas-btn.good { border-left: 3px solid #0284c7; }
      .eas-btn.poor { border-left: 3px solid #ea580c; }
      .eas-btn.very-poor { border-left: 3px solid #dc2626; }
      .eas-btn.random { border-left: 3px solid #7c3aed; }
      .eas-status { font-size: 11px; color: #94a3b8; }
    </style>
    <div class="eas-header">
      <span>⚡ ETLAB Auto Survey</span>
      <button style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;" onclick="this.closest('#etlab-auto-survey-bar').remove();">✕</button>
    </div>
    <div class="eas-buttons">
      <button class="eas-btn excellent" data-mode="excellent">Excellent</button>
      <button class="eas-btn very-good" data-mode="very_good">Very Good</button>
      <button class="eas-btn good" data-mode="good">Good</button>
      <button class="eas-btn poor" data-mode="poor">Poor</button>
      <button class="eas-btn very-poor" data-mode="very_poor">Very Poor</button>
      <button class="eas-btn random" data-mode="random">Random</button>
    </div>
    <div class="eas-status" id="eas-status-msg">Tap a rating to fill & submit immediately</div>
  `

  document.body.appendChild(container)

  const statusEl = document.getElementById('eas-status-msg')

  function normalize(str) {
    return (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const synonyms = {
    excellent: ['excellent', 'outstanding', 'strongly agree', 'high', 'highest', '5', '10'],
    very_good: ['very good', 'very well', 'agree', '4', '8', 'satisfied'],
    good: ['good', 'fairly good', 'moderately agree', '3', '7', 'somewhat agree'],
    poor: ['poor', 'disagree', 'below average', 'low', '2', '4', 'dissatisfied'],
    very_poor: ['very poor', 'strongly disagree', 'lowest', 'never', '1', 'unacceptable'],
  }

  function executeSurvey(mode) {
    statusEl.textContent = 'Processing survey...'

    const listItems = document.querySelectorAll('li')
    let answered = 0
    let failed = false

    listItems.forEach((li) => {
      const qEl = li.querySelector('.question')
      if (!qEl) return
      const ansEl = li.querySelector('.answer') || li

      // Handle Radios
      const radios = Array.from(ansEl.querySelectorAll('input[type="radio"]:not([disabled])'))
      if (radios.length > 0) {
        let chosen = null
        if (mode === 'random') {
          chosen = radios[Math.floor(Math.random() * radios.length)]
        } else {
          const list = synonyms[mode] || [mode]
          for (const syn of list) {
            for (const r of radios) {
              const label = r.closest('label')
                ? r.closest('label').textContent
                : r.nextSibling
                ? r.nextSibling.textContent
                : r.value
              if (normalize(label).includes(syn)) {
                chosen = r
                break
              }
            }
            if (chosen) break
          }
        }

        if (chosen) {
          chosen.click()
          chosen.checked = true
          chosen.dispatchEvent(new Event('change', { bubbles: true }))
          answered++
        } else {
          failed = true
        }
      }

      // Handle Textarea
      const ta = ansEl.querySelector('textarea')
      if (ta) {
        if (qEl.textContent.toLowerCase().includes('age')) {
          ta.value = Math.floor(Math.random() * 5) + 20
        } else {
          ta.value = 'Nothing'
        }
        ta.dispatchEvent(new Event('input', { bubbles: true }))
        ta.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })

    if (failed && mode !== 'random') {
      statusEl.textContent = 'Some questions could not be mapped. Survey was not submitted.'
      return
    }

    statusEl.textContent = 'Responses selected. Submitting survey...'

    // Submit safeguard
    const submitBtn = document.querySelector(
      'button[name="submitButton"], button[type="submit"], input[type="submit"]',
    )
    if (
      submitBtn &&
      !/cancel|reset|logout|back/i.test(submitBtn.name || submitBtn.textContent || '')
    ) {
      submitBtn.click()
      statusEl.textContent = 'Survey submitted successfully.'
    } else {
      statusEl.textContent = 'Survey Submit button could not be identified safely.'
    }
  }

  container.querySelectorAll('.eas-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      executeSurvey(btn.getAttribute('data-mode'))
    })
  })
})()
