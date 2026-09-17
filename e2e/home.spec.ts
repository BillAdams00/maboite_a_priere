import { test, expect } from '@playwright/test';

test.describe('Navigation publique', () => {
  test('La page d’accueil affiche le verset et les boutons d’action', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Ma boîte à prière/);
    await expect(page.locator('h1')).toContainText('Portons nos fardeaux les uns les autres');
    await expect(page.locator('text=Matthieu 18:19 (LSG)')).toBeVisible();

    const deposerBtn = page.locator('a[href="/deposer"]');
    await expect(deposerBtn.first()).toBeVisible();

    const communauteBtn = page.locator('a[href="/communaute"]');
    await expect(communauteBtn.first()).toBeVisible();
  });

  test('Accès au formulaire de dépôt', async ({ page }) => {
    await page.goto('/deposer');

    await expect(page.locator('h1')).toContainText('Déposer un sujet de prière');
    await expect(page.locator('input[placeholder="Ex. Samuel"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Ex. Dubois"]')).toBeVisible();

    // Boutons de confidentialité
    await expect(page.getByRole('button', { name: /Public/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Privé/ })).toBeVisible();
  });
});
