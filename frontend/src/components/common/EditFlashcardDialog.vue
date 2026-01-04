<script setup lang="ts">
import type { UpdateFlashcardRequest } from '@/types'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue: boolean
  data?: UpdateFlashcardRequest | null
  title: string
  questionLabel: string
  answerLabel: string
  questionMaxLength?: number
  answerMaxLength?: number
  questionRequiredMessage: string
  questionMaxLengthMessage: string
  answerRequiredMessage: string
  answerMaxLengthMessage: string
  cancelLabel?: string
  saveLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  questionMaxLength: 200,
  answerMaxLength: 500,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: UpdateFlashcardRequest]
}>()

const { t } = useI18n()

const formRef = ref()
const question = ref('')
const answer = ref('')

watch(
  () => props.data,
  (newData) => {
    if (newData) {
      question.value = newData.question
      answer.value = newData.answer
    }
  },
  { immediate: true },
)

const questionRules = [
  (v: string) => !!v.trim() || props.questionRequiredMessage,
  (v: string) => v.length <= props.questionMaxLength || props.questionMaxLengthMessage,
]

const answerRules = [
  (v: string) => !!v.trim() || props.answerRequiredMessage,
  (v: string) => v.length <= props.answerMaxLength || props.answerMaxLengthMessage,
]

const isValid = computed(() => {
  const questionValid =
    question.value?.trim().length > 0 && question.value?.length <= props.questionMaxLength
  const answerValid =
    answer.value?.trim().length > 0 && answer.value?.length <= props.answerMaxLength
  return questionValid && answerValid
})

const handleSave = () => {
  emit('save', {
    question: question.value.trim(),
    answer: answer.value.trim(),
  })
  resetForm()
}

const handleCancel = () => {
  emit('update:modelValue', false)
  resetForm()
}

const resetForm = () => {
  formRef.value?.reset()
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="600"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="text-h6">
        {{ title }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef">
          <v-textarea
            v-model="question"
            :label="questionLabel"
            :rules="questionRules"
            :counter="questionMaxLength"
            :maxlength="questionMaxLength"
            variant="outlined"
            rows="3"
            required
            class="mb-4"
          />

          <v-textarea
            v-model="answer"
            :label="answerLabel"
            :rules="answerRules"
            :counter="answerMaxLength"
            :maxlength="answerMaxLength"
            variant="outlined"
            rows="5"
            required
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">
          {{ cancelLabel || t('common.cancel') }}
        </v-btn>
        <v-btn color="primary" variant="flat" :disabled="!isValid" @click="handleSave">
          {{ saveLabel || t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
