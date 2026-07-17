'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import './theme-toggle.css';

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
    <div className={className || 'flex items-center justify-center p-2'} title="Toggle theme">
      <label className="theme">
        <span className="theme__toggle-wrap" style={{ fontSize: '12px' }}>
          <input 
            id="theme-toggle"
            className="theme__toggle" 
            type="checkbox" 
            role="switch" 
            name="theme" 
            value="dark"
            checked={theme === 'dark'}
            onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
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
