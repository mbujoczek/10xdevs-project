import { useNotifications } from '@/composables/useNotifications'
import { useAuthStore } from '@/features/authentication/store'
import i18n from '@/i18n'
import router from '@/router'
import { useUiStore } from '@/store/ui.store'
import { extractValidationErrors, mapErrorToI18nKey } from '@/utils/errorMapping'
import axios, { type AxiosError } from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const uiStore = useUiStore()
    uiStore.startLoading()

    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    const uiStore = useUiStore()
    uiStore.stopLoading()
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => {
    const uiStore = useUiStore()
    uiStore.stopLoading()
    return response
  },
  (error: AxiosError) => {
    const authStore = useAuthStore()

    const uiStore = useUiStore()
    uiStore.stopLoading()

    const { showError } = useNotifications()
    const errorMapping = mapErrorToI18nKey(error)

    const translatedMessage = i18n.global.t(errorMapping.messageKey)

    const message =
      translatedMessage !== errorMapping.messageKey
        ? translatedMessage
        : errorMapping.fallbackMessage

    const validationErrors = extractValidationErrors(error)
    if (validationErrors) {
      const firstError = Object.values(validationErrors)[0]
      if (firstError && firstError.length > 0 && firstError[0]) {
        showError(firstError[0])
      } else {
        showError(message)
      }
    } else {
      showError(message)
    }

    if (error.response?.status === 401) {
      authStore.logout()
      router.push('/login')
    }

    return Promise.reject(error)
  },
)

export default api
