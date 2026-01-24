<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

type SupportedLocale = 'en' | 'pl'

const { locale } = useI18n()

const savedLocale = localStorage.getItem('locale') as SupportedLocale | null
if (savedLocale) {
  locale.value = savedLocale
}

watch(locale, (newLocale) => {
  localStorage.setItem('locale', newLocale)
})
</script>

<template>
  <v-btn-toggle v-model="locale" mandatory density="compact">
    <v-btn value="en" size="small"> EN </v-btn>
    <v-btn value="pl" size="small"> PL </v-btn>
  </v-btn-toggle>
</template>
