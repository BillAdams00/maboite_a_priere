import { test, expect } from '@playwright/test';

test.describe('Protection de l’espace Admin sans session', () => {
  const adminRoutes = [
    '/admin',
    '/admin/sujets',
    '/admin/statistiques',
    '/admin/administrateurs',
    '/admin/parametres',
    '/admin/journal',
  ];

  for (const route of adminRoutes) {
    test(`Accès à ${route} sans session redirige vers /admin/connexion`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL('**/admin/connexion', { timeout: 10000 });
      expect(page.url()).toContain('/admin/connexion');
      await expect(page.locator('h1')).toContainText('Espace Administrateur');
    });
  }

  test('Appel à l’API /api/admin/stats/export sans session est refusé (HTTP 401 ou 403)', async ({ request }) => {
    const response = await request.get('/api/admin/stats/export');
    expect([401, 403]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
