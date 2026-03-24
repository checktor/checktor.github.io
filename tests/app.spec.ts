import { test, expect } from '@playwright/test';

test('has tab title', async ({ page }) => {
  await page.goto('http://localhost:4200');

  await expect(page).toHaveTitle(/checktor.github.io/);
});

test('has toolbar title', async ({ page }) => {
  await page.goto('http://localhost:4200');

  await expect(page.getByTestId('app-toolbar-title')).toContainText('checktor.github.io');
});

test('has toolbar button linking to about me page', async ({ page }) => {
  await page.goto('http://localhost:4200');

  await page.getByTestId('app-toolbar-button').click();

  await expect(page.getByTestId('about-me-card-title')).toContainText('C. Hecktor');
});
