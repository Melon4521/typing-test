function settingsPanelInit() {
  // смена 'ru' на 'en'
  const langCheckbox = document
    .querySelector('#settings-lang')
    .querySelector('input[type="checkbox"]');
  const span = langCheckbox.nextElementSibling;

  span.textContent = langCheckbox.checked ? 'ru' : 'en';

  langCheckbox.onchange = () => {
    span.textContent = langCheckbox.checked ? 'ru' : 'en';
  };
}

settingsPanelInit();
