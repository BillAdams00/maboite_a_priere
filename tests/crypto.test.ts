import { describe, it, expect } from 'vitest';
import {
  encryptText,
  decryptText,
  hashIp,
  hashToken,
  generateSecureToken,
  safeEqual,
  signExpressToken,
  verifyExpressToken,
} from '../src/server/lib/crypto';

describe('Crypto utilities', () => {
  it('chiffre et déchiffre correctement le contenu privé', () => {
    const originalText = 'Seigneur, je traverse une épreuve difficile en ce moment.';
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

  it('génère un jeton express signé et le valide', () => {
    const token = signExpressToken('req-12345', 'unpublish', 2);
    expect(token).toBeDefined();

    const verification = verifyExpressToken(token);
    expect(verification.valid).toBe(true);
    expect(verification.requestId).toBe('req-12345');
    expect(verification.action).toBe('unpublish');
  });

  it('rejette un jeton express altéré', () => {
    const token = signExpressToken('req-12345', 'unpublish', 2);
    const altered = token.slice(0, -4) + 'abcd';
    const verification = verifyExpressToken(altered);
    expect(verification.valid).toBe(false);
  });
});
