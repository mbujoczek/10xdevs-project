<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue'
import FlashcardDisplay from '@/features/learning/components/FlashcardDisplay.vue'
import RatingButtons from '@/features/learning/components/RatingButtons.vue'
import { useLearningStore } from '@/features/learning/store'
import type { SRSGrade } from '@/types/enums'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const learningStore = useLearningStore()
const { currentFlashcard, hasDueFlashcards, sessionStatistics, initialSessionCount } =
  storeToRefs(learningStore)

const isAnswerVisible = ref(false)
const isRating = ref(false)

onMounted(async () => {
  if (!hasDueFlashcards.value) {
    await learningStore.getDueFlashcards()
  }

  if (hasDueFlashcards.value) {
    learningStore.startSession()
  }
})

const handleShowAnswer = () => {
  isAnswerVisible.value = true
}

const handleRate = async (grade: SRSGrade) => {
  if (isRating.value || !currentFlashcard.value) return

  isRating.value = true

  try {
    await learningStore.rateFlashcard(currentFlashcard.value.id, grade)

    // Reset for next card
    isAnswerVisible.value = false

    // Check if session is complete
    if (!hasDueFlashcards.value) {
      learningStore.endSession()
      router.push({ name: 'learn-summary' })
    }
  } catch (error) {
    console.error('Failed to rate flashcard:', error)
  } finally {
    isRating.value = false
  }
}

const navigateToFlashcards = () => {
  router.push({ name: 'flashcards' })
}

const navigateToGenerate = () => {
  router.push({ name: 'generate' })
}
</script>

<template>
  <v-container max-width="70em">
    <!-- Empty State -->
    <EmptyState
      v-if="!hasDueFlashcards"
      icon="mdi-check-circle"
      :title="$t('learning.emptyState.title')"
      :description="$t('learning.emptyState.description')"
      :primary-action-label="$t('learning.emptyState.viewFlashcards')"
      :secondary-action-label="$t('learning.emptyState.generateFlashcards')"
      @primary-action="navigateToFlashcards"
      @secondary-action="navigateToGenerate"
    />

    <!-- Learning Interface -->
    <v-card v-else>
      <v-card-title class="d-flex justify-space-between align-center pa-6">
        <div class="text-h4">{{ $t('learning.title') }}</div>
        <v-chip color="primary" variant="elevated" size="large">
          {{ sessionStatistics?.totalReviewed || 0 }} / {{ initialSessionCount }}
        </v-chip>
      </v-card-title>

      <v-card-text class="pa-6">
        <FlashcardDisplay
          v-if="currentFlashcard"
          :flashcard="currentFlashcard"
          :is-answer-visible="isAnswerVisible"
          @show-answer="handleShowAnswer"
        />

        <RatingButtons v-if="isAnswerVisible && currentFlashcard" class="mt-6" @rate="handleRate" />
      </v-card-text>
    </v-card>
  </v-container>
</template>
