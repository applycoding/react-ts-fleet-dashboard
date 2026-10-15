import { expect, test } from '@playwright/test';

test('shows the simulated fleet and filters to drones', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: 'Meridian' })).toBeVisible();
  await expect(page.getByRole('option', { name: /M-14/ })).toBeVisible();
  await expect(page.getByText('Browser sim')).toBeVisible();

  await page
    .getByRole('group', { name: 'Unit kind' })
    .getByRole('button', { name: 'Drones' })
    .click();
  await expect(page.getByRole('option', { name: /M-14/ })).toHaveCount(0);
  await expect(page.getByRole('option', { name: /D-12/ })).toBeVisible();

  await page.getByRole('option', { name: /D-12/ }).click();
  await expect(page.getByRole('region', { name: 'Telemetry' })).toContainText('D-12');
  await expect(page.getByRole('img', { name: /Speed in km\/h/ })).toBeVisible();
});
