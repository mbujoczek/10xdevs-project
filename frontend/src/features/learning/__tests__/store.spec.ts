import * as learningApi from '@/api/learning.api'
import { FlashcardSource, FlashcardStatus, SRSGrade } from '@/types/enums'
import type { Flashcard } from '@/types/flashcards.types'
import type { DueFlashcardsResponse, RateFlashcardResponse } from '@/types/learning.types'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLearningStore } from '../store'

vi.mock('@/api/learning.api')

describe('useLearningStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have empty dueFlashcards array initially', () => {
      const store = useLearningStore()

      expect(store.dueFlashcards).toEqual([])
    })

    it('should have totalDueCount of 0 initially', () => {
      const store = useLearningStore()

      expect(store.totalDueCount).toBe(0)
    })

    it('should have null sessionStatistics initially', () => {
      const store = useLearningStore()

      expect(store.sessionStatistics).toBeNull()
    })

    it('should have isSessionActive false initially', () => {
      const store = useLearningStore()

      expect(store.isSessionActive).toBe(false)
    })

    it('should have initialSessionCount of 0 initially', () => {
      const store = useLearningStore()

      expect(store.initialSessionCount).toBe(0)
    })
  })

  describe('computed: hasDueFlashcards', () => {
    it('should return false when totalDueCount is 0', () => {
      const store = useLearningStore()

      expect(store.hasDueFlashcards).toBe(false)
    })

    it('should return true when totalDueCount is greater than 0', () => {
      const store = useLearningStore()
      store.totalDueCount = 5

      expect(store.hasDueFlashcards).toBe(true)
    })

    it('should update reactively when totalDueCount changes', () => {
      const store = useLearningStore()

      expect(store.hasDueFlashcards).toBe(false)

      store.totalDueCount = 1
      expect(store.hasDueFlashcards).toBe(true)

      store.totalDueCount = 0
      expect(store.hasDueFlashcards).toBe(false)
    })
  })

  describe('computed: currentFlashcard', () => {
    it('should return undefined when dueFlashcards is empty', () => {
      const store = useLearningStore()

      expect(store.currentFlashcard).toBeUndefined()
    })

    it('should return first flashcard when dueFlashcards has items', () => {
      const store = useLearningStore()
      const flashcards = createFlashcards(3)
      store.dueFlashcards = flashcards

      expect(store.currentFlashcard).toStrictEqual(flashcards[0])
    })

    it('should return first flashcard even with multiple flashcards', () => {
      const store = useLearningStore()
      const flashcards = createFlashcards(10)
      store.dueFlashcards = flashcards

      expect(store.currentFlashcard).toStrictEqual(flashcards[0])
      expect(store.currentFlashcard?.id).toBe(1)
    })

    it('should update when dueFlashcards changes', () => {
      const store = useLearningStore()
      const flashcards = createFlashcards(3)
      store.dueFlashcards = flashcards

      expect(store.currentFlashcard?.id).toBe(1)

      store.dueFlashcards = flashcards.slice(1)
      expect(store.currentFlashcard?.id).toBe(2)
    })
  })

  describe('getDueFlashcards', () => {
    it('should fetch and set due flashcards', async () => {
      const store = useLearningStore()
      const mockResponse: DueFlashcardsResponse = {
        flashcards: createFlashcards(5),
        totalDueCount: 5,
      }

      vi.mocked(learningApi.getDueFlashcards).mockResolvedValue(mockResponse)

      await store.getDueFlashcards()

      expect(store.dueFlashcards).toEqual(mockResponse.flashcards)
      expect(store.totalDueCount).toBe(5)
      expect(learningApi.getDueFlashcards).toHaveBeenCalledOnce()
    })

    it('should handle empty response', async () => {
      const store = useLearningStore()
      const mockResponse: DueFlashcardsResponse = {
        flashcards: [],
        totalDueCount: 0,
      }

      vi.mocked(learningApi.getDueFlashcards).mockResolvedValue(mockResponse)

      await store.getDueFlashcards()

      expect(store.dueFlashcards).toEqual([])
      expect(store.totalDueCount).toBe(0)
    })

    it('should update existing flashcards', async () => {
      const store = useLearningStore()
      store.dueFlashcards = createFlashcards(3)
      store.totalDueCount = 3

      const newMockResponse: DueFlashcardsResponse = {
        flashcards: createFlashcards(7),
        totalDueCount: 7,
      }

      vi.mocked(learningApi.getDueFlashcards).mockResolvedValue(newMockResponse)

      await store.getDueFlashcards()

      expect(store.dueFlashcards).toHaveLength(7)
      expect(store.totalDueCount).toBe(7)
    })

    it('should propagate API errors', async () => {
      const store = useLearningStore()
      const error = new Error('API Error')

      vi.mocked(learningApi.getDueFlashcards).mockRejectedValue(error)

      await expect(store.getDueFlashcards()).rejects.toThrow('API Error')
    })
  })

  describe('startSession', () => {
    it('should set isSessionActive to true', () => {
      const store = useLearningStore()
      store.dueFlashcards = createFlashcards(5)

      store.startSession()

      expect(store.isSessionActive).toBe(true)
    })

    it('should set initialSessionCount to current flashcards length', () => {
      const store = useLearningStore()
      store.dueFlashcards = createFlashcards(8)

      store.startSession()

      expect(store.initialSessionCount).toBe(8)
    })

    it('should initialize sessionStatistics with correct structure', () => {
      const store = useLearningStore()
      store.dueFlashcards = createFlashcards(3)

      const beforeStart = Date.now()
      store.startSession()
      const afterStart = Date.now()

      expect(store.sessionStatistics).not.toBeNull()
      expect(store.sessionStatistics?.totalReviewed).toBe(0)
      expect(store.sessionStatistics?.sessionDurationMs).toBeGreaterThanOrEqual(beforeStart)
      expect(store.sessionStatistics?.sessionDurationMs).toBeLessThanOrEqual(afterStart)
    })

    it('should initialize rating distribution with all zeros', () => {
      const store = useLearningStore()
      store.dueFlashcards = createFlashcards(5)

      store.startSession()

      expect(store.sessionStatistics?.ratingDistribution).toEqual({
        [SRSGrade.CompleteBlackout]: 0,
        [SRSGrade.IncorrectResponse]: 0,
        [SRSGrade.IncorrectResponseRecalled]: 0,
        [SRSGrade.CorrectWithDifficulty]: 0,
        [SRSGrade.CorrectAfterHesitation]: 0,
        [SRSGrade.PerfectResponse]: 0,
      })
    })

    it('should work with empty flashcards array', () => {
      const store = useLearningStore()
      store.dueFlashcards = []

      store.startSession()

      expect(store.isSessionActive).toBe(true)
      expect(store.initialSessionCount).toBe(0)
      expect(store.sessionStatistics).not.toBeNull()
    })
  })

  describe('rateFlashcard', () => {
    it('should call API with correct parameters', async () => {
      const store = useLearningStore()
      const flashcards = createFlashcards(3)
      store.dueFlashcards = flashcards
      store.startSession()

      const mockResponse: RateFlashcardResponse = createMockRateResponse(1)
      vi.mocked(learningApi.rateFlashcard).mockResolvedValue(mockResponse)

      await store.rateFlashcard(1, SRSGrade.PerfectResponse)

      expect(learningApi.rateFlashcard).toHaveBeenCalledWith(1, {
        grade: SRSGrade.PerfectResponse,
      })
    })

    it('should remove rated flashcard from queue', async () => {
      const store = useLearningStore()
      const flashcards = createFlashcards(3)
      store.dueFlashcards = flashcards
      store.startSession()

      const mockResponse: RateFlashcardResponse = createMockRateResponse(1)
      vi.mocked(learningApi.rateFlashcard).mockResolvedValue(mockResponse)

      await store.rateFlashcard(1, SRSGrade.PerfectResponse)

      expect(store.dueFlashcards).toHaveLength(2)
      expect(store.dueFlashcards.find((f) => f.id === 1)).toBeUndefined()
    })

    it('should decrement totalDueCount', async () => {
      const store = useLearningStore()
      const flashcards = createFlashcards(5)
      store.dueFlashcards = flashcards
      store.totalDueCount = 5
      store.startSession()

      const mockResponse: RateFlashcardResponse = createMockRateResponse(1)
      vi.mocked(learningApi.rateFlashcard).mockResolvedValue(mockResponse)

      await store.rateFlashcard(1, SRSGrade.CorrectAfterHesitation)

      expect(store.totalDueCount).toBe(4)
    })

    it('should not go below 0 for totalDueCount', async () => {
      const store = useLearningStore()
      const flashcards = createFlashcards(1)
      store.dueFlashcards = flashcards
      store.totalDueCount = 1
      store.startSession()

      const mockResponse: RateFlashcardResponse = createMockRateResponse(1)
      vi.mocked(learningApi.rateFlashcard).mockResolvedValue(mockResponse)

      await store.rateFlashcard(1, SRSGrade.PerfectResponse)

      expect(store.totalDueCount).toBe(0)
    })

    it('should increment totalReviewed in sessionStatistics', async () => {
      const store = useLearningStore()
      const flashcards = createFlashcards(3)
      store.dueFlashcards = flashcards
      store.startSession()

      const mockResponse: RateFlashcardResponse = createMockRateResponse(1)
      vi.mocked(learningApi.rateFlashcard).mockResolvedValue(mockResponse)

      await store.rateFlashcard(1, SRSGrade.PerfectResponse)

      expect(store.sessionStatistics?.totalReviewed).toBe(1)
    })

    it('should update rating distribution correctly', async () => {
      const store = useLearningStore()
      const flashcards = createFlashcards(3)
      store.dueFlashcards = flashcards
      store.startSession()

      const mockResponse: RateFlashcardResponse = createMockRateResponse(1)
      vi.mocked(learningApi.rateFlashcard).mockResolvedValue(mockResponse)

      await store.rateFlashcard(1, SRSGrade.PerfectResponse)

      expect(store.sessionStatistics?.ratingDistribution[SRSGrade.PerfectResponse]).toBe(1)
      expect(store.sessionStatistics?.ratingDistribution[SRSGrade.CompleteBlackout]).toBe(0)
    })

    it('should accumulate ratings for same grade', async () => {
      const store = useLearningStore()
      const flashcards = createFlashcards(3)
      store.dueFlashcards = flashcards
      store.startSession()

      const mockResponse1: RateFlashcardResponse = createMockRateResponse(1)
      const mockResponse2: RateFlashcardResponse = createMockRateResponse(2)
      vi.mocked(learningApi.rateFlashcard)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)

      await store.rateFlashcard(1, SRSGrade.CorrectAfterHesitation)
      await store.rateFlashcard(2, SRSGrade.CorrectAfterHesitation)

      expect(store.sessionStatistics?.ratingDistribution[SRSGrade.CorrectAfterHesitation]).toBe(2)
      expect(store.sessionStatistics?.totalReviewed).toBe(2)
    })

    it('should track different grades separately', async () => {
      const store = useLearningStore()
      const flashcards = createFlashcards(6)
      store.dueFlashcards = flashcards
      store.startSession()

      vi.mocked(learningApi.rateFlashcard).mockImplementation((id) =>
        Promise.resolve(createMockRateResponse(id)),
      )

      await store.rateFlashcard(1, SRSGrade.CompleteBlackout)
      await store.rateFlashcard(2, SRSGrade.IncorrectResponse)
      await store.rateFlashcard(3, SRSGrade.CorrectWithDifficulty)

      expect(store.sessionStatistics?.ratingDistribution[SRSGrade.CompleteBlackout]).toBe(1)
      expect(store.sessionStatistics?.ratingDistribution[SRSGrade.IncorrectResponse]).toBe(1)
      expect(store.sessionStatistics?.ratingDistribution[SRSGrade.CorrectWithDifficulty]).toBe(1)
      expect(store.sessionStatistics?.totalReviewed).toBe(3)
    })

    it('should return API response', async () => {
      const store = useLearningStore()
      const flashcards = createFlashcards(1)
      store.dueFlashcards = flashcards
      store.startSession()

      const mockResponse: RateFlashcardResponse = createMockRateResponse(1)
      vi.mocked(learningApi.rateFlashcard).mockResolvedValue(mockResponse)

      const result = await store.rateFlashcard(1, SRSGrade.PerfectResponse)

      expect(result).toEqual(mockResponse)
    })

    it('should propagate API errors', async () => {
      const store = useLearningStore()
      const flashcards = createFlashcards(1)
      store.dueFlashcards = flashcards
      store.startSession()

      const error = new Error('Rating failed')
      vi.mocked(learningApi.rateFlashcard).mockRejectedValue(error)

      await expect(store.rateFlashcard(1, SRSGrade.PerfectResponse)).rejects.toThrow(
        'Rating failed',
      )
    })
  })

  describe('endSession', () => {
    it('should set isSessionActive to false', () => {
      const store = useLearningStore()
      store.startSession()

      store.endSession()

      expect(store.isSessionActive).toBe(false)
    })

    it('should calculate session duration', () => {
      const store = useLearningStore()
      store.startSession()
      store.endSession()

      const duration = store.sessionStatistics!.sessionDurationMs!
      expect(duration).toBeGreaterThanOrEqual(0)
      expect(duration).toBeLessThan(1000) // Less than 1 second for test
    })

    it('should return session statistics', () => {
      const store = useLearningStore()
      store.dueFlashcards = createFlashcards(3)
      store.startSession()

      const result = store.endSession()

      expect(result).not.toBeNull()
      expect(result).toBe(store.sessionStatistics)
    })

    it('should preserve session statistics after ending', () => {
      const store = useLearningStore()
      store.dueFlashcards = createFlashcards(3)
      store.startSession()

      const statsBefore = store.sessionStatistics
      store.endSession()

      expect(store.sessionStatistics).toBe(statsBefore)
    })

    it('should return null if no session was started', () => {
      const store = useLearningStore()

      const result = store.endSession()

      expect(result).toBeNull()
    })
  })

  describe('resetSessionStatistics', () => {
    it('should reset sessionStatistics to null', () => {
      const store = useLearningStore()
      store.startSession()

      store.resetSessionStatistics()

      expect(store.sessionStatistics).toBeNull()
    })

    it('should reset initialSessionCount to 0', () => {
      const store = useLearningStore()
      store.dueFlashcards = createFlashcards(5)
      store.startSession()

      store.resetSessionStatistics()

      expect(store.initialSessionCount).toBe(0)
    })

    it('should not affect other state', () => {
      const store = useLearningStore()
      store.dueFlashcards = createFlashcards(3)
      store.totalDueCount = 3
      store.startSession()

      store.resetSessionStatistics()

      expect(store.dueFlashcards).toHaveLength(3)
      expect(store.totalDueCount).toBe(3)
    })
  })

  describe('resetLearningState', () => {
    it('should reset all state to initial values', () => {
      const store = useLearningStore()
      store.dueFlashcards = createFlashcards(5)
      store.totalDueCount = 5
      store.startSession()

      store.resetLearningState()

      expect(store.dueFlashcards).toEqual([])
      expect(store.totalDueCount).toBe(0)
      expect(store.sessionStatistics).toBeNull()
      expect(store.isSessionActive).toBe(false)
      expect(store.initialSessionCount).toBe(0)
    })
  })

  describe('complete session flow', () => {
    it('should handle complete learning session', async () => {
      const store = useLearningStore()

      // Fetch flashcards
      const mockResponse: DueFlashcardsResponse = {
        flashcards: createFlashcards(3),
        totalDueCount: 3,
      }
      vi.mocked(learningApi.getDueFlashcards).mockResolvedValue(mockResponse)
      await store.getDueFlashcards()

      expect(store.hasDueFlashcards).toBe(true)
      expect(store.currentFlashcard?.id).toBe(1)

      // Start session
      store.startSession()
      expect(store.isSessionActive).toBe(true)
      expect(store.initialSessionCount).toBe(3)

      // Rate all flashcards
      vi.mocked(learningApi.rateFlashcard).mockImplementation((id) =>
        Promise.resolve(createMockRateResponse(id)),
      )

      await store.rateFlashcard(1, SRSGrade.PerfectResponse)
      expect(store.currentFlashcard?.id).toBe(2)
      expect(store.sessionStatistics?.totalReviewed).toBe(1)

      await store.rateFlashcard(2, SRSGrade.CorrectAfterHesitation)
      expect(store.currentFlashcard?.id).toBe(3)
      expect(store.sessionStatistics?.totalReviewed).toBe(2)

      await store.rateFlashcard(3, SRSGrade.CorrectWithDifficulty)
      expect(store.currentFlashcard).toBeUndefined()
      expect(store.hasDueFlashcards).toBe(false)
      expect(store.sessionStatistics?.totalReviewed).toBe(3)

      // End session
      const stats = store.endSession()
      expect(stats).not.toBeNull()
      expect(stats?.totalReviewed).toBe(3)
      expect(store.isSessionActive).toBe(false)
    })
  })

  // Helper functions
  function createFlashcards(count: number): Flashcard[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      question: `Question ${i + 1}`,
      answer: `Answer ${i + 1}`,
      source: FlashcardSource.Manual,
      status: FlashcardStatus.NotApplicable,
      srsInterval: 1,
      srsRepetitions: 0,
      srsEaseFactor: 2.5,
      srsNextRepetitionDate: new Date().toISOString(),
      srsLastGrade: null,
      createdAtUtc: new Date().toISOString(),
      updatedAtUtc: new Date().toISOString(),
    }))
  }

  function createMockRateResponse(id: number): RateFlashcardResponse {
    return {
      id,
      srsInterval: 6,
      srsRepetitions: 1,
      srsEaseFactor: 2.5,
      srsNextRepetitionDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      srsLastGrade: SRSGrade.PerfectResponse,
      updatedAtUtc: new Date().toISOString(),
    }
  }
})
