import {
  createManualFlashcard,
  deleteFlashcard as deleteFlashcardApi,
  listUserFlashcards,
  updateFlashcard as updateFlashcardApi,
} from '@/api/flashcards.api'
import { FlashcardSource } from '@/types/enums'
import type {
  CreateFlashcardRequest,
  Flashcard,
  UpdateFlashcardRequest,
} from '@/types/flashcards.types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useFlashcardsStore = defineStore('flashcards', () => {
  const flashcards = ref<Flashcard[]>([])

  const totalCount = computed(() => flashcards.value.length)

  const hasFlashcards = computed(() => flashcards.value.length > 0)

  const flashcardById = computed(() => (id: number) => {
    return flashcards.value.find((fc) => fc.id === id)
  })

  const aiGeneratedFlashcards = computed(() => {
    return flashcards.value.filter((fc) => fc.source === FlashcardSource.AI)
  })

  const manualFlashcards = computed(() => {
    return flashcards.value.filter((fc) => fc.source === FlashcardSource.Manual)
  })

  const fetchFlashcards = async (): Promise<void> => {
    const response = await listUserFlashcards()
    flashcards.value = response.flashcards
  }

  const createFlashcard = async (request: CreateFlashcardRequest): Promise<Flashcard> => {
    const flashcard = await createManualFlashcard(request)
    await fetchFlashcards()
    return flashcard
  }

  const updateFlashcard = async (
    id: number,
    request: UpdateFlashcardRequest,
  ): Promise<Flashcard> => {
    const updatedFlashcard = await updateFlashcardApi(id, request)
    const index = flashcards.value.findIndex((fc) => fc.id === id)
    if (index !== -1) {
      flashcards.value[index] = updatedFlashcard
    }
    return updatedFlashcard
  }

  const deleteFlashcard = async (id: number): Promise<void> => {
    const flashcardToDelete = flashcards.value.find((fc) => fc.id === id)
    const index = flashcards.value.findIndex((fc) => fc.id === id)

    if (index !== -1) {
      flashcards.value.splice(index, 1)
    }

    try {
      await deleteFlashcardApi(id)
    } catch (error) {
      if (flashcardToDelete && index !== -1) {
        flashcards.value.splice(index, 0, flashcardToDelete)
      }
      throw error
    }
  }

  const resetState = (): void => {
    flashcards.value = []
  }

  return {
    flashcards,
    totalCount,
    hasFlashcards,
    flashcardById,
    aiGeneratedFlashcards,
    manualFlashcards,
    fetchFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    resetState,
  }
})
