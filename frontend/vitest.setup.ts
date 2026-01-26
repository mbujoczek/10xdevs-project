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

// Mock visualViewport for Vuetify VDialog
Object.defineProperty(global, 'visualViewport', {
  writable: true,
  value: {
    width: 1024,
    height: 768,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    scale: 1,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
})

// Stub Vuetify components globally
config.global.stubs = {
  VApp: false,
  VOverlay: false,
  VProgressCircular: false,
  RouterView: true,
}
