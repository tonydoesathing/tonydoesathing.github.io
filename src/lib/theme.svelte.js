// The light/dark theme: a saved choice wins, otherwise the system preference.
// index.html repeats the key, values and resolution in its pre-paint script;
// keep the two in sync.

export const STORAGE_KEY = 'theme';
export const THEMES = ['light', 'dark'];
const SYSTEM_DARK = '(prefers-color-scheme: dark)';

/** A saved value if it names a theme, otherwise null. */
export const validTheme = value => (THEMES.includes(value) ? value : null);

/** The theme to show for a saved choice (or null) and the system preference. */
export const resolveTheme = (saved, systemDark) => saved ?? (systemDark ? 'dark' : 'light');

let saved = $state(null);
let systemDark = $state(false);

export const theme = {
  get current() {
    return resolveTheme(saved, systemDark);
  },
  /** Switches to the other theme and saves the choice, if storage allows. */
  toggle() {
    saved = theme.current === 'dark' ? 'light' : 'dark';
    apply();
    try {
      localStorage.setItem(STORAGE_KEY, saved);
    } catch {
      // The control also works when browser storage is unavailable.
    }
  },
};

function apply() {
  document.documentElement.dataset.theme = theme.current;
}

/**
 * Reads the saved choice and follows system changes and other tabs' choices.
 *
 * @returns {() => void} Stops following.
 */
export function syncTheme() {
  const system = matchMedia(SYSTEM_DARK);
  systemDark = system.matches;
  try {
    saved = validTheme(localStorage.getItem(STORAGE_KEY));
  } catch {
    // Without storage, follow the system theme.
  }
  apply();

  const onSystemChange = () => {
    systemDark = system.matches;
    apply();
  };
  const onStorageChange = event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    // Ignore unrelated sessionStorage events. A cleared setting resumes auto.
    try {
      if (event.storageArea !== localStorage) return;
    } catch {
      return;
    }
    saved = validTheme(event.newValue);
    apply();
  };
  system.addEventListener('change', onSystemChange);
  window.addEventListener('storage', onStorageChange);
  return () => {
    system.removeEventListener('change', onSystemChange);
    window.removeEventListener('storage', onStorageChange);
  };
}
