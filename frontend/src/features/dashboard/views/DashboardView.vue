<script setup lang="ts">
import { useAuthStore } from '@/features/authentication/store'
import DashboardActions from '@/features/dashboard/components/DashboardActions.vue'
import DashboardStats from '@/features/dashboard/components/DashboardStats.vue'
import { useLearningStore } from '@/features/learning/store'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const learningStore = useLearningStore()

const user = authStore.user
const dueCount = computed(() => learningStore.totalDueCount)
const hasDueFlashcards = computed(() => learningStore.hasDueFlashcards)

const navigateToLearning = () => router.push('/learn')
const navigateToGenerate = () => router.push('/generate')
const navigateToFlashcards = () => router.push('/flashcards')

onMounted(async () => {
  await learningStore.getDueFlashcards()
})
</script>

<template>
  <v-container max-width="70em">
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="text-h4 pa-4">
            {{ t('dashboard.welcome', { username: user?.username || 'User' }) }}
          </v-card-title>
          <v-card-text>
            <DashboardStats :due-count="dueCount" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <DashboardActions
              :has-due-flashcards="hasDueFlashcards"
              @start-learning="navigateToLearning"
              @generate-flashcards="navigateToGenerate"
              @view-flashcards="navigateToFlashcards"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
