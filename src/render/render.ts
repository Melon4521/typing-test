import { generateText } from '../text/textGenerator';
import type { TextsCfg } from '../text/textsConfig';
import type { Elements } from './dom';

export function renderTest(els: Elements, textsCfg: TextsCfg) {
  const text = generateText(textsCfg);

  initPassiveText(els, text);

  els.typingInput.focus();
}

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

  // первый пробел
  els.passiveText.children[0].remove();
}
