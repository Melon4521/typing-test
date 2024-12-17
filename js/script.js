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
    // console.log(typingInput.value);
    let statisticKey =
      currentWordIndex == 0
        ? activeWord
        : typedWords.join(' ') + ' ' + activeWord;

    if (activeWord == null) {
      currentCharIndex = 0;
      prevInputLength = 0;
      newInputLength = 0;
      activeWord = test.words[currentWordIndex];
      currentChar = activeWord[0];

      test.statistic[statisticKey] = {
        corrects: [],
        incorrects: [],
        chars: {},
      };

      if (currentWordIndex == 0) {
        startTime = Date.now();
      }
    }

    newInputLength = typingInput.value.length;

    let wordStatistic = test.statistic[statisticKey];
    let lengthDelta = newInputLength - prevInputLength;
    let typedChar = typingInput.value[-1];

    if (lengthDelta > 0) {
      endTime = Date.now();

      let wordState = activeWord.slice(0, currentCharIndex + 1);

      if (typedChar === currentChar) {
        // набран верный символ
        wordStatistic.corrects.push(wordState);

        if (!(currentWordIndex == 0 && currentCharIndex == 0)) {
          if (wordStatistic.chars[wordState] !== undefined) {
            wordStatistic.chars[wordState] =
              endTime - Number(wordStatistic.chars[wordState]);
          } else {
            wordStatistic.chars[wordState] = endTime - startTime;
          }
        }
      } else {
        wordStatistic.incorrects.push(wordState);
        incorrectTypedChars.add(typedWords.join(' ') + ' ' + wordState);

        if (wordStatistic.chars[wordState] === undefined) {
          wordStatistic.chars[wordState] = String(startTime);
        }
      }

      currentCharIndex += 1;
      currentChar = activeWord[currentCharIndex];
      startTime = Date.now();
      prevInputLength = newInputLength;
    }
  };

  // нажаты стрелки/delete - игнорируем
  typingInput.onkeydown = e => {
    if (
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete'].includes(
        e.code,
      )
    ) {
      e.preventDefault();
    }
  };
}

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

  for (const word of text) {
    const span = document.createElement('span');
    span.textContent = word;

    const space = document.createElement('span');
    space.textContent = ' ';

    passiveText.append(space, span);
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
    }
  }
}

function focusTypingInput() {
  const typingInput = document.querySelector('#typing-input');
  typingInput.focus();
}
