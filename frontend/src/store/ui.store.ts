import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isLoading = ref(false)
  const loadingCount = ref(0)

  const startLoading = () => {
    loadingCount.value++
    isLoading.value = true
  }

  const stopLoading = () => {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
    if (loadingCount.value === 0) {
      isLoading.value = false
    }
  }

  const resetLoading = () => {
    loadingCount.value = 0
    isLoading.value = false
  }

  return {
    isLoading,
    startLoading,
    stopLoading,
    resetLoading,
  }
})
