export type CurrencyCode = 'EUR' | 'USD' | 'CLP' | 'GBP'

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'EUR', label: 'EUR (€)', symbol: '€' },
  { code: 'USD', label: 'USD ($)', symbol: '$' },
  { code: 'CLP', label: 'CLP ($)', symbol: '$' },
  { code: 'GBP', label: 'GBP (£)', symbol: '£' },
]

const SYMBOL_MAP: Record<CurrencyCode, string> = {
  EUR: '€',
  USD: '$',
  CLP: '$',
  GBP: '£',
}

export function getCurrencySymbol(currency?: string): string {
  return SYMBOL_MAP[currency as CurrencyCode] ?? '€'
}
