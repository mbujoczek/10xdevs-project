<script setup lang="ts">
import { generateFlashcardsFromText } from '@/api/flashcards.api'
import { useGenerationStore } from '@/features/generation/store'
import { useUiStore } from '@/store/ui.store'
import type { GenerateFlashcardsRequest } from '@/types/flashcards.types'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const router = useRouter()
const { t, locale } = useI18n()
const uiStore = useUiStore()
const { isLoading } = storeToRefs(uiStore)

const inputText = ref<string>('')
const formRef = ref<HTMLFormElement | null>(null)

const inputTextRules = [
  (v: string) => !!v.trim() || t('generate.errors.required'),
  (v: string) => v.trim().length >= 50 || t('generate.errors.tooShort'),
  (v: string) => v.length <= 10000 || t('generate.errors.tooLong'),
]

const isFormValid = computed(() => {
  const trimmed = inputText.value.trim()
  return trimmed.length >= 50 && trimmed.length <= 10000
})

const language = computed(() => {
  const currentLocale = locale.value
  return currentLocale === 'pl' || currentLocale === 'en' ? currentLocale : 'en'
})

const handleGenerate = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  const request: GenerateFlashcardsRequest = {
    inputText: inputText.value.trim(),
    language: language.value,
  }

  const response = await generateFlashcardsFromText(request)

  const generationStore = useGenerationStore()
  generationStore.initializeReview(response.generationEventId, response.candidates)

  await router.push({
    name: 'review',
    params: { eventId: response.generationEventId.toString() },
  })
}
</script>

<template>
  <v-container max-width="60em">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h4">
            {{ t('generate.title') }}
          </v-card-title>
          <v-card-text>
            <p class="text-body-1 mb-4">
              {{ t('generate.description') }}
            </p>

            <v-form ref="formRef" @submit.prevent="handleGenerate">
              <v-textarea
                v-model="inputText"
                :label="t('generate.form.inputLabel')"
                :placeholder="t('generate.form.inputPlaceholder')"
                :rules="inputTextRules"
                :counter="10000"
                :maxlength="10000"
                :disabled="isLoading"
                variant="outlined"
                rows="12"
                auto-grow
                required
              />

              <div class="d-flex justify-end mt-4">
                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  :disabled="!isFormValid || isLoading"
                >
                  {{ t('generate.form.submitButton') }}
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
