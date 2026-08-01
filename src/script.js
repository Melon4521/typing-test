async function main() {
  try {
    // get the settings JSON
    const settingsResponse = await fetch('api/settings.json');

    if (settingsResponse.ok) {
      const settingsJson = await settingsResponse.json();
      settingsPanelInit(settingsJson);
    } else {
      throw new Error('Failed to fetch');
    }

    // get and save the text JSON
    const textsResponse = await fetch('api/texts.json');

    if (textsResponse.ok) {
      const textsJson = await textsResponse.json();
      sessionStorage.setItem('texts-json', JSON.stringify(textsJson));
    } else {
      throw new Error('Failed to fetch');
    }

    setFocusActionsOnTypingInput();

    newTest();
  } catch (err) {
    if (err.message == 'Failed to fetch') {
      console.log(err);
    } else throw err;
  }
}

main();

//<Test>==============================================================================

function newTest() {
  focusTypingInput(); // DONE: code moved

  const typingInput = document.querySelector('#typing-input');
  typingInput.value = '';
  typingInput.onblur = null;

  const visualText = document.querySelector('#visual-text');
  visualText.innerHTML = '';

  const settingsPanel = document.querySelector('#settings-panel');
  const btnRepeat = document.querySelector('#btn-repeat');

  btnRepeat.onclick = () => {
    console.log('Перезапуск теста');
    clearTimeout(testAbortTimeoutId);
    abortTest();
  };

  // find and remove the old caret
  const oldTypingCaret = document.querySelector('#typing-caret');

  if (oldTypingCaret) oldTypingCaret.remove();

  // create a new caret and append it
  const typingCaret = document.createElement('span');
  typingCaret.classList.add('text__caret');
  typingCaret.id = 'typing-caret';

  document.querySelector('.text__body').append(typingCaret);

  // generate text
  let textsJson = JSON.parse(sessionStorage.getItem('texts-json'));
  const text = generateText(textsJson);

  // create passive text
  initPassiveText(text);

  const test = {
    text: text.join(' '),
    words: text,
    chars: [].concat(...text.map(word => word.split(''))),
    statistic: {},
  };

  let typedWords = [];
  let currentWordIndex = 0;
  let activeWord = null;
  let lastIncorrectWord = null;
  let incorrectTypedCharsInEnd = 0;
  let incorrectTypedChars = new Set();

  let currentCharIndex = 0;
  let prevInputLength = 0;
  let newInputLength = 0;
  let currentChar = null;

  let startTime = 0;
  let endTime = 0;

  // DONE: code moved
  // start the test on input
  typingInput.oninput = function (e) {
    // interrupt the test when typingInput has been out of focus for more than 5 seconds
    // !!! Restore in production
    /* if (typingInput.onblur == null) {
      typingInput.onblur = () => {
        testAbortTimeoutId = setTimeout(() => {
          typingInput.onfocus = null;
          abortTest();
        }, 5000);

        typingInput.onfocus = () => {
          if (testAbortTimeoutId != null) {
            clearTimeout(testAbortTimeoutId);
            testAbortTimeoutId = null;
          }
        };
      };
    } */

    // hide the settings panel
    if (!settingsPanel.classList.contains('_hidden')) {
      settingsPanelHide(true);
    }

    // show the repeat button
    if (btnRepeat.classList.contains('_hidden')) {
      btnRepeat.classList.remove('_hidden');
    }

    // activate the caret
    if (!typingCaret.classList.contains('_active')) {
      typingCaret.classList.add('_active');
    }

    if ((localStorage.getItem('settings-mode') || 'words') == 'time') {
      let secondsCount = localStorage.getItem('settings-value') || 15;
    }

    let statisticKey =
      currentWordIndex == 0
        ? test.words[currentWordIndex]
        : typedWords.join(' ') + ' ' + test.words[currentWordIndex];

    if (activeWord == null) {
      currentCharIndex = 0;
      prevInputLength = 0;
      newInputLength = 0;
      activeWord = test.words[currentWordIndex];
      currentChar = activeWord[currentCharIndex];

      test.statistic[statisticKey] = {
        corrects: [],
        incorrects: [],
        chars: {},
      };

      if (currentWordIndex == 0) {
        startTime = Date.now();
        addWord(statisticKey);
        // addWord();
      }
    }

    newInputLength = typingInput.value.length;

    let wordStatistic = test.statistic[statisticKey];
    let typedChar = typingInput.value.at(-1);

    // # length increased - a character was entered
    if (newInputLength - prevInputLength > 0) {
      // not yet at the end of the word
      if (currentChar !== undefined) {
        endTime = Date.now();

        let wordState = activeWord.slice(0, currentCharIndex + 1);
        let isCorrect;

        // correct character typed
        if (typedChar === currentChar) {
          isCorrect = true;
          wordStatistic.corrects.push(wordState);

          if (wordStatistic.chars[wordState] !== undefined) {
            wordStatistic.chars[wordState] =
              endTime - Number(wordStatistic.chars[wordState]);
          } else {
            wordStatistic.chars[wordState] = endTime - startTime;
          }
        } else {
          // incorrect character typed
          isCorrect = false;
          wordStatistic.incorrects.push(wordState);

          incorrectTypedChars.add(
            currentWordIndex == 0
              ? wordState
              : typedWords.join(' ') + ' ' + wordState,
          );

          if (wordStatistic.chars[wordState] === undefined) {
            wordStatistic.chars[wordState] = String(startTime);
          }
        }

        addChar(typedChar, isCorrect, currentCharIndex, statisticKey);
        currentCharIndex++;
        currentChar = activeWord[currentCharIndex];
        startTime = Date.now();
        prevInputLength = newInputLength;
      } else {
        console.log('До:', incorrectTypedCharsInEnd);
        // end of the word - a space is expected
        if (typedChar === ' ') {
          // NOTE: endTime = Date.now(); <<< think about this later
          if (lastIncorrectWord !== null) {
            let prevWordStatistic = test.statistic[typedWords.join(' ')];

            for (const key of prevWordStatistic.incorrects) {
              prevWordStatistic.chars[key] =
                endTime - Number(prevWordStatistic.chars[key]);
            }
          }

          if (
            wordStatistic.incorrects.length == 0 &&
            incorrectTypedCharsInEnd == 0
          ) {
            lastIncorrectWord = null;
          } else {
            lastIncorrectWord = {
              value: typingInput.value.slice(0, typingInput.value.length - 1),
              wordIndex: currentWordIndex,
              charIndex: currentCharIndex,
              incorrectTypedCharsInEnd,
            };
          }

          typingInput.value = '';
          startTime = Date.now();
          currentWordIndex++;
          typedWords.push(activeWord);
          activeWord = null;
          incorrectTypedCharsInEnd = 0;
          addChar(typedChar, true);
          addWord(typedWords.join(' ') + ' ' + test.words[currentWordIndex]);
          // addWord();
        } else {
          if (incorrectTypedCharsInEnd <= 5) {
            incorrectTypedCharsInEnd++;
            currentCharIndex++;
            currentChar = activeWord[currentCharIndex];
            prevInputLength = newInputLength;
            addChar(typedChar, false, currentCharIndex, statisticKey, true);
          } else {
            typingInput.value = typingInput.value.slice(0, -1);
          }
        }
        console.log('После:', incorrectTypedCharsInEnd);
      }

      // # end of the test
      if (
        currentWordIndex == test.words.length - 1 &&
        currentCharIndex == test.words.at(-1).length &&
        typedChar == test.words.at(-1).at(-1)
      ) {
        if (lastIncorrectWord !== null) {
          let prevWordStatistic = test.statistic[typedWords.join(' ')];

          for (const key of prevWordStatistic.incorrects) {
            prevWordStatistic.chars[key] =
              endTime - Number(prevWordStatistic.chars[key]);
          }
        }

        if (wordStatistic.incorrects.length != 0) {
          for (const key of wordStatistic.incorrects) {
            wordStatistic.chars[key] =
              endTime - Number(wordStatistic.chars[key]);
          }
        }

        finishTest(test, incorrectTypedChars);
      }
    } else {
      // # length decreased - a character was deleted
      if (currentCharIndex <= activeWord.length) {
        let previousWordState = activeWord.slice(0, currentCharIndex);

        if (wordStatistic.corrects.includes(previousWordState)) {
          wordStatistic.corrects.splice(
            wordStatistic.corrects.indexOf(previousWordState),
            1,
          );
        } else {
          wordStatistic.incorrects.splice(
            wordStatistic.incorrects.indexOf(previousWordState),
            1,
          );
        }

        if (typeof wordStatistic.chars[previousWordState] == 'number') {
          delete wordStatistic.chars[previousWordState];
        }

        startTime = Date.now();
        removeChar(currentCharIndex - 1, statisticKey);
      } else {
        incorrectTypedCharsInEnd--;
        removeChar(null, statisticKey, true);
      }

      currentCharIndex--;
      currentChar = activeWord[currentCharIndex];
      prevInputLength = newInputLength;
    }

    // console.log(typingInput.value, typingInput.value.length);
  };

  // DONE: code moved
  typingInput.onkeydown = e => {
    // DONE: code moved
    // arrow/delete keys were pressed - ignore them
    if (
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete'].includes(
        e.code,
      )
    ) {
      e.preventDefault();
    }

    // DONE: code moved
    // move to the previous word
    if (
      e.code == 'Backspace' &&
      !e.ctrlKey &&
      typingInput.value.length == 0 &&
      currentWordIndex !== 0 &&
      lastIncorrectWord !== null
    ) {
      e.preventDefault();

      typingInput.value = lastIncorrectWord.value;
      newInputLength = prevInputLength = typingInput.value.length;
      currentWordIndex = lastIncorrectWord.wordIndex;
      currentCharIndex = lastIncorrectWord.charIndex;
      activeWord = test.words[currentWordIndex];
      incorrectTypedCharsInEnd = lastIncorrectWord.incorrectTypedCharsInEnd;

      typedWords.pop();
      startTime = Date.now();
      lastIncorrectWord = null;

      removeWord();
      console.log('remove', incorrectTypedCharsInEnd);
    }

    // DONE: code moved
    // Ctrl + Backspace
    if (e.code == 'Backspace' && e.ctrlKey && typingInput.value.length != 0) {
      e.preventDefault();

      typingInput.value = '';
      currentCharIndex = prevInputLength = newInputLength = 0;
      currentChar = activeWord[currentCharIndex];

      let statisticKey =
        currentWordIndex == 0
          ? test.words[currentWordIndex]
          : typedWords.join(' ') + ' ' + test.words[currentWordIndex];
      let wordStatistic = test.statistic[statisticKey];

      wordStatistic.corrects.length = 0;
      wordStatistic.incorrects.length = 0;

      for (const [key, value] of Object.entries(wordStatistic.chars)) {
        if (typeof value == 'number') {
          delete wordStatistic.chars[key];
        }
      }

      startTime = Date.now();
      incorrectTypedCharsInEnd = 0;
      removeChar(null, statisticKey, false, true);
    }
  };
}

