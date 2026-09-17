'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    const root = document.documentElement;
    let dark = root.classList.contains('dark');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      const nextDark = root.classList.contains('dark');
      if (nextDark === dark) return;
      dark = nextDark;
      clearTimeout(timer);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        root.classList.remove('theme-transitioning');
        return;
      }
      root.classList.add('theme-transitioning');
      // Keep the override until the 600 ms color transition has settled.
      timer = setTimeout(() => root.classList.remove('theme-transitioning'), 650);
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      root.classList.remove('theme-transitioning');
    };
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
