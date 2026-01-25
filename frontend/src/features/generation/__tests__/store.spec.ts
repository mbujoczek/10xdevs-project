import type { FlashcardCandidate } from '@/types/flashcards.types'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGenerationStore } from '../store'

describe('useGenerationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should have null eventId initially', () => {
      const store = useGenerationStore()

      expect(store.eventId).toBeNull()
    })

    it('should have empty candidates array initially', () => {
      const store = useGenerationStore()

      expect(store.candidates).toEqual([])
    })

    it('should have dialogs closed initially', () => {
      const store = useGenerationStore()

      expect(store.editDialogVisible).toBe(false)
      expect(store.confirmDialogVisible).toBe(false)
    })

    it('should have no candidate being edited initially', () => {
      const store = useGenerationStore()

      expect(store.candidateBeingEdited).toBeNull()
    })

    it('should have no pending action initially', () => {
      const store = useGenerationStore()

      expect(store.pendingAction).toBeNull()
    })
  })

  describe('initializeReview', () => {
    it('should set eventId and candidates', () => {
      const store = useGenerationStore()
      const eventId = 123
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
        { candidateId: 'temp-2', question: 'Q2', answer: 'A2' },
      ]

      store.initializeReview(eventId, candidates)

      expect(store.eventId).toBe(123)
      expect(store.candidates).toHaveLength(2)
    })

    it('should initialize all candidates with pending status', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
        { candidateId: 'temp-2', question: 'Q2', answer: 'A2' },
      ]

      store.initializeReview(456, candidates)

      expect(store.candidates[0]!.status).toBe('pending')
      expect(store.candidates[1]!.status).toBe('pending')
    })

    it('should handle empty candidates array', () => {
      const store = useGenerationStore()

      store.initializeReview(789, [])

      expect(store.eventId).toBe(789)
      expect(store.candidates).toEqual([])
    })

    it('should replace previous review data', () => {
      const store = useGenerationStore()
      const firstCandidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
      ]
      const secondCandidates: FlashcardCandidate[] = [
        { candidateId: 'temp-3', question: 'Q3', answer: 'A3' },
        { candidateId: 'temp-4', question: 'Q4', answer: 'A4' },
      ]

      store.initializeReview(100, firstCandidates)
      store.initializeReview(200, secondCandidates)

      expect(store.eventId).toBe(200)
      expect(store.candidates).toHaveLength(2)
      expect(store.candidates[0]!.candidateId).toBe('temp-3')
    })
  })

  describe('reviewStats computed', () => {
    it('should calculate stats with all pending', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
        { candidateId: 'temp-2', question: 'Q2', answer: 'A2' },
        { candidateId: 'temp-3', question: 'Q3', answer: 'A3' },
      ]

      store.initializeReview(1, candidates)

      expect(store.reviewStats).toEqual({
        accepted: 0,
        edited: 0,
        rejected: 0,
        pending: 3,
      })
    })

    it('should calculate stats with mixed statuses', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
        { candidateId: 'temp-2', question: 'Q2', answer: 'A2' },
        { candidateId: 'temp-3', question: 'Q3', answer: 'A3' },
        { candidateId: 'temp-4', question: 'Q4', answer: 'A4' },
      ]

      store.initializeReview(1, candidates)

      // Simulate actions
      store.candidates[0]!.status = 'accepted'
      store.candidates[1]!.status = 'edited'
      store.candidates[2]!.status = 'rejected'

      expect(store.reviewStats).toEqual({
        accepted: 1,
        edited: 1,
        rejected: 1,
        pending: 1,
      })
    })

    it('should calculate stats with all processed', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
        { candidateId: 'temp-2', question: 'Q2', answer: 'A2' },
      ]

      store.initializeReview(1, candidates)
      store.candidates[0]!.status = 'accepted'
      store.candidates[1]!.status = 'rejected'

      expect(store.reviewStats).toEqual({
        accepted: 1,
        edited: 0,
        rejected: 1,
        pending: 0,
      })
    })
  })

  describe('hasAnyAction computed', () => {
    it('should return false when all candidates are pending', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
        { candidateId: 'temp-2', question: 'Q2', answer: 'A2' },
      ]

      store.initializeReview(1, candidates)

      expect(store.hasAnyAction).toBe(false)
    })

    it('should return true when at least one candidate is processed', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
        { candidateId: 'temp-2', question: 'Q2', answer: 'A2' },
      ]

      store.initializeReview(1, candidates)
      store.candidates[0]!.status = 'accepted'

      expect(store.hasAnyAction).toBe(true)
    })
  })

  describe('acceptedCandidates computed', () => {
    it('should return only accepted candidates', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
        { candidateId: 'temp-2', question: 'Q2', answer: 'A2' },
        { candidateId: 'temp-3', question: 'Q3', answer: 'A3' },
      ]

      store.initializeReview(1, candidates)
      store.candidates[0]!.status = 'accepted'
      store.candidates[1]!.status = 'rejected'
      store.candidates[2]!.status = 'accepted'

      const accepted = store.acceptedCandidates

      expect(accepted).toHaveLength(2)
      expect(accepted[0]!.candidateId).toBe('temp-1')
      expect(accepted[1]!.candidateId).toBe('temp-3')
    })

    it('should return empty array when no accepted candidates', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
      ]

      store.initializeReview(1, candidates)
      store.candidates[0]!.status = 'rejected'

      expect(store.acceptedCandidates).toEqual([])
    })
  })

  describe('editedCandidates computed', () => {
    it('should return only edited candidates', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
        { candidateId: 'temp-2', question: 'Q2', answer: 'A2' },
        { candidateId: 'temp-3', question: 'Q3', answer: 'A3' },
      ]

      store.initializeReview(1, candidates)
      store.candidates[0]!.status = 'edited'
      store.candidates[1]!.status = 'accepted'
      store.candidates[2]!.status = 'edited'

      const edited = store.editedCandidates

      expect(edited).toHaveLength(2)
      expect(edited[0]!.candidateId).toBe('temp-1')
      expect(edited[1]!.candidateId).toBe('temp-3')
    })
  })

  describe('rejectedCount computed', () => {
    it('should count rejected candidates', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
        { candidateId: 'temp-2', question: 'Q2', answer: 'A2' },
        { candidateId: 'temp-3', question: 'Q3', answer: 'A3' },
      ]

      store.initializeReview(1, candidates)
      store.candidates[0]!.status = 'rejected'
      store.candidates[1]!.status = 'accepted'
      store.candidates[2]!.status = 'rejected'

      expect(store.rejectedCount).toBe(2)
    })

    it('should return 0 when no rejected candidates', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
      ]

      store.initializeReview(1, candidates)
      store.candidates[0]!.status = 'accepted'

      expect(store.rejectedCount).toBe(0)
    })
  })

  describe('canFinishReview computed', () => {
    it('should return false when candidates are empty', () => {
      const store = useGenerationStore()

      store.initializeReview(1, [])

      expect(store.canFinishReview).toBe(false)
    })

    it('should return false when some candidates are pending', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
        { candidateId: 'temp-2', question: 'Q2', answer: 'A2' },
      ]

      store.initializeReview(1, candidates)
      store.candidates[0]!.status = 'accepted'

      expect(store.canFinishReview).toBe(false)
    })

    it('should return true when all candidates are processed', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
        { candidateId: 'temp-2', question: 'Q2', answer: 'A2' },
      ]

      store.initializeReview(1, candidates)
      store.candidates[0]!.status = 'accepted'
      store.candidates[1]!.status = 'rejected'

      expect(store.canFinishReview).toBe(true)
    })
  })

  describe('requestAccept', () => {
    it('should set pending action and open confirm dialog', () => {
      const store = useGenerationStore()

      store.requestAccept('temp-1')

      expect(store.pendingAction).toEqual({ candidateId: 'temp-1', action: 'accept' })
      expect(store.confirmDialogVisible).toBe(true)
    })
  })

  describe('requestEdit', () => {
    it('should set candidate being edited and open edit dialog', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
      ]

      store.initializeReview(1, candidates)
      store.requestEdit('temp-1')

      expect(store.candidateBeingEdited).toEqual({
        candidateId: 'temp-1',
        question: 'Q1',
        answer: 'A1',
        status: 'pending',
      })
      expect(store.editDialogVisible).toBe(true)
    })

    it('should not open dialog when candidate not found', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
      ]

      store.initializeReview(1, candidates)
      store.requestEdit('temp-999')

      expect(store.editDialogVisible).toBe(false)
      expect(store.candidateBeingEdited).toBeNull()
    })
  })

  describe('requestReject', () => {
    it('should set pending action and open confirm dialog', () => {
      const store = useGenerationStore()

      store.requestReject('temp-1')

      expect(store.pendingAction).toEqual({ candidateId: 'temp-1', action: 'reject' })
      expect(store.confirmDialogVisible).toBe(true)
    })
  })

  describe('confirmAction', () => {
    it('should update status to accepted when action is accept', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
      ]

      store.initializeReview(1, candidates)
      store.requestAccept('temp-1')
      store.confirmAction()

      expect(store.candidates[0]!.status).toBe('accepted')
      expect(store.pendingAction).toBeNull()
      expect(store.confirmDialogVisible).toBe(false)
    })

    it('should update status to rejected when action is reject', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
      ]

      store.initializeReview(1, candidates)
      store.requestReject('temp-1')
      store.confirmAction()

      expect(store.candidates[0]!.status).toBe('rejected')
      expect(store.pendingAction).toBeNull()
      expect(store.confirmDialogVisible).toBe(false)
    })

    it('should not crash when pendingAction is null', () => {
      const store = useGenerationStore()

      expect(() => store.confirmAction()).not.toThrow()
      expect(store.confirmDialogVisible).toBe(false)
    })
  })

  describe('cancelAction', () => {
    it('should clear pending action and close confirm dialog', () => {
      const store = useGenerationStore()

      store.requestAccept('temp-1')
      store.cancelAction()

      expect(store.pendingAction).toBeNull()
      expect(store.confirmDialogVisible).toBe(false)
    })
  })

  describe('saveEdit', () => {
    it('should update candidate question and answer', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Original Q', answer: 'Original A' },
      ]

      store.initializeReview(1, candidates)
      store.saveEdit('temp-1', { question: 'Edited Q', answer: 'Edited A' })

      expect(store.candidates[0]!.question).toBe('Edited Q')
      expect(store.candidates[0]!.answer).toBe('Edited A')
    })

    it('should store original values on first edit', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Original Q', answer: 'Original A' },
      ]

      store.initializeReview(1, candidates)
      store.saveEdit('temp-1', { question: 'Edited Q', answer: 'Edited A' })

      expect(store.candidates[0]!.originalQuestion).toBe('Original Q')
      expect(store.candidates[0]!.originalAnswer).toBe('Original A')
    })

    it('should not overwrite original values on second edit', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Original Q', answer: 'Original A' },
      ]

      store.initializeReview(1, candidates)
      store.saveEdit('temp-1', { question: 'Edit 1', answer: 'Answer 1' })
      store.saveEdit('temp-1', { question: 'Edit 2', answer: 'Answer 2' })

      expect(store.candidates[0]!.originalQuestion).toBe('Original Q')
      expect(store.candidates[0]!.originalAnswer).toBe('Original A')
      expect(store.candidates[0]!.question).toBe('Edit 2')
      expect(store.candidates[0]!.answer).toBe('Answer 2')
    })

    it('should close edit dialog and open confirm dialog', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q', answer: 'A' },
      ]

      store.initializeReview(1, candidates)
      store.requestEdit('temp-1')
      store.saveEdit('temp-1', { question: 'New Q', answer: 'New A' })

      expect(store.editDialogVisible).toBe(false)
      expect(store.candidateBeingEdited).toBeNull()
      expect(store.confirmDialogVisible).toBe(true)
      expect(store.pendingAction).toEqual({ candidateId: 'temp-1', action: 'edit' })
    })
  })

  describe('buildReviewRequest', () => {
    it('should build request with accepted and edited candidates', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
        { candidateId: 'temp-2', question: 'Q2', answer: 'A2' },
        { candidateId: 'temp-3', question: 'Q3', answer: 'A3' },
      ]

      store.initializeReview(1, candidates)
      store.candidates[0]!.status = 'accepted'
      store.candidates[1]!.status = 'edited'
      store.candidates[1]!.question = 'Q2 edited'
      store.candidates[2]!.status = 'rejected'

      const request = store.buildReviewRequest()

      expect(request.accepted).toHaveLength(1)
      expect(request.accepted[0]).toEqual({
        candidateId: 'temp-1',
        question: 'Q1',
        answer: 'A1',
      })

      expect(request.edited).toHaveLength(1)
      expect(request.edited[0]).toEqual({
        candidateId: 'temp-2',
        question: 'Q2 edited',
        answer: 'A2',
      })
    })

    it('should return empty arrays when no candidates accepted or edited', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
      ]

      store.initializeReview(1, candidates)
      store.candidates[0]!.status = 'rejected'

      const request = store.buildReviewRequest()

      expect(request.accepted).toEqual([])
      expect(request.edited).toEqual([])
    })
  })

  describe('resetStore', () => {
    it('should reset all state to initial values', () => {
      const store = useGenerationStore()
      const candidates: FlashcardCandidate[] = [
        { candidateId: 'temp-1', question: 'Q1', answer: 'A1' },
      ]

      store.initializeReview(1, candidates)
      store.requestEdit('temp-1')
      store.requestAccept('temp-1')

      store.resetStore()

      expect(store.eventId).toBeNull()
      expect(store.candidates).toEqual([])
      expect(store.editDialogVisible).toBe(false)
      expect(store.confirmDialogVisible).toBe(false)
      expect(store.candidateBeingEdited).toBeNull()
      expect(store.pendingAction).toBeNull()
    })
  })
})
