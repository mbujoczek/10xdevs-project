import type { AxiosError } from 'axios'

export interface ErrorMapping {
  messageKey: string
  fallbackMessage: string
}

const ERROR_TYPE_MAP: Record<string, string> = {
  'Invalid Credentials': 'errors.api.invalidCredentials',
  'Not Found': 'errors.api.notFound',
  Forbidden: 'errors.api.forbidden',
  Conflict: 'errors.api.conflict',
  'Username Already Exists': 'errors.api.usernameExists',
  'Bad Request': 'errors.api.badRequest',
  'Validation Failed': 'errors.api.validationFailed',
  'AI Service Unavailable': 'errors.api.aiServiceUnavailable',
  'Internal Server Error': 'errors.api.internalServerError',
}

const STATUS_CODE_MAP: Record<number, string> = {
  400: 'errors.api.badRequest',
  401: 'errors.api.unauthorized',
  403: 'errors.api.forbidden',
  404: 'errors.api.notFound',
  409: 'errors.api.conflict',
  500: 'errors.api.internalServerError',
  503: 'errors.api.serviceUnavailable',
}

export function mapErrorToI18nKey(error: AxiosError): ErrorMapping {
  if (!error.response) {
    return {
      messageKey: 'errors.api.networkError',
      fallbackMessage: 'No network connection. Please check your internet connection.',
    }
  }

  const status = error.response.status
  const problemDetails = error.response.data as Record<string, unknown>

  if (
    problemDetails?.title &&
    typeof problemDetails.title === 'string' &&
    ERROR_TYPE_MAP[problemDetails.title]
  ) {
    return {
      messageKey: ERROR_TYPE_MAP[problemDetails.title]!,
      fallbackMessage: (problemDetails.detail as string) || problemDetails.title,
    }
  }

  if (STATUS_CODE_MAP[status]) {
    return {
      messageKey: STATUS_CODE_MAP[status],
      fallbackMessage: (problemDetails?.detail as string) || `HTTP ${status} error occurred.`,
    }
  }

  return {
    messageKey: 'errors.api.genericError',
    fallbackMessage: 'An unexpected error occurred. Please try again.',
  }
}

export function extractValidationErrors(error: AxiosError): Record<string, string[]> | null {
  const problemDetails = error.response?.data as Record<string, unknown>

  if (problemDetails?.errors && typeof problemDetails.errors === 'object') {
    return problemDetails.errors as Record<string, string[]>
  }

  return null
}
