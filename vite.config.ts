import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        panel: fileURLToPath(new URL('index.html', import.meta.url)),
        'service-worker': fileURLToPath(
          new URL('src/background/service-worker.ts', import.meta.url),
        ),
        'content-script': fileURLToPath(
          new URL('src/content/content-script.ts', import.meta.url),
        ),
        'diagnostics-main': fileURLToPath(
          new URL('src/diagnostics/main-world.ts', import.meta.url),
        ),
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === 'service-worker' ||
          chunkInfo.name === 'content-script' ||
          chunkInfo.name === 'diagnostics-main'
            ? '[name].js'
            : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
