import { generateText } from '../text/textGenerator';
import type { TextsCfg } from '../text/textsConfig';
import type { Elements } from './dom';

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

export function renderTest(els: Elements, textsCfg: TextsCfg) {
  const text = generateText(textsCfg);
  initPassiveText(els, text);
}
