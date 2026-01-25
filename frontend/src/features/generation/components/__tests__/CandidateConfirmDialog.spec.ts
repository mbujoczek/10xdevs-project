import type { CandidateWithStatus } from '@/features/generation/store'
import en from '@/i18n/locales/en.json'
import pl from '@/i18n/locales/pl.json'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import CandidateConfirmDialog from '../CandidateConfirmDialog.vue'

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

describe('CandidateConfirmDialog.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof CandidateConfirmDialog>>

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createCandidate = (): CandidateWithStatus => ({
    candidateId: 'temp-1',
    question: 'Test Question',
    answer: 'Test Answer',
    status: 'pending',
  })

  const mountComponent = (props: {
    modelValue: boolean
    action: 'accept' | 'edit' | 'reject'
    candidate: CandidateWithStatus | null
  }) => {
    const div = document.createElement('div')
    div.setAttribute('data-app', 'true')
    document.body.appendChild(div)

    return mount(CandidateConfirmDialog, {
      props,
      attachTo: div,
      global: {
        plugins: [i18n, vuetify],
      },
    })
  }

  describe('rendering', () => {
    it('should show dialog when modelValue is true', () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      const dialog = wrapper.findComponent({ name: 'VDialog' })
      expect(dialog.props('modelValue')).toBe(true)
    })

    it('should hide dialog when modelValue is false', () => {
      wrapper = mountComponent({
        modelValue: false,
        action: 'accept',
        candidate: createCandidate(),
      })

      const dialog = wrapper.findComponent({ name: 'VDialog' })
      expect(dialog.props('modelValue')).toBe(false)
    })

    it('should display correct title from i18n', () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      expect(document.body.textContent).toContain('Confirm action')
    })

    it('should render cancel and confirm buttons', () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      expect(buttons.length).toBeGreaterThanOrEqual(2)

      const buttonTexts = buttons.map((btn) => btn.text())
      expect(buttonTexts).toContain('Cancel')
      expect(buttonTexts).toContain('Confirm')
    })

    it('should have primary color on confirm button', () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const confirmButton = buttons.find((btn) => btn.text() === 'Confirm')

      expect(confirmButton?.props('color')).toBe('primary')
    })
  })

  describe('dialogMessage computed', () => {
    it('should show accept message when action is accept', () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      expect(document.body.textContent).toContain('Are you sure you want to accept this flashcard?')
    })

    it('should show edit message when action is edit', () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'edit',
        candidate: createCandidate(),
      })

      expect(document.body.textContent).toContain('Are you sure you want to save these changes?')
    })

    it('should show reject message when action is reject', () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'reject',
        candidate: createCandidate(),
      })

      expect(document.body.textContent).toContain('Are you sure you want to reject this flashcard?')
    })
  })

  describe('events emission', () => {
    it('should emit update:modelValue with false when cancel is clicked', async () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const cancelButton = buttons.find((btn) => btn.text() === 'Cancel')

      await cancelButton?.trigger('click')
      await nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    })

    it('should emit confirm when confirm button is clicked', async () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const confirmButton = buttons.find((btn) => btn.text() === 'Confirm')

      await confirmButton?.trigger('click')
      await nextTick()

      expect(wrapper.emitted('confirm')).toHaveLength(1)
    })

    it('should emit update:modelValue with false after confirm', async () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'reject',
        candidate: createCandidate(),
      })

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const confirmButton = buttons.find((btn) => btn.text() === 'Confirm')

      await confirmButton?.trigger('click')
      await nextTick()

      const updateEvents = wrapper.emitted('update:modelValue')
      expect(updateEvents).toBeTruthy()
      expect(updateEvents?.[updateEvents.length - 1]).toEqual([false])
    })

    it('should emit update:modelValue when dialog is closed by backdrop', async () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      const dialog = wrapper.findComponent({ name: 'VDialog' })
      await dialog.vm.$emit('update:modelValue', false)
      await nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    })
  })

  describe('dialog configuration', () => {
    it('should have max-width of 500', () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      const dialog = wrapper.findComponent({ name: 'VDialog' })
      expect(dialog.props('maxWidth')).toBe('500')
    })

    it('should display text-h6 class on title', () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      const title = wrapper.findComponent({ name: 'VCardTitle' })
      expect(title.classes()).toContain('text-h6')
    })

    it('should display text-body-1 class on message', () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      const text = wrapper.findComponent({ name: 'VCardText' })
      expect(text.classes()).toContain('text-body-1')
    })
  })

  describe('button styling', () => {
    it('should have text variant on cancel button', () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const cancelButton = buttons.find((btn) => btn.text() === 'Cancel')

      expect(cancelButton?.props('variant')).toBe('text')
    })

    it('should have flat variant on confirm button', () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const confirmButton = buttons.find((btn) => btn.text() === 'Confirm')

      expect(confirmButton?.props('variant')).toBe('flat')
    })
  })

  describe('action-specific behavior', () => {
    it('should work correctly for accept action', async () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      expect(document.body.textContent).toContain('Are you sure you want to accept this flashcard?')

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const confirmButton = buttons.find((btn) => btn.text() === 'Confirm')

      await confirmButton?.trigger('click')
      await nextTick()

      expect(wrapper.emitted('confirm')).toHaveLength(1)
    })

    it('should work correctly for edit action', async () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'edit',
        candidate: createCandidate(),
      })

      expect(document.body.textContent).toContain('Are you sure you want to save these changes?')

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const confirmButton = buttons.find((btn) => btn.text() === 'Confirm')

      await confirmButton?.trigger('click')
      await nextTick()

      expect(wrapper.emitted('confirm')).toHaveLength(1)
    })

    it('should work correctly for reject action', async () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'reject',
        candidate: createCandidate(),
      })

      expect(document.body.textContent).toContain('Are you sure you want to reject this flashcard?')

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const confirmButton = buttons.find((btn) => btn.text() === 'Confirm')

      await confirmButton?.trigger('click')
      await nextTick()

      expect(wrapper.emitted('confirm')).toHaveLength(1)
    })
  })

  describe('cancel flow', () => {
    it('should not emit confirm when cancel is clicked', async () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const cancelButton = buttons.find((btn) => btn.text() === 'Cancel')

      await cancelButton?.trigger('click')
      await nextTick()

      expect(wrapper.emitted('confirm')).toBeUndefined()
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    it('should only close dialog on cancel', async () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'reject',
        candidate: createCandidate(),
      })

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const cancelButton = buttons.find((btn) => btn.text() === 'Cancel')

      await cancelButton?.trigger('click')
      await nextTick()

      const emittedEvents = wrapper.emitted()
      expect(Object.keys(emittedEvents)).toEqual(['update:modelValue'])
      expect(emittedEvents['update:modelValue']?.[0]).toEqual([false])
    })
  })

  describe('edge cases', () => {
    it('should handle null candidate', () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: null,
      })

      expect(document.body.textContent).toContain('Confirm action')
      expect(document.body.textContent).toContain('Are you sure you want to accept this flashcard?')
    })

    it('should handle rapid open/close', async () => {
      wrapper = mountComponent({
        modelValue: false,
        action: 'accept',
        candidate: createCandidate(),
      })

      await wrapper.setProps({ modelValue: true })
      await nextTick()

      await wrapper.setProps({ modelValue: false })
      await nextTick()

      await wrapper.setProps({ modelValue: true })
      await nextTick()

      const dialog = wrapper.findComponent({ name: 'VDialog' })
      expect(dialog.props('modelValue')).toBe(true)
    })

    it('should handle action change while dialog is open', async () => {
      wrapper = mountComponent({
        modelValue: true,
        action: 'accept',
        candidate: createCandidate(),
      })

      expect(document.body.textContent).toContain('Are you sure you want to accept this flashcard?')

      await wrapper.setProps({ action: 'reject' })
      await nextTick()

      expect(document.body.textContent).toContain('Are you sure you want to reject this flashcard?')
    })
  })
})
