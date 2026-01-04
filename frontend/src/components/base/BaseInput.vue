<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string | number
  label?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  error?: boolean
  errorMessages?: string | string[]
  rules?: Array<(v: string) => boolean | string>
  required?: boolean
  autofocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  error: false,
  required: false,
  autofocus: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val as string),
})
</script>

<template>
  <v-text-field
    v-model="value"
    :label="label"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :error="error"
    :error-messages="errorMessages"
    :rules="rules"
    :required="required"
    :autofocus="autofocus"
    variant="outlined"
    density="comfortable"
  />
</template>
