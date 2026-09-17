import { describe, it, expect } from 'vitest';
import { PrayerService } from '../src/server/services/prayer.service';

describe('PrayerService', () => {
  it('détecte correctement un numéro de téléphone dans le contenu', () => {
    const text1 = 'Appelez-moi d’urgence au 06 12 34 56 78 pour prier';
    const text2 = 'Prière normale sans coordonnées particulières';

    expect(PrayerService.isSuspiciousContent(text1)).toBe(true);
    expect(PrayerService.isSuspiciousContent(text2)).toBe(false);
  });

  it('détecte les adresses e-mail', () => {
    const text = 'Écrivez-moi à contact@spam-voyance.com';
    expect(PrayerService.isSuspiciousContent(text)).toBe(true);
  });

  it('détecte les mots-clés de spam (casino, marabout, crypto)', () => {
    const text = 'Grand marabout voyant retour d’affection';
    expect(PrayerService.isSuspiciousContent(text)).toBe(true);
  });
});