// DONE: code moved
function finishTest(test, incorrectTypedChars) {
  console.log(test);
  const typingInput = document.querySelector('#typing-input');

  typingInput.oninput = null;
  typingInput.onkeydown = null;

  settingsPanelHide(false);

  let [totalMilliseconds, totalCharsCount] = Object.values(
    test.statistic,
  ).reduce(
    function ([sum, count], wordStatistic) {
      for (let key in wordStatistic.chars) {
        if (wordStatistic.chars[key] != 0) {
          sum += wordStatistic.chars[key];
          count++;
        }
      }

      return [sum, count];
    },
    [0, 0],
  );

  let totalMinutes = totalMilliseconds / 1000 / 60;

  // # WPM
  let wpm = test.words.length / totalMinutes;

  // # CPM
  let cpm = totalCharsCount / totalMinutes;

  // # Accurancy
  let mistakes = incorrectTypedChars.size;
  let accurancy = (1 - mistakes / totalCharsCount) * 100;

  console.log('wpm: ' + wpm, 'cpm: ' + cpm, 'accurancy: ' + accurancy);
}

let testAbortTimeoutId = null;

// DONE: code moved
function abortTest() {
  console.log('Тест прерван');

  const btnRepeat = document.querySelector('#btn-repeat');

  // hide the repeat button
  if (!btnRepeat.classList.contains('_hidden')) {
    btnRepeat.classList.add('_hidden');
  }
  // show the settings panel
  settingsPanelHide(false);

  // new test
  newTest();
}

