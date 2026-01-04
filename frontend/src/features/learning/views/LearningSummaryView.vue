<script setup lang="ts">
import SessionStats from '@/features/learning/components/SessionStats.vue'
import { useLearningStore } from '@/features/learning/store'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const learningStore = useLearningStore()
const { sessionStatistics } = storeToRefs(learningStore)

onMounted(() => {
  if (!sessionStatistics.value) {
    router.push({ name: 'dashboard' })
  }
})

const returnToDashboard = () => {
  learningStore.resetSessionStatistics()
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <v-container max-width="70em">
    <v-card v-if="sessionStatistics">
      <v-card-title class="text-center pa-8">
        <div class="text-h3 mb-2 text-wrap">{{ $t('learning.summary.title') }}</div>
        <div class="text-h6 text-grey text-wrap">{{ $t('learning.summary.subtitle') }}</div>
      </v-card-title>

      <v-card-text class="pa-6">
        <SessionStats :statistics="sessionStatistics" />
      </v-card-text>

      <v-card-actions class="justify-center pa-6">
        <v-btn color="primary" size="x-large" @click="returnToDashboard">
          <v-icon start>mdi-home</v-icon>
          {{ $t('learning.summary.returnToDashboard') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Fallback for no data -->
    <v-card v-else>
      <v-card-text class="text-center pa-12">
        <v-icon size="120" color="grey-lighten-1" class="mb-4">mdi-alert-circle-outline</v-icon>
        <div class="text-h5 text-grey-darken-1 mb-4">
          {{ $t('learning.summary.noDataTitle') }}
        </div>
        <div class="text-body-1 text-grey mb-6">
          {{ $t('learning.summary.noDataDescription') }}
        </div>
        <v-btn color="primary" variant="outlined" size="large" @click="returnToDashboard">
          <v-icon start>mdi-home</v-icon>
          {{ $t('learning.summary.returnToDashboard') }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>
