import type { TranslationDictionary } from './qq';

let activeDict: TranslationDictionary | null = null;

export function setActiveDict(dict: TranslationDictionary) {
  activeDict = dict;
}

export function getActiveDict(): TranslationDictionary | null {
  return activeDict;
}

