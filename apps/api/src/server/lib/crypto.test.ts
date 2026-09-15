import { describe, it, expect } from 'vitest';
import {
  encryptText,
  decryptText,
  hashIp,
  hashToken,
  generateSecureToken,
  safeEqual,
} from './crypto.js';

describe('Crypto utilities', () => {
  it('chiffre et déchiffre correctement le contenu privé', () => {
    const originalText = 'Seigneur, je traverse une épreuve financière difficile en ce moment.';
    const { ciphertext, iv } = encryptText(originalText);

    expect(ciphertext).not.toBe(originalText);
    expect(iv).toBeDefined();

    const decrypted = decryptText(ciphertext, iv);
    expect(decrypted).toBe(originalText);
  });

  it('hache les adresses IP avec pepper sans stocker le clair', () => {
    const ip = '192.168.1.42';
    const hash1 = hashIp(ip);
    const hash2 = hashIp(ip);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toContain('192.168.1.42');
    expect(hash1?.length).toBe(64);
  });

  it('hache les tokens sensibles (manageToken) avec le pepper', () => {
    const rawToken = generateSecureToken(32);
    const hashed = hashToken(rawToken);

    expect(hashed).not.toBe(rawToken);
    expect(hashed.length).toBe(64);
    expect(hashToken(rawToken)).toBe(hashed);
    expect(safeEqual(hashed, hashToken(rawToken))).toBe(true);
    expect(safeEqual(hashed, hashToken('autre-token'))).toBe(false);
  });

  it('génère un jeton sécurisé aléatoire', () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();

    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThan(30);
  });

  it('compare deux chaînes de manière constante en temps', () => {
    expect(safeEqual('secret-token-123', 'secret-token-123')).toBe(true);
    expect(safeEqual('secret-token-123', 'wrong-token-456')).toBe(false);
  });
});
