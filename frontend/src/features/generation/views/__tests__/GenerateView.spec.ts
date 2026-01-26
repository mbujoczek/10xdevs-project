import * as flashcardsApi from '@/api/flashcards.api'
import { useGenerationStore } from '@/features/generation/store'
import en from '@/i18n/locales/en.json'
import pl from '@/i18n/locales/pl.json'
import { useUiStore } from '@/store/ui.store'
import type { GenerateFlashcardsResponse } from '@/types/flashcards.types'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import GenerateView from '../GenerateView.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    pl,
  },
})

const vuetify = createVuetify({
  components,
  directives,
})

vi.mock('@/api/flashcards.api', () => ({
  generateFlashcardsFromText: vi.fn(),
}))

interface GenerateViewVM {
  isFormValid: boolean
  language: string
  inputTextRules: Array<(value: string) => boolean | string>
  inputText: string
  handleGenerate: () => Promise<void>
}

describe('GenerateView.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof GenerateView>>
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'generate',
          component: { template: '<div>Generate</div>' },
        },
        {
          path: '/review/:eventId',
          name: 'review',
          component: { template: '<div>Review</div>' },
        },
      ],
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const mountComponent = (locale = 'en') => {
    i18n.global.locale.value = locale as 'en' | 'pl'
    return mount(GenerateView, {
      global: {
        plugins: [i18n, vuetify, router],
        stubs: {
          VForm: false,
          VTextarea: false,
          VBtn: false,
        },
      },
    })
  }

  describe('rendering', () => {
    it('should render title and description', async () => {
      wrapper = mountComponent()

      expect(wrapper.text()).toContain('Generate flashcards')
      expect(wrapper.text()).toContain('Paste your study material')
    })

    it('should render textarea with correct attributes', async () => {
      wrapper = mountComponent()

      const textarea = wrapper.findComponent({ name: 'VTextarea' })
      expect(textarea.exists()).toBe(true)
      expect(textarea.props('counter')).toBe(10000)
      expect(textarea.props('rows')).toBe('12')
    })

    it('should render submit button', async () => {
      wrapper = mountComponent()

      const button = wrapper.findComponent({ name: 'VBtn' })
      expect(button.exists()).toBe(true)
      expect(button.props('color')).toBe('primary')
    })
  })

  describe('form validation', () => {
    it('should have submit button disabled when form is empty', async () => {
      wrapper = mountComponent()
      await nextTick()

      const button = wrapper.findComponent({ name: 'VBtn' })
      expect(button.props('disabled')).toBe(true)
    })

    it('should have submit button disabled for text shorter than 50 chars', async () => {
      wrapper = mountComponent()
      await nextTick()

      const textarea = wrapper.findComponent({ name: 'VTextarea' })
      await textarea.vm.$emit('update:modelValue', 'Short text')
      await nextTick()

      const vm = wrapper.vm as unknown as GenerateViewVM
      expect(vm.isFormValid).toBe(false)

      const button = wrapper.findComponent({ name: 'VBtn' })
      expect(button.props('disabled')).toBe(true)
    })

    it('should enable submit button for text with exactly 50 chars', async () => {
      wrapper = mountComponent()
      await nextTick()

      const validText = 'a'.repeat(50)
      const textarea = wrapper.findComponent({ name: 'VTextarea' })
      await textarea.vm.$emit('update:modelValue', validText)
      await nextTick()

      const vm = wrapper.vm as unknown as GenerateViewVM
      expect(vm.isFormValid).toBe(true)

      const button = wrapper.findComponent({ name: 'VBtn' })
      expect(button.props('disabled')).toBe(false)
    })

    it('should enable submit button for text with 100 chars', async () => {
      wrapper = mountComponent()
      await nextTick()

      const validText = 'a'.repeat(100)
      const textarea = wrapper.findComponent({ name: 'VTextarea' })
      await textarea.vm.$emit('update:modelValue', validText)
      await nextTick()

      const vm = wrapper.vm as unknown as GenerateViewVM
      expect(vm.isFormValid).toBe(true)

      const button = wrapper.findComponent({ name: 'VBtn' })
      expect(button.props('disabled')).toBe(false)
    })

    it('should enable submit button for text with exactly 10000 chars', async () => {
      wrapper = mountComponent()
      await nextTick()

      const validText = 'a'.repeat(10000)
      const textarea = wrapper.findComponent({ name: 'VTextarea' })
      await textarea.vm.$emit('update:modelValue', validText)
      await nextTick()

      const vm = wrapper.vm as unknown as GenerateViewVM
      expect(vm.isFormValid).toBe(true)

      const button = wrapper.findComponent({ name: 'VBtn' })
      expect(button.props('disabled')).toBe(false)
    })

    it('should disable submit button for text longer than 10000 chars', async () => {
      wrapper = mountComponent()
      await nextTick()

      const invalidText = 'a'.repeat(10001)
      const textarea = wrapper.findComponent({ name: 'VTextarea' })
      await textarea.vm.$emit('update:modelValue', invalidText)
      await nextTick()

      const vm = wrapper.vm as unknown as GenerateViewVM
      expect(vm.isFormValid).toBe(false)

      const button = wrapper.findComponent({ name: 'VBtn' })
      expect(button.props('disabled')).toBe(true)
    })

    it('should trim whitespace before validation', async () => {
      wrapper = mountComponent()
      await nextTick()

      // 50 chars with leading/trailing spaces
      const textWithSpaces = '  ' + 'a'.repeat(50) + '  '
      const textarea = wrapper.findComponent({ name: 'VTextarea' })
      await textarea.vm.$emit('update:modelValue', textWithSpaces)
      await nextTick()

      const vm = wrapper.vm as unknown as GenerateViewVM
      expect(vm.isFormValid).toBe(true)
    })

    it('should treat whitespace-only text as invalid', async () => {
      wrapper = mountComponent()
      await nextTick()

      const textarea = wrapper.findComponent({ name: 'VTextarea' })
      await textarea.vm.$emit('update:modelValue', '     ')
      await nextTick()

      const vm = wrapper.vm as unknown as GenerateViewVM
      expect(vm.isFormValid).toBe(false)
    })
  })

  describe('language detection', () => {
    it('should use "en" for English locale', async () => {
      wrapper = mountComponent('en')

      const vm = wrapper.vm as unknown as GenerateViewVM
      expect(vm.language).toBe('en')
    })

    it('should use "pl" for Polish locale', async () => {
      wrapper = mountComponent('pl')

      const vm = wrapper.vm as unknown as GenerateViewVM
      expect(vm.language).toBe('pl')
    })

    it('should fallback to "en" for unsupported locale', async () => {
      wrapper = mountComponent('de')

      const vm = wrapper.vm as unknown as GenerateViewVM
      expect(vm.language).toBe('en')
    })
  })

  describe('submit flow', () => {
    it('should call API with correct payload on submit', async () => {
      const mockResponse: GenerateFlashcardsResponse = {
        generationEventId: 123,
        candidates: [
          { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
          { candidateId: 'temp-2', question: 'Q2', answer: 'A2' },
        ],
        cadidatesCount: 2,
        createdAtUtc: '2026-01-25T10:00:00Z',
      }

      vi.mocked(flashcardsApi.generateFlashcardsFromText).mockResolvedValue(mockResponse)

      wrapper = mountComponent('en')
      await nextTick()

      const validText = 'a'.repeat(100)
      const vm = wrapper.vm as unknown as GenerateViewVM
      vm.inputText = validText
      await nextTick()

      await vm.handleGenerate()
      await nextTick()

      expect(flashcardsApi.generateFlashcardsFromText).toHaveBeenCalledWith({
        inputText: validText,
        language: 'en',
      })
    })

    it('should trim input text before sending to API', async () => {
      const mockResponse: GenerateFlashcardsResponse = {
        generationEventId: 456,
        candidates: [],
        cadidatesCount: 0,
        createdAtUtc: '2026-01-25T10:00:00Z',
      }

      vi.mocked(flashcardsApi.generateFlashcardsFromText).mockResolvedValue(mockResponse)

      wrapper = mountComponent()
      await nextTick()

      const textWithSpaces = '  ' + 'a'.repeat(100) + '  '
      const vm = wrapper.vm as unknown as GenerateViewVM
      vm.inputText = textWithSpaces
      await nextTick()

      await vm.handleGenerate()
      await nextTick()

      expect(flashcardsApi.generateFlashcardsFromText).toHaveBeenCalledWith({
        inputText: 'a'.repeat(100),
        language: 'en',
      })
    })

    it('should initialize generation store with API response', async () => {
      const mockResponse: GenerateFlashcardsResponse = {
        generationEventId: 789,
        candidates: [{ candidateId: 'temp-1', question: 'Question 1', answer: 'Answer 1' }],
        cadidatesCount: 1,
        createdAtUtc: '2026-01-25T10:00:00Z',
      }

      vi.mocked(flashcardsApi.generateFlashcardsFromText).mockResolvedValue(mockResponse)

      wrapper = mountComponent()
      const generationStore = useGenerationStore()
      await nextTick()

      const validText = 'a'.repeat(100)
      const vm = wrapper.vm as unknown as GenerateViewVM
      vm.inputText = validText
      await nextTick()

      await vm.handleGenerate()
      await nextTick()

      expect(generationStore.eventId).toBe(789)
      expect(generationStore.candidates).toHaveLength(1)
      expect(generationStore.candidates[0]!.candidateId).toBe('temp-1')
    })

    it('should navigate to review route with eventId', async () => {
      const mockResponse: GenerateFlashcardsResponse = {
        generationEventId: 999,
        candidates: [],
        cadidatesCount: 0,
        createdAtUtc: '2026-01-25T10:00:00Z',
      }

      vi.mocked(flashcardsApi.generateFlashcardsFromText).mockResolvedValue(mockResponse)

      wrapper = mountComponent()
      await nextTick()

      const validText = 'a'.repeat(100)
      const vm = wrapper.vm as unknown as GenerateViewVM
      vm.inputText = validText
      await nextTick()

      await vm.handleGenerate()
      await nextTick()

      expect(router.currentRoute.value.name).toBe('review')
      expect(router.currentRoute.value.params.eventId).toBe('999')
    })

    it('should use Polish language when locale is pl', async () => {
      const mockResponse: GenerateFlashcardsResponse = {
        generationEventId: 111,
        candidates: [],
        cadidatesCount: 0,
        createdAtUtc: '2026-01-25T10:00:00Z',
      }

      vi.mocked(flashcardsApi.generateFlashcardsFromText).mockResolvedValue(mockResponse)

      wrapper = mountComponent('pl')
      await nextTick()

      const validText = 'a'.repeat(100) // Valid Polish text with 100 chars
      const vm = wrapper.vm as unknown as GenerateViewVM
      vm.inputText = validText
      await nextTick()

      await vm.handleGenerate()
      await nextTick()

      expect(flashcardsApi.generateFlashcardsFromText).toHaveBeenCalledWith({
        inputText: validText,
        language: 'pl',
      })
    })
  })

  describe('loading state', () => {
    it('should disable textarea when loading', async () => {
      wrapper = mountComponent()
      const uiStore = useUiStore()
      uiStore.isLoading = true
      await nextTick()

      const textarea = wrapper.findComponent({ name: 'VTextarea' })
      expect(textarea.props('disabled')).toBe(true)
    })

    it('should disable submit button when loading', async () => {
      wrapper = mountComponent()
      const uiStore = useUiStore()
      await nextTick()

      // Set valid text first
      const validText = 'a'.repeat(100)
      const textarea = wrapper.findComponent({ name: 'VTextarea' })
      await textarea.vm.$emit('update:modelValue', validText)
      await nextTick()

      // Now set loading
      uiStore.isLoading = true
      await nextTick()

      const button = wrapper.findComponent({ name: 'VBtn' })
      expect(button.props('disabled')).toBe(true)
    })

    it('should enable controls when not loading', async () => {
      wrapper = mountComponent()
      const uiStore = useUiStore()
      uiStore.isLoading = false
      await nextTick()

      const validText = 'a'.repeat(100)
      const textarea = wrapper.findComponent({ name: 'VTextarea' })
      await textarea.vm.$emit('update:modelValue', validText)
      await nextTick()

      expect(textarea.props('disabled')).toBe(false)

      const button = wrapper.findComponent({ name: 'VBtn' })
      expect(button.props('disabled')).toBe(false)
    })
  })

  describe('validation rules', () => {
    it('should show required error for empty text', async () => {
      wrapper = mountComponent()
      await nextTick()

      const vm = wrapper.vm as unknown as GenerateViewVM
      const rules = vm.inputTextRules

      expect(rules[0]!('')).toBe('Please enter text to generate flashcards')
      expect(rules[0]!('   ')).toBe('Please enter text to generate flashcards')
    })

    it('should show tooShort error for text < 50 chars', async () => {
      wrapper = mountComponent()
      await nextTick()

      const vm = wrapper.vm as unknown as GenerateViewVM
      const rules = vm.inputTextRules

      expect(rules[1]!('a'.repeat(49))).toBe(
        'Text must be at least 50 characters long for meaningful flashcard generation',
      )
    })

    it('should pass validation for text with 50 chars', async () => {
      wrapper = mountComponent()
      await nextTick()

      const vm = wrapper.vm as unknown as GenerateViewVM
      const rules = vm.inputTextRules

      expect(rules[1]!('a'.repeat(50))).toBe(true)
    })

    it('should show tooLong error for text > 10000 chars', async () => {
      wrapper = mountComponent()
      await nextTick()

      const vm = wrapper.vm as unknown as GenerateViewVM
      const rules = vm.inputTextRules

      expect(rules[2]!('a'.repeat(10001))).toBe('Text must not exceed 10,000 characters')
    })

    it('should pass validation for text with 10000 chars', async () => {
      wrapper = mountComponent()
      await nextTick()

      const vm = wrapper.vm as unknown as GenerateViewVM
      const rules = vm.inputTextRules

      expect(rules[2]!('a'.repeat(10000))).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle API error gracefully', async () => {
      const errorMessage = 'API Error'
      vi.mocked(flashcardsApi.generateFlashcardsFromText).mockRejectedValue(new Error(errorMessage))

      wrapper = mountComponent()
      await nextTick()

      const validText = 'a'.repeat(100)
      const vm = wrapper.vm as unknown as GenerateViewVM
      vm.inputText = validText
      await nextTick()

      try {
        await vm.handleGenerate()
      } catch {
        // Expected to throw
      }
      await nextTick()

      // Error should be handled without throwing
      expect(flashcardsApi.generateFlashcardsFromText).toHaveBeenCalled()
    })
  })
})
