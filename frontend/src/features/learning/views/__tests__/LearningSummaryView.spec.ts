import SessionStats from '@/features/learning/components/SessionStats.vue'
import { useLearningStore } from '@/features/learning/store'
import en from '@/i18n/locales/en.json'
import pl from '@/i18n/locales/pl.json'
import { SRSGrade } from '@/types/enums'
import type { SessionStatistics } from '@/types/learning.types'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import LearningSummaryView from '../LearningSummaryView.vue'

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

const createStatistics = (): SessionStatistics => ({
  totalReviewed: 10,
  ratingDistribution: {
    [SRSGrade.CompleteBlackout]: 0,
    [SRSGrade.IncorrectResponse]: 1,
    [SRSGrade.IncorrectResponseRecalled]: 1,
    [SRSGrade.CorrectWithDifficulty]: 2,
    [SRSGrade.CorrectAfterHesitation]: 3,
    [SRSGrade.PerfectResponse]: 3,
  },
  sessionDurationMs: 180000, // 3 minutes
})

describe('LearningSummaryView.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof LearningSummaryView>>
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'dashboard',
          component: { template: '<div>Dashboard</div>' },
        },
        {
          path: '/learn/summary',
          name: 'learn-summary',
          component: { template: '<div>Summary</div>' },
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
    const component = mount(LearningSummaryView, {
      global: {
        plugins: [i18n, vuetify, router],
      },
    })
    await nextTick()
    return component
  }

  describe('rendering with statistics', () => {
    it('should render title and subtitle', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = createStatistics()

      wrapper = await mountComponent()

      expect(wrapper.text()).toContain('Session complete!')
      expect(wrapper.text()).toContain("Well done! Here's your performance summary.")
    })

    it('should render SessionStats component with statistics', async () => {
      const statistics = createStatistics()
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = statistics

      wrapper = await mountComponent()

      const sessionStats = wrapper.findComponent(SessionStats)
      expect(sessionStats.exists()).toBe(true)
      expect(sessionStats.props('statistics')).toEqual(statistics)
    })

    it('should display return to dashboard button', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = createStatistics()

      wrapper = await mountComponent()

      expect(wrapper.text()).toContain('Return to dashboard')
      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
    })

    it('should display total reviewed count', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = createStatistics()

      wrapper = await mountComponent()

      expect(wrapper.text()).toContain('10')
    })

    it('should display session statistics', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = createStatistics()

      wrapper = await mountComponent()

      // Check that statistics are displayed
      expect(wrapper.findComponent(SessionStats).exists()).toBe(true)
    })
  })

  describe('rendering without statistics', () => {
    it('should render fallback message when no statistics', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = null

      wrapper = await mountComponent()

      expect(wrapper.text()).toContain('No session data')
      expect(wrapper.text()).toContain('Please complete a learning session first')
    })

    it('should display fallback icon', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = null

      wrapper = await mountComponent()

      const icon = wrapper.find('.mdi-alert-circle-outline')
      expect(icon.exists()).toBe(true)
    })

    it('should show return button in fallback state', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = null

      wrapper = await mountComponent()

      expect(wrapper.text()).toContain('Return to dashboard')
    })

    it('should not render SessionStats when no data', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = null

      wrapper = await mountComponent()

      expect(wrapper.findComponent(SessionStats).exists()).toBe(false)
    })
  })

  describe('navigation', () => {
    it('should redirect to dashboard on mount if no statistics', async () => {
      const pushSpy = vi.spyOn(router, 'push')
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = null

      await mountComponent()
      await nextTick()

      expect(pushSpy).toHaveBeenCalledWith({ name: 'dashboard' })
    })

    it('should not redirect if statistics are available', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = createStatistics()

      await router.push('/learn/summary')
      wrapper = await mountComponent()
      await nextTick()

      expect(router.currentRoute.value.name).toBe('learn-summary')
    })

    it('should navigate to dashboard when return button clicked', async () => {
      const pushSpy = vi.spyOn(router, 'push')
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = createStatistics()

      wrapper = await mountComponent()

      const buttons = wrapper.findAll('button')
      await buttons[0]!.trigger('click')
      await nextTick()

      expect(pushSpy).toHaveBeenCalledWith({ name: 'dashboard' })
    })

    it('should navigate to dashboard from fallback state', async () => {
      const pushSpy = vi.spyOn(router, 'push')
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = null

      wrapper = await mountComponent()

      const buttons = wrapper.findAll('button')
      await buttons[0]!.trigger('click')
      await nextTick()

      expect(pushSpy).toHaveBeenCalledWith({ name: 'dashboard' })
    })
  })

  describe('store interaction', () => {
    it('should reset session statistics when returning to dashboard', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = createStatistics()

      wrapper = await mountComponent()

      const button = wrapper.find('button')
      await button.trigger('click')
      await nextTick()

      expect(learningStore.sessionStatistics).toBeNull()
    })

    it('should maintain statistics until user returns to dashboard', async () => {
      const statistics = createStatistics()
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = statistics

      wrapper = await mountComponent()

      expect(learningStore.sessionStatistics).toEqual(statistics)
    })
  })

  describe('localization', () => {
    it('should render English translations', async () => {
      i18n.global.locale.value = 'en'
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = createStatistics()

      wrapper = await mountComponent()

      expect(wrapper.text()).toContain('Session complete!')
      expect(wrapper.text()).toContain('Return to dashboard')
    })

    it('should render Polish translations', async () => {
      i18n.global.locale.value = 'pl'
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = createStatistics()

      wrapper = await mountComponent()

      expect(wrapper.text()).toContain('Sesja ukończona!')
      expect(wrapper.text()).toContain('Wróć do panelu')
    })

    it('should show localized fallback messages', async () => {
      i18n.global.locale.value = 'en'
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = null

      wrapper = await mountComponent()

      expect(wrapper.text()).toContain('No session data')
    })
  })

  describe('edge cases', () => {
    it('should handle zero reviewed flashcards', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = {
        totalReviewed: 0,
        ratingDistribution: {
          [SRSGrade.CompleteBlackout]: 0,
          [SRSGrade.IncorrectResponse]: 0,
          [SRSGrade.IncorrectResponseRecalled]: 0,
          [SRSGrade.CorrectWithDifficulty]: 0,
          [SRSGrade.CorrectAfterHesitation]: 0,
          [SRSGrade.PerfectResponse]: 0,
        },
        sessionDurationMs: 0,
      }

      wrapper = await mountComponent()

      expect(wrapper.findComponent(SessionStats).exists()).toBe(true)
    })

    it('should handle very long session durations', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = {
        ...createStatistics(),
        sessionDurationMs: 7200000, // 2 hours
      }

      wrapper = await mountComponent()

      expect(wrapper.findComponent(SessionStats).exists()).toBe(true)
    })

    it('should handle large number of reviewed flashcards', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = {
        ...createStatistics(),
        totalReviewed: 999,
      }

      wrapper = await mountComponent()

      expect(wrapper.text()).toContain('999')
    })
  })

  describe('UI elements', () => {
    it('should display home icon on return button', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = createStatistics()

      wrapper = await mountComponent()

      const icon = wrapper.find('.mdi-home')
      expect(icon.exists()).toBe(true)
    })

    it('should use primary color for return button', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = createStatistics()

      wrapper = await mountComponent()

      const button = wrapper.findComponent({ name: 'VBtn' })
      expect(button.props('color')).toBe('primary')
    })

    it('should center card content', async () => {
      const learningStore = useLearningStore()
      learningStore.sessionStatistics = createStatistics()

      wrapper = await mountComponent()

      const cardTitle = wrapper.find('[role="heading"]')
      expect(cardTitle.attributes('class')).toContain('text-center')
    })
  })
})
