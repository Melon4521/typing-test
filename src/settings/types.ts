export const LANGS = ['ru', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(value: unknown): value is Lang {
  return (
    typeof value === 'string' && (LANGS as readonly string[]).includes(value)
  );
}

export const MODES = ['words', 'time'] as const;
export type Mode = (typeof MODES)[number];

export function isMode(value: unknown): value is Mode {
  return (
    typeof value === 'string' && (MODES as readonly string[]).includes(value)
  );
}

// NOTE: В проде поменять на 25 | 50 | 75 | 100
export const WORDS_VALUES = [5, 25, 75, 100] as const;
export type WordsValue = (typeof WORDS_VALUES)[number];

export function isWordsValue(value: unknown): value is WordsValue {
  return (
    typeof value === 'number' &&
    (WORDS_VALUES as readonly number[]).includes(value)
  );
}

export const TIME_VALUES = [15, 30, 60, 120] as const;
export type TimeValue = (typeof TIME_VALUES)[number];

export function isTimeValue(value: unknown): value is TimeValue {
  return (
    typeof value === 'number' &&
    (TIME_VALUES as readonly number[]).includes(value)
  );
}
