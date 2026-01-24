<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { useUiStore } from '@/store/ui.store'
import type { LoginRequest } from '@/types/auth.types'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const uiStore = useUiStore()
const { isLoading } = storeToRefs(uiStore)

const emit = defineEmits<{
  submit: [credentials: LoginRequest]
}>()

const username = ref('')
const password = ref('')
const formRef = ref<HTMLFormElement | null>(null)

const usernameRules = [(v: string) => !!v || t('validation.required')]

const passwordRules = [(v: string) => !!v || t('validation.required')]

const isFormValid = computed(() => {
  return username.value.trim() !== '' && password.value.trim() !== ''
})

const handleSubmit = () => {
  if (!isFormValid.value) return

  emit('submit', {
    username: username.value.trim(),
    password: password.value,
  })
}
</script>

<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <BaseInput
      v-model="username"
      :label="t('auth.login.username')"
      :rules="usernameRules"
      :disabled="isLoading"
      autofocus
      required
    />

    <BaseInput
      v-model="password"
      :label="t('auth.login.password')"
      :rules="passwordRules"
      :disabled="isLoading"
      type="password"
      required
      class="mt-4"
    />

    <BaseButton type="submit" :disabled="!isFormValid || isLoading" block class="mt-6">
      {{ t('auth.login.submit') }}
    </BaseButton>
  </v-form>
</template>
