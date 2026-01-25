<script setup lang="ts">
import type { SRSGrade } from '@/types/enums'
import type { SessionStatistics } from '@/types/learning.types'
import {
  ALL_GRADES,
  calculateAverageRating,
  calculateGradePercentage,
  formatSessionDuration,
} from '@/utils/srs'

interface Props {
  statistics: SessionStatistics
}

const props = defineProps<Props>()

const calculateAverage = (): number => {
  return calculateAverageRating(props.statistics.ratingDistribution, props.statistics.totalReviewed)
}

const formatDuration = (): string => {
  return formatSessionDuration(props.statistics.sessionDurationMs)
}

const getRatingPercentage = (grade: SRSGrade): number => {
  return calculateGradePercentage(
    props.statistics.ratingDistribution,
    props.statistics.totalReviewed,
    grade,
  )
}
</script>

<template>
  <div class="w-100">
    <v-row>
      <!-- Total Reviewed -->
      <v-col cols="12" sm="6" md="4">
        <v-card elevation="1" color="cardBackground">
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="primary" class="mb-2">mdi-cards</v-icon>
            <div class="text-h3 font-weight-bold text-primary mb-1">
              {{ statistics.totalReviewed }}
            </div>
            <div class="text-subtitle-1 text-grey">
              {{ $t('learning.summary.totalReviewed') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Average Rating -->
      <v-col cols="12" sm="6" md="4">
        <v-card elevation="1" color="cardBackground">
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="success" class="mb-2">mdi-star</v-icon>
            <div class="text-h3 font-weight-bold text-success mb-1">
              {{ calculateAverage().toFixed(1) }}
            </div>
            <div class="text-subtitle-1 text-grey">
              {{ $t('learning.summary.averageRating') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Duration -->
      <v-col cols="12" sm="6" md="4">
        <v-card elevation="1" color="cardBackground">
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="info" class="mb-2">mdi-clock-outline</v-icon>
            <div class="text-h3 font-weight-bold text-info mb-1">
              {{ formatDuration() }}
            </div>
            <div class="text-subtitle-1 text-grey">
              {{ $t('learning.summary.duration') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Rating Distribution -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="1" color="cardBackground">
          <v-card-title role="heading" class="pa-4">
            {{ $t('learning.summary.ratingDistribution') }}
          </v-card-title>
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col v-for="grade in ALL_GRADES" :key="grade" cols="6" sm="4" md="2">
                <div class="text-center pa-2">
                  <div class="text-h6 font-weight-bold mb-1">{{ grade }}</div>
                  <v-progress-circular
                    :model-value="getRatingPercentage(grade)"
                    :size="60"
                    :width="6"
                    :color="grade <= 1 ? 'error' : grade <= 3 ? 'warning' : 'success'"
                    class="mb-2"
                  >
                    {{ getRatingPercentage(grade) }}%
                  </v-progress-circular>
                  <div class="text-caption text-grey">
                    {{ statistics.ratingDistribution[grade] }}
                    {{ $t('learning.summary.times') }}
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
