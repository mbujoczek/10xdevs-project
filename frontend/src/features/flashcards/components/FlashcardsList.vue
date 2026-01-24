<script setup lang="ts">
import type { Flashcard } from '@/types/flashcards.types'
import FlashcardCard from './FlashcardCard.vue'

interface Props {
  flashcards: Flashcard[]
}

defineProps<Props>()

defineEmits<{
  edit: [id: number]
  delete: [id: number]
}>()
</script>

<template>
  <v-row>
    <v-col v-for="flashcard in flashcards" :key="flashcard.id" cols="12" md="6" lg="4">
      <FlashcardCard
        :flashcard="flashcard"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </v-col>
  </v-row>
</template>
