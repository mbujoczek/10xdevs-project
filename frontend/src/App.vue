<script setup lang="ts">
import { useUiStore } from '@/store/ui.store'
import { storeToRefs } from 'pinia'

const uiStore = useUiStore()
const { isLoading } = storeToRefs(uiStore)
</script>

<template>
  <v-overlay :model-value="isLoading" class="align-center justify-center" persistent>
    <v-progress-circular color="primary" indeterminate size="64" />
  </v-overlay>

  <router-view />
</template>

<style scoped></style>
