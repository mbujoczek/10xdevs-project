import type { DueFlashcardsResponse } from '@/types/learning.types'
import api from './axios'

export const getDueFlashcards = async (): Promise<DueFlashcardsResponse> => {
  const response = await api.get<DueFlashcardsResponse>('/learning/due')
  return response.data
}
