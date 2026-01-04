<script setup lang="ts">
interface Props {
  icon?: string
  title: string
  description: string
  primaryActionLabel?: string
  secondaryActionLabel?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'mdi-information-outline',
})

defineEmits<{
  primaryAction: []
  secondaryAction: []
}>()
</script>

<template>
  <v-container class="d-flex flex-column align-center justify-center py-12">
    <v-icon size="120" color="grey-lighten-1" class="mb-6">{{ icon }}</v-icon>
    <h2 class="text-h5 text-grey-darken-1 mb-2">{{ title }}</h2>
    <p class="text-body-1 text-grey mb-8">{{ description }}</p>
    <div
      v-if="primaryActionLabel || secondaryActionLabel"
      class="d-flex flex-column flex-sm-row ga-4"
    >
      <v-btn v-if="primaryActionLabel" color="primary" size="large" @click="$emit('primaryAction')">
        {{ primaryActionLabel }}
      </v-btn>
      <v-btn
        v-if="secondaryActionLabel"
        variant="outlined"
        color="primary"
        size="large"
        @click="$emit('secondaryAction')"
      >
        {{ secondaryActionLabel }}
      </v-btn>
    </div>
  </v-container>
</template>
