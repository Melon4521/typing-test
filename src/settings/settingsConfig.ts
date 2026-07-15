import {
  TIME_VALUES,
  WORDS_VALUES,
  type Lang,
  type TimeValue,
  type WordsValue,
} from '../core/types';

interface SettingsBase {
  icon: string;
  type: 'checkbox' | 'radio';
}

interface SettingsLang extends SettingsBase {
  checkedValue: Lang;
  uncheckedValue: Lang;
}

interface SettingsMode<T extends number> extends SettingsBase {
  title: string;
  values: readonly T[];
}

type SettingsCfg = {
  lang: SettingsLang;
  words: SettingsMode<WordsValue>;
  time: SettingsMode<TimeValue>;
};

export function getSettingsCfg(): SettingsCfg {
  return {
    lang: {
      icon: '_icon-globe',
      type: 'checkbox',

      checkedValue: 'ru',
      uncheckedValue: 'en',
    },
    time: {
      icon: '_icon-timer',
      type: 'radio',

      title: 'время',
      values: TIME_VALUES,
    },
    words: {
      icon: '_icon-letter',
      type: 'radio',

      title: 'слова',
      values: WORDS_VALUES,
    },
  };
}
