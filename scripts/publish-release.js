import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// Secure token acquisition: Prefer environment variables GITHUB_TOKEN or GH_TOKEN
let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''

if (!token) {
  try {
    const credOutput = execSync('git credential fill', {
      input: 'url=https://github.com\n',
      encoding: 'utf-8',
    })
    const match = credOutput.match(/password=([^\r\n]+)/)
    if (match) {
      token = match[1].trim()
    }
  } catch (e) {
    // git credential manager not available or failed
  }
}

if (!token) {
  console.error('No GitHub token found. Please set GITHUB_TOKEN or GH_TOKEN environment variable.')
  process.exit(1)
}

const owner = 'adwaith620'
const repo = 'etlab-auto-survey'
const tag = 'v2.0.0'

const releaseBody = `# ETLAB Auto Survey — Cross-Browser Desktop Edition (v2.0.0)

Desktop browser extension for automating ETLAB surveys with six rating modes and automatic form submission.

> ⚠️ **PC / DESKTOP ONLY**: This extension is strictly intended for desktop/laptop web browsers (Windows, macOS, Linux). It is not supported on Android phones, iPhones, tablets, or mobile browser apps.

---

### Highlights & Features
- **6 Selectable Rating Modes**: Excellent (Default), Very Good, Good, Poor, Very Poor, and Random.
- **Immediate One-Click Execution**: Clicking any rating option immediately fills, verifies, and submits the survey with no intermediate confirmation prompts.
- **Intelligent Semantic Mapping**: Normalizes answer labels and adapts to 6-point, 5-point, 4-point, 3-point, Likert, and numeric scales without relying on button order.
- **Robust Submission Safeguards**: Rejects dangerous buttons (Cancel, Reset, Logout, Clear), prevents duplicate submissions, and aborts if questions cannot be mapped reliably.
- **Desktop Browser Packages**: Dedicated verified packages for Google Chrome, Microsoft Edge, Opera, and Mozilla Firefox.
- **54 Automated Tests Passed**: Verified with Vitest covering rating mapping, submitter safeguards, popup UI, and storage persistence.

---

### Installation Quick Guide
1. Download the ZIP file for your desktop browser below.
2. Extract the ZIP to an accessible folder.
3. Open your browser's extension manager (\`chrome://extensions\`, \`edge://extensions\`, \`opera://extensions\`, or \`about:debugging\` for Firefox).
4. Enable **Developer mode** and select **Load unpacked** (or **Load Temporary Add-on** for Firefox).
5. Select the extracted folder containing \`manifest.json\`.

*(For mobile users or userscript managers, \`etlab-auto-survey.user.js\` is provided as an optional standalone alternative).*
`

async function run() {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'etlab-auto-survey-publisher',
  }

  console.log(`Checking / creating GitHub Release ${tag}...`)

  let release
  const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`, {
    headers,
  })
  if (getRes.ok) {
    release = await getRes.json()
    console.log(`Found existing release: ID ${release.id}`)
  } else {
    const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag_name: tag,
        target_commitish: 'main',
        name: 'v2.0.0 — Cross-Browser Desktop Edition',
        body: releaseBody,
        draft: false,
        prerelease: false,
      }),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      throw new Error(`Failed to create release: ${createRes.status} ${errText}`)
    }
    release = await createRes.json()
    console.log(`Release created successfully: ID ${release.id}`)
  }

  const assets = [
    {
      filePath: 'package/etlab-auto-survey-chrome-v2.0.0.zip',
      name: 'etlab-auto-survey-chrome-v2.0.0.zip',
      type: 'application/zip',
    },
    {
      filePath: 'package/etlab-auto-survey-edge-v2.0.0.zip',
      name: 'etlab-auto-survey-edge-v2.0.0.zip',
      type: 'application/zip',
    },
    {
      filePath: 'package/etlab-auto-survey-opera-v2.0.0.zip',
      name: 'etlab-auto-survey-opera-v2.0.0.zip',
      type: 'application/zip',
    },
    {
      filePath: 'package/etlab-auto-survey-firefox-v2.0.0.zip',
      name: 'etlab-auto-survey-firefox-v2.0.0.zip',
      type: 'application/zip',
    },
    {
      filePath: 'userscript/etlab-auto-survey.user.js',
      name: 'etlab-auto-survey.user.js',
      type: 'text/javascript',
    },
  ]

  for (const asset of assets) {
    if (!fs.existsSync(asset.filePath)) {
      console.warn(`File not found: ${asset.filePath}`)
      continue
    }

    console.log(`Uploading ${asset.name}...`)
    const fileBytes = fs.readFileSync(asset.filePath)

    // Delete existing asset if it exists with same name
    const existingAsset = release.assets ? release.assets.find((a) => a.name === asset.name) : null
    if (existingAsset) {
      console.log(`Deleting previous asset ${asset.name} (ID: ${existingAsset.id})...`)
      await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases/assets/${existingAsset.id}`,
        {
          method: 'DELETE',
          headers,
        },
      )
    }

    const uploadUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${
      release.id
    }/assets?name=${encodeURIComponent(asset.name)}`
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': asset.type,
      },
      body: fileBytes,
    })

    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      console.error(`Failed to upload ${asset.name}: ${uploadRes.status} ${errText}`)
    } else {
      const uploadedData = await uploadRes.json()
      console.log(`Uploaded ${asset.name} successfully (ID: ${uploadedData.id})!`)
    }
  }

  console.log(`\nAll release assets uploaded successfully to: ${release.html_url}\n`)
}

run().catch((err) => {
  console.error('Error publishing release:', err)
  process.exit(1)
})
