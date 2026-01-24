import {
  getDueFlashcards as fetchDueFlashcards,
  rateFlashcard as rateFlashcardApi,
} from '@/api/learning.api'
import { SRSGrade } from '@/types/enums'
import type { Flashcard } from '@/types/flashcards.types'
import type {
  RateFlashcardResponse,
  RatingDistribution,
  SessionStatistics,
} from '@/types/learning.types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useLearningStore = defineStore('learning', () => {
  const dueFlashcards = ref<Flashcard[]>([])
  const totalDueCount = ref<number>(0)
  const sessionStatistics = ref<SessionStatistics | null>(null)
  const isSessionActive = ref<boolean>(false)
  const initialSessionCount = ref<number>(0)

  const hasDueFlashcards = computed(() => totalDueCount.value > 0)

  const currentFlashcard = computed(() => {
    return dueFlashcards.value.length > 0 ? dueFlashcards.value[0] : undefined
  })

  const getDueFlashcards = async (): Promise<void> => {
    const response = await fetchDueFlashcards()
    dueFlashcards.value = response.flashcards
    totalDueCount.value = response.totalDueCount
  }

  const startSession = (): void => {
    isSessionActive.value = true
    initialSessionCount.value = dueFlashcards.value.length

    const emptyDistribution: RatingDistribution = {
      [SRSGrade.CompleteBlackout]: 0,
      [SRSGrade.IncorrectResponse]: 0,
      [SRSGrade.IncorrectResponseRecalled]: 0,
      [SRSGrade.CorrectWithDifficulty]: 0,
      [SRSGrade.CorrectAfterHesitation]: 0,
      [SRSGrade.PerfectResponse]: 0,
    }

    sessionStatistics.value = {
      totalReviewed: 0,
      ratingDistribution: emptyDistribution,
      sessionDurationMs: Date.now(),
    }
  }

  const rateFlashcard = async (id: number, grade: SRSGrade): Promise<RateFlashcardResponse> => {
    const response = await rateFlashcardApi(id, { grade })

    // Remove rated flashcard from the queue
    dueFlashcards.value = dueFlashcards.value.filter((card) => card.id !== id)
    totalDueCount.value = Math.max(0, totalDueCount.value - 1)

    // Update session statistics
    if (sessionStatistics.value) {
      sessionStatistics.value.totalReviewed += 1
      sessionStatistics.value.ratingDistribution[grade] += 1
    }

    return response
  }

  const endSession = (): SessionStatistics | null => {
    isSessionActive.value = false

    if (sessionStatistics.value && sessionStatistics.value.sessionDurationMs) {
      sessionStatistics.value.sessionDurationMs =
        Date.now() - sessionStatistics.value.sessionDurationMs
    }

    return sessionStatistics.value
  }

  const resetSessionStatistics = (): void => {
    sessionStatistics.value = null
    initialSessionCount.value = 0
  }

  const resetLearningState = () => {
    dueFlashcards.value = []
    totalDueCount.value = 0
    sessionStatistics.value = null
    isSessionActive.value = false
    initialSessionCount.value = 0
  }

  return {
    dueFlashcards,
    totalDueCount,
    sessionStatistics,
    isSessionActive,
    initialSessionCount,
    hasDueFlashcards,
    currentFlashcard,
    getDueFlashcards,
    startSession,
    rateFlashcard,
    endSession,
    resetSessionStatistics,
    resetLearningState,
  }
})
