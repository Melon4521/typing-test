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
 * @returns `shoudCleanInput` - Clean typing input or not;
 * @returns `testStatistics` - Object with test stats of finished test or null;
 */
export function typeChar(
  state: TestState,
  char: string,
): {
  shoudCleanInput: boolean;
  testStatistics: TestStatistics | null;
} {
  const currentWord = state.words[state.currentWordIndex];

  // Get key of current word for state.statistic
  const statisticKey =
    state.currentWordIndex === 0
      ? state.words[0]
      : state.typedWords.join(' ') + ' ' + state.words[state.currentWordIndex];
  const wordStatistic = state.statistic[statisticKey];
  const wordState = currentWord.slice(0, state.currentCharIndex + 1);

  // It isn't an end of the word
  if (currentWord[state.currentCharIndex] !== undefined) {
    state.endTime = Date.now();

    // Correct char was typed
    if (char === currentWord[state.currentCharIndex]) {
      wordStatistic.corrects.push(wordState);

      if (wordStatistic.chars[wordState] !== undefined) {
        wordStatistic.chars[wordState] =
          state.endTime - Number(wordStatistic.chars[wordState]);
      } else {
        wordStatistic.chars[wordState] = state.endTime - state.startTime;
      }
    } else {
      // Incorrect char was typed
      wordStatistic.incorrects.push(wordState);
      state.incorrectTypedChars.add(
        state.currentWordIndex == 0
          ? wordState
          : state.typedWords.join(' ') + ' ' + wordState,
      );

      if (wordStatistic.chars[wordState] === undefined) {
        wordStatistic.chars[wordState] = String(state.startTime);
      }
    }

    if (state.currentCharIndex < currentWord.length) {
      wordStatistic.currentlyTyped = wordStatistic.currentlyTyped + char;
    }

    state.currentCharIndex++;
    state.startTime = Date.now();
    state.prevInputLength = state.newInputLength;
  } else {
    // It is an end of the word

    // A space is expected to move to the next word
    if (char === ' ') {
      state.endTime = Date.now();

      if (state.lastIncorrectWord !== null) {
        const prevWordStatistic = state.statistic[state.typedWords.join(' ')];

        for (const key of prevWordStatistic.incorrects) {
          prevWordStatistic.chars[key] =
            state.endTime - Number(prevWordStatistic.chars[key]);
        }
      }

      if (
        wordStatistic.incorrects.length === 0 &&
        state.incorrectTypedCharsInEndCount == 0
      ) {
        state.lastIncorrectWord = null;
      } else {
        state.lastIncorrectWord = {
          value: wordStatistic.currentlyTyped,
          wordIndex: state.currentWordIndex,
          charIndex: state.currentCharIndex,
          incorrectTypedCharsInEndCount: state.incorrectTypedCharsInEndCount,
        };
      }

      state.startTime = Date.now();
      state.currentWordIndex++;
      state.typedWords.push(currentWord);
      state.activeWord = null;
      state.incorrectTypedCharsInEndCount = 0;
      return {
        shoudCleanInput: true,
        testStatistics: null,
      };
    } else {
      // The user typed another char, not space
      if (state.incorrectTypedCharsInEndCount < 5) {
        state.incorrectTypedCharsInEndCount++;
        wordStatistic.incorrectTypedCharsInEnd += char;
        state.currentCharIndex++;
        state.prevInputLength = state.newInputLength;
      }
    }
  }

  // End of the test
  if (
    state.mode === 'words' &&
    state.currentWordIndex === state.words.length - 1 &&
    state.currentCharIndex === currentWord.length
  ) {
    state.endTime = Date.now();

    if (state.lastIncorrectWord !== null) {
      const prevWordStatistic = state.statistic[state.typedWords.join(' ')];

      for (const key of prevWordStatistic.incorrects) {
        prevWordStatistic.chars[key] =
          state.endTime - Number(prevWordStatistic.chars[key]);
      }
    }

    if (wordStatistic.incorrects.length !== 0) {
      for (const key of wordStatistic.incorrects) {
        wordStatistic.chars[key] =
          state.endTime - Number(wordStatistic.chars[key]);
      }
    }

    return {
      shoudCleanInput: false,
      testStatistics: finishTest(state),
    };
  }

  return {
    shoudCleanInput: false,
    testStatistics: null,
  };
}

/**
 * Processes deletion of char by mutating test state.
 *
 * @param state - State of running test.
 */
export function deleteChar(state: TestState) {
  if (state.activeWord !== null) {
    // Get key of current word for state.statistic
    const statisticKey =
      state.currentWordIndex === 0
        ? state.words[0]
        : state.typedWords.join(' ') +
          ' ' +
          state.words[state.currentWordIndex];
    const wordStatistic = state.statistic[statisticKey];

    if (state.currentCharIndex <= state.activeWord.length) {
      const previousWordState = state.activeWord.slice(
        0,
        state.currentCharIndex,
      );

      const correctIndex = wordStatistic.corrects.indexOf(previousWordState);
      if (correctIndex !== -1) {
        wordStatistic.corrects.splice(correctIndex, 1);
      } else {
        const incorrectIndex =
          wordStatistic.incorrects.indexOf(previousWordState);
        if (incorrectIndex !== -1)
          wordStatistic.incorrects.splice(incorrectIndex, 1);
      }

      if (typeof wordStatistic.chars[previousWordState] == 'number') {
        delete wordStatistic.chars[previousWordState];
      }

      state.startTime = Date.now();
    } else {
      state.incorrectTypedCharsInEndCount--;
      wordStatistic.incorrectTypedCharsInEnd =
        wordStatistic.incorrectTypedCharsInEnd.slice(0, -1);
    }

    state.currentCharIndex--;
    state.prevInputLength = state.newInputLength;

    if (state.currentCharIndex < state.activeWord.length) {
      wordStatistic.currentlyTyped = wordStatistic.currentlyTyped.slice(0, -1);
    }
  }
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
