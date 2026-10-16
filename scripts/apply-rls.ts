import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

function getDirectUrl(): string {
  if (process.env.DIRECT_URL) {
    return process.env.DIRECT_URL;
  }
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*DIRECT_URL\s*=\s*["']?([^"'\r\n]+)["']?/);
      if (match) {
        return match[1];
      }
    }
  }
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  throw new Error('DIRECT_URL introuvable dans process.env ou .env');
}

/**
 * Découpe le fichier SQL en instructions individuelles en préservant les blocs DO $$ ... $$;
 * PostgreSQL / Prisma ne supportant pas les instructions multiples dans une commande préparée unique.
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;

  const lines = sql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!inDollarQuote && (trimmed.startsWith('--') || trimmed.length === 0)) {
      continue;
    }

    if (line.includes('$$')) {
      const matches = line.match(/\$\$/g);
      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          inDollarQuote = !inDollarQuote;
        }
      }
    }

    current += line + '\n';

    if (!inDollarQuote && trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }

  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  return statements.filter((s) => s.length > 0);
}

async function main() {
  const directUrl = getDirectUrl();
  const maskedUrl = directUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`🔐 Connexion à la base via DIRECT_URL (${maskedUrl})...`);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: directUrl,
      },
    },
  });

  try {
    const sqlPath = path.resolve(__dirname, '../prisma/sql/enable-rls.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Fichier SQL introuvable à l'emplacement : ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    const statements = splitSqlStatements(sqlContent);
    console.log(`📜 Exécution de prisma/sql/enable-rls.sql (${statements.length} instruction(s))...`);

    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt);
    }
    console.log('✅ Instructions SQL exécutées avec succès.\n');

    console.log('🔍 Vérification du statut Row Level Security (RLS) sur TOUTES les tables de public via pg_tables.rowsecurity :');
    const rows = await prisma.$queryRaw<Array<{ tablename: string; rowsecurity: boolean }>>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename ASC;
    `;

    if (rows.length === 0) {
      console.warn('\n⚠️ Aucune table trouvée dans le schéma public.');
      process.exit(1);
    }

    let allCovered = true;
    console.log('┌──────────────────────────────────────┬──────────────────────┬─────────────────────────┐');
    console.log('│ Table                                │ Statut RLS           │ Résultat                │');
    console.log('├──────────────────────────────────────┼──────────────────────┼─────────────────────────┤');

    for (const r of rows) {
      if (r.rowsecurity === true) {
        console.log(`│ ${r.tablename.padEnd(36)} │ RLS = true           │ 🟢 Protégé              │`);
      } else {
        console.log(`│ ${r.tablename.padEnd(36)} │ RLS = false          │ 🔴 NON PROTÉGÉ          │`);
        allCovered = false;
      }
    }
    console.log('└──────────────────────────────────────┴──────────────────────┴─────────────────────────┘');

    if (!allCovered) {
      console.error('\n❌ Échec : au moins une table du schéma public n’a pas RLS activé !');
      process.exit(1);
    } else {
      console.log(`\n🛡️ Succès : 100 % des tables du schéma public (${rows.length}/${rows.length}) ont RLS = true et accès PostgREST bloqué.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Échec de l’application de RLS :', err.message);
  process.exit(1);
});
