import { test, expect } from '@playwright/test';

test.describe('Cloisonnement strict du PRIVÉ & Non-fuite des données', () => {
  const uniqueId = Date.now().toString(36);
  const privateContent = `Sujet ultra-confidentiel pastoral privé (ref-${uniqueId}).`;
  const authorFirstName = 'MariePrivee';
  const authorLastName = 'SecretPrivateFamily';

  test('2. Dépôt PRIVÉ → n\'apparaît JAMAIS sur /communaute, /exauces, /communaute/[slug], ni /api/prayers/count ; nom jamais fuité', async ({
    page,
    request,
  }) => {
    test.setTimeout(60000);
    await page.goto('/deposer');

    // Sélection de la confidentialité PRIVÉ
    await page.click('button:has-text("Privé")');

    await page.fill('#firstName', authorFirstName);
    await page.fill('#lastName', authorLastName);
    await page.fill('#content', privateContent);

    // Attente du jeton Turnstile
    await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', { timeout: 15000 });

    // Dépôt
    await page.click('button[type="submit"]');

    // Page de confirmation
    await page.waitForURL('**/deposer/merci', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Ton sujet a bien été déposé');

    // Récupération sécurisée du slug privé généré depuis le sessionStorage
    const privateSlug = await page.evaluate(() => {
      return sessionStorage.getItem('mbap_last_slug');
    });

    expect(privateSlug).toBeTruthy();

    // 1. Vérification sur /communaute : le texte secret et le nom ne doivent JAMAIS apparaître
    await page.goto('/communaute');
    const communauteHtml = await page.content();
    expect(communauteHtml).not.toContain(privateContent);
    expect(communauteHtml).not.toContain(authorFirstName);
    expect(communauteHtml).not.toContain(authorLastName);

    // 2. Vérification sur /exauces : aucune présence
    await page.goto('/exauces');
    const exaucesHtml = await page.content();
    expect(exaucesHtml).not.toContain(privateContent);
    expect(exaucesHtml).not.toContain(authorLastName);

    // 3. Vérification de l'URL directe /communaute/[slug] : doit retourner 404 (Introuvable)
    const directResponse = await page.goto(`/communaute/${privateSlug}`);
    expect([404, 200]).toContain(directResponse?.status());
    // Sur Next.js App Router, notFound() rend la page 404 personnalisée ou par défaut
    await expect(page.locator('body')).toContainText(/Cette page n’a pas pu être trouvée|introuvable|404/i);

    // 4. Vérification de l'API /api/prayers/count : doit retourner 404
    const apiResponse = await request.get(`/api/prayers/count?slug=${privateSlug}`);
    expect(apiResponse.status()).toBe(404);
    const apiBody = await apiResponse.json();
    expect(apiBody.error).toBe('Sujet introuvable');

    // 5. Vérification transversale : le nom de famille ne figure dans aucune page publique
    for (const publicPage of ['/', '/communaute', '/exauces', '/a-propos']) {
      await page.goto(publicPage);
      const html = await page.content();
      expect(html).not.toContain(authorLastName);
    }
  });
});
