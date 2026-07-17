'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

interface ThemeToggleProps {
  className?: string;
  iconClassName?: string;
}

export function ThemeToggle({ className, iconClassName }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`w-8 h-8 ${className || 'p-2'}`}></div>;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className={`transition-colors flex items-center justify-center ${className || 'p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10'}`}
      title="Toggle theme"
    >
      <span className={`material-symbols-outlined ${iconClassName || 'text-gray-900 dark:text-white'}`}>
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );
}