//</Test>==============================================================================

//<Visual Text>==============================================================================
/* 
function addWord() {
  const typingCaret = document.querySelector('#typing-caret');
  const visualText = document.querySelector('#visual-text');

  let visualActiveWord = visualText.querySelector('.active-word');
  let word = document.createElement('span');

  if (visualActiveWord) {
    visualActiveWord.classList.remove('active-word');
  }

  word.classList.add('active-word');
  word.prepend(typingCaret);

  visualText.append(word);
}
 */

// NOTE: Continue by adapting the remaining functions to the wordContainer
// NOTE: Consider adding the space inside passiveTextWord rather than as a separate span after it

function addWord(wordKey) {
  const typingCaret = document.querySelector('#typing-caret');
  const visualText = document.querySelector('#visual-text');
  const visualActiveWord = visualText.querySelector('.active-word');
  const passiveText = document.querySelector('#passive-text');
  const passiveTextWord = passiveText.querySelector(`[data-key='${wordKey}']`);
  const word = document.createElement('span');
  const wordContainer = document.createElement('span');

  if (visualActiveWord) {
    visualActiveWord.classList.remove('active-word');
  }

  wordContainer.style.display = 'inline-block';
  wordContainer.style.minWidth = passiveTextWord.offsetWidth + 'px';
  wordContainer.append(word);

  word.classList.add('active-word');
  word.prepend(typingCaret);

  visualText.append(wordContainer);
}

