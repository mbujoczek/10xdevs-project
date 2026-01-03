<script setup lang="ts">
import type { CandidateWithStatus } from '@/features/generation/store'
import { ref, watch } from 'vue'
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

const formRef = ref<HTMLFormElement | null>(null)
const question = ref('')
const answer = ref('')

watch(
  () => props.candidate,
  (newCandidate) => {
    if (newCandidate) {
      question.value = newCandidate.question
      answer.value = newCandidate.answer
    }
  },
  { immediate: true },
)

const questionRules = [
  (v: string) => !!v.trim() || t('review.editDialog.errors.questionRequired'),
  (v: string) => v.length <= 200 || t('review.editDialog.errors.questionTooLong'),
]

const answerRules = [
  (v: string) => !!v.trim() || t('review.editDialog.errors.answerRequired'),
  (v: string) => v.length <= 500 || t('review.editDialog.errors.answerTooLong'),
]

function handleCancel() {
  emit('update:modelValue', false)
  resetForm()
}

async function handleSave() {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  emit('save', {
    question: question.value.trim(),
    answer: answer.value.trim(),
  })
  resetForm()
}

function resetForm() {
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
        {{ t('review.editDialog.title') }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef">
          <v-text-field
            v-model="question"
            :label="t('review.editDialog.questionLabel')"
            :rules="questionRules"
            :counter="200"
            :maxlength="200"
            variant="outlined"
            required
            class="mb-4"
          />

          <v-textarea
            v-model="answer"
            :label="t('review.editDialog.answerLabel')"
            :rules="answerRules"
            :counter="500"
            :maxlength="500"
            variant="outlined"
            rows="5"
            required
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">
          {{ t('review.editDialog.cancel') }}
        </v-btn>
        <v-btn color="primary" variant="flat" @click="handleSave">
          {{ t('review.editDialog.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
