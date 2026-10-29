import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Pure-logic tests run in Node; component tests opt in to jsdom with a file comment.
export default defineConfig({
  plugins: [react()],
  test: { include: ['tests/**/*.test.{ts,tsx}'] }
})
