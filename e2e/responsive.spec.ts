import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = [
  '/',
  '/deposer',
  '/deposer/merci',
  '/communaute',
  '/exauces',
  '/a-propos',
  '/confidentialite',
  '/mentions-legales',
];

test.describe('Responsive mobile 375px', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  for (const pagePath of PUBLIC_PAGES) {
    test(`Pas de scroll horizontal sur ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      await page.waitForTimeout(600);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));

      expect(
        hasHorizontalScroll,
        `Débordement horizontal détecté sur ${pagePath} : scrollWidth=${metrics.scrollWidth}px > innerWidth=${metrics.innerWidth}px`
      ).toBe(false);
    });
  }
});
