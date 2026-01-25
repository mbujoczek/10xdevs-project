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
import CandidateCard from '../CandidateCard.vue'

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

interface CandidateCardVM {
  cardColor: 'error' | 'success' | 'warning' | undefined
  cardVariant: 'outlined' | 'tonal'
  cardClass: '' | 'rejected-card'
  isLocked: boolean
}

describe('CandidateCard.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof CandidateCard>>

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const mountComponent = (candidate: CandidateWithStatus) => {
    return mount(CandidateCard, {
      props: { candidate },
      global: {
        plugins: [i18n, vuetify],
        stubs: {
          VCard: false,
          VBtn: false,
          VChip: false,
        },
      },
    })
  }

  const createCandidate = (
    status: CandidateWithStatus['status'] = 'pending',
  ): CandidateWithStatus => ({
    candidateId: 'temp-1',
    question: 'Test Question?',
    answer: 'Test Answer',
    status,
  })

  describe('rendering', () => {
    it('should display question from candidate', () => {
      const candidate = createCandidate()
      candidate.question = 'What is Vue.js?'
      wrapper = mountComponent(candidate)

      expect(wrapper.text()).toContain('What is Vue.js?')
    })

    it('should display answer from candidate', () => {
      const candidate = createCandidate()
      candidate.answer = 'A progressive JavaScript framework'
      wrapper = mountComponent(candidate)

      expect(wrapper.text()).toContain('A progressive JavaScript framework')
    })

    it('should render all three action buttons', () => {
      const candidate = createCandidate()
      wrapper = mountComponent(candidate)

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      expect(buttons.length).toBeGreaterThanOrEqual(3)

      const buttonTexts = buttons.map((btn) => btn.text())
      expect(buttonTexts).toContain('Accept')
      expect(buttonTexts).toContain('Edit')
      expect(buttonTexts).toContain('Reject')
    })

    it('should not show status chip for pending candidates', () => {
      const candidate = createCandidate('pending')
      wrapper = mountComponent(candidate)

      const chip = wrapper.findComponent({ name: 'VChip' })
      expect(chip.exists()).toBe(false)
    })

    it('should show status chip for accepted candidates', () => {
      const candidate = createCandidate('accepted')
      wrapper = mountComponent(candidate)

      const chip = wrapper.findComponent({ name: 'VChip' })
      expect(chip.exists()).toBe(true)
      expect(chip.text()).toContain('Accepted')
    })

    it('should show status chip for edited candidates', () => {
      const candidate = createCandidate('edited')
      wrapper = mountComponent(candidate)

      const chip = wrapper.findComponent({ name: 'VChip' })
      expect(chip.exists()).toBe(true)
      expect(chip.text()).toContain('Edited')
    })

    it('should show status chip for rejected candidates', () => {
      const candidate = createCandidate('rejected')
      wrapper = mountComponent(candidate)

      const chip = wrapper.findComponent({ name: 'VChip' })
      expect(chip.exists()).toBe(true)
      expect(chip.text()).toContain('Rejected')
    })
  })

  describe('isLocked computed', () => {
    it('should enable buttons when status is pending', () => {
      const candidate = createCandidate('pending')
      wrapper = mountComponent(candidate)

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const actionButtons = buttons.filter((btn) => {
        const text = btn.text()
        return text === 'Accept' || text === 'Edit' || text === 'Reject'
      })

      actionButtons.forEach((btn) => {
        expect(btn.props('disabled')).toBe(false)
      })
    })

    it('should disable all buttons when status is accepted', () => {
      const candidate = createCandidate('accepted')
      wrapper = mountComponent(candidate)

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const actionButtons = buttons.filter((btn) => {
        const text = btn.text()
        return text === 'Accept' || text === 'Edit' || text === 'Reject'
      })

      actionButtons.forEach((btn) => {
        expect(btn.props('disabled')).toBe(true)
      })
    })

    it('should disable all buttons when status is edited', () => {
      const candidate = createCandidate('edited')
      wrapper = mountComponent(candidate)

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const actionButtons = buttons.filter((btn) => {
        const text = btn.text()
        return text === 'Accept' || text === 'Edit' || text === 'Reject'
      })

      actionButtons.forEach((btn) => {
        expect(btn.props('disabled')).toBe(true)
      })
    })

    it('should disable all buttons when status is rejected', () => {
      const candidate = createCandidate('rejected')
      wrapper = mountComponent(candidate)

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const actionButtons = buttons.filter((btn) => {
        const text = btn.text()
        return text === 'Accept' || text === 'Edit' || text === 'Reject'
      })

      actionButtons.forEach((btn) => {
        expect(btn.props('disabled')).toBe(true)
      })
    })
  })

  describe('cardColor computed', () => {
    it('should have no color for pending status', () => {
      const candidate = createCandidate('pending')
      wrapper = mountComponent(candidate)

      const vm = wrapper.vm as unknown as CandidateCardVM
      expect(vm.cardColor).toBeUndefined()
    })

    it('should have success color for accepted status', () => {
      const candidate = createCandidate('accepted')
      wrapper = mountComponent(candidate)

      const vm = wrapper.vm as unknown as CandidateCardVM
      expect(vm.cardColor).toBe('success')
    })

    it('should have warning color for edited status', () => {
      const candidate = createCandidate('edited')
      wrapper = mountComponent(candidate)

      const vm = wrapper.vm as unknown as CandidateCardVM
      expect(vm.cardColor).toBe('warning')
    })

    it('should have error color for rejected status', () => {
      const candidate = createCandidate('rejected')
      wrapper = mountComponent(candidate)

      const vm = wrapper.vm as unknown as CandidateCardVM
      expect(vm.cardColor).toBe('error')
    })
  })

  describe('cardVariant computed', () => {
    it('should use outlined variant for pending status', () => {
      const candidate = createCandidate('pending')
      wrapper = mountComponent(candidate)

      const vm = wrapper.vm as unknown as CandidateCardVM
      expect(vm.cardVariant).toBe('outlined')
    })

    it('should use tonal variant for accepted status', () => {
      const candidate = createCandidate('accepted')
      wrapper = mountComponent(candidate)

      const vm = wrapper.vm as unknown as CandidateCardVM
      expect(vm.cardVariant).toBe('tonal')
    })

    it('should use tonal variant for edited status', () => {
      const candidate = createCandidate('edited')
      wrapper = mountComponent(candidate)

      const vm = wrapper.vm as unknown as CandidateCardVM
      expect(vm.cardVariant).toBe('tonal')
    })

    it('should use tonal variant for rejected status', () => {
      const candidate = createCandidate('rejected')
      wrapper = mountComponent(candidate)

      const vm = wrapper.vm as unknown as CandidateCardVM
      expect(vm.cardVariant).toBe('tonal')
    })
  })

  describe('cardClass computed', () => {
    it('should not have rejected-card class for pending status', () => {
      const candidate = createCandidate('pending')
      wrapper = mountComponent(candidate)

      const vm = wrapper.vm as unknown as CandidateCardVM
      expect(vm.cardClass).toBe('')
    })

    it('should not have rejected-card class for accepted status', () => {
      const candidate = createCandidate('accepted')
      wrapper = mountComponent(candidate)

      const vm = wrapper.vm as unknown as CandidateCardVM
      expect(vm.cardClass).toBe('')
    })

    it('should not have rejected-card class for edited status', () => {
      const candidate = createCandidate('edited')
      wrapper = mountComponent(candidate)

      const vm = wrapper.vm as unknown as CandidateCardVM
      expect(vm.cardClass).toBe('')
    })

    it('should have rejected-card class for rejected status', () => {
      const candidate = createCandidate('rejected')
      wrapper = mountComponent(candidate)

      const vm = wrapper.vm as unknown as CandidateCardVM
      expect(vm.cardClass).toBe('rejected-card')
    })

    it('should apply opacity 0.6 for rejected cards', () => {
      const candidate = createCandidate('rejected')
      wrapper = mountComponent(candidate)

      const card = wrapper.find('.rejected-card')
      expect(card.exists()).toBe(true)
    })
  })

  describe('events emission', () => {
    it('should emit accept when accept button is clicked', async () => {
      const candidate = createCandidate('pending')
      wrapper = mountComponent(candidate)

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const acceptButton = buttons.find((btn) => btn.text() === 'Accept')

      await acceptButton?.trigger('click')
      await nextTick()

      expect(wrapper.emitted('accept')).toHaveLength(1)
    })

    it('should emit edit when edit button is clicked', async () => {
      const candidate = createCandidate('pending')
      wrapper = mountComponent(candidate)

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const editButton = buttons.find((btn) => btn.text() === 'Edit')

      await editButton?.trigger('click')
      await nextTick()

      expect(wrapper.emitted('edit')).toHaveLength(1)
    })

    it('should emit reject when reject button is clicked', async () => {
      const candidate = createCandidate('pending')
      wrapper = mountComponent(candidate)

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const rejectButton = buttons.find((btn) => btn.text() === 'Reject')

      await rejectButton?.trigger('click')
      await nextTick()

      expect(wrapper.emitted('reject')).toHaveLength(1)
    })

    it('should not emit accept when button is disabled', async () => {
      const candidate = createCandidate('accepted')
      wrapper = mountComponent(candidate)

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const acceptButton = buttons.find((btn) => btn.text() === 'Accept')

      // Button is disabled, so click should not work
      expect(acceptButton?.props('disabled')).toBe(true)

      await acceptButton?.trigger('click')
      await nextTick()

      expect(wrapper.emitted('accept')).toBeUndefined()
    })
  })

  describe('visual styling', () => {
    it('should apply candidate-card class', () => {
      const candidate = createCandidate()
      wrapper = mountComponent(candidate)

      const card = wrapper.find('.candidate-card')
      expect(card.exists()).toBe(true)
    })

    it('should apply mb-4 margin class', () => {
      const candidate = createCandidate()
      wrapper = mountComponent(candidate)

      const card = wrapper.find('.mb-4')
      expect(card.exists()).toBe(true)
    })

    it('should have word-break style on title', () => {
      const candidate = createCandidate()
      candidate.question = 'VeryLongWordWithoutSpacesToTestWordBreakingBehavior'
      wrapper = mountComponent(candidate)

      const title = wrapper.findComponent({ name: 'VCardTitle' })
      expect(title.exists()).toBe(true)
    })
  })

  describe('button colors', () => {
    it('should have success color on accept button', () => {
      const candidate = createCandidate('pending')
      wrapper = mountComponent(candidate)

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const acceptButton = buttons.find((btn) => btn.text() === 'Accept')

      expect(acceptButton?.props('color')).toBe('success')
    })

    it('should have warning color on edit button', () => {
      const candidate = createCandidate('pending')
      wrapper = mountComponent(candidate)

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const editButton = buttons.find((btn) => btn.text() === 'Edit')

      expect(editButton?.props('color')).toBe('warning')
    })

    it('should have error color on reject button', () => {
      const candidate = createCandidate('pending')
      wrapper = mountComponent(candidate)

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const rejectButton = buttons.find((btn) => btn.text() === 'Reject')

      expect(rejectButton?.props('color')).toBe('error')
    })
  })

  describe('chip styling', () => {
    it('should have success color chip for accepted status', () => {
      const candidate = createCandidate('accepted')
      wrapper = mountComponent(candidate)

      const chip = wrapper.findComponent({ name: 'VChip' })
      expect(chip.props('color')).toBe('success')
    })

    it('should have warning color chip for edited status', () => {
      const candidate = createCandidate('edited')
      wrapper = mountComponent(candidate)

      const chip = wrapper.findComponent({ name: 'VChip' })
      expect(chip.props('color')).toBe('warning')
    })

    it('should have error color chip for rejected status', () => {
      const candidate = createCandidate('rejected')
      wrapper = mountComponent(candidate)

      const chip = wrapper.findComponent({ name: 'VChip' })
      expect(chip.props('color')).toBe('error')
    })

    it('should have flat variant chip', () => {
      const candidate = createCandidate('accepted')
      wrapper = mountComponent(candidate)

      const chip = wrapper.findComponent({ name: 'VChip' })
      expect(chip.props('variant')).toBe('flat')
    })

    it('should have small size chip', () => {
      const candidate = createCandidate('accepted')
      wrapper = mountComponent(candidate)

      const chip = wrapper.findComponent({ name: 'VChip' })
      expect(chip.props('size')).toBe('small')
    })
  })
})
