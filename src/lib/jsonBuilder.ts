import type { FlattenedField, JsonRequestPayload, ManualFields, StatusOption } from './types'
import { generateUniqueNames } from './fakeNames'

export function parseJsonInput(input: string): JsonRequestPayload {
  const parsed = JSON.parse(input) as JsonRequestPayload
  return parsed
}

export function flattenJsonFields(value: unknown, path = ''): FlattenedField[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => flattenJsonFields(entry, `${path}[${index}]`))
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => {
      const nextPath = path ? `${path}.${key}` : key
      return flattenJsonFields(entry, nextPath)
    })
  }

  return [{ path, value }]
}

export function extractStatusOptions(payload: JsonRequestPayload): StatusOption[] {
  const responses = Array.isArray(payload.Responses) ? payload.Responses : []

  return responses
    .map((item) => ({
      code: String(item.ProviderStatusCode ?? 'UNKNOWN'),
      description: String(item.ProviderStatusDescription ?? 'No description provided'),
    }))
    .filter((item, index, list) => list.findIndex((entry) => entry.code === item.code) === index)
}

function deriveAccountNumber(baseAccountNumber: string | number, statusCode: string): string {
  const digits = String(baseAccountNumber ?? '').replace(/\D/g, '')
  const suffix = String(statusCode ?? '').replace(/\D/g, '').padStart(3, '0').slice(-3)

  if (!digits) {
    return ''
  }

  if (digits.length <= 3) {
    return suffix
  }

  return `${digits.slice(0, -3)}${suffix}`
}

export function applyBusinessRules(
  payload: JsonRequestPayload,
  manualFields: ManualFields,
  selectedStatusCodes?: StatusOption[],
): JsonRequestPayload {
  const nextPayload: JsonRequestPayload = {
    ...payload,
    ProviderId: manualFields.ProviderId || payload.ProviderId || '',
    ProviderName: manualFields.ProviderName || payload.ProviderName || '',
    MockVariable: manualFields.MockVariable || payload.MockVariable || '',
  }

  const responses = Array.isArray(payload.Responses)
    ? payload.Responses.map((item) => ({ ...item }))
    : []

  const statusMap = new Map((selectedStatusCodes ?? []).map((entry) => [entry.code, entry]))
  const generatedNames = generateUniqueNames(responses.length)

  responses.forEach((item, index) => {
    const selected = statusMap.get(String(item.ProviderStatusCode ?? ''))
    if (selected) {
      item.ProviderStatusCode = selected.code
      item.ProviderStatusDescription = selected.description
    }

    const statusCode = String(item.ProviderStatusCode ?? '')
    const accountNumber = deriveAccountNumber(manualFields.AccountNumber || item.AccountNumber || '', statusCode)
    const generatedName = generatedNames[index] ?? generateUniqueNames(1)[0]

    item.AccountNumber = accountNumber
    item.BeneficiaryAccountNumber = accountNumber
    item.BeneficiaryAccountName = `${generatedName.firstName} ${generatedName.lastName}`
    item.BeneficiaryGivenNames = generatedName.firstName
    item.BeneficiaryFamilyName = generatedName.lastName
  })

  nextPayload.Responses = responses
  return nextPayload
}
