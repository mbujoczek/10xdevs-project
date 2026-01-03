<script setup lang="ts">
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import { useAuthStore } from '@/features/authentication/store'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const { t } = useI18n()

const drawer = ref(false)

const handleLogout = async () => {
  authStore.logout()
  await router.push('/login')
  drawer.value = false
}

const closeDrawer = () => {
  drawer.value = false
}
</script>

<template>
  <v-app-bar app color="primary" dark>
    <template v-slot:prepend>
      <v-app-bar-nav-icon class="ml-2 d-md-none" @click="drawer = !drawer" />
    </template>

    <v-toolbar-title class="mr-4 overflow-x">
      {{ t('app.name') }}
    </v-toolbar-title>

    <v-spacer class="d-none d-md-flex" />

    <div class="d-none d-md-flex">
      <v-btn text :to="{ name: 'dashboard' }" :active="$route.name === 'dashboard'">
        {{ t('nav.dashboard') }}
      </v-btn>

      <v-btn text :to="{ name: 'flashcards' }" :active="$route.name === 'flashcards'">
        {{ t('nav.myFlashcards') }}
      </v-btn>

      <v-btn
        text
        :to="{ name: 'generate' }"
        :active="$route.name === 'generate' || $route.name === 'review'"
      >
        {{ t('nav.generate') }}
      </v-btn>

      <v-btn text :to="{ name: 'statistics' }" :active="$route.name === 'statistics'">
        {{ t('nav.statistics') }}
      </v-btn>
    </div>

    <v-spacer />

    <LanguageSwitcher class="mr-4 d-none d-md-flex" />

    <v-btn text class="mr-2 d-none d-md-inline-flex" @click="handleLogout">
      {{ t('nav.logout') }}
    </v-btn>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" temporary app>
    <v-list nav density="compact">
      <v-list-item :to="{ name: 'dashboard' }" @click="closeDrawer">
        <v-list-item-title>{{ t('nav.dashboard') }}</v-list-item-title>
      </v-list-item>

      <v-list-item :to="{ name: 'flashcards' }" @click="closeDrawer">
        <v-list-item-title>{{ t('nav.myFlashcards') }}</v-list-item-title>
      </v-list-item>

      <v-list-item :to="{ name: 'generate' }" @click="closeDrawer">
        <v-list-item-title>{{ t('nav.generate') }}</v-list-item-title>
      </v-list-item>

      <v-list-item :to="{ name: 'statistics' }" @click="closeDrawer">
        <v-list-item-title>{{ t('nav.statistics') }}</v-list-item-title>
      </v-list-item>

      <v-divider class="my-2" />

      <v-list-item>
        <v-list-item-title class="d-flex justify-center">
          <LanguageSwitcher />
        </v-list-item-title>
      </v-list-item>

      <v-divider class="my-2" />

      <v-list-item @click="handleLogout">
        <v-list-item-title>{{ t('nav.logout') }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
