import { test, expect } from '@playwright/test';

// ACCEPTANCE level: each test is a user story exercised through the real UI.
// Spec titles map 1:1 to the acceptance criteria in TESTING.md.

test.describe('Acceptance: student', () => {
  test('As a student, I can register a new account and land on the dashboard', async ({ page }) => {
    const unique = Date.now();
    await page.goto('/register');

    await page.locator('#studentId').fill(`64010${unique % 1000}`);
    await page.locator('#email').fill(`stud${unique}@example.com`);
    await page.locator('#name').fill('Test Student');
    await page.locator('#phone').fill('0812345678');
    await page.locator('#major').fill('Computer Science');
    await page.locator('#year').selectOption('3');
    await page.locator('#username').fill(`student_${unique}`);
    await page.locator('#password').fill('pw12345');

    await page.locator('form button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('As a student, I can log in and open the booking calendar for today', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#username').fill('user');
    await page.locator('#password').fill('password');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto('/booking');
    // The booking calendar renders: the page heading, the time-slot section, and
    // the availability legend. (Individual slots switch between button/disabled
    // depending on the clock, so we assert the stable scaffolding instead.)
    await expect(page.getByText('จองคอร์ทแบดมินตัน')).toBeVisible();
    await expect(page.getByRole('heading', { name: /ช่วงเวลา/ })).toBeVisible();
    await expect(page.getByText('21:00')).toBeVisible();
  });
});

test.describe('Acceptance: admin', () => {
  test('As an admin, I can log in and reach the admin dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('password');
    await page.locator('form button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard$/);
    const role = await page.evaluate(() => {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u).role : null;
    });
    expect(role).toBe('ADMIN');
  });
});
