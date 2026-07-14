import {
  isLang,
  isMode,
  isTimeValue,
  isWordsValue,
  LANGS,
  MODES,
  TIME_VALUES,
  WORDS_VALUES,
  type Lang,
  type Mode,
  type TimeValue,
  type WordsValue,
} from './types';

const KEYS = {
  lang: 'settings-lang',
  mode: 'settings-mode',
  value: 'settings-value',
} as const;

export const settingsStore = {
  getLang: (): Lang => {
    const lang = localStorage.getItem(KEYS.lang);
    return isLang(lang) ? lang : LANGS[0];
  },
  setLang: (lang: Lang) => localStorage.setItem(KEYS.lang, lang),

  getMode: (): Mode => {
    const mode = localStorage.getItem(KEYS.mode);
    return isMode(mode) ? mode : MODES[0];
  },
  setMode: (mode: Mode) => localStorage.setItem(KEYS.mode, mode),

  getValue: (mode: Mode = settingsStore.getMode()): WordsValue | TimeValue => {
    const raw = localStorage.getItem(KEYS.value);
    const value = raw === null ? null : Number(raw);

    if (mode === 'words') {
      return isWordsValue(value) ? value : WORDS_VALUES[0];
    } else {
      return isTimeValue(value) ? value : TIME_VALUES[0];
    }
  },
  setWordsValue(value: WordsValue) {
    localStorage.setItem(KEYS.value, String(value));
  },
  setTimeValue(value: TimeValue) {
    localStorage.setItem(KEYS.value, String(value));
  },
};
