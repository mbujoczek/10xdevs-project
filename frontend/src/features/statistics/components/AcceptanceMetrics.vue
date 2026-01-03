<script setup lang="ts">
import type { GenerationAcceptanceResponse } from '@/types/statistics.types'
import { useI18n } from 'vue-i18n'
import MetricCard from './MetricCard.vue'

interface Props {
  data: GenerationAcceptanceResponse | null
}

defineProps<Props>()
const { t } = useI18n()

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`
}
</script>

<template>
  <div v-if="!data" class="text-center text-body-1 text-medium-emphasis">
    {{ t('statistics.loading') }}
  </div>
  <div v-else>
    <!-- Success/Warning Alert -->
    <v-alert :type="data.meetsSuccessMetric ? 'success' : 'warning'" variant="tonal" class="mb-4">
      <template v-if="data.meetsSuccessMetric">
        {{ t('statistics.successMetric.met') }}
      </template>
      <template v-else>
        {{ t('statistics.successMetric.notMet') }}
      </template>
    </v-alert>

    <!-- Metrics Grid -->
    <v-row dense>
      <v-col cols="12" sm="6" md="4">
        <MetricCard
          :label="t('statistics.metrics.totalCandidates')"
          :value="data.totalCandidates"
          icon="mdi-card-multiple"
        />
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <MetricCard
          :label="t('statistics.metrics.acceptedWithoutEditing')"
          :value="data.acceptedWithoutEditing"
          icon="mdi-check-circle"
          color="success"
        />
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <MetricCard
          :label="t('statistics.metrics.acceptedAfterEditing')"
          :value="data.acceptedAfterEditing"
          icon="mdi-pencil-circle"
          color="info"
        />
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <MetricCard
          :label="t('statistics.metrics.rejected')"
          :value="data.rejected"
          icon="mdi-close-circle"
          color="error"
        />
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <MetricCard
          :label="t('statistics.metrics.acceptanceRate')"
          :value="formatPercentage(data.acceptanceRate)"
          icon="mdi-percent"
        />
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <MetricCard
          :label="t('statistics.metrics.pureAcceptanceRate')"
          :value="formatPercentage(data.pureAcceptanceRate)"
          icon="mdi-star"
          :color="data.meetsSuccessMetric ? 'success' : 'warning'"
        />
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <MetricCard
          :label="t('statistics.metrics.targetRate')"
          :value="formatPercentage(data.targetRate)"
          icon="mdi-target"
        />
      </v-col>
    </v-row>
  </div>
</template>
