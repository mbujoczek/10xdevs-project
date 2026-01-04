import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock CSS imports globally
vi.mock('*.css', () => ({}))
vi.mock('*.scss', () => ({}))

// Mock ResizeObserver for Vuetify
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver for Vuetify
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Stub Vuetify components globally
config.global.stubs = {
  VApp: false,
  VOverlay: false,
  VProgressCircular: false,
  RouterView: true,
}
