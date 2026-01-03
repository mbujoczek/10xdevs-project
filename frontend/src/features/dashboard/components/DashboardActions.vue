<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import { useI18n } from 'vue-i18n'

interface Props {
  hasDueFlashcards: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()

const emit = defineEmits<{
  'start-learning': []
  'generate-flashcards': []
  'view-flashcards': []
}>()
</script>

<template>
  <v-row class="ga-4">
    <v-col cols="12">
      <BaseButton
        color="primary"
        size="large"
        block
        :disabled="!props.hasDueFlashcards"
        @click="emit('start-learning')"
      >
        {{ t('dashboard.actions.startLearning') }}
      </BaseButton>
    </v-col>

    <v-col cols="12">
      <BaseButton color="secondary" size="large" block @click="emit('generate-flashcards')">
        {{ t('dashboard.actions.generate') }}
      </BaseButton>
    </v-col>

    <v-col cols="12">
      <BaseButton color="secondary" size="large" block @click="emit('view-flashcards')">
        {{ t('dashboard.actions.myFlashcards') }}
      </BaseButton>
    </v-col>
  </v-row>
</template>
