<script setup lang="ts">
interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
  color?: string
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'elevated',
  color: 'primary',
  size: 'default',
  disabled: false,
  loading: false,
  block: false,
})
</script>

<template>
  <v-btn
    :type="type"
    :variant="variant"
    :color="color"
    :size="size"
    :disabled="disabled"
    :loading="loading"
    :block="block"
  >
    <slot />
  </v-btn>
</template>
