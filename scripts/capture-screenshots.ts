import { mkdir } from 'node:fs/promises';
import { chromium, type Page } from '@playwright/test';

const base = process.env.CAPTURE_URL ?? 'http://127.0.0.1:4173';

async function waitForMap(page: Page): Promise<void> {
  await page
    .getByRole('option', { name: /M-14|D-12/ })
    .first()
    .waitFor();
  await page.evaluate('document.fonts.ready');
  try {
    await page.waitForFunction(
      `() => [...document.querySelectorAll('img.leaflet-tile')].some((tile) => tile.complete && tile.naturalWidth > 0)`,
      undefined,
      { timeout: 12_000 },
    );
  } catch {
    // A screenshot without tiles is still useful if the tile host is slow.
  }
  await page.waitForTimeout(400);
}

async function prepare(page: Page, scheme: 'light' | 'dark'): Promise<void> {
  await page.goto(base);
  await page
    .getByRole('button', { name: scheme === 'dark' ? 'Dark' : 'Light', exact: true })
    .click();
  await page.getByRole('option', { name: /D-12/ }).click();
  await waitForMap(page);
}

async function main(): Promise<void> {
  await mkdir('docs/screenshots', { recursive: true });
  const browser = await chromium.launch();

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await prepare(desktop, 'dark');
  await desktop.screenshot({ path: 'docs/screenshots/desktop-dark.png' });

  await prepare(desktop, 'light');
  await desktop.screenshot({ path: 'docs/screenshots/desktop-light.png' });
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await prepare(mobile, 'dark');
  await mobile.screenshot({ path: 'docs/screenshots/mobile-dark.png', fullPage: true });
  await mobile.close();

  await browser.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
