<script setup lang="ts">
import RegisterForm from '@/features/authentication/components/RegisterForm.vue'
import { useAuthStore } from '@/features/authentication/store'
import type { RegisterRequest } from '@/types/auth.types'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const handleRegister = async (data: RegisterRequest) => {
  await authStore.register(data)
  await router.push('/')
}
</script>

<template>
  <v-container class="d-flex align-center justify-center fill-height" fluid>
    <v-card width="400" class="pa-6">
      <v-card-title class="text-h5 text-center mb-6">
        {{ t('auth.register.title') }}
      </v-card-title>

      <v-card-text class="pa-0">
        <RegisterForm @submit="handleRegister" />
      </v-card-text>

      <v-card-text class="text-center text-body-2 mt-4">
        {{ t('auth.register.hasAccount') }}
        <router-link to="/login" class="text-primary text-decoration-none font-weight-medium">
          {{ t('auth.register.login') }}
        </router-link>
      </v-card-text>
    </v-card>
  </v-container>
</template>
