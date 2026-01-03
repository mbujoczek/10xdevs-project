import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import LoginForm from '../LoginForm.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      auth: {
        login: {
          username: 'Username',
          password: 'Password',
          submit: 'Log In',
        },
      },
      validation: {
        required: 'This field is required',
      },
    },
  },
})

const vuetify = createVuetify({
  components,
  directives,
})

describe('LoginForm.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mountComponent = (props = {}) => {
    return mount(LoginForm, {
      global: {
        plugins: [i18n, vuetify],
        stubs: {
          VForm: false,
        },
      },
      props,
    })
  }

  it('renders username and password inputs', () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    expect(inputs).toHaveLength(2)
  })

  it('renders submit button with correct text', () => {
    const wrapper = mountComponent()

    const button = wrapper.findComponent({ name: 'VBtn' })
    expect(button.text()).toBe('Log In')
  })

  it('disables submit button when form is empty', async () => {
    const wrapper = mountComponent()

    const button = wrapper.findComponent({ name: 'VBtn' })
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('enables submit button when both fields are filled', async () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    expect(inputs.length).toBe(2)

    await inputs[0]!.setValue('testuser')
    await inputs[1]!.setValue('testpassword')
    await wrapper.vm.$nextTick()

    const button = wrapper.findComponent({ name: 'VBtn' })
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('emits submit event with credentials when form is submitted', async () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    expect(inputs.length).toBe(2)

    await inputs[0]!.setValue('testuser')
    await inputs[1]!.setValue('testpassword')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]).toEqual([
      { username: 'testuser', password: 'testpassword' },
    ])
  })

  it('trims whitespace from username', async () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    expect(inputs.length).toBe(2)

    await inputs[0]!.setValue('  testuser  ')
    await inputs[1]!.setValue('testpassword')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      { username: 'testuser', password: 'testpassword' },
    ])
  })

  it('does not emit submit when form is invalid', async () => {
    const wrapper = mountComponent()

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('username input has autofocus attribute', () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    expect(inputs.length).toBe(2)
    expect(inputs[0]!.props('autofocus')).toBe(true)
  })

  it('password input has type password', () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    expect(inputs.length).toBe(2)
    expect(inputs[1]!.props('type')).toBe('password')
  })
})
