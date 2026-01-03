<script setup lang="ts">
defineEmits<{
  create: []
  generate: []
}>()
</script>

<template>
  <v-container class="d-flex flex-column align-center justify-center py-12">
    <v-icon size="120" color="grey-lighten-1" class="mb-6">mdi-cards-outline</v-icon>
    <h2 class="text-h5 text-grey-darken-1 mb-2">{{ $t('flashcards.emptyState.title') }}</h2>
    <p class="text-body-1 text-grey mb-8">{{ $t('flashcards.emptyState.description') }}</p>
    <div class="d-flex flex-column flex-sm-row ga-4">
      <v-btn color="primary" size="large" @click="$emit('create')">
        <v-icon start>mdi-plus</v-icon>
        {{ $t('flashcards.emptyState.createButton') }}
      </v-btn>
      <v-btn variant="outlined" color="primary" size="large" @click="$emit('generate')">
        <v-icon start>mdi-auto-fix</v-icon>
        {{ $t('flashcards.emptyState.generateButton') }}
      </v-btn>
    </div>
  </v-container>
</template>
