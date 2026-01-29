import { defineConfig } from 'cypress'
import * as dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:4173',
    env: {
      USERNAME: process.env.CYPRESS_USERNAME,
      PASSWORD: process.env.CYPRESS_PASSWORD,
    },
  },
})
