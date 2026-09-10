import { test, expect } from '@playwright/test';

// SYSTEM level: full stack (real browser -> Next.js -> proxy -> NestJS -> DB),
// verifying technical flows and access control.
test.describe('System: auth & route protection', () => {
  test('redirects an unauthenticated visitor away from /booking to /login', async ({ page }) => {
    await page.goto('/booking');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('rejects invalid credentials and stays on the login page', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#username').fill('user');
    await page.locator('#password').fill('definitely-wrong');
    await page.locator('form button[type="submit"]').click();

    // Error toast appears and we do not navigate to the dashboard.
    await expect(page.getByText(/invalid credentials|login failed/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('logs in the seeded user and stores a JWT', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#username').fill('user');
    await page.locator('#password').fill('password');
    await page.locator('form button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard$/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });
});
