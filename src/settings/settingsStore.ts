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
} from '../core/types';

const KEYS = {
  lang: 'settings-lang',
  mode: 'settings-mode',
  value: 'settings-value',
} as const;

export interface SettingsStore {
  getLang(): Lang;
  setLang(lang: Lang): void;

  getMode(): Mode;
  setMode(mode: Mode): void;

  getValue(mode: 'words'): WordsValue;
  getValue(mode: 'time'): TimeValue;
  getValue(mode?: Mode): WordsValue | TimeValue;
  setWordsValue(value: WordsValue): void;
  setTimeValue(value: TimeValue): void;

  // ensureValueForMode возвращает значение, соответствующее выбранному mode, и записывает в localStorage
  ensureValueForMode(mode: Mode): WordsValue | TimeValue;
}

/**
 * Gets the stored value for the current or specified mode.
 *
 * @param mode - The mode for which the value should be resolved.
 * @returns The validated value for the selected mode.
 */
function getValue(mode: 'words'): WordsValue;
function getValue(mode: 'time'): TimeValue;
function getValue(mode?: Mode): WordsValue | TimeValue;
function getValue(mode = settingsStore.getMode()): WordsValue | TimeValue {
  const raw = localStorage.getItem(KEYS.value);
  const value = raw === null ? null : Number(raw);

  if (mode === 'words') {
    if (value !== null && !isWordsValue(value)) {
      console.warn(
        `Invalid stored value: "${value}", chosen default: "${WORDS_VALUES[0]}"`,
      );
    }
    return isWordsValue(value) ? value : WORDS_VALUES[0];
  } else {
    if (value !== null && !isTimeValue(value)) {
      console.warn(
        `Invalid stored value: "${value}", chosen default: "${TIME_VALUES[0]}"`,
      );
    }
    return isTimeValue(value) ? value : TIME_VALUES[0];
  }
}

export const settingsStore: SettingsStore = {
  getLang: (): Lang => {
    const lang = localStorage.getItem(KEYS.lang);
    if (lang !== null && !isLang(lang)) {
      console.warn(
        `Invalid stored lang: "${lang}", chosen default: "${LANGS[0]}"`,
      );
    }
    return isLang(lang) ? lang : LANGS[0];
  },
  setLang: (lang: Lang) => localStorage.setItem(KEYS.lang, lang),

  getMode: (): Mode => {
    const mode = localStorage.getItem(KEYS.mode);
    if (mode !== null && !isMode(mode)) {
      console.warn(
        `Invalid stored mode: "${mode}", chosen default: "${MODES[0]}"`,
      );
    }
    return isMode(mode) ? mode : MODES[0];
  },
  setMode: (mode: Mode) => localStorage.setItem(KEYS.mode, mode),

  getValue,
  setWordsValue: (value: WordsValue) =>
    localStorage.setItem(KEYS.value, String(value)),
  setTimeValue: (value: TimeValue) =>
    localStorage.setItem(KEYS.value, String(value)),
  ensureValueForMode: (mode: Mode): WordsValue | TimeValue => {
    const value = getValue(mode);

    if (mode === 'words') {
      settingsStore.setWordsValue(value as WordsValue);
    } else {
      settingsStore.setTimeValue(value as TimeValue);
    }

    return value;
  },
};

/**
 * Initializes the settings storage with defaults when needed.
 */
export function initSettings() {
  if (!isLang(localStorage.getItem(KEYS.lang))) {
    settingsStore.setLang(LANGS[0]);
  }

  if (!isMode(localStorage.getItem(KEYS.mode))) {
    settingsStore.setMode(MODES[0]);
  }

  const mode = settingsStore.getMode();
  const raw = localStorage.getItem(KEYS.value);
  const value = raw === null ? null : Number(raw);
  const isValidValue =
    mode === 'words' ? isWordsValue(value) : isTimeValue(value);

  if (isValidValue) return;

  if (mode === 'words') {
    settingsStore.setWordsValue(WORDS_VALUES[0]);
  } else {
    settingsStore.setTimeValue(TIME_VALUES[0]);
  }
}
