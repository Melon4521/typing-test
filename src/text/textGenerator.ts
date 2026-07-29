import type { AllowedWordsCount } from '../core/types';
import { settingsStore } from '../settings/settingsStore';
import type { TextsCfg } from './textsConfig';

/**
 * Generates a random typing text based on the current settings.
 *
 * @param textsCfg - The text configuration for both ready-made and random text variants.
 * @returns An array of words that forms the typing test content.
 */
export function generateText(textsCfg: TextsCfg) {
  const settingsMode = settingsStore.getMode();
  const settingsLang = settingsStore.getLang();

  let wordsCount: AllowedWordsCount;

  if (settingsMode === 'time') {
    wordsCount = 500;
  } else {
    wordsCount = settingsStore.getValue(settingsMode);
  }

  // ready-made text with a 0.03 probability (3% chance)
  if (Math.random() <= 0.03) {
    const text = textsCfg[settingsLang].ready;
    return text[Math.floor(Math.random() * text.length)]
      .split(' ')
      .slice(0, wordsCount);
  } else {
    const randomWords = textsCfg[settingsLang].random;
    const text: string[] = [];

    let nextCapital = true;
    const punctuations = ['.', ',', ';', ':', '!', '?', '"', '-'];

    for (let i = 0; i < wordsCount; i++) {
      let word = randomWords[Math.floor(Math.random() * randomWords.length)];

      // if the first letter should be capitalized
      if (nextCapital) {
        word = word[0].toUpperCase() + word.slice(1, word.length);
        nextCapital = false;
      }

      // random punctuation with a 0.05 probability (5% chance)
      if (Math.random() <= 0.05) {
        const punctuation =
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
