import { getElements } from './render/dom';
import { getSettingsCfg } from './settings/settingsConfig';
import {
  attachSettingsValueChangeListener,
  initSettingsLang,
  initSettingsMode,
  initSettingsValue,
} from './settings/settingsPanel';
import { initSettings, settingsStore } from './settings/settingsStore';
// import { getTextsCfg } from './text/textsConfig';

function main() {
  initSettings();

  const els = getElements();
  // const textsCfg = getTextsCfg();
  const settingsCfg = getSettingsCfg();

  initSettingsLang(els, settingsCfg);
  initSettingsMode(els, settingsCfg);
  initSettingsValue(settingsStore.getMode(), els, settingsCfg);
  attachSettingsValueChangeListener(els);
}

main();
