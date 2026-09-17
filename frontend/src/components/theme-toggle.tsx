'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import './theme-toggle.css';

interface ThemeToggleProps {
  className?: string;
  iconClassName?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div aria-hidden="true" className={className || 'flex items-center justify-center p-2'}><span className="block h-9 w-[72px]" /></div>;
  }

  return (
    <div className={className || 'flex items-center justify-center p-2'} title="Toggle theme">
      <label className="theme">
        <span className="theme__toggle-wrap" style={{ fontSize: '12px' }}>
          <input 
            className="theme__toggle" 
            type="checkbox" 
            role="switch" 
            aria-label="Dark mode"
            name="theme" 
            value="dark"
            checked={resolvedTheme === 'dark'}
            onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')}
          />
          <span className="theme__icon">
            <span className="theme__icon-part"></span>
            <span className="theme__icon-part"></span>
            <span className="theme__icon-part"></span>
            <span className="theme__icon-part"></span>
            <span className="theme__icon-part"></span>
            <span className="theme__icon-part"></span>
            <span className="theme__icon-part"></span>
            <span className="theme__icon-part"></span>
            <span className="theme__icon-part"></span>
          </span>
        </span>
      </label>
    </div>
  );
}
