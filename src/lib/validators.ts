export function isIsoCountryCode(value: string) {
  return /^[A-Za-z]{2}$/.test(value.trim())
}
