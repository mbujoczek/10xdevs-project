<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  icon?: string
  color?: string
}

defineProps<Props>()
</script>

<template>
  <v-card elevation="2">
    <v-card-text>
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-subtitle-2 text-medium-emphasis">{{ label }}</div>
        <v-icon v-if="icon" :color="color" size="small">{{ icon }}</v-icon>
      </div>
      <div class="text-h4" :style="{ color: color || 'inherit' }">{{ value }}</div>
    </v-card-text>
  </v-card>
</template>
