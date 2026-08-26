import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { input: { panel: 'index.html', background: 'src/background.ts', content: 'src/content.ts' }, output: { entryFileNames: '[name].js' } } },
});
