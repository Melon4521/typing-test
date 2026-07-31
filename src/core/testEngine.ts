import type { Mode, TestState } from './types';

/**
 * Creates test state object with defaults for new typing test.
 *
 * @param text - Array of current test's words.
 * @param mode - Current mode of test.
 * @returns Test state object.
 */
export function newTestState(text: string[], mode: Mode): TestState {
  return {
    text: text.join(' '),
    words: [...text],
    chars: text.join(' ').split(''),
    statistic: {},
    mode,
    currentWordIndex: 0,
    currentCharIndex: 0,
    activeWord: null,
    typedWords: [],
    lastIncorrectWord: null,
    incorrectTypedCharsInEndCount: 0,
    incorrectTypedChars: new Set(),
    prevInputLength: 0,
    newInputLength: 0,
    startTime: 0,
    endTime: 0,
    status: 'idle',
    abortTimeoutId: null,
    finishTimeoutId: null,
  };
}
