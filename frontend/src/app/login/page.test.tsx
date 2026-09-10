import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';

// Mock the network boundary and framework glue so we test the page's behavior,
// not axios or Next internals.
const post = vi.fn();
vi.mock('@/lib/api', () => ({ default: { post: (...args: any[]) => post(...args) } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('next-themes', () => ({ useTheme: () => ({ theme: 'light', setTheme: vi.fn() }) }));

const success = vi.fn();
const error = vi.fn();
vi.mock('sonner', () => ({ toast: { success: (m: string) => success(m), error: (m: string) => error(m) } }));

describe('LoginPage (integration: form + mocked api)', () => {
  beforeEach(() => {
    post.mockReset();
    success.mockReset();
    error.mockReset();
    localStorage.clear();
  });

  it('posts credentials and stores the token + user on success', async () => {
    post.mockResolvedValue({
      data: {
        access_token: 'jwt-123',
        user: { id: 1, username: 'user', name: 'Normal User', role: 'USER' },
      },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(post).toHaveBeenCalledWith('/auth/login', {
      username: 'user',
      password: 'password',
    }));

    expect(localStorage.getItem('token')).toBe('jwt-123');
    expect(JSON.parse(localStorage.getItem('user')!).username).toBe('user');
    expect(success).toHaveBeenCalled();
  });

  it('shows an error toast and stores nothing when login fails', async () => {
    post.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(error).toHaveBeenCalledWith('Invalid credentials'));
    expect(localStorage.getItem('token')).toBeNull();
  });
});
