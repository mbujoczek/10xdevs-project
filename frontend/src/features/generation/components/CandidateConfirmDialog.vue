<script setup lang="ts">
import type { CandidateWithStatus } from '@/features/generation/store'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue: boolean
  action: 'accept' | 'edit' | 'reject'
  candidate: CandidateWithStatus | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()

const { t } = useI18n()

const dialogTitle = computed(() => {
  return t('review.confirmDialog.title')
})

const dialogMessage = computed(() => {
  switch (props.action) {
    case 'accept':
      return t('review.confirmDialog.acceptMessage')
    case 'edit':
      return t('review.confirmDialog.editMessage')
    case 'reject':
      return t('review.confirmDialog.rejectMessage')
    default:
      return ''
  }
})

function handleCancel() {
  emit('update:modelValue', false)
}

function handleConfirm() {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title role="heading" class="text-h6">
        {{ dialogTitle }}
      </v-card-title>

      <v-card-text class="text-body-1">
        {{ dialogMessage }}
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">
          {{ t('review.confirmDialog.cancel') }}
        </v-btn>
        <v-btn color="primary" variant="flat" @click="handleConfirm">
          {{ t('review.confirmDialog.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
