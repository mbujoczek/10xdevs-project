<script setup lang="ts">
interface Props {
  modelValue: boolean
  flashcardQuestion: string
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="text-h6">
        {{ $t('flashcards.deleteDialog.title') }}
      </v-card-title>

      <v-card-text>
        <p class="mb-4">{{ $t('flashcards.deleteDialog.message') }}</p>
        <v-alert type="warning" variant="tonal" class="mb-0">
          <div class="text-subtitle-2 mb-1">{{ $t('flashcards.card.question') }}</div>
          <div class="text-body-2">{{ flashcardQuestion }}</div>
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="$emit('update:modelValue', false)">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn color="error" variant="flat" @click="$emit('confirm')">
          {{ $t('common.delete') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
