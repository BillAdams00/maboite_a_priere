import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibilité (axe-core WCAG 2 AA)', () => {
  const pagesToTest = ['/', '/deposer', '/communaute'];

  for (const pagePath of pagesToTest) {
    test(`Zéro violation critique ou sérieuse sur ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      // Laisser le temps aux animations et composants client de se stabiliser
      await page.waitForTimeout(1000);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const seriousOrCriticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'serious' || v.impact === 'critical'
      );

      if (seriousOrCriticalViolations.length > 0) {
        console.error(
          `Violations d'accessibilité détectées sur ${pagePath}:`,
          JSON.stringify(seriousOrCriticalViolations, null, 2)
        );
      }

      expect(
        seriousOrCriticalViolations,
        `Violations critiques ou sérieuses trouvées sur ${pagePath}`
      ).toEqual([]);
    });
  }
});
