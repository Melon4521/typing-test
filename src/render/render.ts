import { generateText } from '../text/textGenerator';
import type { TextsCfg } from '../text/textsConfig';
import type { Elements } from './dom';

/**
 * Renders DOM for an actual test state
 *
 * @param els - The DOM elements used by the typing test.
 * @param textsCfg - The configuration of texts.
 */
export function renderTest(els: Elements, textsCfg: TextsCfg) {
  const text = generateText(textsCfg);

  initPassiveText(els, text);

  els.typingInput.focus();
}

/**
 * Attaches focus and blur listeners to the typing input before the test starts.
 *
 * Allows the user to focus the input either by clicking the placeholder or by pressing
 * any printable key when the placeholder is active.
 *
 * @param els - The DOM elements used by the typing test.
 */
export function setFocusActionsOnTypingInput(els: Elements) {
  els.typingInput.focus();

  const isPlaceholderBlur = () =>
    els.textPlaceholder.classList.contains('_blur');

  els.typingInput.addEventListener('blur', () => {
    if (!isPlaceholderBlur()) {
      els.textPlaceholder.classList.add('_blur');

      els.textPlaceholder.onclick = () => els.typingInput.focus();
      document.addEventListener('keydown', onKeyDown);
    }
  });

  els.typingInput.addEventListener('focus', () => {
    if (isPlaceholderBlur()) {
      els.textPlaceholder.classList.remove('_blur');

      els.textPlaceholder.onclick = null;
      document.removeEventListener('keydown', onKeyDown);
    }
  });

  /**
   * Focuses the typing input when the user presses a printable key while the placeholder is active.
   *
   * @param e - The keyboard event that triggered the handler.
   */
  function onKeyDown(e: KeyboardEvent) {
    if (
      ![
        'Tab',
        'Enter',
        'Space',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
      ].includes(e.code) &&
      !e.shiftKey &&
      !e.altKey &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      e.preventDefault();
      els.typingInput.focus();
    }
  }
}

/**
 * Builds the passive text view by inserting the generated words and spaces into the DOM.
 *
 * @param els - The DOM elements used to render the passive text.
 * @param text - The array of words that should be displayed.
 */
function initPassiveText(els: Elements, text: string[]) {
  els.passiveText.innerHTML = '';
  let wordKey = '';

  for (const word of text) {
    wordKey += word;

    const span = document.createElement('span');
    span.textContent = word;
    span.dataset.key = wordKey;

    const space = document.createElement('span');
    space.textContent = ' ';

    els.passiveText.append(space, span);

    wordKey += ' ';
  }

  // Remove first space
  els.passiveText.children[0].remove();
}
