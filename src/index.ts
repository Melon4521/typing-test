import { getElements } from './render/dom';
import { newTest, setFocusActionsOnTypingInput } from './render/render';
import { getSettingsCfg } from './settings/settingsConfig';
import {
  attachSettingsValueChangeListener,
  initSettingsLang,
  initSettingsMode,
  initSettingsValue,
} from './settings/settingsPanel';
import { initSettings } from './settings/settingsStore';
import { getTextsCfg } from './text/textsConfig';

/**
 * Initializes the application.
 */
function main() {
  const els = getElements();
  const textsCfg = getTextsCfg();
  const settingsCfg = getSettingsCfg();

  // Settings panel initialization
  initSettings();
  initSettingsLang(els, settingsCfg);
  initSettingsMode(els, settingsCfg);
  initSettingsValue(els, settingsCfg);
  attachSettingsValueChangeListener(els);

  setFocusActionsOnTypingInput(els);

  // New test initialization
  newTest(els, textsCfg);
}

main();
