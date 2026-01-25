import { completeFlashcardsReview } from '@/api/flashcards.api'
import i18n from '@/i18n'
import vuetify from '@/plugins/vuetify'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import CandidateCard from '../../components/CandidateCard.vue'
import CandidateConfirmDialog from '../../components/CandidateConfirmDialog.vue'
import EditCandidateDialog from '../../components/EditCandidateDialog.vue'
import { useGenerationStore } from '../../store'
import ReviewView from '../ReviewView.vue'

vi.mock('@/api/flashcards.api', () => ({
  completeFlashcardsReview: vi.fn(),
}))

vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
  }),
}))

interface ReviewViewVM {
  currentAction: 'accept' | 'edit' | 'reject'
  currentCandidate: {
    candidateId: string
    question: string
    answer: string
  } | null
  handleFinishReview: () => Promise<void>
}

describe('ReviewView.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof ReviewView>>
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/review/:eventId',
          name: 'review',
          component: { template: '<div>Review</div>' },
        },
        {
          path: '/dashboard',
          name: 'dashboard',
          component: { template: '<div>Dashboard</div>' },
        },
        {
          path: '/flashcards',
          name: 'flashcards',
          component: { template: '<div>Flashcards</div>' },
        },
      ],
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const mountComponent = async (locale = 'en', eventId = '123') => {
    i18n.global.locale.value = locale as 'en' | 'pl'
    await router.push(`/review/${eventId}`)
    await router.isReady()
    return mount(ReviewView, {
      global: {
        plugins: [i18n, vuetify, router],
        stubs: {
          CandidateCard: false,
          CandidateConfirmDialog: false,
          EditCandidateDialog: false,
        },
      },
    })
  }

  describe('rendering', () => {
    it('should render title and description', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      expect(wrapper.text()).toContain('Review generated flashcards')
      expect(wrapper.text()).toContain('Review the AI-generated flashcards')
    })

    it('should render stats section with correct values', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [
        { candidateId: 'c1', question: 'Q1', answer: 'A1' },
        { candidateId: 'c2', question: 'Q2', answer: 'A2' },
      ])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      expect(wrapper.text()).toContain('Pending')
      expect(wrapper.text()).toContain('Accepted')
      expect(wrapper.text()).toContain('Edited')
      expect(wrapper.text()).toContain('Rejected')
    })

    it('should render candidate cards for each candidate', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [
        { candidateId: 'c1', question: 'Q1', answer: 'A1' },
        { candidateId: 'c2', question: 'Q2', answer: 'A2' },
      ])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      const cards = wrapper.findAllComponents(CandidateCard)
      expect(cards).toHaveLength(2)
    })

    it('should render finish button', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const finishButton = buttons[buttons.length - 1]!
      expect(finishButton.exists()).toBe(true)
      expect(finishButton.text()).toContain('Finish review')
    })

    it('should show "no candidates" message when list is empty', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      expect(wrapper.text()).toContain('No flashcards to review')
    })
  })

  describe('stats display', () => {
    it('should show correct pending count', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [
        { candidateId: 'c1', question: 'Q1', answer: 'A1' },
        { candidateId: 'c2', question: 'Q2', answer: 'A2' },
      ])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      const stats = wrapper.findAll('.text-h4')
      // Skip first one (title), stats start at index 1
      expect(stats[1]!.text()).toBe('2') // pending
    })

    it('should show correct accepted count after accepting', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      generationStore.requestAccept('c1')
      generationStore.confirmAction()
      await nextTick()

      const stats = wrapper.findAll('.text-h4')
      expect(stats[2]!.text()).toBe('1') // accepted
    })

    it('should show correct rejected count after rejecting', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      generationStore.requestReject('c1')
      generationStore.confirmAction()
      await nextTick()

      const stats = wrapper.findAll('.text-h4')
      expect(stats[4]!.text()).toBe('1') // rejected
    })
  })

  describe('candidate actions', () => {
    it('should call requestAccept when accepting candidate', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])
      const spy = vi.spyOn(generationStore, 'requestAccept')

      wrapper = await mountComponent('en', '123')
      await nextTick()

      const cards = wrapper.findAllComponents(CandidateCard)
      await cards[0]!.vm.$emit('accept')
      await nextTick()

      expect(spy).toHaveBeenCalledWith('c1')
    })

    it('should call requestEdit when editing candidate', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])
      const spy = vi.spyOn(generationStore, 'requestEdit')

      wrapper = await mountComponent('en', '123')
      await nextTick()

      const cards = wrapper.findAllComponents(CandidateCard)
      await cards[0]!.vm.$emit('edit')
      await nextTick()

      expect(spy).toHaveBeenCalledWith('c1')
    })

    it('should call requestReject when rejecting candidate', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])
      const spy = vi.spyOn(generationStore, 'requestReject')

      wrapper = await mountComponent('en', '123')
      await nextTick()

      const cards = wrapper.findAllComponents(CandidateCard)
      await cards[0]!.vm.$emit('reject')
      await nextTick()

      expect(spy).toHaveBeenCalledWith('c1')
    })

    it('should call confirmAction when confirming action', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])
      const spy = vi.spyOn(generationStore, 'confirmAction')

      wrapper = await mountComponent('en', '123')
      await nextTick()

      generationStore.requestAccept('c1')
      await nextTick()

      const dialog = wrapper.findComponent(CandidateConfirmDialog)
      await dialog.vm.$emit('confirm')
      await nextTick()

      expect(spy).toHaveBeenCalled()
    })

    it('should call saveEdit when saving edits', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])
      const spy = vi.spyOn(generationStore, 'saveEdit')

      wrapper = await mountComponent('en', '123')
      await nextTick()

      generationStore.requestEdit('c1')
      await nextTick()

      const dialog = wrapper.findComponent(EditCandidateDialog)
      const editedData = { question: 'Edited Q', answer: 'Edited A' }
      await dialog.vm.$emit('save', editedData)
      await nextTick()

      expect(spy).toHaveBeenCalledWith('c1', editedData)
    })
  })

  describe('finish review', () => {
    it('should have finish button disabled when candidates are pending', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const finishButton = buttons[buttons.length - 1]!
      expect(finishButton.props('disabled')).toBe(true)
    })

    it('should have finish button enabled when all candidates processed', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      generationStore.requestAccept('c1')
      generationStore.confirmAction()
      await nextTick()

      const buttons = wrapper.findAllComponents({ name: 'VBtn' })
      const finishButton = buttons[buttons.length - 1]!
      expect(finishButton.props('disabled')).toBe(false)
    })

    it('should call API and navigate to flashcards on finish', async () => {
      const mockResponse = {
        savedFlashcardsCount: 2,
        acceptedCount: 1,
        editedCount: 0,
        rejectedCount: 0,
        flashcardIds: [1, 2],
      }
      vi.mocked(completeFlashcardsReview).mockResolvedValue(mockResponse)

      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      generationStore.requestAccept('c1')
      generationStore.confirmAction()
      await nextTick()

      const vm = wrapper.vm as unknown as ReviewViewVM
      await vm.handleFinishReview()
      await nextTick()

      expect(completeFlashcardsReview).toHaveBeenCalledWith(123, {
        accepted: [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }],
        edited: [],
      })
      expect(router.currentRoute.value.name).toBe('flashcards')
    })

    it('should reset store after completing review', async () => {
      const mockResponse = {
        savedFlashcardsCount: 1,
        acceptedCount: 1,
        editedCount: 0,
        rejectedCount: 0,
        flashcardIds: [1],
      }
      vi.mocked(completeFlashcardsReview).mockResolvedValue(mockResponse)

      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])
      const spy = vi.spyOn(generationStore, 'resetStore')

      wrapper = await mountComponent('en', '123')
      await nextTick()

      generationStore.requestAccept('c1')
      generationStore.confirmAction()
      await nextTick()

      const vm = wrapper.vm as unknown as ReviewViewVM
      await vm.handleFinishReview()
      await nextTick()

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('route handling', () => {
    it('should redirect to dashboard if no eventId param', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [])

      wrapper = await mountComponent('en', '')
      await nextTick()

      // Wait for onMounted redirect
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(router.currentRoute.value.name).toBe('dashboard')
    })

    it('should redirect to dashboard if eventId is invalid', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [])

      wrapper = await mountComponent('en', 'invalid')
      await nextTick()

      // Wait for onMounted redirect
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(router.currentRoute.value.name).toBe('dashboard')
    })

    it('should redirect to dashboard if no candidates exist', async () => {
      const generationStore = useGenerationStore()
      generationStore.eventId = 999 // Different eventId

      wrapper = await mountComponent('en', '123')
      await nextTick()

      // Wait for onMounted redirect
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(router.currentRoute.value.name).toBe('dashboard')
    })

    it('should not redirect if candidates exist for eventId', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      // Wait a bit to ensure no redirect happens
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(router.currentRoute.value.name).toBe('review')
    })
  })

  describe('dialogs', () => {
    it('should render CandidateConfirmDialog', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      const dialog = wrapper.findComponent(CandidateConfirmDialog)
      expect(dialog.exists()).toBe(true)
    })

    it('should render EditCandidateDialog', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      const dialog = wrapper.findComponent(EditCandidateDialog)
      expect(dialog.exists()).toBe(true)
    })

    it('should pass currentAction to confirm dialog', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      generationStore.requestAccept('c1')
      await nextTick()

      const dialog = wrapper.findComponent(CandidateConfirmDialog)
      expect(dialog.props('action')).toBe('accept')
    })

    it('should pass candidateBeingEdited to edit dialog', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      generationStore.requestEdit('c1')
      await nextTick()

      const dialog = wrapper.findComponent(EditCandidateDialog)
      expect(dialog.props('candidate')).toMatchObject({
        candidateId: 'c1',
        question: 'Q1',
        answer: 'A1',
      })
    })
  })

  describe('computed properties', () => {
    it('should compute currentAction correctly', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      generationStore.requestReject('c1')
      await nextTick()

      const vm = wrapper.vm as unknown as ReviewViewVM
      expect(vm.currentAction).toBe('reject')
    })

    it('should compute currentCandidate correctly', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      generationStore.requestAccept('c1')
      await nextTick()

      const vm = wrapper.vm as unknown as ReviewViewVM
      expect(vm.currentCandidate).toMatchObject({
        candidateId: 'c1',
        question: 'Q1',
        answer: 'A1',
      })
    })

    it('should return null for currentCandidate when no pending action', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('en', '123')
      await nextTick()

      const vm = wrapper.vm as unknown as ReviewViewVM
      expect(vm.currentCandidate).toBeNull()
    })
  })

  describe('language', () => {
    it('should render Polish translations when locale is pl', async () => {
      const generationStore = useGenerationStore()
      generationStore.initializeReview(123, [{ candidateId: 'c1', question: 'Q1', answer: 'A1' }])

      wrapper = await mountComponent('pl', '123')
      await nextTick()

      expect(wrapper.text()).toContain('Przejrzyj wygenerowane fiszki')
    })
  })
})
