import type {
  DueFlashcardsResponse,
  RateFlashcardRequest,
  RateFlashcardResponse,
} from '@/types/learning.types'
import api from './axios'

export const getDueFlashcards = async (): Promise<DueFlashcardsResponse> => {
  const response = await api.get<DueFlashcardsResponse>('/learning/due')
  return response.data
}

export const rateFlashcard = async (
  id: number,
  request: RateFlashcardRequest,
): Promise<RateFlashcardResponse> => {
  const response = await api.post<RateFlashcardResponse>(`/learning/flashcards/${id}/rate`, request)
  return response.data
}
