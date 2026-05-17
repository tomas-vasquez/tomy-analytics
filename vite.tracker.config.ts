import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/tracker/index.ts'),
      name: 'Analytics',
      formats: ['iife'],
      fileName: () => 'analytics.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
    css: false,
  },
})
