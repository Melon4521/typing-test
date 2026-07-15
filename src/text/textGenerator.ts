import type { AllowedWordsCount } from '../core/types';
import { settingsStore } from '../settings/settingsStore';
import type { TextsCfg } from './textsConfig';

export function generateText(textsCfg: TextsCfg) {
  const settingsMode = settingsStore.getMode();
  const settingsLang = settingsStore.getLang();

  let wordsCount: AllowedWordsCount;

  if (settingsMode === 'time') {
    wordsCount = 500;
  } else {
    wordsCount = settingsStore.getValue(settingsMode);
  }

  // готовый текст - вероятность 0.03 (шанс 3%)
  if (Math.random() <= 0.03) {
    let text = textsCfg[settingsLang].ready;
    return text[Math.floor(Math.random() * text.length)]
      .split(' ')
      .slice(0, wordsCount);
  } else {
    let randomWords = textsCfg[settingsLang].random;
    let text: string[] = [];

    let nextCapital = true;
    let punctuations = ['.', ',', ';', ':', '!', '?', '"', '-'];

    for (let i = 0; i < wordsCount; i++) {
      let word = randomWords[Math.floor(Math.random() * randomWords.length)];

      // если первая буква должна быть заглавной
      if (nextCapital) {
        word = word[0].toUpperCase() + word.slice(1, word.length);
        nextCapital = false;
      }

      // случайный знак препинания - вероятность 0.05 (шанс 5%)
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
          switch (punctuation) {
            case '.':
            case '!':
            case '?':
              word += punctuation;
              nextCapital = true;
              break;

            case '"':
              word = '"' + word + '"';
              break;

            case '-':
              word =
                word +
                '-' +
                randomWords[Math.floor(Math.random() * randomWords.length)];
              break;

            default:
              word += punctuation;
              break;
          }
        }
      }

      text.push(word);
    }

    return text;
  }
}
