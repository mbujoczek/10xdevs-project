import { FlashcardSource, FlashcardStatus } from '@/types'
import type {
  CompleteReviewRequest,
  CompleteReviewResponse,
  CreateFlashcardRequest,
  Flashcard,
  GenerateFlashcardsRequest,
  GenerateFlashcardsResponse,
  ListFlashcardsResponse,
  UpdateFlashcardRequest,
} from '@/types/flashcards.types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../axios'
import * as flashcardsApi from '../flashcards.api'

vi.mock('../axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('flashcards.api - generateFlashcardsFromText', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('successful scenarios', () => {
    it('should send correct request payload and return response', async () => {
      const request: GenerateFlashcardsRequest = {
        inputText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        language: 'en',
      }

      const mockResponse: GenerateFlashcardsResponse = {
        generationEventId: 123,
        candidates: [
          { candidateId: 'temp-1', question: 'Question 1', answer: 'Answer 1' },
          { candidateId: 'temp-2', question: 'Question 2', answer: 'Answer 2' },
        ],
        cadidatesCount: 2,
        createdAtUtc: '2026-01-25T10:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockResponse })

      const result = await flashcardsApi.generateFlashcardsFromText(request)

      expect(api.post).toHaveBeenCalledWith('/flashcards/generate', request)
      expect(result).toEqual(mockResponse)
      expect(result.generationEventId).toBe(123)
      expect(result.candidates).toHaveLength(2)
    })

    it('should handle Polish language', async () => {
      const request: GenerateFlashcardsRequest = {
        inputText: 'Tekst po polsku z wystarczającą ilością znaków do przetworzenia.',
        language: 'pl',
      }

      const mockResponse: GenerateFlashcardsResponse = {
        generationEventId: 456,
        candidates: [],
        cadidatesCount: 0,
        createdAtUtc: '2026-01-25T10:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockResponse })

      const result = await flashcardsApi.generateFlashcardsFromText(request)

      expect(api.post).toHaveBeenCalledWith('/flashcards/generate', request)
      expect(result.generationEventId).toBe(456)
    })

    it('should handle request without language (undefined)', async () => {
      const request: GenerateFlashcardsRequest = {
        inputText: 'Text without explicit language parameter, should use backend default.',
      }

      const mockResponse: GenerateFlashcardsResponse = {
        generationEventId: 789,
        candidates: [],
        cadidatesCount: 0,
        createdAtUtc: '2026-01-25T10:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockResponse })

      const result = await flashcardsApi.generateFlashcardsFromText(request)

      expect(api.post).toHaveBeenCalledWith('/flashcards/generate', request)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('edge cases', () => {
    it('should handle empty candidates array', async () => {
      const request: GenerateFlashcardsRequest = {
        inputText: 'Short text that generates no flashcards for some reason.',
        language: 'en',
      }

      const mockResponse: GenerateFlashcardsResponse = {
        generationEventId: 111,
        candidates: [],
        cadidatesCount: 0,
        createdAtUtc: '2026-01-25T10:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockResponse })

      const result = await flashcardsApi.generateFlashcardsFromText(request)

      expect(result.candidates).toEqual([])
      expect(result.cadidatesCount).toBe(0)
    })

    it('should handle large input text', async () => {
      const largeText = 'Lorem ipsum dolor sit amet. '.repeat(300) // ~8400 chars

      const request: GenerateFlashcardsRequest = {
        inputText: largeText,
        language: 'en',
      }

      const mockResponse: GenerateFlashcardsResponse = {
        generationEventId: 999,
        candidates: Array.from({ length: 15 }, (_, i) => ({
          candidateId: `temp-${i + 1}`,
          question: `Question ${i + 1}`,
          answer: `Answer ${i + 1}`,
        })),
        cadidatesCount: 15,
        createdAtUtc: '2026-01-25T10:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockResponse })

      const result = await flashcardsApi.generateFlashcardsFromText(request)

      expect(result.candidates).toHaveLength(15)
      expect(api.post).toHaveBeenCalledWith('/flashcards/generate', {
        inputText: largeText,
        language: 'en',
      })
    })
  })

  describe('error handling', () => {
    it('should throw error on 400 Bad Request', async () => {
      const request: GenerateFlashcardsRequest = {
        inputText: 'Valid text',
        language: 'en',
      }

      const error = {
        response: {
          status: 400,
          data: { message: 'Invalid input text' },
        },
      }

      vi.mocked(api.post).mockRejectedValue(error)

      await expect(flashcardsApi.generateFlashcardsFromText(request)).rejects.toEqual(error)
    })

    it('should throw error on 401 Unauthorized', async () => {
      const request: GenerateFlashcardsRequest = {
        inputText: 'Valid text',
        language: 'en',
      }

      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      }

      vi.mocked(api.post).mockRejectedValue(error)

      await expect(flashcardsApi.generateFlashcardsFromText(request)).rejects.toEqual(error)
    })

    it('should throw error on 429 Rate Limit', async () => {
      const request: GenerateFlashcardsRequest = {
        inputText: 'Valid text',
        language: 'en',
      }

      const error = {
        response: {
          status: 429,
          data: { message: 'Too many requests' },
        },
      }

      vi.mocked(api.post).mockRejectedValue(error)

      await expect(flashcardsApi.generateFlashcardsFromText(request)).rejects.toEqual(error)
    })

    it('should throw error on 500 Server Error', async () => {
      const request: GenerateFlashcardsRequest = {
        inputText: 'Valid text',
        language: 'en',
      }

      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      }

      vi.mocked(api.post).mockRejectedValue(error)

      await expect(flashcardsApi.generateFlashcardsFromText(request)).rejects.toEqual(error)
    })

    it('should throw error on 503 Service Unavailable', async () => {
      const request: GenerateFlashcardsRequest = {
        inputText: 'Valid text',
        language: 'en',
      }

      const error = {
        response: {
          status: 503,
          data: { message: 'AI service unavailable' },
        },
      }

      vi.mocked(api.post).mockRejectedValue(error)

      await expect(flashcardsApi.generateFlashcardsFromText(request)).rejects.toEqual(error)
    })

    it('should throw error on network failure', async () => {
      const request: GenerateFlashcardsRequest = {
        inputText: 'Valid text',
        language: 'en',
      }

      const error = new Error('Network Error')

      vi.mocked(api.post).mockRejectedValue(error)

      await expect(flashcardsApi.generateFlashcardsFromText(request)).rejects.toThrow(
        'Network Error',
      )
    })
  })
})

describe('flashcards.api - completeFlashcardsReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should send complete review request with eventId', async () => {
    const eventId = 123
    const request: CompleteReviewRequest = {
      accepted: [{ candidateId: 'temp-1', question: 'Q1', answer: 'A1' }],
      edited: [{ candidateId: 'temp-2', question: 'Q2 edited', answer: 'A2 edited' }],
    }

    const mockResponse: CompleteReviewResponse = {
      savedFlashcardsCount: 2,
      acceptedCount: 1,
      editedCount: 1,
      rejectedCount: 0,
      flashcardIds: [1, 2],
    }

    vi.mocked(api.post).mockResolvedValue({ data: mockResponse })

    const result = await flashcardsApi.completeFlashcardsReview(eventId, request)

    expect(api.post).toHaveBeenCalledWith(`/flashcards/generation/${eventId}/complete`, request)
    expect(result).toEqual(mockResponse)
  })

  it('should handle error response from complete review', async () => {
    const eventId = 456
    const request: CompleteReviewRequest = {
      accepted: [],
      edited: [],
    }

    const error = {
      response: {
        status: 404,
        data: { message: 'Generation event not found' },
      },
    }

    vi.mocked(api.post).mockRejectedValue(error)

    await expect(flashcardsApi.completeFlashcardsReview(eventId, request)).rejects.toEqual(error)
  })
})

describe('flashcards.api - CRUD operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createManualFlashcard', () => {
    it('should create flashcard and return created entity', async () => {
      const request: CreateFlashcardRequest = {
        question: 'New Question',
        answer: 'New Answer',
      }

      const mockFlashcard: Flashcard = {
        id: 1,
        question: 'New Question',
        answer: 'New Answer',
        source: FlashcardSource.Manual,
        status: FlashcardStatus.NotApplicable,
        srsInterval: null,
        srsRepetitions: null,
        srsEaseFactor: null,
        srsNextRepetitionDate: null,
        srsLastGrade: null,
        createdAtUtc: '2026-01-25T10:00:00Z',
        updatedAtUtc: '2026-01-25T10:00:00Z',
      }

      vi.mocked(api.post).mockResolvedValue({ data: mockFlashcard })

      const result = await flashcardsApi.createManualFlashcard(request)

      expect(api.post).toHaveBeenCalledWith('/flashcards', request)
      expect(result).toEqual(mockFlashcard)
    })
  })

  describe('updateFlashcard', () => {
    it('should update flashcard and return updated entity', async () => {
      const id = 1
      const request: UpdateFlashcardRequest = {
        question: 'Updated Question',
        answer: 'Updated Answer',
      }

      const mockFlashcard: Flashcard = {
        id: 1,
        question: 'Updated Question',
        answer: 'Updated Answer',
        source: FlashcardSource.Manual,
        status: FlashcardStatus.NotApplicable,
        srsInterval: null,
        srsRepetitions: null,
        srsEaseFactor: null,
        srsNextRepetitionDate: null,
        srsLastGrade: null,
        createdAtUtc: '2026-01-25T10:00:00Z',
        updatedAtUtc: '2026-01-25T10:05:00Z',
      }

      vi.mocked(api.put).mockResolvedValue({ data: mockFlashcard })

      const result = await flashcardsApi.updateFlashcard(id, request)

      expect(api.put).toHaveBeenCalledWith(`/flashcards/${id}`, request)
      expect(result).toEqual(mockFlashcard)
    })
  })

  describe('deleteFlashcard', () => {
    it('should call delete endpoint with correct id', async () => {
      const id = 1

      vi.mocked(api.delete).mockResolvedValue({ data: undefined })

      await flashcardsApi.deleteFlashcard(id)

      expect(api.delete).toHaveBeenCalledWith(`/flashcards/${id}`)
    })
  })

  describe('getFlashcard', () => {
    it('should fetch single flashcard by id', async () => {
      const id = 1

      const mockFlashcard: Flashcard = {
        id: 1,
        question: 'Test Question',
        answer: 'Test Answer',
        source: FlashcardSource.Manual,
        status: FlashcardStatus.NotApplicable,
        srsInterval: 1,
        srsRepetitions: 0,
        srsEaseFactor: 2.5,
        srsNextRepetitionDate: '2026-01-26T10:00:00Z',
        srsLastGrade: null,
        createdAtUtc: '2026-01-25T10:00:00Z',
        updatedAtUtc: '2026-01-25T10:00:00Z',
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockFlashcard })

      const result = await flashcardsApi.getFlashcard(id)

      expect(api.get).toHaveBeenCalledWith(`/flashcards/${id}`)
      expect(result).toEqual(mockFlashcard)
    })
  })

  describe('listUserFlashcards', () => {
    it('should fetch all user flashcards', async () => {
      const mockResponse: ListFlashcardsResponse = {
        flashcards: [
          {
            id: 1,
            question: 'Q1',
            answer: 'A1',
            source: FlashcardSource.Manual,
            status: FlashcardStatus.NotApplicable,
            srsInterval: null,
            srsRepetitions: null,
            srsEaseFactor: null,
            srsNextRepetitionDate: null,
            srsLastGrade: null,
            createdAtUtc: '2026-01-25T10:00:00Z',
            updatedAtUtc: '2026-01-25T10:00:00Z',
          },
          {
            id: 2,
            question: 'Q2',
            answer: 'A2',
            source: FlashcardSource.AI,
            status: FlashcardStatus.Accepted,
            srsInterval: null,
            srsRepetitions: null,
            srsEaseFactor: null,
            srsNextRepetitionDate: null,
            srsLastGrade: null,
            createdAtUtc: '2026-01-25T10:01:00Z',
            updatedAtUtc: '2026-01-25T10:01:00Z',
          },
        ],
        totalCount: 2,
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse })

      const result = await flashcardsApi.listUserFlashcards()

      expect(api.get).toHaveBeenCalledWith('/flashcards')
      expect(result).toEqual(mockResponse)
      expect(result.flashcards).toHaveLength(2)
    })
  })
})
