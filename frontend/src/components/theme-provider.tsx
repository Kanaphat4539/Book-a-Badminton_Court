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
      root.classList.add('theme-transitioning');
      // Read the shared CSS clock so cleanup never cuts the transition short.
      const duration = Number.parseFloat(
        getComputedStyle(root).getPropertyValue('--theme-transition-duration'),
      ) || 250;
      timer = setTimeout(() => root.classList.remove('theme-transitioning'), duration + 50);
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
