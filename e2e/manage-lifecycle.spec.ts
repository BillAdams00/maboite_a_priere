import { test, expect } from '@playwright/test';
import { prisma } from '../src/server/db';

test.describe('Lien de gestion /mon-sujet/[token] & Cycle d\'exaucement', () => {
  const uniqueId = Date.now().toString(36);
  const prayerContent = `Demande de prière pour déblocage professionnel et direction divine (ref-${uniqueId}).`;
  const testimony = `Le Seigneur a merveilleusement pourvu et ouvert une nouvelle opportunité (témoignage ${uniqueId}) !`;
  const authorFirstName = 'Sarah';
  const authorLastName = 'ExauceeSecret';

  test('4. Token invalide → 404', async ({ page }) => {
    const invalidToken = 'token-invalide-inexistant-1234567890abcdef';
    const response = await page.goto(`/mon-sujet/${invalidToken}`);
    expect([404, 200]).toContain(response?.status());
    await expect(page.locator('body')).toContainText(/Cette page n’a pas pu être trouvée|introuvable|404/i);
  });

  test('4. Cycle d\'exaucement complet via le lien de gestion privé', async ({ page }) => {
    // 1. Dépôt initial du sujet
    await page.goto('/deposer');
    await page.fill('#firstName', authorFirstName);
    await page.fill('#lastName', authorLastName);
    await page.fill('#content', prayerContent);

    await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', { timeout: 15000 });
    await page.click('button[type="submit"]');

    await page.waitForURL('**/deposer/merci', { timeout: 10000 });

    // Récupération du token de gestion et du slug
    const manageToken = await page.evaluate(() => sessionStorage.getItem('mbap_last_manage_token'));
    const publicSlug = await page.evaluate(() => sessionStorage.getItem('mbap_last_slug'));
    expect(manageToken).toBeTruthy();
    expect(publicSlug).toBeTruthy();

    // 2. Accès à la page de gestion privée avec le token valide
    await page.goto(`/mon-sujet/${manageToken}`);
    await expect(page.locator('body')).toContainText('Gestion de votre sujet');
    await expect(page.locator('body')).toContainText(prayerContent);
    await expect(page.locator('body')).toContainText(authorFirstName);

    // 3. Déclaration de l'exaucement par le déposant
    const openModalBtn = page.locator('button', { hasText: 'Témoigner d\'un exaucement' });
    await expect(openModalBtn).toBeVisible();
    await openModalBtn.click();

    // Remplissage du témoignage dans la modale
    const testimonyTextarea = page.locator('textarea[placeholder*="Le Seigneur a répondu"]');
    await expect(testimonyTextarea).toBeVisible();
    await testimonyTextarea.fill(testimony);

    // Soumission du témoignage
    await page.click('button[type="submit"]:has-text("Transmettre mon témoignage")');

    // Vérification du retour visuel immédiat
    await expect(page.locator('body')).toContainText(/témoignage a été transmis|confirmation/i);

    // 4. Modération pastorale : confirmation de l'exaucement dans la base Postgres locale
    const dbPrayer = await prisma.prayerRequest.findUnique({
      where: { publicSlug: publicSlug! },
    });
    expect(dbPrayer).not.toBeNull();

    await prisma.$transaction([
      prisma.answeredClaim.update({
        where: { requestId: dbPrayer!.id },
        data: {
          confirmedAt: new Date(),
        },
      }),
      prisma.prayerRequest.update({
        where: { id: dbPrayer!.id },
        data: {
          isAnswered: true,
          answeredAt: new Date(),
          answeredNote: testimony,
        },
      }),
    ]);

    // 5. Rechargement de la page privée /mon-sujet/[token]
    await page.reload();
    await expect(page.locator('body')).toContainText('Exaucé');
    await expect(page.locator('body')).toContainText('Votre témoignage d\'exaucement :');
    await expect(page.locator('body')).toContainText(testimony);

    // 6. Vérification sur la page publique des prières exaucées /exauces
    await page.goto('/exauces');
    await expect(page.locator('body')).toContainText(prayerContent);
    await expect(page.locator('body')).toContainText(authorFirstName);
    await expect(page.locator('body')).toContainText(testimony);
    await expect(page.locator('body')).toContainText('Prière exaucée 🙌');

    // Le nom de famille ne doit JAMAIS apparaître sur /exauces
    const pageHtml = await page.content();
    expect(pageHtml).not.toContain(authorLastName);
  });
});
