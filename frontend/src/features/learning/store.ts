import { getDueFlashcards as fetchDueFlashcards } from '@/api/learning.api'
import type { Flashcard } from '@/types/flashcards.types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useLearningStore = defineStore('learning', () => {
  const dueFlashcards = ref<Flashcard[]>([])
  const totalDueCount = ref<number>(0)

  const hasDueFlashcards = computed(() => totalDueCount.value > 0)

  const getDueFlashcards = async (): Promise<void> => {
    const response = await fetchDueFlashcards()
    dueFlashcards.value = response.flashcards
    totalDueCount.value = response.totalDueCount
  }

  const resetLearningState = () => {
    dueFlashcards.value = []
    totalDueCount.value = 0
  }

  return {
    dueFlashcards,
    totalDueCount,
    hasDueFlashcards,
    getDueFlashcards,
    resetLearningState,
  }
})
