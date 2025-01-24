async function main() {
  try {
    // получаем json настроек
    const settingsResponse = await fetch('api/settings.json');

    if (settingsResponse.ok) {
      const settingsJson = await settingsResponse.json();
      settingsPanelInit(settingsJson);
    } else {
      throw new Error('Failed to fetch');
    }

    // получаем и сохраняем json текстов
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
  let textsJson = JSON.parse(sessionStorage.getItem('texts-json'));
  const text = generateText(textsJson);

  initPassiveText(text);

  const test = {
    text: text.join(' '),
    words: text,
    chars: [].concat(...text.map(word => word.split(''))),
    statistic: {},
  };

  const typingInput = document.querySelector('#typing-input');
  typingInput.value = '';

  const visualText = document.querySelector('#visual-text');
  visualText.innerHTML = '';

  typingInput.onblur = null;

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

  // Начинаем тест при вводе
  typingInput.oninput = function (e) {
    if (typingInput.onblur == null) {
      // прерывание теста (typingInput больше 5 сек не в фокусе)
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
        addWord();
      }
    }

    newInputLength = typingInput.value.length;

    let wordStatistic = test.statistic[statisticKey];
    let typedChar = typingInput.value.at(-1);

    // # длина увеличилась - символ ввели
    if (newInputLength - prevInputLength > 0) {
      // еще не дошли до конца слова
      if (currentChar !== undefined) {
        endTime = Date.now();

        let wordState = activeWord.slice(0, currentCharIndex + 1);
        let isCorrect;

        // набран верный символ
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
          // набран неверный символ
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
        // конец слова - ожидается пробел
        if (typedChar === ' ') {
          // NOTE: endTime = Date.now(); <<< ПРОДУМАТЬ ЭТО ПОЗЖЕ
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
          addWord();
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

      // # конец теста
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
      // # длина уменьшилась - символ удалили
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

  typingInput.onkeydown = e => {
    // нажаты стрелки/delete - игнорируем
    if (
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete'].includes(
        e.code,
      )
    ) {
      e.preventDefault();
    }

    // переход к предыдущему слову
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

function finishTest(test, incorrectTypedChars) {
  console.log(test);
  const typingInput = document.querySelector('#typing-input');

  typingInput.oninput = null;
  typingInput.onkeydown = null;

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

function abortTest() {
  console.log('Тест прерван');
  newTest();
}

//</Test>==============================================================================

//<Visual Text>==============================================================================

function addWord() {
  const visualText = document.querySelector('#visual-text');
  let word = document.createElement('span');
  let visualActiveWord = visualText.querySelector('.active-word');

  if (visualActiveWord) {
    visualActiveWord.classList.remove('active-word');
  }

  word.classList.add('active-word');

  visualText.append(word);
}

function removeWord() {
  const visualText = document.querySelector('#visual-text');

  // удаляем текущее активное слово
  visualText.querySelector('.active-word').remove();

  // получаем предыдущее
  let previousWord = visualText.children[visualText.children.length - 1];

  // делаем активным словом и удаляем последний символ - пробел
  previousWord.classList.add('active-word');
  previousWord.children[previousWord.children.length - 1].remove();
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

  // удалили только один символ
  if (!all) {
    // удаляем последний символ в активном слове
    visualActiveWord.children[visualActiveWord.children.length - 1].remove();

    // ошибка в пределах слова
    if (!incorrectInEnd) {
      // заменяем неверный символ в passiveTextWord на верный
      passiveTextWord.textContent =
        passiveTextWordValue.slice(0, charIndex) +
        currentWord[charIndex] +
        passiveTextWordValue.slice(charIndex + 1);
    } else {
      // ошибка в конце слова
      passiveTextWord.textContent = passiveTextWordValue.slice(0, -1);
    }
  } else {
    // удалили все символы

    // возвращем изначальное слово в пассивный текст
    passiveTextWord.textContent = currentWord;

    // удаляем все символы из активного слова
    for (const elem of Array.from(visualActiveWord.children)) {
      elem.remove();
    }
  }
}

//</Visual Text>==============================================================================

function settingsPanelInit(settingsJson) {
  const settingsLang = document.querySelector('#settings-lang');
  const settingsMode = document.querySelector('#settings-mode');
  const settingsValue = document.querySelector('#settings-value');

  // отмена выделения текста
  settingsLang.onmousedown =
    settingsMode.onmousedown =
    settingsValue.onmousedown =
      () => {
        return false;
      };

  //# LANG
  let settingsLangValue = localStorage.getItem('settings-lang');

  if (settingsLangValue == null) {
    localStorage.setItem('settings-lang', settingsJson.lang.checkedValue);
    settingsLangValue = settingsJson.lang.checkedValue;
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

  // изменение языка
  langCheckbox.onchange = function () {
    langCheckboxSpan.textContent = langCheckbox.value = langCheckbox.checked
      ? settingsJson.lang.checkedValue
      : settingsJson.lang.uncheckedValue;
    localStorage.setItem('settings-lang', langCheckbox.value);
    newTest();
    focusTypingInput();
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

  // делегируем изменение режима
  settingsMode.addEventListener('change', function (e) {
    localStorage.setItem('settings-mode', e.target.value);
    initSettingsValue(e.target.value);
    newTest();
    focusTypingInput();
  });

  // выбираем нужный режим
  settingsMode.querySelector(
    `input[value='${settingsModeValue}']`,
  ).checked = true;

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

    // делегируем изменение значения
    settingsValue.addEventListener('change', function (e) {
      localStorage.setItem('settings-value', e.target.value);
      newTest();
      focusTypingInput();
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

function generateText(textsJson) {
  const settingsMode = localStorage.getItem('settings-mode') || 'words';
  const settingsLang = localStorage.getItem('settings-lang') || 'ru';

  let wordsCount = localStorage.getItem('settings-value') || 25;

  if (settingsMode == 'time') {
    wordsCount = 500;
  }

  // готовый текст - вероятность 0,03 (шанс 3%)
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

      // если первая буква должна быть заглавной
      if (nextCapital) {
        word = word[0].toUpperCase() + word.slice(1, word.length);
        nextCapital = false;
      }

      // случайный знак препинания - вероятность 0,05 (шанс 5%)
      // note: возможно потом добавить регулирование кол-ва знаков препинания
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

  // первый пробел
  passiveText.children[0].remove();
}

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

function focusTypingInput() {
  const typingInput = document.querySelector('#typing-input');
  typingInput.focus();
}
