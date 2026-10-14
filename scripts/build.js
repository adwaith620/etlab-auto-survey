import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const target = process.argv[2] || 'chrome';

function buildBrowser(browserName) {
  console.log(`\n========================================`);
  console.log(`Building ETLAB Auto Survey for: ${browserName.toUpperCase()}`);
  console.log(`========================================\n`);

  process.env.TARGET_BROWSER = browserName;
  const outDir = browserName === 'chrome' ? 'build' : `build-${browserName}`;

  try {
    execSync(`npx vite build`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        TARGET_BROWSER: browserName,
        BUILD_OUT_DIR: outDir,
      },
    });

    console.log(`\n[SUCCESS] Successfully generated build for ${browserName} in /${outDir}\n`);
  } catch (err) {
    console.error(`\n[ERROR] Failed to build for ${browserName}:`, err.message);
    process.exit(1);
  }
}

if (target === 'all') {
  buildBrowser('chrome');
  buildBrowser('firefox');
} else {
  buildBrowser(target);
}
