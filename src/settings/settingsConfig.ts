import {
  TIME_VALUES,
  WORDS_VALUES,
  type Lang,
  type TimeValue,
  type WordsValue,
} from '../core/types';

/**
 * Common settings metadata shared by language and mode options.
 */
interface SettingsBase {
  icon: string;
  type: 'checkbox' | 'radio';
}

/**
 * Configuration for the language toggle setting.
 */
interface SettingsLang extends SettingsBase {
  checkedValue: Lang;
  uncheckedValue: Lang;
}

/**
 * Configuration for a mode-based radio setting.
 */
interface SettingsMode<T extends number> extends SettingsBase {
  title: string;
  values: readonly T[];
}

/**
 * Full settings configuration for the application.
 */
export type SettingsCfg = {
  lang: SettingsLang;
  words: SettingsMode<WordsValue>;
  time: SettingsMode<TimeValue>;
};

/**
 * Creates the settings configuration used to initialize the UI.
 *
 * @returns The settings metadata for language, mode, and values.
 */
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
