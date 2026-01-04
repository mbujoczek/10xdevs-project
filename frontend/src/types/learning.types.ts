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

export interface LearningSessionState {
  currentIndex: number
  totalCount: number
  isAnswerVisible: boolean
  completedCount: number
}

export interface SessionStatistics {
  totalReviewed: number
  ratingDistribution: RatingDistribution
  sessionDurationMs?: number
}

export interface RatingDistribution {
  [SRSGrade.CompleteBlackout]: number
  [SRSGrade.IncorrectResponse]: number
  [SRSGrade.IncorrectResponseRecalled]: number
  [SRSGrade.CorrectWithDifficulty]: number
  [SRSGrade.CorrectAfterHesitation]: number
  [SRSGrade.PerfectResponse]: number
}

export interface FlashcardRatingPayload {
  flashcardId: number
  grade: SRSGrade
  timestamp: string
}
