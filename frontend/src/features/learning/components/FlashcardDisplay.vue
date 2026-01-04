<script setup lang="ts">
import type { Flashcard } from '@/types/flashcards.types'

interface Props {
  flashcard: Flashcard
  isAnswerVisible: boolean
}

defineProps<Props>()

defineEmits<{
  showAnswer: []
}>()
</script>

<template>
  <div class="flashcard-display">
    <!-- Question Card -->
    <v-card elevation="2" class="mb-6">
      <v-card-text class="pa-8">
        <div class="text-overline text-grey mb-2">{{ $t('learning.question') }}</div>
        <div class="text-h5">{{ flashcard.question }}</div>
      </v-card-text>
    </v-card>

    <!-- Show Answer Button -->
    <v-btn
      v-if="!isAnswerVisible"
      color="primary"
      size="x-large"
      block
      class="mb-6"
      @click="$emit('showAnswer')"
    >
      {{ $t('learning.showAnswer') }}
    </v-btn>

    <!-- Answer Card -->
    <v-expand-transition>
      <v-card v-if="isAnswerVisible" elevation="2" color="blue-grey-lighten-5">
        <v-card-text class="pa-8">
          <div class="text-overline text-grey mb-2">{{ $t('learning.answer') }}</div>
          <div class="text-h5">{{ flashcard.answer }}</div>
        </v-card-text>
      </v-card>
    </v-expand-transition>
  </div>
</template>

<style scoped>
.flashcard-display {
  width: 100%;
}
</style>
