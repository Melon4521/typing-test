/**
 * Represents the main DOM elements used by the typing test and settings UI.
 */
export interface Elements {
  textPlaceholder: HTMLElement;
  textBody: HTMLElement;
  typingInput: HTMLInputElement;
  visualText: HTMLElement;
  passiveText: HTMLElement;
  typingCaret: HTMLElement;

  settingsPanel: HTMLFormElement;
  settingsLang: HTMLElement;
  settingsMode: HTMLElement;
  settingsValue: HTMLElement;

  btnRepeat: HTMLButtonElement;
}

/**
 * Collects the required DOM elements from the document.
 *
 * @returns The typed element map for the app.
 */
export function getElements(): Elements {
  return {
    textPlaceholder: document.querySelector('.text__placeholder')!,
    textBody: document.querySelector('.text__body')!,
    typingInput: document.querySelector('#typing-input')!,
    visualText: document.querySelector('#visual-text')!,
    passiveText: document.querySelector('#passive-text')!,
    typingCaret: document.querySelector('#typing-caret')!,

    settingsPanel: document.querySelector('#settings-panel')!,
    settingsLang: document.querySelector('#settings-lang')!,
    settingsMode: document.querySelector('#settings-mode')!,
    settingsValue: document.querySelector('#settings-value')!,

    btnRepeat: document.querySelector('#btn-repeat')!,
  };
}
