settingsPanelInit();

async function settingsPanelInit() {
  try {
    let response = await fetch('/api/settings.json');

    if (response.ok) {
      let settingsJson = await response.json();

      const settingsLang = document.querySelector('#settings-lang');
      const settingsMode = document.querySelector('#settings-mode');
      const settingsValue = document.querySelector('#settings-value');

      // #lang checkbox
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

      // смена языка
      const langCheckbox = settingsLang.querySelector('input[type="checkbox"]');
      const langCheckboxSpan = langCheckbox.nextElementSibling;

      langCheckboxSpan.textContent = langCheckbox.checked
        ? settingsJson.lang.checkedValue
        : settingsJson.lang.uncheckedValue;

      langCheckbox.onchange = () => {
        langCheckboxSpan.textContent = langCheckbox.value = langCheckbox.checked
          ? settingsJson.lang.checkedValue
          : settingsJson.lang.uncheckedValue;
        localStorage.setItem('settings-lang', langCheckbox.value);
      };

      langCheckbox.closest('.custom-checkbox').onmousedown = () => {
        return false;
      };

      // #mode radios
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

        settingsMode.children[settingsMode.children.length - 1].onchange =
          e => {
            localStorage.setItem('settings-mode', e.target.value);
            initSettingsValue(e.target.value);
          };

        settingsMode.children[settingsMode.children.length - 1].onmousedown =
          () => {
            return false;
          };
      }

      settingsMode.children[modeList.indexOf(settingsModeValue)].querySelector(
        'input[type="radio"]',
      ).checked = true;

      // #value radios
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

          settingsValue.children[settingsValue.children.length - 1].onchange =
            e => {
              localStorage.setItem('settings-value', e.target.value);
            };

          settingsValue.children[
            settingsValue.children.length - 1
          ].onmousedown = () => {
            return false;
          };
        }

        let activeRadio;

        if (checkedValue == 'default') {
          activeRadio = settingsValue.children[0].querySelector(
            'input[type="radio"]',
          );
        } else {
          activeRadio = settingsValue.children[
            valueList.indexOf(+checkedValue) || 0
          ].querySelector('input[type="radio"]');
        }

        activeRadio.checked = true;
        localStorage.setItem('settings-value', activeRadio.value);
      }
    } else {
      throw new Error('Failed to fetch');
    }
  } catch (err) {
    console.log(err);
  }
}

async function generateText() {
  const settingsMode = localStorage.getItem('settings-mode') || 'words';
  const settingsLang = localStorage.getItem('settings-lang') || 'ru';

  let wordsCount = localStorage.getItem('settings-value') || 25;

  if (settingsMode == 'words') {
    wordsCount = localStorage.getItem('settings-value') || 25;
  } else {
    wordsCount = 500;
  }

  try {
    let response = await fetch('/api/texts.json');

    if (response.ok) {
      const textsJson = await response.json();

      // случайный текст - вероятность 0,03 (шанс 3%)
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
          let word =
            randomWords[Math.floor(Math.random() * randomWords.length)];

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
              if (
                punctuation == '.' ||
                punctuation == '!' ||
                punctuation == '?'
              ) {
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
    } else {
      throw new Error('Failed to fetch');
    }
  } catch (err) {
    console.log(err);
  }
}

generateText().then(text => {
  console.log(text);
  console.log(text.join(' '));
});