function removeWord() {
  const typingCaret = document.querySelector('#typing-caret');
  const visualText = document.querySelector('#visual-text');

  // remove the current active word
  visualText.querySelector('.active-word').remove();

  // get the previous one
  let previousWord = visualText.children[visualText.children.length - 1];

  // make it the active word and remove the last character - the space
  previousWord.classList.add('active-word');
  previousWord.children[previousWord.children.length - 1].remove();

  // add the caret to the beginning
  previousWord.prepend(typingCaret);
}

function addChar(
  typedChar,
  isCorrect,
  charIndex,
  wordKey,
  incorrectInEnd = false,
) {
  const visualText = document.querySelector('#visual-text');
  const passiveText = document.querySelector('#passive-text');

  let visualActiveWord = visualText.querySelector('.active-word');
  let char = document.createElement('span');

  if (isCorrect) {
    char.textContent = typedChar;
    char.classList.add('correct-char');
  } else {
    char.classList.add('incorrect-char');
    let passiveTextWord = passiveText.querySelector(`[data-key='${wordKey}']`);

    if (!incorrectInEnd) {
      let passiveTextWordValue = passiveTextWord.textContent;
      let charValue = typedChar == ' ' ? '_' : typedChar;

      char.textContent = charValue;
      passiveTextWord.textContent =
        passiveTextWordValue.slice(0, charIndex) +
        charValue +
        passiveTextWordValue.slice(charIndex + 1);
    } else {
      char.classList.add('incorrect-in-end');
      char.textContent = typedChar;
      passiveTextWord.textContent += typedChar;
    }
  }

  visualActiveWord.append(char);
}

function removeChar(charIndex, wordKey, incorrectInEnd = false, all = false) {
  const visualText = document.querySelector('#visual-text');
  const passiveText = document.querySelector('#passive-text');

  let visualActiveWord = visualText.querySelector('.active-word');
  let passiveTextWord = passiveText.querySelector(`[data-key='${wordKey}']`);
  let passiveTextWordValue = passiveTextWord.textContent;
  let currentWord = wordKey.split(' ').at(-1);

  // only one character was deleted
  if (!all) {
    // remove the last character from the active word
    visualActiveWord.children[visualActiveWord.children.length - 1].remove();

    // error within the word
    if (!incorrectInEnd) {
      // replace the incorrect character in passiveTextWord with the correct one
      passiveTextWord.textContent =
        passiveTextWordValue.slice(0, charIndex) +
        currentWord[charIndex] +
        passiveTextWordValue.slice(charIndex + 1);
    } else {
      // error at the end of the word
      passiveTextWord.textContent = passiveTextWordValue.slice(0, -1);
    }
  } else {
    // all characters were deleted
    const typingCaret = document.querySelector('#typing-caret');

    // restore the original word to the passive text
    passiveTextWord.textContent = currentWord;

    // remove all characters from the active word
    for (const elem of Array.from(visualActiveWord.children)) {
      elem.remove();
    }

    visualActiveWord.prepend(typingCaret);
  }
}

