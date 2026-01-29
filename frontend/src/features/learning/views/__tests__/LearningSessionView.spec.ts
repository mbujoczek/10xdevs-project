import * as learningApi from '@/api/learning.api'
import EmptyState from '@/components/common/EmptyState.vue'
import { useLearningStore } from '@/features/learning/store'
import en from '@/i18n/locales/en.json'
import pl from '@/i18n/locales/pl.json'
import { FlashcardSource, FlashcardStatus } from '@/types/enums'
import type { Flashcard } from '@/types/flashcards.types'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import LearningSessionView from '../LearningSessionView.vue'

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

vi.mock('@/api/learning.api', () => ({
  getDueFlashcards: vi.fn(),
  rateFlashcard: vi.fn(),
}))

const createFlashcard = (id: number): Flashcard => ({
  id,
  question: `Test Question ${id}`,
  answer: `Test Answer ${id}`,
  source: FlashcardSource.Manual,
  status: FlashcardStatus.NotApplicable,
  srsInterval: 1,
  srsRepetitions: 0,
  srsEaseFactor: 2.5,
  srsNextRepetitionDate: new Date().toISOString(),
  srsLastGrade: null,
  createdAtUtc: new Date().toISOString(),
  updatedAtUtc: new Date().toISOString(),
})

describe('LearningSessionView.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof LearningSessionView>>
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'dashboard',
          component: { template: '<div>Dashboard</div>' },
        },
        {
          path: '/learn',
          name: 'learn',
          component: { template: '<div>Learn</div>' },
        },
        {
          path: '/learn/summary',
          name: 'learn-summary',
          component: { template: '<div>Summary</div>' },
        },
        {
          path: '/flashcards',
          name: 'flashcards',
          component: { template: '<div>Flashcards</div>' },
        },
        {
          path: '/generate',
          name: 'generate',
          component: { template: '<div>Generate</div>' },
        },
      ],
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const mountComponent = async () => {
    const component = mount(LearningSessionView, {
      global: {
        plugins: [i18n, vuetify, router],
      },
    })
    await nextTick()
    return component
  }

  describe('rendering', () => {
    it('should render empty state when no due flashcards', async () => {
      vi.mocked(learningApi.getDueFlashcards).mockResolvedValue({
        flashcards: [],
        totalDueCount: 0,
      })

      wrapper = await mountComponent()
      await nextTick()

      const emptyState = wrapper.findComponent(EmptyState)
      expect(emptyState.exists()).toBe(true)
      expect(wrapper.text()).toContain('All caught up!')
    })

    it('should display learning interface when flashcards available', async () => {
      const flashcards = [createFlashcard(1), createFlashcard(2)]
      vi.mocked(learningApi.getDueFlashcards).mockResolvedValue({
        flashcards,
        totalDueCount: 2,
      })

      const learningStore = useLearningStore()
      learningStore.dueFlashcards = flashcards
      learningStore.totalDueCount = 2
      learningStore.startSession()

      wrapper = await mountComponent()
      await nextTick()

      expect(wrapper.text()).toContain('Learning session')
    })

    it('should display current flashcard when flashcards available', async () => {
      const flashcards = [createFlashcard(1)]
      vi.mocked(learningApi.getDueFlashcards).mockResolvedValue({
        flashcards,
        totalDueCount: 1,
      })

      const learningStore = useLearningStore()
      learningStore.dueFlashcards = flashcards
      learningStore.totalDueCount = 1
      learningStore.startSession()

      wrapper = await mountComponent()
      await nextTick()

      expect(wrapper.text()).toContain('Test Question 1')
    })
  })

  describe('store integration', () => {
    it('should fetch due flashcards on mount if not available', async () => {
      vi.mocked(learningApi.getDueFlashcards).mockResolvedValue({
        flashcards: [],
        totalDueCount: 0,
      })

      wrapper = await mountComponent()
      await nextTick()

      expect(learningApi.getDueFlashcards).toHaveBeenCalled()
    })

    it('should start session when flashcards available', async () => {
      const flashcards = [createFlashcard(1), createFlashcard(2)]
      vi.mocked(learningApi.getDueFlashcards).mockResolvedValue({
        flashcards,
        totalDueCount: 2,
      })

      const learningStore = useLearningStore()
      learningStore.dueFlashcards = flashcards
      learningStore.totalDueCount = 2

      wrapper = await mountComponent()
      await nextTick()

      expect(learningStore.isSessionActive).toBe(true)
    })
  })
})
