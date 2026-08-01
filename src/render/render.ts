import { generateText } from '../text/textGenerator';
import type { TextsCfg } from '../text/textsConfig';
import type { Elements } from './dom';

/**
 * Renders DOM for an actual test state.
 *
 * @param els - The DOM elements used by the typing test.
 * @param state - State of running test.
 */
function renderTest(els: Elements, state: TestState) {
  // Clear visual text
  els.visualText.innerHTML = '';

  for (
    let wordIndex = 0;
    wordIndex <
    [...state.typedWords, state.activeWord === null ? '' : state.activeWord]
      .length;
    wordIndex++
  ) {
    const wordSpan = document.createElement('span');

    // If it isn't the last word that user has just started typing
    if (!(wordIndex === state.typedWords.length && state.activeWord === null)) {
      // Get key of an iterable word for state.statistic
      const statisticKey = state.words.slice(0, wordIndex + 1).join(' ');
      const word = state.words[wordIndex];
      const wordStatistic = state.statistic[statisticKey];
      const currentlyTyped = wordStatistic.currentlyTyped;
      const wordInPassiveText = els.passiveText.querySelector(
        `[data-key="${statisticKey}"]`,
      ) as HTMLSpanElement;

      // Change passive text
      wordInPassiveText.textContent =
        currentlyTyped.replaceAll(' ', '_') +
        word.slice(currentlyTyped.length) +
        wordStatistic.incorrectTypedCharsInEnd;

      for (let charIndex = 0; charIndex < currentlyTyped.length; charIndex++) {
        const charSpan = document.createElement('span');
        const isCharCorrect = currentlyTyped[charIndex] === word[charIndex];

        charSpan.textContent =
          currentlyTyped[charIndex] === ' ' ? '_' : currentlyTyped[charIndex];
        charSpan.classList.add(
          isCharCorrect ? 'correct-char' : 'incorrect-char',
        );

        wordSpan.append(charSpan);
      }

      if (wordStatistic.incorrectTypedCharsInEnd !== '') {
        const incorrectTypedCharsSpan = document.createElement('span');

        incorrectTypedCharsSpan.textContent =
          wordStatistic.incorrectTypedCharsInEnd;
        incorrectTypedCharsSpan.classList.add('incorrect-char');
        incorrectTypedCharsSpan.classList.add('incorrect-in-end');
        wordSpan.append(incorrectTypedCharsSpan);
      }
    }

    // Add space before current word (if it isn't first word)
    if (wordIndex !== 0) {
      els.visualText.append(' ');
    }

    els.visualText.append(wordSpan);
  }

  // Add typingCaret into the last word
  if (els.visualText.children.length !== 0) {
    const activeWordSpan = els.visualText.lastElementChild as HTMLSpanElement;

    activeWordSpan.classList.add('active-word');
    activeWordSpan.append(els.typingCaret);
    updateScrollPosition(els, activeWordSpan);
  }
}

/**
 * Renders screen with statistics of finished test.
 *
 * @param stats - Statistics of finished test.
 */
function renderTestStatistics(stats: TestStatistics) {
  console.log(stats);
}

/**
 * Sets DOM initial state and attaches listeners to the typingInput element with test logic.
 *
 * @param els - The DOM elements used by the typing test.
 * @param textsCfg - The configuration of texts.
 */
