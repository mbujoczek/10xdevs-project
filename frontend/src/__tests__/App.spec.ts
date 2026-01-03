import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
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
      component: { template: '<div>Home</div>' },
    },
  ],
})

const vuetify = createVuetify({
  components,
  directives,
})

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mounts and renders properly', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router, vuetify],
      },
    })

    expect(wrapper.findComponent({ name: 'VApp' }).exists()).toBe(true)
  })
})
