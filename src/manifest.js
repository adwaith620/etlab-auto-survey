import { defineManifest } from '@crxjs/vite-plugin';

export function getManifest(targetBrowser = 'chrome') {
  const isFirefox = targetBrowser === 'firefox';

  const baseManifest = {
    name: 'ETLAB Auto Survey — Cross-Browser Edition',
    description: 'Automated survey and feedback filler for ETLAB with selectable ratings and instant submission.',
    version: '2.0.0',
    manifest_version: 3,
    icons: {
      16: 'img/logo-16.png',
      32: 'img/logo-34.png',
      48: 'img/logo-48.png',
      128: 'img/logo-128.png',
    },
    action: {
      default_popup: 'popup.html',
      default_icon: 'img/logo-48.png',
      default_title: 'ETLAB Auto Survey',
    },
    permissions: ['activeTab', 'storage', 'tabs'],
    host_permissions: [
      '*://*.etlab.in/*',
    ],
    content_scripts: [
      {
        matches: [
          '*://*.etlab.in/*',
        ],
        js: ['src/content/index.js'],
        run_at: 'document_idle',
      },
    ],
    web_accessible_resources: [
      {
        resources: ['img/logo-16.png', 'img/logo-34.png', 'img/logo-48.png', 'img/logo-128.png'],
        matches: ['*://*.etlab.in/*'],
      },
    ],
  };

  if (isFirefox) {
    baseManifest.browser_specific_settings = {
      gecko: {
        id: 'etlab-auto-survey@vivekkj123',
        strict_min_version: '109.0',
      },
    };
    baseManifest.background = {
      scripts: ['src/background/index.js'],
      type: 'module',
    };
  } else {
    baseManifest.background = {
      service_worker: 'src/background/index.js',
      type: 'module',
    };
  }

  return baseManifest;
}

export default defineManifest(getManifest(process.env.TARGET_BROWSER || 'chrome'));
