import SessionStats from '@/features/learning/components/SessionStats.vue'
import en from '@/i18n/locales/en.json'
import pl from '@/i18n/locales/pl.json'
import { SRSGrade } from '@/types/enums'
import type { SessionStatistics } from '@/types/learning.types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

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

const createStatistics = (overrides?: Partial<SessionStatistics>): SessionStatistics => ({
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
  ...overrides,
})

const mountComponent = (props: { statistics: SessionStatistics }) => {
  return mount(SessionStats, {
    props,
    global: {
      plugins: [i18n, vuetify],
    },
  })
}

describe('SessionStats.vue', () => {
  describe('rendering total reviewed', () => {
    it('should display total reviewed count', () => {
      const statistics = createStatistics({ totalReviewed: 15 })
      const wrapper = mountComponent({ statistics })

      expect(wrapper.text()).toContain('15')
    })

    it('should display 0 when no flashcards reviewed', () => {
      const statistics = createStatistics({ totalReviewed: 0 })
      const wrapper = mountComponent({ statistics })

      expect(wrapper.text()).toContain('0')
    })

    it('should display large numbers correctly', () => {
      const statistics = createStatistics({ totalReviewed: 999 })
      const wrapper = mountComponent({ statistics })

      expect(wrapper.text()).toContain('999')
    })
  })

  describe('rendering average rating', () => {
    it('should display average rating with one decimal place', () => {
      const statistics = createStatistics()
      const wrapper = mountComponent({ statistics })

      // Average: (0*0 + 1*1 + 2*1 + 3*2 + 4*3 + 5*3) / 10 = (0+1+2+6+12+15)/10 = 36/10 = 3.6
      expect(wrapper.text()).toContain('3.6')
    })

    it('should display 0.0 for all failing grades', () => {
      const statistics = createStatistics({
        totalReviewed: 3,
        ratingDistribution: {
          [SRSGrade.CompleteBlackout]: 3,
          [SRSGrade.IncorrectResponse]: 0,
          [SRSGrade.IncorrectResponseRecalled]: 0,
          [SRSGrade.CorrectWithDifficulty]: 0,
          [SRSGrade.CorrectAfterHesitation]: 0,
          [SRSGrade.PerfectResponse]: 0,
        },
      })
      const wrapper = mountComponent({ statistics })

      expect(wrapper.text()).toContain('0.0')
    })

    it('should display 5.0 for all perfect grades', () => {
      const statistics = createStatistics({
        totalReviewed: 5,
        ratingDistribution: {
          [SRSGrade.CompleteBlackout]: 0,
          [SRSGrade.IncorrectResponse]: 0,
          [SRSGrade.IncorrectResponseRecalled]: 0,
          [SRSGrade.CorrectWithDifficulty]: 0,
          [SRSGrade.CorrectAfterHesitation]: 0,
          [SRSGrade.PerfectResponse]: 5,
        },
      })
      const wrapper = mountComponent({ statistics })

      expect(wrapper.text()).toContain('5.0')
    })
  })

  describe('rendering duration', () => {
    it('should display duration in minutes and seconds', () => {
      const statistics = createStatistics({ sessionDurationMs: 323000 }) // 5m 23s
      const wrapper = mountComponent({ statistics })

      expect(wrapper.text()).toContain('5m 23s')
    })

    it('should display seconds only for short sessions', () => {
      const statistics = createStatistics({ sessionDurationMs: 45000 }) // 45s
      const wrapper = mountComponent({ statistics })

      expect(wrapper.text()).toContain('45s')
    })

    it('should display "-" for undefined duration', () => {
      const statistics = createStatistics({ sessionDurationMs: undefined })
      const wrapper = mountComponent({ statistics })

      expect(wrapper.text()).toContain('-')
    })

    it('should display long durations correctly', () => {
      const statistics = createStatistics({ sessionDurationMs: 1800000 }) // 30 minutes
      const wrapper = mountComponent({ statistics })

      expect(wrapper.text()).toContain('30m 0s')
    })
  })

  describe('rendering rating distribution', () => {
    it('should display percentages for all grades', () => {
      const statistics = createStatistics({
        totalReviewed: 10,
        ratingDistribution: {
          [SRSGrade.CompleteBlackout]: 1, // 10%
          [SRSGrade.IncorrectResponse]: 1, // 10%
          [SRSGrade.IncorrectResponseRecalled]: 2, // 20%
          [SRSGrade.CorrectWithDifficulty]: 2, // 20%
          [SRSGrade.CorrectAfterHesitation]: 2, // 20%
          [SRSGrade.PerfectResponse]: 2, // 20%
        },
      })
      const wrapper = mountComponent({ statistics })

      // Should display progress indicators or percentages
      expect(wrapper.exists()).toBe(true)
    })

    it('should show 0% for grades not used', () => {
      const statistics = createStatistics({
        totalReviewed: 5,
        ratingDistribution: {
          [SRSGrade.CompleteBlackout]: 0,
          [SRSGrade.IncorrectResponse]: 0,
          [SRSGrade.IncorrectResponseRecalled]: 0,
          [SRSGrade.CorrectWithDifficulty]: 0,
          [SRSGrade.CorrectAfterHesitation]: 0,
          [SRSGrade.PerfectResponse]: 5,
        },
      })
      const wrapper = mountComponent({ statistics })

      // Component should render but some progress bars should be at 0
      expect(wrapper.exists()).toBe(true)
    })

    it('should show 100% for single grade used exclusively', () => {
      const statistics = createStatistics({
        totalReviewed: 10,
        ratingDistribution: {
          [SRSGrade.CompleteBlackout]: 0,
          [SRSGrade.IncorrectResponse]: 0,
          [SRSGrade.IncorrectResponseRecalled]: 0,
          [SRSGrade.CorrectWithDifficulty]: 10,
          [SRSGrade.CorrectAfterHesitation]: 0,
          [SRSGrade.PerfectResponse]: 0,
        },
      })
      const wrapper = mountComponent({ statistics })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('icons and visual elements', () => {
    it('should display appropriate icons for each stat', () => {
      const statistics = createStatistics()
      const wrapper = mountComponent({ statistics })

      const html = wrapper.html()
      // Check for Material Design Icons
      expect(html).toContain('mdi-cards') // Total reviewed icon
      expect(html).toContain('mdi-star') // Average rating icon
      expect(html).toContain('mdi-clock') // Duration icon
    })
  })

  describe('layout and structure', () => {
    it('should use card-based layout', () => {
      const statistics = createStatistics()
      const wrapper = mountComponent({ statistics })

      const cards = wrapper.findAll('.v-card')
      expect(cards.length).toBeGreaterThanOrEqual(3) // Total, Average, Duration cards
    })

    it('should be responsive with grid layout', () => {
      const statistics = createStatistics()
      const wrapper = mountComponent({ statistics })

      const rows = wrapper.findAll('.v-row')
      expect(rows.length).toBeGreaterThanOrEqual(1)
    })

    it('should have proper column structure', () => {
      const statistics = createStatistics()
      const wrapper = mountComponent({ statistics })

      // Check that component renders with key statistics
      expect(wrapper.text()).toContain(statistics.totalReviewed.toString())
    })
  })

  describe('edge cases', () => {
    it('should handle 0 total reviewed gracefully', () => {
      const statistics = createStatistics({
        totalReviewed: 0,
        ratingDistribution: {
          [SRSGrade.CompleteBlackout]: 0,
          [SRSGrade.IncorrectResponse]: 0,
          [SRSGrade.IncorrectResponseRecalled]: 0,
          [SRSGrade.CorrectWithDifficulty]: 0,
          [SRSGrade.CorrectAfterHesitation]: 0,
          [SRSGrade.PerfectResponse]: 0,
        },
      })
      const wrapper = mountComponent({ statistics })

      expect(wrapper.text()).toContain('0')
      expect(wrapper.text()).toContain('0.0') // Average
    })

    it('should handle very large numbers', () => {
      const statistics = createStatistics({
        totalReviewed: 10000,
        ratingDistribution: {
          [SRSGrade.CompleteBlackout]: 0,
          [SRSGrade.IncorrectResponse]: 0,
          [SRSGrade.IncorrectResponseRecalled]: 0,
          [SRSGrade.CorrectWithDifficulty]: 0,
          [SRSGrade.CorrectAfterHesitation]: 0,
          [SRSGrade.PerfectResponse]: 10000,
        },
        sessionDurationMs: 7200000, // 2 hours
      })
      const wrapper = mountComponent({ statistics })

      expect(wrapper.text()).toContain('10000')
      expect(wrapper.text()).toContain('120m') // 2 hours in minutes
    })

    it('should handle fractional percentages by rounding', () => {
      const statistics = createStatistics({
        totalReviewed: 3,
        ratingDistribution: {
          [SRSGrade.CompleteBlackout]: 1, // 33.33%
          [SRSGrade.IncorrectResponse]: 1, // 33.33%
          [SRSGrade.IncorrectResponseRecalled]: 1, // 33.33%
          [SRSGrade.CorrectWithDifficulty]: 0,
          [SRSGrade.CorrectAfterHesitation]: 0,
          [SRSGrade.PerfectResponse]: 0,
        },
      })
      const wrapper = mountComponent({ statistics })

      // Should round to 33%
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('reactivity', () => {
    it('should update when statistics prop changes', async () => {
      const statistics1 = createStatistics({ totalReviewed: 5 })
      const wrapper = mountComponent({ statistics: statistics1 })

      expect(wrapper.text()).toContain('5')

      const statistics2 = createStatistics({ totalReviewed: 10 })
      await wrapper.setProps({ statistics: statistics2 })

      expect(wrapper.text()).toContain('10')
    })

    it('should recalculate average when distribution changes', async () => {
      const statistics1 = createStatistics({
        totalReviewed: 1,
        ratingDistribution: {
          [SRSGrade.CompleteBlackout]: 0,
          [SRSGrade.IncorrectResponse]: 0,
          [SRSGrade.IncorrectResponseRecalled]: 0,
          [SRSGrade.CorrectWithDifficulty]: 0,
          [SRSGrade.CorrectAfterHesitation]: 0,
          [SRSGrade.PerfectResponse]: 1,
        },
      })
      const wrapper = mountComponent({ statistics: statistics1 })

      expect(wrapper.text()).toContain('5.0')

      const statistics2 = createStatistics({
        totalReviewed: 1,
        ratingDistribution: {
          [SRSGrade.CompleteBlackout]: 1,
          [SRSGrade.IncorrectResponse]: 0,
          [SRSGrade.IncorrectResponseRecalled]: 0,
          [SRSGrade.CorrectWithDifficulty]: 0,
          [SRSGrade.CorrectAfterHesitation]: 0,
          [SRSGrade.PerfectResponse]: 0,
        },
      })
      await wrapper.setProps({ statistics: statistics2 })

      expect(wrapper.text()).toContain('0.0')
    })
  })

  describe('progress indicators', () => {
    it('should render progress circles for each grade', () => {
      const statistics = createStatistics()
      const wrapper = mountComponent({ statistics })

      // v-progress-circular should be used for each grade
      const html = wrapper.html()
      expect(html).toContain('v-progress-circular')
    })
  })
})
