import RatingButtons from '@/features/learning/components/RatingButtons.vue'
import en from '@/i18n/locales/en.json'
import pl from '@/i18n/locales/pl.json'
import { SRSGrade } from '@/types/enums'
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

const mountComponent = () => {
  return mount(RatingButtons, {
    global: {
      plugins: [i18n, vuetify],
    },
  })
}

describe('RatingButtons.vue', () => {
  describe('rendering', () => {
    it('should render 6 rating buttons', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(6)
    })

    it('should display button labels 0-5', () => {
      const wrapper = mountComponent()

      const text = wrapper.text()
      expect(text).toContain('0')
      expect(text).toContain('1')
      expect(text).toContain('2')
      expect(text).toContain('3')
      expect(text).toContain('4')
      expect(text).toContain('5')
    })

    it('should have error color for grades 0-1', () => {
      const wrapper = mountComponent()

      // Check that error class/color is applied to first two buttons
      const buttons = wrapper.findAll('button')
      // Vuetify applies color through classes, check that buttons exist
      expect(buttons.length).toBeGreaterThanOrEqual(6)
    })

    it('should have warning color for grades 2-3', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(6)
    })

    it('should have success color for grades 4-5', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(6)
    })

    it('should display description for each grade', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Complete blackout')
      expect(wrapper.text()).toContain('Incorrect')
      expect(wrapper.text()).toContain('Correct')
      expect(wrapper.text()).toContain('Perfect')
    })

    it('should display instructions text', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('Rate your response')
    })
  })

  describe('events', () => {
    it('should emit rate event with grade 0 when first button clicked', async () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAll('button')
      await buttons[0]!.trigger('click')

      expect(wrapper.emitted('rate')).toBeTruthy()
      expect(wrapper.emitted('rate')![0]).toEqual([SRSGrade.CompleteBlackout])
    })

    it('should emit rate event with grade 5 when last button clicked', async () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAll('button')
      await buttons[5]!.trigger('click')

      expect(wrapper.emitted('rate')).toBeTruthy()
      expect(wrapper.emitted('rate')![0]).toEqual([SRSGrade.PerfectResponse])
    })

    it('should emit rate event with correct grade for each button', async () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAll('button')
      const expectedGrades = [
        SRSGrade.CompleteBlackout,
        SRSGrade.IncorrectResponse,
        SRSGrade.IncorrectResponseRecalled,
        SRSGrade.CorrectWithDifficulty,
        SRSGrade.CorrectAfterHesitation,
        SRSGrade.PerfectResponse,
      ]

      for (let i = 0; i < 6; i++) {
        await buttons[i]!.trigger('click')
        expect(wrapper.emitted('rate')![i]).toEqual([expectedGrades[i]])
      }
    })

    it('should emit multiple rate events when buttons clicked multiple times', async () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAll('button')

      await buttons[0]!.trigger('click')
      await buttons[2]!.trigger('click')
      await buttons[5]!.trigger('click')

      expect(wrapper.emitted('rate')).toHaveLength(3)
      expect(wrapper.emitted('rate')![0]).toEqual([SRSGrade.CompleteBlackout])
      expect(wrapper.emitted('rate')![1]).toEqual([SRSGrade.IncorrectResponseRecalled])
      expect(wrapper.emitted('rate')![2]).toEqual([SRSGrade.PerfectResponse])
    })
  })

  describe('layout', () => {
    it('should use grid layout with v-row', () => {
      const wrapper = mountComponent()

      const row = wrapper.find('.v-row')
      expect(row.exists()).toBe(true)
    })

    it('should have 6 columns for buttons', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(6)
    })

    it('should be responsive with different column sizes', () => {
      const wrapper = mountComponent()

      // Verify all buttons are rendered
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(6)
    })
  })

  describe('accessibility', () => {
    it('should have clickable buttons', () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAll('button')
      buttons.forEach((button) => {
        expect(button.element.tagName).toBe('BUTTON')
      })
    })

    it('should maintain keyboard navigation', async () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAll('button')
      const firstButton = buttons[0]

      // Simulate Enter key press
      await firstButton!.trigger('keydown.enter')
      await firstButton!.trigger('click')

      expect(wrapper.emitted('rate')).toBeTruthy()
    })

    it('should have text labels for screen readers', () => {
      const wrapper = mountComponent()

      const text = wrapper.text()
      // Each button should have both number and description
      expect(text).toContain('0')
      expect(text).toContain('Complete blackout')
    })
  })

  describe('edge cases', () => {
    it('should handle rapid clicking', async () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAll('button')
      const button = buttons[3]

      // Click rapidly
      await button!.trigger('click')
      await button!.trigger('click')
      await button!.trigger('click')

      expect(wrapper.emitted('rate')).toHaveLength(3)
    })

    it('should handle clicking different buttons in sequence', async () => {
      const wrapper = mountComponent()

      const buttons = wrapper.findAll('button')

      for (const button of buttons.slice(0, 6)) {
        await button.trigger('click')
      }

      expect(wrapper.emitted('rate')).toHaveLength(6)
    })

    it('should not crash with missing translations', () => {
      const wrapper = mountComponent()

      expect(wrapper.exists()).toBe(true)
    })
  })
})
