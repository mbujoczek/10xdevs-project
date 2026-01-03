<script setup lang="ts">
import type { CandidateWithStatus } from '@/features/generation/store'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  candidate: CandidateWithStatus
}

const props = defineProps<Props>()
const { t } = useI18n()

const emit = defineEmits<{
  accept: []
  edit: []
  reject: []
}>()

const isLocked = computed(() => props.candidate.status !== 'pending')

const cardColor = computed(() => {
  switch (props.candidate.status) {
    case 'accepted':
      return 'success'
    case 'edited':
      return 'warning'
    case 'rejected':
      return 'error'
    default:
      return undefined
  }
})

const cardVariant = computed(() => {
  return props.candidate.status !== 'pending' ? 'tonal' : 'outlined'
})

const cardClass = computed(() => {
  return props.candidate.status === 'rejected' ? 'rejected-card' : ''
})
</script>

<template>
  <v-card :color="cardColor" :variant="cardVariant" :class="cardClass" class="candidate-card mb-4">
    <v-card-title class="text-h6" style="white-space: normal; word-break: break-word">
      {{ candidate.question }}
    </v-card-title>

    <v-card-text class="text-body-1">
      {{ candidate.answer }}
    </v-card-text>

    <v-card-actions class="pa-4 pt-0">
      <v-btn color="success" variant="outlined" :disabled="isLocked" @click="emit('accept')">
        {{ t('review.candidateCard.accept') }}
      </v-btn>

      <v-btn color="warning" variant="outlined" :disabled="isLocked" @click="emit('edit')">
        {{ t('review.candidateCard.edit') }}
      </v-btn>

      <v-btn color="error" variant="outlined" :disabled="isLocked" @click="emit('reject')">
        {{ t('review.candidateCard.reject') }}
      </v-btn>

      <v-spacer />

      <v-chip v-if="candidate.status !== 'pending'" :color="cardColor" variant="flat" size="small">
        {{ t(`review.candidateCard.status.${candidate.status}`) }}
      </v-chip>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.candidate-card {
  transition: all 0.3s ease;
}

.rejected-card {
  opacity: 0.6;
}

.candidate-card:not(.rejected-card):hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
</style>
