import { useEffect, useState } from 'react';

const KEY = 'specrail.theme';

function getInitial(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';
  const stored = localStorage.getItem(KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function useThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitial);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);
  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) };
}
