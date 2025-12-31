import type { FlashcardSource, FlashcardStatus, SRSGrade } from './enums'

export interface FlashcardCandidate {
  candidateId: string
  question: string
  answer: string
}

export interface Flashcard {
  id: number
  question: string
  answer: string
  source: FlashcardSource
  status: FlashcardStatus
  srsInterval: number | null
  srsRepetitions: number | null
  srsEaseFactor: number | null
  srsNextRepetitionDate: string | null
  srsLastGrade: SRSGrade | null
  createdAtUtc: string
  updatedAtUtc: string
}

export interface CreateFlashcardRequest {
  question: string
  answer: string
}

export type UpdateFlashcardRequest = CreateFlashcardRequest

export interface GenerateFlashcardsRequest {
  inputText: string
  language?: 'pl' | 'en'
}

export interface GenerateFlashcardsResponse {
  generationEventId: number
  candidates: FlashcardCandidate[]
  cadidatesCount: number
  createdAtUtc: string
}

export interface CompleteReviewRequest {
  accepted: FlashcardCandidate[]
  edited: FlashcardCandidate[]
}

export interface CompleteReviewResponse {
  savedFlashcardsCount: number
  acceptedCount: number
  editedCount: number
  rejectedCount: number
  flashcardIds: number[]
}

export interface ListFlashcardsResponse {
  flashcards: Flashcard[]
  totalCount: number
}
