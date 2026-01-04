<script setup lang="ts">
import { SRSGrade } from '@/types/enums'

defineEmits<{
  rate: [grade: SRSGrade]
}>()

const ratingOptions = [
  {
    grade: SRSGrade.CompleteBlackout,
    label: '0',
    description: 'learning.grades.completeBlackout',
    color: 'error',
  },
  {
    grade: SRSGrade.IncorrectResponse,
    label: '1',
    description: 'learning.grades.incorrectResponse',
    color: 'error',
  },
  {
    grade: SRSGrade.IncorrectResponseRecalled,
    label: '2',
    description: 'learning.grades.incorrectResponseRecalled',
    color: 'warning',
  },
  {
    grade: SRSGrade.CorrectWithDifficulty,
    label: '3',
    description: 'learning.grades.correctWithDifficulty',
    color: 'warning',
  },
  {
    grade: SRSGrade.CorrectAfterHesitation,
    label: '4',
    description: 'learning.grades.correctAfterHesitation',
    color: 'success',
  },
  {
    grade: SRSGrade.PerfectResponse,
    label: '5',
    description: 'learning.grades.perfectResponse',
    color: 'success',
  },
]
</script>

<template>
  <div class="w-100">
    <div class="text-subtitle-1 text-grey-darken-1 mb-4 text-center">
      {{ $t('learning.rateYourResponse') }}
    </div>

    <v-row dense>
      <v-col v-for="option in ratingOptions" :key="option.grade" cols="6" sm="4" md="2">
        <v-btn
          :color="option.color"
          variant="elevated"
          size="large"
          block
          class="flex-column pa-4"
          height="auto"
          @click="$emit('rate', option.grade)"
        >
          <div class="text-h4 font-weight-bold mb-1 mr-2">{{ option.label }}</div>
          <div class="text-caption text-wrap">{{ $t(option.description) }}</div>
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>