export function newTest(els: Elements, textsCfg: TextsCfg) {
  const text = generateText(textsCfg);
  const state = newTestState(text, settingsStore.getMode());

  els.typingInput.focus();
  els.typingInput.value = '';
  els.typingInput.onblur = null;

  els.visualText.innerHTML = '';

  // Attach a click listener to abort test
  els.btnRepeat.onclick = () => {
    console.log('Прерывание теста...');

    if (state.abortTimeoutId !== null) {
      clearTimeout(state.abortTimeoutId);
    }

    abortTest(state, els, textsCfg);
  };

  // Move typingCaret into the textBody element
  els.textBody.append(els.typingCaret);

  // Show the typingCaret
  if (els.typingCaret.classList.contains('_hidden')) {
    els.typingCaret.classList.remove('_hidden');
  }

  initPassiveText(els, text);

  // Pasting in input is forbidden
  els.typingInput.onpaste = e => {
    e.preventDefault();
  };

  // Extra actions on key pressed before input event handler
  els.typingInput.onkeydown = e => {
    // If user wants to type another char (of length 1) in the end of the word and limit is already reached
    if (
      state.incorrectTypedCharsInEndCount > 5 &&
      e.key.length === 1 &&
      e.key !== ' '
    ) {
      e.preventDefault();
    }

    // Arrow/Delete keys were pressed - ignore them
    if (
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete'].includes(
        e.code,
      )
    ) {
      e.preventDefault();
    }

    // Move to the previous word, that was incorrect typed
    if (
      e.code === 'Backspace' &&
      !e.ctrlKey &&
      els.typingInput.value.length === 0 &&
      state.currentWordIndex !== 0 &&
      state.lastIncorrectWord !== null
    ) {
      e.preventDefault();

      els.typingInput.value = state.lastIncorrectWord.value;
      state.newInputLength = state.prevInputLength =
        els.typingInput.value.length;
      state.currentWordIndex = state.lastIncorrectWord.wordIndex;
      state.currentCharIndex = state.lastIncorrectWord.charIndex;
      state.activeWord = state.words[state.currentWordIndex];
      state.incorrectTypedCharsInEndCount =
        state.lastIncorrectWord.incorrectTypedCharsInEndCount;
      state.typedWords.pop();
      state.startTime = Date.now();
      state.lastIncorrectWord = null;

      renderTest(els, state);
    }

    // Ctrl + Backspace - fully erase typed word
    if (
      e.code === 'Backspace' &&
      e.ctrlKey &&
      els.typingInput.value.length != 0
    ) {
      e.preventDefault();

      els.typingInput.value = '';
      state.currentCharIndex = state.prevInputLength = state.newInputLength = 0;

      // Get key of current word for state.statistic
      const statisticKey =
        state.currentWordIndex === 0
          ? state.words[0]
          : state.typedWords.join(' ') +
            ' ' +
            state.words[state.currentWordIndex];
      const wordStatistic = state.statistic[statisticKey];

      wordStatistic.corrects.length = 0;
      wordStatistic.incorrects.length = 0;
      wordStatistic.incorrectTypedCharsInEnd = '';
      wordStatistic.currentlyTyped = '';

      for (const [key, value] of Object.entries(wordStatistic.chars)) {
        if (typeof value === 'number') {
          delete wordStatistic.chars[key];
        }
      }

      state.startTime = Date.now();
      state.incorrectTypedCharsInEndCount = 0;

      renderTest(els, state);
    }
  };

  // Start the test when user input in typingInput
  els.typingInput.oninput = function (e) {
    // Interrupt the test when typingInput has been out of focus for more than 5 seconds
    // !!! Restore in production
    /* if (els.typingInput.onblur == null) {
      els.typingInput.onblur = () => {
        console.log('Прерывание теста через 5 секунд.');
        testState.abortTimeoutId = setTimeout(() => {
          els.typingInput.onfocus = null;
          abortTest(testState, els, textsCfg, mode);
        }, 5000);

        els.typingInput.onfocus = () => {
          if (testState.abortTimeoutId !== null) {
            console.log('Отмена прерывания.');
            clearTimeout(testState.abortTimeoutId);
            testState.abortTimeoutId = null;
          }
        };
      };
    } */

    // Get key of current word for state.statistic
    const statisticKey =
      state.currentWordIndex === 0
        ? state.words[0]
        : state.typedWords.join(' ') +
          ' ' +
          state.words[state.currentWordIndex];

    // If it is start of the test
    if (state.currentWordIndex === 0 && state.currentCharIndex === 0) {
      // Hide the settingsPanel
      if (!els.settingsPanel.classList.contains('_hidden')) {
        settingsPanelHide(els.settingsPanel, true);
      }

      // Show the repeat button
      if (els.btnRepeat.classList.contains('_hidden')) {
        els.btnRepeat.classList.remove('_hidden');
      }

      // Activate the typingCaret
      if (!els.typingCaret.classList.contains('_active')) {
        els.typingCaret.classList.add('_active');
      }

      // Set finish timeout in time mode when test starts
      if (state.mode === 'time') {
        const finishMilliseconds = settingsStore.getValue(state.mode) * 1000;

        // Remove listeners from typingInput, shows settingsPanel and calculate stats with finishTest function
        state.finishTimeoutId = setTimeout(() => {
          els.typingInput.oninput = null;
          els.typingInput.onkeydown = null;

          settingsPanelHide(els.settingsPanel, false);

          state.endTime = Date.now();

          if (state.lastIncorrectWord !== null) {
            const prevWordStatistic =
              state.statistic[state.typedWords.join(' ')];

            for (const key of prevWordStatistic.incorrects) {
              prevWordStatistic.chars[key] =
                state.endTime - Number(prevWordStatistic.chars[key]);
            }
          }

          if (state.activeWord !== null) {
            // Get key of current word for state.statistic
            const statisticKey =
              state.currentWordIndex === 0
                ? state.words[0]
                : state.typedWords.join(' ') +
                  ' ' +
                  state.words[state.currentWordIndex];
            const wordStatistic = state.statistic[statisticKey];

            if (wordStatistic.incorrects.length !== 0) {
              for (const key of wordStatistic.incorrects) {
                wordStatistic.chars[key] =
                  state.endTime - Number(wordStatistic.chars[key]);
              }
            }
          }

          const testStatistics = finishTest(state);

          renderTestStatistics(testStatistics);
        }, finishMilliseconds);
      }
    }

    if (state.activeWord === null) {
      state.currentCharIndex = 0;
      state.prevInputLength = 0;
      state.newInputLength = 0;
      state.activeWord = state.words[state.currentWordIndex];

      state.statistic[statisticKey] = {
        currentlyTyped: '',
        corrects: [],
        incorrects: [],
        chars: {},
        incorrectTypedCharsInEnd: '',
      };

      if (state.currentWordIndex === 0) {
        state.startTime = Date.now();
      }
    }

    state.newInputLength = els.typingInput.value.length;

    // Length increased - a char was typed
    if (state.newInputLength - state.prevInputLength > 0 && e.data !== null) {
      const { shoudCleanInput, testStatistics } = typeChar(state, e.data);

      if (shoudCleanInput) {
        els.typingInput.value = '';
      }

      if (testStatistics !== null) {
        els.typingInput.oninput = null;
        els.typingInput.onkeydown = null;

        settingsPanelHide(els.settingsPanel, false);

        renderTestStatistics(testStatistics);
      }
    } else {
      // Length decreased - a character was deleted
      deleteChar(state);
    }

    renderTest(els, state);
  };
}

