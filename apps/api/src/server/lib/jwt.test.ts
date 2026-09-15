import { describe, it, expect } from 'vitest';
import { createAccessToken, verifyAccessToken } from './jwt.js';

describe('JWT utilities', () => {
  it('signe et vérifie un jeton administrateur valide', async () => {
    const payload = {
      adminId: 'admin_123',
      email: 'pasteur@eglise.fr',
      role: 'ADMIN' as const,
    };

    const token = await createAccessToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const verified = await verifyAccessToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.adminId).toBe(payload.adminId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe(payload.role);
  });

  it('rejette un jeton invalide ou corrompu', async () => {
    const verified = await verifyAccessToken('token-invalide-corrompu.xyz');
    expect(verified).toBeNull();
  });
});
