import type { Mode, TestState, TestStatistics } from './types';

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

/**
 * Processes addition of typed char by mutating test state.
 *
 * @param state - State of running test.
 * @param char - Added char.
 */
export function typeChar(state: TestState, char: string) {
  console.log('typeChar', state, char);
}

/**
 * Processes deletion of char by mutating test state.
 *
 * @param state - State of running test.
 */
export function deleteChar(state: TestState) {
  console.log('deleteChar', state);
}

/**
 * Calculates final statistics of finished test.
 *
 * @param state - State object of finished test.
 * @returns Statistics of finished test.
 */
export function finishTest(state: TestState): TestStatistics {
  const [totalMilliseconds, totalCharsCount] = Object.values(
    state.statistic,
  ).reduce(
    function ([sum, count], wordStatistic) {
      for (const key in wordStatistic.chars) {
        const timeDelta = wordStatistic.chars[key];
        if (typeof timeDelta === 'number' && timeDelta !== 0) {
          sum += timeDelta;
          count++;
        }
      }

      return [sum, count];
    },
    [0, 0],
  );

  const totalMinutes = totalMilliseconds / 1000 / 60;

  return {
    wpm: state.words.length / totalMinutes,
    cpm: totalCharsCount / totalMinutes,
    accuracy: (1 - state.incorrectTypedChars.size / totalCharsCount) * 100,
    errorStats: state.statistic,
  };
}
