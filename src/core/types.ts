export const LANGS = ['ru', 'en'] as const;
export type Lang = (typeof LANGS)[number];

/**
 * Checks whether the provided value is a supported language code.
 *
 * @param value - The value to validate.
 * @returns True when the value is one of the supported languages.
 */
export function isLang(value: unknown): value is Lang {
  return (
    typeof value === 'string' && (LANGS as readonly string[]).includes(value)
  );
}

export const MODES = ['words', 'time'] as const;
export type Mode = (typeof MODES)[number];

/**
 * Checks whether the provided value is a supported typing mode.
 *
 * @param value - The value to validate.
 * @returns True when the value is either "words" or "time".
 */
export function isMode(value: unknown): value is Mode {
  return (
    typeof value === 'string' && (MODES as readonly string[]).includes(value)
  );
}

// NOTE: In production, change this to 25 | 50 | 75 | 100
export const WORDS_VALUES = [5, 25, 75, 100] as const;
export type WordsValue = (typeof WORDS_VALUES)[number];

/**
 * Checks whether the provided value is a supported words-count option.
 *
 * @param value - The value to validate.
 * @returns True when the value matches one of the allowed words counts.
 */
export function isWordsValue(value: unknown): value is WordsValue {
  return (
    typeof value === 'number' &&
    (WORDS_VALUES as readonly number[]).includes(value)
  );
}

export const TIME_VALUES = [15, 30, 60, 120] as const;
export type TimeValue = (typeof TIME_VALUES)[number];

/**
 * Checks whether the provided value is a supported time-limit option.
 *
 * @param value - The value to validate.
 * @returns True when the value matches one of the allowed time values.
 */
export function isTimeValue(value: unknown): value is TimeValue {
  return (
    typeof value === 'number' &&
    (TIME_VALUES as readonly number[]).includes(value)
  );
}

export type AllowedWordsCount = WordsValue | 500;

/**
 * Represents state of the typing test.
 */
export interface TestState {
  text: string;
  words: string[];
  chars: string[];
  statistic: Record<string, WordStatistic>;
  mode: Mode;
  currentWordIndex: number;
  currentCharIndex: number;
  activeWord: string | null;
  typedWords: string[];
  lastIncorrectWord: LastIncorrectWord | null;
  incorrectTypedCharsInEndCount: number;
  incorrectTypedChars: Set<string>;
  prevInputLength: number;
  newInputLength: number;
  startTime: number;
  endTime: number;
  status: TestStatus;
  abortTimeoutId: number | null;
  finishTimeoutId: number | null;
}

export type TestStatus = 'idle' | 'running' | 'finished' | 'aborted';

/**
 * Represents statistic of typed word.
 */
export interface WordStatistic {
  corrects: string[];
  incorrects: string[];
  chars: Record<string, number | string>;
  incorrectTypedCharsInEnd: string;
}

/**
 * Represents statistic of previous incorrect typed word.
 */
export interface LastIncorrectWord {
  value: string;
  wordIndex: number;
  charIndex: number;
  incorrectTypedCharsInEndCount: number;
}

/**
 * Represents statistic of finished test.
 */
export interface TestStatistics {
  wpm: number;
  cpm: number;
  accuracy: number;
  errorStats: Record<
    string,
    Pick<WordStatistic, 'incorrects' | 'incorrectTypedCharsInEnd'>
  >;
}
