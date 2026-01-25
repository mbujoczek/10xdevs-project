<script setup lang="ts">
import LoginForm from '@/features/authentication/components/LoginForm.vue'
import { useAuthStore } from '@/features/authentication/store'
import type { LoginRequest } from '@/types/auth.types'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const handleLogin = async (credentials: LoginRequest) => {
  await authStore.login(credentials)
  await router.push('/')
}
</script>

<template>
  <v-container class="d-flex align-center justify-center fill-height" fluid>
    <v-card width="400" class="pa-6">
      <v-card-title role="heading" class="text-h5 text-center mb-6">
        {{ t('auth.login.title') }}
      </v-card-title>

      <v-card-text class="pa-0">
        <LoginForm @submit="handleLogin" />
      </v-card-text>

      <v-card-text class="text-center text-body-2 mt-4">
        {{ t('auth.login.noAccount') }}
        <router-link to="/register" class="text-primary text-decoration-none font-weight-medium">
          {{ t('auth.login.register') }}
        </router-link>
      </v-card-text>
    </v-card>
  </v-container>
</template>
