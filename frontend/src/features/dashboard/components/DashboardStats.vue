<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  dueCount: number
}

const props = defineProps<Props>()
const { t } = useI18n()
</script>

<template>
  <div>
    <div v-if="props.dueCount === 0" class="text-body-1 text-center">
      {{ t('dashboard.noDue') }}
    </div>
    <div v-else class="text-center">
      <div class="text-h3 mb-2">{{ props.dueCount }}</div>
      <div class="text-body-1">{{ t('dashboard.dueCount', { count: props.dueCount }) }}</div>
    </div>
  </div>
</template>
