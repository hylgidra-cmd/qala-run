import { qq } from './qq';
import { uz } from './uz';
import { kk } from './kk';
import { tr } from './tr';
import { en } from './en';
import type { TranslationDictionary } from './qq';

export type LanguageCode = 'qq' | 'uz' | 'kk' | 'tr' | 'en';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'qq', name: 'Qaraqalpaqsha', flag: '🚩' },
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'kk', name: 'Qazaqsha', flag: '🇰🇿' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

const DICTIONARIES: Record<LanguageCode, TranslationDictionary> = {
  qq,
  uz,
  kk,
  tr,
  en,
};

let currentLang: LanguageCode = (() => {
  const saved = localStorage.getItem('dontstop.lang') as LanguageCode | null;
  if (saved && saved in DICTIONARIES) {
    return saved;
  }
  return 'qq';
})();

const listeners = new Set<(lang: LanguageCode) => void>();

export function getLanguage(): LanguageCode {
  return currentLang;
}

export function setLanguage(lang: LanguageCode) {
  if (lang in DICTIONARIES) {
    currentLang = lang;
    localStorage.setItem('dontstop.lang', lang);
    listeners.forEach((listener) => listener(lang));
  }
}

export function subscribeLanguageChange(listener: (lang: LanguageCode) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveDictionary(): TranslationDictionary {
  return DICTIONARIES[currentLang] ?? qq;
}

export { t } from './qq';
