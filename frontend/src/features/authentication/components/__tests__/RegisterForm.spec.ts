import en from '@/i18n/locales/en.json'
import pl from '@/i18n/locales/pl.json'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import RegisterForm from '../RegisterForm.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    pl,
  },
})

const vuetify = createVuetify({
  components,
  directives,
})

describe('RegisterForm.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mountComponent = (props = {}) => {
    return mount(RegisterForm, {
      global: {
        plugins: [i18n, vuetify],
        stubs: {
          VForm: {
            template: '<form><slot /></form>',
            methods: {
              validate: () => Promise.resolve({ valid: true }),
            },
          },
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
    expect(button.text()).toBe('Sign up')
  })

  it('disables submit button when form is empty', async () => {
    const wrapper = mountComponent()

    const button = wrapper.findComponent({ name: 'VBtn' })
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('disables submit button when username is too short', async () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    expect(inputs.length).toBe(2)

    await inputs[0]!.setValue('')
    await inputs[1]!.setValue('password123')
    await wrapper.vm.$nextTick()

    const button = wrapper.findComponent({ name: 'VBtn' })
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('disables submit button when username contains spaces', async () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    expect(inputs.length).toBe(2)

    await inputs[0]!.setValue('test user')
    await inputs[1]!.setValue('password123')
    await wrapper.vm.$nextTick()

    const button = wrapper.findComponent({ name: 'VBtn' })
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('disables submit button when username exceeds 50 characters', async () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    expect(inputs.length).toBe(2)

    await inputs[0]!.setValue('a'.repeat(51))
    await inputs[1]!.setValue('password123')
    await wrapper.vm.$nextTick()

    const button = wrapper.findComponent({ name: 'VBtn' })
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('disables submit button when password is too short', async () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    expect(inputs.length).toBe(2)

    await inputs[0]!.setValue('testuser')
    await inputs[1]!.setValue('pass')
    await wrapper.vm.$nextTick()

    const button = wrapper.findComponent({ name: 'VBtn' })
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('enables submit button when all fields are valid', async () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    expect(inputs.length).toBe(2)

    await inputs[0]!.setValue('testuser')
    await inputs[1]!.setValue('password123')
    await wrapper.vm.$nextTick()

    const button = wrapper.findComponent({ name: 'VBtn' })
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('emits submit event with data when form is submitted', async () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    expect(inputs.length).toBe(2)

    await inputs[0]!.setValue('testuser')
    await inputs[1]!.setValue('password123')
    await wrapper.vm.$nextTick()

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]).toEqual([
      { username: 'testuser', password: 'password123' },
    ])
  })

  it('trims whitespace from username before submit', async () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    expect(inputs.length).toBe(2)

    await inputs[0]!.setValue('  testuser  ')
    await inputs[1]!.setValue('password123')
    await wrapper.vm.$nextTick()

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('submit')?.[0]).toEqual([
      { username: 'testuser', password: 'password123' },
    ])
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

  it('validates username is required', () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    expect(inputs.length).toBe(2)

    const usernameRules = inputs[0]!.props('rules') as Array<(v: string) => boolean | string>
    expect(usernameRules).toBeDefined()
    expect(usernameRules[0]!('')).toBe('This field is required')
    expect(usernameRules[0]!('testuser')).toBe(true)
  })

  it('validates username max length', () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    const usernameRules = inputs[0]!.props('rules') as Array<(v: string) => boolean | string>

    expect(usernameRules[1]!('a'.repeat(51))).toBe('Username must not exceed 50 characters')
    expect(usernameRules[1]!('a'.repeat(50))).toBe(true)
  })

  it('validates username has no whitespace', () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    const usernameRules = inputs[0]!.props('rules') as Array<(v: string) => boolean | string>

    expect(usernameRules[2]!('test user')).toBe('Username cannot contain spaces')
    expect(usernameRules[2]!('testuser')).toBe(true)
  })

  it('validates password is required', () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    const passwordRules = inputs[1]!.props('rules') as Array<(v: string) => boolean | string>

    expect(passwordRules[0]!('')).toBe('This field is required')
    expect(passwordRules[0]!('password')).toBe(true)
  })

  it('validates password minimum length', () => {
    const wrapper = mountComponent()

    const inputs = wrapper.findAllComponents({ name: 'VTextField' })
    const passwordRules = inputs[1]!.props('rules') as Array<(v: string) => boolean | string>

    expect(passwordRules[1]!('pass')).toBe('Password must be at least 8 characters long')
    expect(passwordRules[1]!('password123')).toBe(true)
  })
})
