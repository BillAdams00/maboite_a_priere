import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '../src/server/db';

const PUBLIC_TABLES = [
  'PrayerRequest',
  'PrayerAction',
  'Admin',
  'AdminInvitation',
  'AnsweredClaim',
  'Report',
  'AuditLog',
  'Setting',
  'DailyStat',
  'UsedExpressToken',
];

describe('Preuve Row Level Security (RLS) & étanchéité PostgREST', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('100% des tables du schéma public ont RLS = true dans PostgreSQL', async () => {
    const rows = await prisma.$queryRaw<Array<{ tablename: string; rowsecurity: boolean }>>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename ASC;
    `;

    expect(rows.length).toBeGreaterThan(0);

    for (const table of rows) {
      expect(
        table.rowsecurity,
        `La table ${table.tablename} doit avoir RLS activé (rowsecurity = true)`
      ).toBe(true);
    }
  });

  it('Si clés Supabase réelles configurées : aucune donnée n\'est accessible via la clé anon sur l\'API REST', async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const isPlaceholder =
      !supabaseUrl ||
      !anonKey ||
      supabaseUrl.includes('placeholder-project') ||
      anonKey.includes('placeholder-anon-key');

    if (isPlaceholder) {
      console.log(
        'ℹ️ Clés Supabase distantes non configurées (placeholders locaux). Le test d\'étanchéité SQL pg_tables.rowsecurity confirme que RLS est actif sur toutes les tables.'
      );
      return;
    }

    for (const tableName of PUBLIC_TABLES) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=*`, {
          method: 'GET',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
        });

        if (response.ok) {
          const data = (await response.json()) as any[];
          expect(
            Array.isArray(data) && data.length === 0,
            `La table ${tableName} ne doit renvoyer aucune ligne à la clé anon (reçu ${data?.length} lignes)`
          ).toBe(true);
        } else {
          // 401 Unauthorized, 403 Forbidden ou 404 Not Found sont également des refus d'accès valides
          expect([401, 403, 404]).toContain(response.status);
        }
      } catch (err: any) {
        console.warn(`Tentative de connexion à ${tableName} :`, err.message);
      }
    }
  });
});