//</Visual Text>==============================================================================

// DONE: code moved
function settingsPanelInit(settingsJson) {
  const settingsLang = document.querySelector('#settings-lang');
  const settingsMode = document.querySelector('#settings-mode');
  const settingsValue = document.querySelector('#settings-value');
  const settingsPanel = document.querySelector('#settings-panel');

  // prevent text selection
  settingsLang.onmousedown =
    settingsMode.onmousedown =
    settingsValue.onmousedown =
      () => {
        return false;
      };

  //# LANG
  let settingsLangValue = localStorage.getItem('settings-lang');

  if (settingsLangValue == null) {
    settingsLangValue = settingsJson.lang.checkedValue;
    localStorage.setItem('settings-lang', settingsLangValue);
  }

  settingsLang.insertAdjacentHTML(
    'beforeend',
    /* html */ `
      <label class="custom-checkbox">
        <input ${
          settingsLangValue == settingsJson.lang.checkedValue ? 'checked' : ''
        } type="checkbox" name="settings-lang" value="${settingsLangValue}">
        <span class="${settingsJson.lang.icon}">
          ${settingsLangValue}
        </span>
      </label>  
    `,
  );

  const langCheckbox = settingsLang.querySelector('input[type="checkbox"]');
  const langCheckboxSpan = langCheckbox.nextElementSibling;

  langCheckboxSpan.textContent = langCheckbox.checked
    ? settingsJson.lang.checkedValue
    : settingsJson.lang.uncheckedValue;

  // language change
  langCheckbox.onchange = function () {
    if (!settingsPanel.classList.contains('_hidden')) {
      langCheckboxSpan.textContent = langCheckbox.value = langCheckbox.checked
        ? settingsJson.lang.checkedValue
        : settingsJson.lang.uncheckedValue;
      localStorage.setItem('settings-lang', langCheckbox.value);
      newTest();
    }
  };

  //# MODE
  let modeList = ['words', 'time'];
  let settingsModeValue = localStorage.getItem('settings-mode');

  if (!modeList.includes(settingsModeValue)) {
    localStorage.setItem('settings-mode', modeList[0]);
    settingsModeValue = modeList[0];
  }

  for (const mode of modeList) {
    let modeJson = settingsJson[mode];

    settingsMode.insertAdjacentHTML(
      'beforeend',
      /* html */ `
          <label class="custom-radio">
            <input type="radio" name="settings-mode" value="${mode}">
            <span class="${modeJson.icon}">${modeJson.title}</span>
          </label>
        `,
    );
  }

  // select the appropriate mode
  settingsMode.querySelector(`input[value='${settingsModeValue}']`).checked =
    true;

  // delegate mode changes
  settingsMode.addEventListener('change', function (e) {
    if (!settingsPanel.classList.contains('_hidden')) {
      localStorage.setItem('settings-mode', e.target.value);
      initSettingsValue(e.target.value);
      newTest();
    }
  });

  //# VALUE
  initSettingsValue(
    settingsModeValue,
    localStorage.getItem('settings-value') || 'default',
  );

  function initSettingsValue(mode, checkedValue = 'default') {
    let valueList = settingsJson[mode].values;
    settingsValue.innerHTML = '';

    for (const value of valueList) {
      settingsValue.insertAdjacentHTML(
        'beforeend',
        /* html */ `
            <label class="custom-radio">
              <input type="radio" name="settings-value" value="${value}">
              <span>${value}</span>
            </label>
          `,
      );
    }

    // delegate value changes
    settingsValue.addEventListener('change', function (e) {
      if (!settingsPanel.classList.contains('_hidden')) {
        localStorage.setItem('settings-value', e.target.value);
        newTest();
      }
    });

    let activeRadio;

    if (checkedValue == 'default') {
      activeRadio = settingsValue.querySelector('input[type="radio"]');
    } else {
      activeRadio = settingsValue.querySelector(
        `input[value='${checkedValue}']`,
      );
    }

    activeRadio.checked = true;
    localStorage.setItem('settings-value', activeRadio.value);
  }
}

