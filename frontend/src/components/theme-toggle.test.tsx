import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './theme-toggle';

const setTheme = vi.fn();
let currentTheme = 'light';

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: currentTheme, setTheme }),
}));

describe('ThemeToggle (unit)', () => {
  beforeEach(() => {
    setTheme.mockClear();
    currentTheme = 'light';
  });

  it('renders a switch once mounted', async () => {
    render(<ThemeToggle />);
    expect(await screen.findByRole('switch')).toBeInTheDocument();
  });

  it('switches to dark when toggled from light', async () => {
    render(<ThemeToggle />);
    const toggle = await screen.findByRole('switch');
    fireEvent.click(toggle);
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('switches to light when toggled from dark', async () => {
    currentTheme = 'dark';
    render(<ThemeToggle />);
    const toggle = await screen.findByRole('switch');
    fireEvent.click(toggle);
    expect(setTheme).toHaveBeenCalledWith('light');
  });
});
