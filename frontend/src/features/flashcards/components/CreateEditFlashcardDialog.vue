<script setup lang="ts">
import EditFlashcardDialog from '@/components/common/EditFlashcardDialog.vue'
import type { CreateFlashcardRequest, Flashcard } from '@/types/flashcards.types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue: boolean
  flashcard?: Flashcard
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: CreateFlashcardRequest]
}>()

const { t } = useI18n()

const isEditMode = computed(() => !!props.flashcard)

const dialogData = computed(() => {
  return props.flashcard
    ? {
        question: props.flashcard.question,
        answer: props.flashcard.answer,
      }
    : null
})

const dialogTitle = computed(() =>
  isEditMode.value ? t('flashcards.editDialog.title') : t('flashcards.createDialog.title'),
)

const handleSave = (data: CreateFlashcardRequest) => {
  emit('save', data)
}
</script>

<template>
  <EditFlashcardDialog
    :model-value="modelValue"
    :data="dialogData"
    :title="dialogTitle"
    :question-label="t('flashcards.form.question')"
    :answer-label="t('flashcards.form.answer')"
    :question-required-message="t('flashcards.validation.questionRequired')"
    :question-max-length-message="t('flashcards.validation.questionMaxLength')"
    :answer-required-message="t('flashcards.validation.answerRequired')"
    :answer-max-length-message="t('flashcards.validation.answerMaxLength')"
    @update:model-value="emit('update:modelValue', $event)"
    @save="handleSave"
  />
</template>
