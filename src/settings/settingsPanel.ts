import {
  MODES,
  type Mode,
  type TimeValue,
  type WordsValue,
} from '../core/types';
import type { Elements } from '../render/dom';
import type { SettingsCfg } from './settingsConfig';
import { settingsStore } from './settingsStore';

/**
 * Checks whether a settings container is hidden.
 *
 * @param container - The container element to inspect.
 * @returns True when the container has the `_hidden` CSS class.
 */
function isHidden(container: HTMLElement) {
  return container.classList.contains('_hidden');
}

/**
 * Initializes the language setting UI and binds its change handler.
 *
 * @param els - The DOM elements used by the settings panel.
 * @param settingsCfg - The settings configuration for language options.
 */
export function initSettingsLang(els: Elements, settingsCfg: SettingsCfg) {
  const checkedLangValue = settingsCfg.lang.checkedValue;
  const uncheckedLangValue = settingsCfg.lang.uncheckedValue;

  // отмена выделения текста
  els.settingsLang.onmousedown = () => {
    return false;
  };

  const lang = settingsStore.getLang();

  els.settingsLang.insertAdjacentHTML(
    'beforeend',
    /* html */ `
    <label class="custom-checkbox">
      <input ${
        lang == checkedLangValue ? 'checked' : ''
      } type="checkbox" name="settings-lang" value="${lang}">
      <span class="${settingsCfg.lang.icon}">
        ${lang}
      </span>
    </label>  
    `,
  );

  const langCheckbox = els.settingsLang.querySelector(
    'input[type="checkbox"]',
  ) as HTMLInputElement;
  const langCheckboxSpan = langCheckbox.nextElementSibling as HTMLSpanElement;

  langCheckboxSpan.textContent = langCheckbox.checked
    ? checkedLangValue
    : uncheckedLangValue;

  // изменение языка
  langCheckbox.addEventListener('change', function () {
    if (!isHidden(els.settingsPanel)) {
      const pickedLang = langCheckbox.checked
        ? checkedLangValue
        : uncheckedLangValue;

      langCheckboxSpan.textContent = langCheckbox.value = pickedLang;
      settingsStore.setLang(pickedLang);

      // TODO: Вызов нового теста
      // newTest();
    }
  });
}

/**
 * Initializes the mode setting UI and binds its change handler.
 *
 * @param els - The DOM elements used by the settings panel.
 * @param settingsCfg - The settings configuration for mode options.
 */
export function initSettingsMode(els: Elements, settingsCfg: SettingsCfg) {
  // отмена выделения текста
  els.settingsMode.onmousedown = () => {
    return false;
  };

  const mode = settingsStore.getMode();

  for (const m of MODES) {
    const modeOptions = settingsCfg[m];

    els.settingsMode.insertAdjacentHTML(
      'beforeend',
      /* html */ `
      <label class="custom-radio">
        <input type="radio" name="settings-mode" value="${m}">
        <span class="${modeOptions.icon}">${modeOptions.title}</span>
      </label>
      `,
    );
  }

  // выбираем нужный режим
  const modeFirstRadio = els.settingsMode.querySelector(
    `input[value='${mode}']`,
  ) as HTMLInputElement;
  modeFirstRadio.checked = true;

  // делегируем изменение режима
  els.settingsMode.addEventListener('change', function (e) {
    if (
      !isHidden(els.settingsPanel) &&
      e.target &&
      e.target instanceof HTMLInputElement
    ) {
      const pickedMode = e.target.value as Mode;
      settingsStore.setMode(pickedMode);

      initSettingsValue(els, settingsCfg);

      // TODO: Вызов нового теста
      // newTest();
    }
  });
}

/**
 * Initializes the value selection UI for the currently active mode.
 *
 * @param els - The DOM elements used by the settings panel.
 * @param settingsCfg - The settings configuration for available values.
 */
export function initSettingsValue(els: Elements, settingsCfg: SettingsCfg) {
  // отмена выделения текста
  els.settingsValue.onmousedown = () => {
    return false;
  };

  const mode = settingsStore.getMode();
  const values = settingsCfg[mode].values;

  els.settingsValue.innerHTML = '';

  for (const value of values) {
    els.settingsValue.insertAdjacentHTML(
      'beforeend',
      /* html */ `
      <label class="custom-radio">
        <input type="radio" name="settings-value" value="${value}">
        <span>${value}</span>
      </label>
      `,
    );
  }

  const currentValue = settingsStore.ensureValueForMode(mode);

  const activeRadio = els.settingsValue.querySelector(
    `input[value='${currentValue}']`,
  ) as HTMLInputElement;

  activeRadio.checked = true;
}

/**
 * Attaches a change listener for the value selection UI.
 *
 * @param els - The DOM elements used by the settings panel.
 */
export function attachSettingsValueChangeListener(els: Elements) {
  // делегируем изменение значения
  els.settingsValue.addEventListener('change', function (e) {
    if (
      !isHidden(els.settingsPanel) &&
      e.target &&
      e.target instanceof HTMLInputElement
    ) {
      if (settingsStore.getMode() === 'words') {
        settingsStore.setWordsValue(Number(e.target.value) as WordsValue);
      } else {
        settingsStore.setTimeValue(Number(e.target.value) as TimeValue);
      }

      // TODO: Вызов нового теста
      // newTest();
    }
  });
}

/**
 * Shows or hides the settings panel.
 *
 * @param panel - The settings panel element.
 * @param hide - Whether the panel should be hidden.
 */
export function settingsPanelHide(panel: HTMLFormElement, hide: boolean) {
  if (hide) {
    panel.classList.add('_hidden');
  } else {
    panel.classList.remove('_hidden');
  }
}
