import en from '../i18n/en.json';

const LOCALES = { en };
const DEFAULT = 'en';

export function t(key) {
  const locale = DEFAULT;
  return LOCALES[locale][key] || key;
}

export default { t };
