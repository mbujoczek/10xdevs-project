<script setup lang="ts">
import EditFlashcardDialog from '@/components/common/EditFlashcardDialog.vue'
import type { CandidateWithStatus } from '@/features/generation/store'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue: boolean
  candidate: CandidateWithStatus | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: { question: string; answer: string }]
}>()

const { t } = useI18n()

const dialogData = computed(() => {
  return props.candidate
    ? {
        question: props.candidate.question,
        answer: props.candidate.answer,
      }
    : null
})

const handleSave = (data: { question: string; answer: string }) => {
  emit('save', data)
}
</script>

<template>
  <EditFlashcardDialog
    :model-value="modelValue"
    :data="dialogData"
    :title="t('review.editDialog.title')"
    :question-label="t('review.editDialog.questionLabel')"
    :answer-label="t('review.editDialog.answerLabel')"
    :question-max-length="200"
    :answer-max-length="500"
    :question-required-message="t('review.editDialog.errors.questionRequired')"
    :question-max-length-message="t('review.editDialog.errors.questionTooLong')"
    :answer-required-message="t('review.editDialog.errors.answerRequired')"
    :answer-max-length-message="t('review.editDialog.errors.answerTooLong')"
    :cancel-label="t('review.editDialog.cancel')"
    :save-label="t('review.editDialog.save')"
    @update:model-value="emit('update:modelValue', $event)"
    @save="handleSave"
  />
</template>
