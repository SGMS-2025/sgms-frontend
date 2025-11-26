import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../constants/locales/en.json';
import vi from '../constants/locales/vi.json';

const resources = {
  en: { translation: en },
  vi: { translation: vi }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // default language
  fallbackLng: {
    en: ['en', 'vi'],
    vi: ['vi', 'en'],
    default: ['en', 'vi']
  },
  interpolation: {
    escapeValue: false, // react already safes from xss
    formatSeparator: ',',
    format: function (value, format, _lng) {
      if (format === 'uppercase') return value.toUpperCase();
      return value;
    }
  }
});

export default i18n;
