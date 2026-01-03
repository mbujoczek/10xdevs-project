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
import api from './axios'

export const generateFlashcardsFromText = async (
  request: GenerateFlashcardsRequest,
): Promise<GenerateFlashcardsResponse> => {
  const response = await api.post<GenerateFlashcardsResponse>('/flashcards/generate', request)
  return response.data
}

export const completeFlashcardsReview = async (
  eventId: number,
  request: CompleteReviewRequest,
): Promise<CompleteReviewResponse> => {
  const response = await api.post<CompleteReviewResponse>(
    `/flashcards/generation/${eventId}/complete`,
    request,
  )
  return response.data
}

export const createManualFlashcard = async (
  request: CreateFlashcardRequest,
): Promise<Flashcard> => {
  const response = await api.post<Flashcard>('/flashcards', request)
  return response.data
}

export const updateFlashcard = async (
  id: number,
  request: UpdateFlashcardRequest,
): Promise<Flashcard> => {
  const response = await api.put<Flashcard>(`/flashcards/${id}`, request)
  return response.data
}

export const deleteFlashcard = async (id: number): Promise<void> => {
  await api.delete(`/flashcards/${id}`)
}

export const getFlashcard = async (id: number): Promise<Flashcard> => {
  const response = await api.get<Flashcard>(`/flashcards/${id}`)
  return response.data
}

export const listUserFlashcards = async (
  page: number = 1,
  pageSize: number = 50,
): Promise<ListFlashcardsResponse> => {
  const response = await api.get<ListFlashcardsResponse>('/flashcards', {
    params: { page, pageSize },
  })
  return response.data
}
