import type { CompleteReviewRequest, FlashcardCandidate } from '@/types/flashcards.types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type CandidateStatus = 'pending' | 'accepted' | 'edited' | 'rejected'

export interface CandidateWithStatus extends FlashcardCandidate {
  status: CandidateStatus
  originalQuestion?: string
  originalAnswer?: string
}

interface PendingAction {
  candidateId: string
  action: 'accept' | 'edit' | 'reject'
}

export const useGenerationStore = defineStore('generation', () => {
  const eventId = ref<number | null>(null)
  const candidates = ref<CandidateWithStatus[]>([])
  const editDialogVisible = ref(false)
  const confirmDialogVisible = ref(false)
  const candidateBeingEdited = ref<CandidateWithStatus | null>(null)
  const pendingAction = ref<PendingAction | null>(null)

  const reviewStats = computed(() => {
    const accepted = candidates.value.filter((c) => c.status === 'accepted').length
    const edited = candidates.value.filter((c) => c.status === 'edited').length
    const rejected = candidates.value.filter((c) => c.status === 'rejected').length
    const pending = candidates.value.filter((c) => c.status === 'pending').length

    return { accepted, edited, rejected, pending }
  })

  const hasAnyAction = computed(() => {
    return candidates.value.some((c) => c.status !== 'pending')
  })

  const acceptedCandidates = computed(() => {
    return candidates.value.filter((c) => c.status === 'accepted')
  })

  const editedCandidates = computed(() => {
    return candidates.value.filter((c) => c.status === 'edited')
  })

  const rejectedCount = computed(() => {
    return candidates.value.filter((c) => c.status === 'rejected').length
  })

  const canFinishReview = computed(() => {
    return candidates.value.length > 0 && candidates.value.every((c) => c.status !== 'pending')
  })

  function initializeReview(generationEventId: number, generatedCandidates: FlashcardCandidate[]) {
    eventId.value = generationEventId
    candidates.value = generatedCandidates.map((c) => ({
      ...c,
      status: 'pending' as CandidateStatus,
    }))
  }

  function requestAccept(candidateId: string) {
    pendingAction.value = { candidateId, action: 'accept' }
    confirmDialogVisible.value = true
  }

  function requestEdit(candidateId: string) {
    const candidate = candidates.value.find((c) => c.candidateId === candidateId)
    if (candidate) {
      candidateBeingEdited.value = candidate
      editDialogVisible.value = true
    }
  }

  function requestReject(candidateId: string) {
    pendingAction.value = { candidateId, action: 'reject' }
    confirmDialogVisible.value = true
  }

  function confirmAction() {
    if (!pendingAction.value) return

    const { candidateId, action } = pendingAction.value

    if (action === 'accept') {
      updateCandidateStatus(candidateId, 'accepted')
    } else if (action === 'edit') {
      updateCandidateStatus(candidateId, 'edited')
    } else if (action === 'reject') {
      updateCandidateStatus(candidateId, 'rejected')
    }

    pendingAction.value = null
    confirmDialogVisible.value = false
  }

  function cancelAction() {
    pendingAction.value = null
    confirmDialogVisible.value = false
  }

  function saveEdit(candidateId: string, editedData: { question: string; answer: string }) {
    const candidate = candidates.value.find((c) => c.candidateId === candidateId)
    if (candidate) {
      if (!candidate.originalQuestion) {
        candidate.originalQuestion = candidate.question
        candidate.originalAnswer = candidate.answer
      }
      candidate.question = editedData.question
      candidate.answer = editedData.answer
    }

    editDialogVisible.value = false
    candidateBeingEdited.value = null

    pendingAction.value = { candidateId, action: 'edit' }
    confirmDialogVisible.value = true
  }

  function updateCandidateStatus(candidateId: string, status: CandidateStatus) {
    const candidate = candidates.value.find((c) => c.candidateId === candidateId)
    if (candidate) {
      candidate.status = status
    }
  }

  function buildReviewRequest(): CompleteReviewRequest {
    const accepted = acceptedCandidates.value.map((c) => ({
      candidateId: c.candidateId,
      question: c.question,
      answer: c.answer,
    }))

    const edited = editedCandidates.value.map((c) => ({
      candidateId: c.candidateId,
      question: c.question,
      answer: c.answer,
    }))

    return { accepted, edited }
  }

  function resetStore() {
    eventId.value = null
    candidates.value = []
    editDialogVisible.value = false
    confirmDialogVisible.value = false
    candidateBeingEdited.value = null
    pendingAction.value = null
  }

  return {
    eventId,
    candidates,
    editDialogVisible,
    confirmDialogVisible,
    candidateBeingEdited,
    pendingAction,
    reviewStats,
    hasAnyAction,
    acceptedCandidates,
    editedCandidates,
    rejectedCount,
    canFinishReview,
    initializeReview,
    requestAccept,
    requestEdit,
    requestReject,
    confirmAction,
    cancelAction,
    saveEdit,
    updateCandidateStatus,
    buildReviewRequest,
    resetStore,
  }
})
