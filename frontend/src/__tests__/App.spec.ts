import en from '@/i18n/locales/en.json'
import pl from '@/i18n/locales/pl.json'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import App from '../App.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: { template: '<div>Dashboard</div>' },
        },
        {
          path: 'flashcards',
          name: 'flashcards',
          component: { template: '<div>Flashcards</div>' },
        },
        {
          path: 'generate',
          name: 'generate',
          component: { template: '<div>Generate</div>' },
        },
        {
          path: 'statistics',
          name: 'statistics',
          component: { template: '<div>Statistics</div>' },
        },
      ],
    },
  ],
})

const vuetify = createVuetify({
  components,
  directives,
})

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    pl,
  },
})

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mounts and renders properly', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router, vuetify, i18n],
      },
    })

    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true)
  })

  it('renders VApp through DefaultLayout', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router, vuetify, i18n],
        stubs: {
          RouterView: false,
        },
      },
    })

    await router.isReady()
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent({ name: 'VApp' }).exists()).toBe(true)
  })
})
