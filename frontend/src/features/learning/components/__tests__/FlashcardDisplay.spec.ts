import FlashcardDisplay from '@/features/learning/components/FlashcardDisplay.vue'
import en from '@/i18n/locales/en.json'
import pl from '@/i18n/locales/pl.json'
import { FlashcardSource, FlashcardStatus } from '@/types/enums'
import type { Flashcard } from '@/types/flashcards.types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
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

const mountComponent = (props: { flashcard: Flashcard; isAnswerVisible: boolean }) => {
  return mount(FlashcardDisplay, {
    props,
    global: {
      plugins: [i18n, vuetify],
    },
  })
}

describe('FlashcardDisplay.vue', () => {
  describe('rendering', () => {
    it('should render question card', () => {
      const flashcard = createFlashcard(1)
      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: false,
      })

      expect(wrapper.text()).toContain('Test Question 1')
    })

    it('should display question with proper formatting', () => {
      const flashcard = createFlashcard(1)
      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: false,
      })

      const questionText = wrapper.find('.text-h5')
      expect(questionText.exists()).toBe(true)
      expect(questionText.text()).toBe('Test Question 1')
    })

    it('should show "Show Answer" button when answer is not visible', () => {
      const flashcard = createFlashcard(1)
      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: false,
      })

      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
    })

    it('should hide "Show Answer" button when answer is visible', () => {
      const flashcard = createFlashcard(1)
      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: true,
      })

      // Check that v-if="!isAnswerVisible" hides the button
      const buttons = wrapper.findAll('button')
      const showAnswerButton = buttons.find((btn) => btn.text().includes('Show Answer'))
      expect(showAnswerButton).toBeUndefined()
    })

    it('should not display answer card when answer is not visible', () => {
      const flashcard = createFlashcard(1)
      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: false,
      })

      expect(wrapper.text()).not.toContain('Test Answer 1')
    })

    it('should display answer card when answer is visible', () => {
      const flashcard = createFlashcard(1)
      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: true,
      })

      expect(wrapper.text()).toContain('Test Answer 1')
    })

    it('should display both question and answer when visible', () => {
      const flashcard = createFlashcard(1)
      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: true,
      })

      expect(wrapper.text()).toContain('Test Question 1')
      expect(wrapper.text()).toContain('Test Answer 1')
    })
  })

  describe('events', () => {
    it('should emit showAnswer event when button is clicked', async () => {
      const flashcard = createFlashcard(1)
      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: false,
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      expect(wrapper.emitted('showAnswer')).toBeTruthy()
      expect(wrapper.emitted('showAnswer')).toHaveLength(1)
    })

    it('should emit showAnswer without parameters', async () => {
      const flashcard = createFlashcard(1)
      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: false,
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      const emitted = wrapper.emitted('showAnswer')
      expect(emitted).toBeTruthy()
      expect(emitted![0]).toEqual([])
    })
  })

  describe('props validation', () => {
    it('should accept valid flashcard prop', () => {
      const flashcard = createFlashcard(1)
      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: false,
      })

      expect(wrapper.props('flashcard')).toEqual(flashcard)
    })

    it('should accept isAnswerVisible as boolean', () => {
      const flashcard = createFlashcard(1)
      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: true,
      })

      expect(wrapper.props('isAnswerVisible')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle long question text', () => {
      const flashcard: Flashcard = {
        ...createFlashcard(1),
        question: 'A'.repeat(500),
      }

      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: false,
      })

      expect(wrapper.text()).toContain('A'.repeat(500))
    })

    it('should handle long answer text', () => {
      const flashcard: Flashcard = {
        ...createFlashcard(1),
        answer: 'B'.repeat(500),
      }

      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: true,
      })

      expect(wrapper.text()).toContain('B'.repeat(500))
    })

    it('should handle special characters in question', () => {
      const flashcard: Flashcard = {
        ...createFlashcard(1),
        question: '<script>alert("XSS")</script>',
      }

      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: false,
      })

      // Vue automatically escapes HTML
      expect(wrapper.html()).not.toContain('<script>')
    })

    it('should handle special characters in answer', () => {
      const flashcard: Flashcard = {
        ...createFlashcard(1),
        answer: '< > & " \' characters',
      }

      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: true,
      })

      expect(wrapper.text()).toContain('< > & " \' characters')
    })

    it('should handle Unicode characters', () => {
      const flashcard: Flashcard = {
        ...createFlashcard(1),
        question: 'What is 日本語?',
        answer: 'Japanese language: 日本語',
      }

      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: true,
      })

      expect(wrapper.text()).toContain('日本語')
    })

    it('should handle empty strings gracefully', () => {
      const flashcard: Flashcard = {
        ...createFlashcard(1),
        question: '',
        answer: '',
      }

      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: true,
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('reactivity', () => {
    it('should update when flashcard prop changes', async () => {
      const flashcard1 = createFlashcard(1)
      const wrapper = mountComponent({
        flashcard: flashcard1,
        isAnswerVisible: false,
      })

      expect(wrapper.text()).toContain('Test Question 1')

      const flashcard2 = createFlashcard(2)
      await wrapper.setProps({ flashcard: flashcard2 })

      expect(wrapper.text()).toContain('Test Question 2')
      expect(wrapper.text()).not.toContain('Test Question 1')
    })

    it('should update when isAnswerVisible changes from false to true', async () => {
      const flashcard = createFlashcard(1)
      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: false,
      })

      expect(wrapper.text()).not.toContain('Test Answer 1')

      await wrapper.setProps({ isAnswerVisible: true })

      expect(wrapper.text()).toContain('Test Answer 1')
    })

    it('should update when isAnswerVisible changes from true to false', async () => {
      const flashcard = createFlashcard(1)
      const wrapper = mountComponent({
        flashcard,
        isAnswerVisible: true,
      })

      expect(wrapper.text()).toContain('Test Answer 1')

      await wrapper.setProps({ isAnswerVisible: false })
      await nextTick()

      // After hiding answer, the button should appear instead
      expect(wrapper.text()).toContain('Show answer')
    })
  })
})
