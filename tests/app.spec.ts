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
  await expect(page.getByTestId('about-me-card-content')).toContainText('Working as IT consultant and playing around with all sorts of computers and music stuff in my free time.');
});

test('has card linking to "Raspberry Pi NAS server" page', async ({ page }) => {
  await page.goto('http://localhost:4200');

  await expect(page.getByTestId('raspberry-pi-nas-server-card-header')).toContainText('Raspberry Pi NAS server');
  await expect(page.getByTestId('raspberry-pi-nas-server-card-content')).toContainText('Searching for security and performance best practices when configuring Samba server on Raspberry Pi.');

  await page.getByTestId('raspberry-pi-nas-server-card').click();

  await expect(page.getByTestId('blog-post-markdown')).toContainText('Configuring a Raspberry Pi as NAS server inside your local network isn\'t that complicated.');
});

test('has card linking to "Under construction" page', async ({ page }) => {
  await page.goto('http://localhost:4200');

  await expect(page.getByTestId('under-construction-card-header')).toContainText('Under construction');
  await expect(page.getByTestId('under-construction-card-content')).toContainText('Stay tuned!');

  await page.getByTestId('under-construction-card').click();

  await expect(page.getByTestId('blog-post-markdown')).toContainText('Stay tuned!');
});
