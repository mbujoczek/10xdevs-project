import EditFlashcardDialog from '@/components/common/EditFlashcardDialog.vue'
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
import EditCandidateDialog from '../EditCandidateDialog.vue'

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

interface EditCandidateDialogVM {
  dialogData: { question: string; answer: string } | null
}

describe('EditCandidateDialog.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof EditCandidateDialog>>

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
    question: 'Original Question',
    answer: 'Original Answer',
    status: 'pending',
  })

  const mountComponent = (props: {
    modelValue: boolean
    candidate: CandidateWithStatus | null
  }) => {
    return mount(EditCandidateDialog, {
      props,
      global: {
        plugins: [i18n, vuetify],
        stubs: {
          EditFlashcardDialog: false,
        },
      },
    })
  }

  describe('dialogData computed', () => {
    it('should map candidate to dialog data format', () => {
      const candidate = createCandidate()
      candidate.question = 'Test Question'
      candidate.answer = 'Test Answer'

      wrapper = mountComponent({
        modelValue: true,
        candidate,
      })

      const vm = wrapper.vm as unknown as EditCandidateDialogVM
      expect(vm.dialogData).toEqual({
        question: 'Test Question',
        answer: 'Test Answer',
      })
    })

    it('should return null when candidate is null', () => {
      wrapper = mountComponent({
        modelValue: false,
        candidate: null,
      })

      const vm = wrapper.vm as unknown as EditCandidateDialogVM
      expect(vm.dialogData).toBeNull()
    })

    it('should extract question field correctly', () => {
      const candidate = createCandidate()
      candidate.question = 'What is Vue.js?'

      wrapper = mountComponent({
        modelValue: true,
        candidate,
      })

      const vm = wrapper.vm as unknown as EditCandidateDialogVM
      expect(vm.dialogData?.question).toBe('What is Vue.js?')
    })

    it('should extract answer field correctly', () => {
      const candidate = createCandidate()
      candidate.answer = 'A progressive framework'

      wrapper = mountComponent({
        modelValue: true,
        candidate,
      })

      const vm = wrapper.vm as unknown as EditCandidateDialogVM
      expect(vm.dialogData?.answer).toBe('A progressive framework')
    })

    it('should not include status in dialog data', () => {
      const candidate = createCandidate()

      wrapper = mountComponent({
        modelValue: true,
        candidate,
      })

      const vm = wrapper.vm as unknown as EditCandidateDialogVM
      expect(vm.dialogData).not.toHaveProperty('status')
      expect(vm.dialogData).not.toHaveProperty('candidateId')
    })
  })

  describe('props forwarding to EditFlashcardDialog', () => {
    it('should pass modelValue to child component', () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      expect(childComponent.props('modelValue')).toBe(true)
    })

    it('should pass dialogData to child component', () => {
      const candidate = createCandidate()
      wrapper = mountComponent({
        modelValue: true,
        candidate,
      })

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      expect(childComponent.props('data')).toEqual({
        question: 'Original Question',
        answer: 'Original Answer',
      })
    })

    it('should pass title from i18n', () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      expect(childComponent.props('title')).toBe('Edit flashcard')
    })

    it('should pass questionLabel from i18n', () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      expect(childComponent.props('questionLabel')).toBe('Question')
    })

    it('should pass answerLabel from i18n', () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      expect(childComponent.props('answerLabel')).toBe('Answer')
    })

    it('should pass questionMaxLength as 200', () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      expect(childComponent.props('questionMaxLength')).toBe(200)
    })

    it('should pass answerMaxLength as 500', () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      expect(childComponent.props('answerMaxLength')).toBe(500)
    })

    it('should pass all validation messages from i18n', () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      expect(childComponent.props('questionRequiredMessage')).toBe('Question is required')
      expect(childComponent.props('questionMaxLengthMessage')).toBe(
        'Question must not exceed 200 characters',
      )
      expect(childComponent.props('answerRequiredMessage')).toBe('Answer is required')
      expect(childComponent.props('answerMaxLengthMessage')).toBe(
        'Answer must not exceed 500 characters',
      )
    })

    it('should pass cancel and save labels from i18n', () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      expect(childComponent.props('cancelLabel')).toBe('Cancel')
      expect(childComponent.props('saveLabel')).toBe('Save')
    })
  })

  describe('events delegation', () => {
    it('should emit update:modelValue when child emits it', async () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      await childComponent.vm.$emit('update:modelValue', false)
      await nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    })

    it('should emit save with correct data format when child emits save', async () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const editedData = {
        question: 'Edited Question',
        answer: 'Edited Answer',
      }

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      await childComponent.vm.$emit('save', editedData)
      await nextTick()

      expect(wrapper.emitted('save')).toBeTruthy()
      expect(wrapper.emitted('save')?.[0]).toEqual([editedData])
    })

    it('should pass through question in save event', async () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const editedData = {
        question: 'New Question Text',
        answer: 'New Answer Text',
      }

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      await childComponent.vm.$emit('save', editedData)
      await nextTick()

      const emittedData = wrapper.emitted('save')?.[0]?.[0] as unknown as {
        question: string
        answer: string
      }
      expect(emittedData.question).toBe('New Question Text')
    })

    it('should pass through answer in save event', async () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const editedData = {
        question: 'New Question Text',
        answer: 'New Answer Text',
      }

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      await childComponent.vm.$emit('save', editedData)
      await nextTick()

      const emittedData = wrapper.emitted('save')?.[0]?.[0] as unknown as {
        question: string
        answer: string
      }
      expect(emittedData.answer).toBe('New Answer Text')
    })
  })

  describe('reactive updates', () => {
    it('should update dialogData when candidate prop changes', async () => {
      const candidate1 = createCandidate()
      candidate1.question = 'Question 1'

      wrapper = mountComponent({
        modelValue: true,
        candidate: candidate1,
      })

      let vm = wrapper.vm as unknown as EditCandidateDialogVM
      expect(vm.dialogData?.question).toBe('Question 1')

      const candidate2 = createCandidate()
      candidate2.question = 'Question 2'

      await wrapper.setProps({ candidate: candidate2 })
      await nextTick()

      vm = wrapper.vm as unknown as EditCandidateDialogVM
      expect(vm.dialogData?.question).toBe('Question 2')
    })

    it('should set dialogData to null when candidate becomes null', async () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      let vm = wrapper.vm as unknown as EditCandidateDialogVM
      expect(vm.dialogData).not.toBeNull()

      await wrapper.setProps({ candidate: null })
      await nextTick()

      vm = wrapper.vm as unknown as EditCandidateDialogVM
      expect(vm.dialogData).toBeNull()
    })

    it('should update child component data when candidate changes', async () => {
      const candidate1 = createCandidate()
      wrapper = mountComponent({
        modelValue: true,
        candidate: candidate1,
      })

      const candidate2 = createCandidate()
      candidate2.question = 'Updated Question'
      candidate2.answer = 'Updated Answer'

      await wrapper.setProps({ candidate: candidate2 })
      await nextTick()

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      expect(childComponent.props('data')).toEqual({
        question: 'Updated Question',
        answer: 'Updated Answer',
      })
    })
  })

  describe('edge cases', () => {
    it('should handle candidate with empty strings', () => {
      const candidate = createCandidate()
      candidate.question = ''
      candidate.answer = ''

      wrapper = mountComponent({
        modelValue: true,
        candidate,
      })

      const vm = wrapper.vm as unknown as EditCandidateDialogVM
      expect(vm.dialogData).toEqual({
        question: '',
        answer: '',
      })
    })

    it('should handle candidate with very long text', () => {
      const candidate = createCandidate()
      candidate.question = 'Q'.repeat(300)
      candidate.answer = 'A'.repeat(600)

      wrapper = mountComponent({
        modelValue: true,
        candidate,
      })

      const vm = wrapper.vm as unknown as EditCandidateDialogVM
      expect(vm.dialogData?.question).toBe('Q'.repeat(300))
      expect(vm.dialogData?.answer).toBe('A'.repeat(600))
    })

    it('should handle candidate with special characters', () => {
      const candidate = createCandidate()
      candidate.question = 'Question with <html> & "quotes"'
      candidate.answer = "Answer with 'apostrophes' & symbols: !@#$%"

      wrapper = mountComponent({
        modelValue: true,
        candidate,
      })

      const vm = wrapper.vm as unknown as EditCandidateDialogVM
      expect(vm.dialogData?.question).toBe('Question with <html> & "quotes"')
      expect(vm.dialogData?.answer).toBe("Answer with 'apostrophes' & symbols: !@#$%")
    })

    it('should handle rapid open/close with different candidates', async () => {
      const candidate1 = createCandidate()
      candidate1.question = 'Q1'

      wrapper = mountComponent({
        modelValue: true,
        candidate: candidate1,
      })

      const candidate2 = createCandidate()
      candidate2.question = 'Q2'

      await wrapper.setProps({ modelValue: false, candidate: null })
      await nextTick()

      await wrapper.setProps({ modelValue: true, candidate: candidate2 })
      await nextTick()

      const vm = wrapper.vm as unknown as EditCandidateDialogVM
      expect(vm.dialogData?.question).toBe('Q2')
    })

    it('should handle edited candidate with original values stored', () => {
      const candidate = createCandidate()
      candidate.status = 'edited'
      candidate.question = 'Edited Question'
      candidate.answer = 'Edited Answer'
      candidate.originalQuestion = 'Original Question'
      candidate.originalAnswer = 'Original Answer'

      wrapper = mountComponent({
        modelValue: true,
        candidate,
      })

      const vm = wrapper.vm as unknown as EditCandidateDialogVM
      // dialogData should use current values, not original
      expect(vm.dialogData).toEqual({
        question: 'Edited Question',
        answer: 'Edited Answer',
      })
    })
  })

  describe('integration with EditFlashcardDialog', () => {
    it('should render EditFlashcardDialog component', () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      expect(childComponent.exists()).toBe(true)
    })

    it('should pass all required props to child', () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      const childProps = childComponent.props()

      expect(childProps).toHaveProperty('modelValue')
      expect(childProps).toHaveProperty('data')
      expect(childProps).toHaveProperty('title')
      expect(childProps).toHaveProperty('questionLabel')
      expect(childProps).toHaveProperty('answerLabel')
      expect(childProps).toHaveProperty('questionMaxLength')
      expect(childProps).toHaveProperty('answerMaxLength')
    })
  })

  describe('validation constraints', () => {
    it('should enforce 200 character limit for question', () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      expect(childComponent.props('questionMaxLength')).toBe(200)
    })

    it('should enforce 500 character limit for answer', () => {
      wrapper = mountComponent({
        modelValue: true,
        candidate: createCandidate(),
      })

      const childComponent = wrapper.findComponent(EditFlashcardDialog)
      expect(childComponent.props('answerMaxLength')).toBe(500)
    })
  })
})
