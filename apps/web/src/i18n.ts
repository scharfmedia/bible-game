import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from '@bible/i18n'
import type { Locale } from '@bible/engine'

export function initI18n(locale: Locale = 'en'): typeof i18n {
  void i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: 'en',
    keySeparator: false, // keys are literal dotted strings like "card.strike.name"
    nsSeparator: false,
    interpolation: { escapeValue: false },
  })
  return i18n
}

export { i18n }
