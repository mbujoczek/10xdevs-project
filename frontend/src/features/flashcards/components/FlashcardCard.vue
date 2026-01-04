<script setup lang="ts">
import { FlashcardSource, FlashcardStatus } from '@/types/enums'
import type { Flashcard } from '@/types/flashcards.types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  flashcard: Flashcard
}

const props = defineProps<Props>()

defineEmits<{
  edit: [id: number]
  delete: [id: number]
}>()

const { t } = useI18n()

const sourceColor = computed(() =>
  props.flashcard.source === FlashcardSource.AI ? 'purple' : 'blue',
)

const sourceIcon = computed(() =>
  props.flashcard.source === FlashcardSource.AI ? 'mdi-robot' : 'mdi-account',
)

const sourceLabel = computed(() =>
  props.flashcard.source === FlashcardSource.AI
    ? t('flashcards.card.sourceAI')
    : t('flashcards.card.sourceManual'),
)

const showStatus = computed(() => props.flashcard.status !== FlashcardStatus.NotApplicable)

const statusColor = computed(() => {
  switch (props.flashcard.status) {
    case FlashcardStatus.Accepted:
      return 'success'
    case FlashcardStatus.Edited:
      return 'warning'
    case FlashcardStatus.Deleted:
      return 'error'
    default:
      return 'grey'
  }
})

const statusLabel = computed(() => {
  switch (props.flashcard.status) {
    case FlashcardStatus.Accepted:
      return t('flashcards.card.statusAccepted')
    case FlashcardStatus.Edited:
      return t('flashcards.card.statusEdited')
    case FlashcardStatus.Deleted:
      return t('flashcards.card.statusDeleted')
    default:
      return ''
  }
})
</script>

<template>
  <v-card elevation="2" class="h-100 d-flex flex-column" color="cardBackground">
    <v-card-text class="flex-grow-1">
      <div class="d-flex justify-space-between align-start mb-4">
        <v-chip :color="sourceColor" size="small" class="mr-2">
          <v-icon start size="small">{{ sourceIcon }}</v-icon>
          {{ sourceLabel }}
        </v-chip>
        <v-chip v-if="showStatus" :color="statusColor" size="small">
          {{ statusLabel }}
        </v-chip>
      </div>

      <div class="mb-4">
        <div class="text-subtitle-2 text-grey-darken-1 mb-1">
          {{ $t('flashcards.card.question') }}
        </div>
        <div class="text-body-1">{{ flashcard.question }}</div>
      </div>

      <div class="mb-4">
        <div class="text-subtitle-2 text-grey-darken-1 mb-1">
          {{ $t('flashcards.card.answer') }}
        </div>
        <div class="text-body-1">{{ flashcard.answer }}</div>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn icon size="small" variant="text" @click="$emit('edit', flashcard.id)">
        <v-icon>mdi-pencil</v-icon>
        <v-tooltip activator="parent" location="top">
          {{ $t('flashcards.card.editTooltip') }}
        </v-tooltip>
      </v-btn>
      <v-btn icon size="small" variant="text" color="error" @click="$emit('delete', flashcard.id)">
        <v-icon>mdi-delete</v-icon>
        <v-tooltip activator="parent" location="top">
          {{ $t('flashcards.card.deleteTooltip') }}
        </v-tooltip>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
