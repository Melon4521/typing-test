import { getElements } from './render/dom';
import { renderTest, setFocusActionsOnTypingInput } from './render/render';
import { getSettingsCfg } from './settings/settingsConfig';
import {
  attachSettingsValueChangeListener,
  initSettingsLang,
  initSettingsMode,
  initSettingsValue,
} from './settings/settingsPanel';
import { initSettings } from './settings/settingsStore';
import { getTextsCfg } from './text/textsConfig';

function main() {
  const els = getElements();
  const textsCfg = getTextsCfg();
  const settingsCfg = getSettingsCfg();

  // панель настроек
  initSettings();
  initSettingsLang(els, settingsCfg);
  initSettingsMode(els, settingsCfg);
  initSettingsValue(els, settingsCfg);
  attachSettingsValueChangeListener(els);

  setFocusActionsOnTypingInput(els);

  // тест
  renderTest(els, textsCfg);
}

main();
