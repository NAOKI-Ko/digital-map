import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '~~': rootDir,
      '@@': rootDir,
      '~': `${rootDir}app`,
      '@': `${rootDir}app`,
    },
  },
  test: {
    environment: 'node',
  },
})
