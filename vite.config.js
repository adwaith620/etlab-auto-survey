import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import zipPack from 'vite-plugin-zip-pack'
import { getManifest } from './src/manifest.js'
import { config } from './src/read_pages_folder.js'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const targetBrowser = process.env.TARGET_BROWSER || 'chrome'
  const outDir = process.env.BUILD_OUT_DIR || (targetBrowser === 'firefox' ? 'build-firefox' : 'build')
  const manifest = getManifest(targetBrowser)

  return {
    build: {
      emptyOutDir: true,
      outDir,
      rollupOptions: {
        input: config,
        output: {
          chunkFileNames: 'assets/chunk-[hash].js',
        },
      },
    },

    plugins: [
      crx({ manifest }),
      react(),
      zipPack({
        outDir: `package`,
        inDir: outDir,
        // @ts-ignore
        outFileName: `etlab-auto-survey-${targetBrowser}-v${manifest.version}.zip`,
      }),
    ],
  }
})