/**
 * Aborts running test by creating new test.
 *
 * Hides btnRepeat, shows settingsPanel and clears finishTimeoutId if current mode is `time`
 *
 * @param testState - Test state object of running typing test.
 * @param els - The DOM elements used by the typing test.
 * @param textsCfg - The configuration of texts.
 */
function abortTest(state: TestState, els: Elements, textsCfg: TextsCfg) {
  console.log('Тест прерван.');

  // Hide the btnRepeat
  if (!els.btnRepeat.classList.contains('_hidden')) {
    els.btnRepeat.classList.add('_hidden');
  }

  // Show the settings panel
  settingsPanelHide(els.settingsPanel, false);

  if (state.mode === 'time' && state.finishTimeoutId !== null) {
    clearTimeout(state.finishTimeoutId);
  }

  // Create new test
  newTest(els, textsCfg);
}

/**
 * Attaches focus and blur listeners to the typing input before the test starts.
 *
 * Allows the user to focus the input either by clicking the placeholder or by pressing
 * any printable key when the placeholder is active.
 *
 * @param els - The DOM elements used by the typing test.
 */
export function setFocusActionsOnTypingInput(els: Elements) {
  els.typingInput.focus();

  const isPlaceholderBlur = () =>
    els.textPlaceholder.classList.contains('_blur');

  els.typingInput.addEventListener('blur', () => {
    if (!isPlaceholderBlur()) {
      els.textPlaceholder.classList.add('_blur');

      els.textPlaceholder.onclick = () => els.typingInput.focus();
      document.addEventListener('keydown', onKeyDown);
    }
  });

  els.typingInput.addEventListener('focus', () => {
    if (isPlaceholderBlur()) {
      els.textPlaceholder.classList.remove('_blur');

      els.textPlaceholder.onclick = null;
      document.removeEventListener('keydown', onKeyDown);
    }
  });

  /**
   * Focuses the typing input when the user presses a printable key while the placeholder is active.
   *
   * @param e - The keyboard event that triggered the handler.
   */
  function onKeyDown(e: KeyboardEvent) {
    if (
      ![
        'Tab',
        'Enter',
        'Space',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
      ].includes(e.code) &&
      !e.shiftKey &&
      !e.altKey &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      e.preventDefault();
      els.typingInput.focus();
    }
  }
}

/**
 * Builds the passive text view by inserting the generated words and spaces into the DOM.
 *
 * @param els - The DOM elements used to render the passive text.
 * @param text - The array of words that should be displayed.
 */
function initPassiveText(els: Elements, text: string[]) {
  els.passiveText.innerHTML = '';
  let wordKey = '';

  for (const word of text) {
    wordKey += word;

    const span = document.createElement('span');
    span.textContent = word;
    span.dataset.key = wordKey;

    const space = document.createElement('span');
    space.textContent = ' ';

    els.passiveText.append(space, span);

    wordKey += ' ';
  }

  // Remove first space
  els.passiveText.children[0].remove();
}