// DONE: code moved
function settingsPanelHide(hide) {
  const settingsPanel = document.querySelector('#settings-panel');

  if (hide) {
    settingsPanel.classList.add('_hidden');
  } else {
    settingsPanel.classList.remove('_hidden');
  }
}

// DONE: code moved
function generateText(textsJson) {
  const settingsMode = localStorage.getItem('settings-mode') || 'words';
  const settingsLang = localStorage.getItem('settings-lang') || 'ru';

  let wordsCount = localStorage.getItem('settings-value') || 25;

  if (settingsMode == 'time') {
    wordsCount = 500;
  }

  // ready-made text with a 0.03 probability (3% chance)
  if (Math.random() <= 0.03) {
    let text = textsJson[settingsLang].ready;
    return text[Math.floor(Math.random() * text.length)]
      .split(' ')
      .slice(0, wordsCount);
  } else {
    let randomWords = textsJson[settingsLang].random;
    let text = [];

    let nextCapital = true;
    let punctuations = ['.', ',', ';', ':', '!', '?', '"', '-'];

    for (let i = 0; i < wordsCount; i++) {
      let word = randomWords[Math.floor(Math.random() * randomWords.length)];

      // if the first letter should be capitalized
      if (nextCapital) {
        word = word[0].toUpperCase() + word.slice(1, word.length);
        nextCapital = false;
      }

      // random punctuation with a 0.05 probability (5% chance)
      // note: we may add punctuation count control later
      if (Math.random() <= 0.05) {
        let punctuation =
          punctuations[Math.floor(Math.random() * punctuations.length)];

        if (
          !(
            word[word.length - 1] == '"' &&
            (punctuation == '"' || punctuation == '-')
          )
        ) {
          if (punctuation == '.' || punctuation == '!' || punctuation == '?') {
            word += punctuation;
            nextCapital = true;
          } else if (punctuation == '"') {
            word = '"' + word + '"';
          } else if (punctuation == '-') {
            word =
              word +
              '-' +
              randomWords[Math.floor(Math.random() * randomWords.length)];
          } else {
            word += punctuation;
          }
        }
      }

      text.push(word);
    }

    return text;
  }
}

// DONE: code moved
function initPassiveText(text) {
  const passiveText = document.querySelector('#passive-text');
  passiveText.innerHTML = '';
  let wordKey = '';

  for (const word of text) {
    wordKey += word;

    const span = document.createElement('span');
    span.textContent = word;
    span.dataset.key = wordKey;

    const space = document.createElement('span');
    space.textContent = ' ';

    passiveText.append(space, span);

    wordKey += ' ';
  }

  // first space
  passiveText.children[0].remove();
}

// DONE: code moved
function setFocusActionsOnTypingInput() {
  const typingInput = document.querySelector('#typing-input');
  const placeholder = document.querySelector('.text__placeholder');

  focusTypingInput();

  typingInput.addEventListener('blur', () => {
    if (!placeholder.classList.contains('_blur')) {
      placeholder.classList.add('_blur');

      placeholder.onclick = () => {
        focusTypingInput();
      };

      document.addEventListener('keydown', onKeyDown);
    }
  });

  typingInput.addEventListener('focus', () => {
    if (placeholder.classList.contains('_blur')) {
      placeholder.classList.remove('_blur');

      placeholder.onclick = null;
      document.removeEventListener('keydown', onKeyDown);
    }
  });

  function onKeyDown(e) {
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
      focusTypingInput();
      e.preventDefault();
    }
  }
}

// DONE: code moved
function focusTypingInput() {
  const typingInput = document.querySelector('#typing-input');
  typingInput.focus();
}
