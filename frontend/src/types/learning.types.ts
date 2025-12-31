import type { SRSGrade } from './enums'
import type { Flashcard } from './flashcards.types'

export interface DueFlashcardsResponse {
  flashcards: Flashcard[]
  totalDueCount: number
}

export interface RateFlashcardRequest {
  grade: SRSGrade
  reviewedAtUtc?: string
}

export interface RateFlashcardResponse {
  id: number
  srsInterval: number
  srsRepetitions: number
  srsEaseFactor: number
  srsNextRepetitionDate: string
  srsLastGrade: SRSGrade
  updatedAtUtc: string
}
