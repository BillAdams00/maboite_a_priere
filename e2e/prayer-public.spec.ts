import { test, expect } from '@playwright/test';

test.describe('Parcours Public & Prière', () => {
  const uniqueId = Date.now().toString(36);
  const prayerContent = `Seigneur soutiens notre famille dans cette épreuve médicale (ref-${uniqueId}).`;
  const authorFirstName = 'David';
  const authorLastName = 'MartinSecret';

  test('1. Dépôt PUBLIC → visible sur /communaute sans fuite du nom de famille', async ({ page }) => {
    await page.goto('/deposer');

    await page.fill('#firstName', authorFirstName);
    await page.fill('#lastName', authorLastName);
    await page.selectOption('#category', 'sante');
    await page.fill('#content', prayerContent);

    // Attente du jeton Turnstile automatique avec clé de test Cloudflare
    await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', { timeout: 15000 });

    // Soumission du sujet
    await page.click('button[type="submit"]');

    // Vérification de la confirmation
    await page.waitForURL('**/deposer/merci', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Ton sujet a bien été déposé');

    // Vérification sur le mur de la communauté
    await page.goto('/communaute');
    await expect(page.locator('body')).toContainText(prayerContent);
    await expect(page.locator('body')).toContainText(authorFirstName);

    // Vérification stricte : le nom de famille ne doit JAMAIS apparaître dans le HTML
    const pageHtml = await page.content();
    expect(pageHtml).not.toContain(authorLastName);
  });

  test('3. « Je prie pour toi » est idempotent (deux clics = +1)', async ({ page }) => {
    await page.goto('/communaute');

    // Localisation de la carte contenant notre sujet de test
    const card = page.locator('article', { hasText: prayerContent });
    await expect(card).toBeVisible({ timeout: 10000 });

    const prayButton = card.locator('button').filter({ has: page.locator('span.font-mono') });
    await expect(prayButton).toBeVisible();

    // Lecture du compteur initial
    const countBadge = card.locator('button span.font-mono');
    const initialText = (await countBadge.textContent())?.trim() || '0';
    const initialCount = parseInt(initialText, 10);

    // Premier clic : enregistrement de la prière
    await prayButton.click();

    // Attente du passage à "J'ai prié" et du compteur à initialCount + 1
    await expect(card.locator('text=J\'ai prié')).toBeVisible({ timeout: 5000 });
    await expect(countBadge).toHaveText(String(initialCount + 1));

    // Le bouton doit désormais être désactivé côté interface
    await expect(prayButton).toBeDisabled();

    // Rechargement complet de la page pour simuler une nouvelle tentative par le même visiteur
    await page.reload();
    await page.waitForTimeout(1000);

    const reloadedCard = page.locator('article', { hasText: prayerContent });
    const reloadedBadge = reloadedCard.locator('button span.font-mono');

    // Le compteur doit TOUJOURS être à initialCount + 1 (idempotence garantie)
    await expect(reloadedBadge).toHaveText(String(initialCount + 1));
  });
});
