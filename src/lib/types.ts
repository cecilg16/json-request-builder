export interface ManualFields {
  ProviderId: string
  ProviderName: string
  MockVariable: string
  AccountNumber: string
  CountryTo: string
}

export interface StatusOption {
  code: string
  description: string
}

export interface FlattenedField {
  path: string
  value: unknown
}

export interface ResponseItem {
  AccountNumber?: number | string
  BeneficiaryAccountName?: string
  BeneficiaryAccountNumber?: string | number
  BeneficiaryFamilyName?: string
  BeneficiaryGivenNames?: string
  ProviderStatusCode?: string
  ProviderStatusDescription?: string
  [key: string]: unknown
}

export interface JsonRequestPayload {
  ProviderId?: number | string
  ProviderName?: string
  MockVariable?: string
  CountryTo?: string
  Responses?: ResponseItem[]
  [key: string]: unknown
}
