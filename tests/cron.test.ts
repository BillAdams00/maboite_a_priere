import { describe, it, expect } from 'vitest';
import { GET } from '../src/app/api/cron/daily-stats/route';

describe('Cron Daily Stats Route (/api/cron/daily-stats)', () => {
  it('refuse l’accès (HTTP 401) sans en-tête d’autorisation Authorization', async () => {
    const request = new Request('http://localhost:3000/api/cron/daily-stats');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Non autorisé' });
  });

  it('refuse l’accès (HTTP 401) si le secret Bearer est invalide', async () => {
    const request = new Request('http://localhost:3000/api/cron/daily-stats', {
      headers: {
        authorization: 'Bearer wrong-secret-token',
      },
    });
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Non autorisé' });
  });
});
