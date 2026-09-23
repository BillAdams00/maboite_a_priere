import { describe, it, expect } from 'vitest';
import { getDailyVerse, DAILY_VERSES } from '../src/lib/constants/daily-verses';

describe('Daily Verse calculation (Europe/Paris timezone)', () => {
  it('retourne un verset valide contenant reference, text et theme', () => {
    const verse = getDailyVerse();
    expect(verse).toBeDefined();
    expect(verse.reference).toBeTruthy();
    expect(verse.text).toBeTruthy();
    expect(verse.theme).toBeTruthy();
    expect(DAILY_VERSES).toContain(verse);
  });

  it('est déterministe pour une date calendaire donnée', () => {
    const date1 = new Date('2026-09-23T10:00:00.000Z');
    const date2 = new Date('2026-09-23T14:30:00.000Z');

    const verse1 = getDailyVerse(date1);
    const verse2 = getDailyVerse(date2);

    expect(verse1.reference).toBe(verse2.reference);
    expect(verse1.text).toBe(verse2.text);
  });

  it('ancre le calcul sur le fuseau Europe/Paris plutôt que UTC', () => {
    // Le 23 septembre à 23h30 UTC correspond au 24 septembre à 01h30 (heure d'été CEST, UTC+2) à Paris.
    const dateLateUtc = new Date('2026-09-23T23:30:00.000Z'); // = 24/09/2026 à Paris
    const dateNextDayParis = new Date('2026-09-24T12:00:00.000Z'); // = 24/09/2026 à Paris

    const verseLate = getDailyVerse(dateLateUtc);
    const verseNextDay = getDailyVerse(dateNextDayParis);

    // Les deux dates correspondent au même jour calendaire (24 septembre) à Paris
    expect(verseLate.reference).toBe(verseNextDay.reference);
  });
});
