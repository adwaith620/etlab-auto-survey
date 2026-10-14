import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const target = process.argv[2] || 'all'

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function cleanPackageDir() {
  const pkgDir = path.resolve('package')
  if (fs.existsSync(pkgDir)) {
    const files = fs.readdirSync(pkgDir)
    for (const file of files) {
      if (file.endsWith('.zip')) {
        fs.unlinkSync(path.join(pkgDir, file))
      }
    }
  }
}

function buildBrowser(browserName) {
  console.log(`\n========================================`)
  console.log(`Building ETLAB Auto Survey for: ${browserName.toUpperCase()}`)
  console.log(`========================================\n`)

  process.env.TARGET_BROWSER = browserName
  const outDir = browserName === 'firefox' ? 'build-firefox' : 'build'

  try {
    execSync(`npx vite build`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        TARGET_BROWSER: browserName,
        BUILD_OUT_DIR: outDir,
      },
    })

    console.log(`\n[SUCCESS] Successfully generated build for ${browserName} in /${outDir}\n`)
  } catch (err) {
    console.error(`\n[ERROR] Failed to build for ${browserName}:`, err.message)
    process.exit(1)
  }
}

function createBrowserPackages() {
  cleanPackageDir()

  // 1. Build Chromium MV3 (for Chrome, Edge, Opera)
  buildBrowser('chrome')

  const pkgDir = path.resolve('package')
  const chromeZip = path.join(pkgDir, 'etlab-auto-survey-chrome-v2.0.0.zip')
  const edgeZip = path.join(pkgDir, 'etlab-auto-survey-edge-v2.0.0.zip')
  const operaZip = path.join(pkgDir, 'etlab-auto-survey-opera-v2.0.0.zip')

  if (fs.existsSync(chromeZip)) {
    // Both Edge and Opera use the identical Chromium MV3 package structure
    fs.copyFileSync(chromeZip, edgeZip)
    console.log(`[PACKAGED] Created Microsoft Edge package: ${edgeZip}`)
    fs.copyFileSync(chromeZip, operaZip)
    console.log(`[PACKAGED] Created Opera package: ${operaZip}`)
  }

  // 2. Build Mozilla Firefox (Gecko MV3 / WebExtensions)
  buildBrowser('firefox')
}

if (target === 'all') {
  createBrowserPackages()
} else if (target === 'chrome') {
  buildBrowser('chrome')
} else if (target === 'firefox') {
  buildBrowser('firefox')
} else {
  buildBrowser(target)
}
