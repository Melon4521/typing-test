function InitThemeSwitcher() {
  // NOTE: Состояния переключателя
  // light - false
  // dark - true

  // Проверяем Local Storage
  let theme = localStorage.getItem('theme');

  if (!theme) {
    // Если нет в Local Storage, то проверяем media query
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  document.documentElement.dataset.theme = theme;

  const themeSwither = document.querySelector('#theme-switcher');
  themeSwither.checked = theme === 'dark';

  document.addEventListener('change', function (e) {
    if (e.target.id === 'theme-switcher') {
      let theme = document.documentElement.dataset.theme;
      theme = theme === 'dark' ? 'light' : 'dark';

      document.documentElement.dataset.theme = theme;
      localStorage.setItem('theme', theme);
    }
  });
}

InitThemeSwitcher();
