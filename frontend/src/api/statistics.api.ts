import type { GenerationAcceptanceResponse } from '@/types/statistics.types'
import api from './axios'

export const getGenerationAcceptance = async (): Promise<GenerationAcceptanceResponse> => {
  const response = await api.get<GenerationAcceptanceResponse>('/statistics/generation-acceptance')
  return response.data
}
