<script setup lang="ts">
import AcceptanceMetrics from '@/features/statistics/components/AcceptanceMetrics.vue'
import { useStatisticsStore } from '@/features/statistics/store'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const statisticsStore = useStatisticsStore()

onMounted(async () => {
  await statisticsStore.getGenerationAcceptance()
})
</script>

<template>
  <v-container max-width="70em">
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="text-h4 pa-4">
            {{ t('statistics.title') }}
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <AcceptanceMetrics :data="statisticsStore.acceptanceData" />
      </v-col>
    </v-row>
  </v-container>
</template>
