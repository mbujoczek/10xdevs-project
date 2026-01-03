import { getGenerationAcceptance as fetchGenerationAcceptance } from '@/api/statistics.api'
import type { GenerationAcceptanceResponse } from '@/types/statistics.types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useStatisticsStore = defineStore('statisticsStore', () => {
  const acceptanceData = ref<GenerationAcceptanceResponse | null>(null)

  const hasData = computed(() => acceptanceData.value !== null)

  const formattedAcceptanceRate = computed(() => {
    if (!acceptanceData.value) return '0%'
    return `${(acceptanceData.value.acceptanceRate * 100).toFixed(1)}%`
  })

  const formattedPureAcceptanceRate = computed(() => {
    if (!acceptanceData.value) return '0%'
    return `${(acceptanceData.value.pureAcceptanceRate * 100).toFixed(1)}%`
  })

  const formattedTargetRate = computed(() => {
    if (!acceptanceData.value) return '0%'
    return `${(acceptanceData.value.targetRate * 100).toFixed(1)}%`
  })

  const getGenerationAcceptance = async (): Promise<void> => {
    const response = await fetchGenerationAcceptance()
    acceptanceData.value = response
  }

  const resetState = (): void => {
    acceptanceData.value = null
  }

  return {
    acceptanceData,
    hasData,
    formattedAcceptanceRate,
    formattedPureAcceptanceRate,
    formattedTargetRate,
    getGenerationAcceptance,
    resetState,
  }
})
