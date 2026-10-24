import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Auto-chargement sécurisé de .env.production.local si présent
const envProdPath = path.resolve(process.cwd(), '.env.production.local');
if (fs.existsSync(envProdPath)) {
  const content = fs.readFileSync(envProdPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

async function main() {
  const prodUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maboite-a-priere.vercel.app';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const superAdminEmail = (process.env.INITIAL_SUPER_ADMIN_EMAIL || '').trim().toLowerCase();

  console.log('🔍 Début de la vérification de production...');
  console.log(`🌐 URL cible : ${prodUrl}`);

  // 1. Vérification du compte dans Supabase Auth
  if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes('placeholder')) {
    console.log('\n--- 1. Vérification Supabase Auth ---');
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.error('❌ Erreur lors de la lecture des utilisateurs Supabase Auth :', error.message);
    } else {
      const found = data.users.find((u) => u.email?.toLowerCase() === superAdminEmail);
      if (found) {
        console.log(`✅ Compte Super-Admin confirmé dans Supabase Auth :`);
        console.log(`   - Email : ${found.email}`);
        console.log(`   - Confirmé / Invité : ${found.invited_at || found.created_at}`);
      } else {
        console.warn(`⚠️ Compte introuvable dans Supabase Auth pour : ${superAdminEmail}`);
      }
    }
  }

  // 2. Test des endpoints HTTP sur l'URL de production
  if (prodUrl && !prodUrl.includes('localhost')) {
    console.log('\n--- 2. Test des endpoints de production ---');
    try {
      // GET /
      const resHome = await fetch(prodUrl);
      console.log(`📡 GET / HTTP Status : ${resHome.status} ${resHome.status === 200 ? '✅' : '❌'}`);

      // GET /communaute
      const resCommunaute = await fetch(`${prodUrl}/communaute`);
      console.log(`📡 GET /communaute HTTP Status : ${resCommunaute.status} ${resCommunaute.status === 200 ? '✅' : '❌'}`);

      // GET /admin sans session -> redirection vers /admin/connexion
      const resAdmin = await fetch(`${prodUrl}/admin`, { redirect: 'manual' });
      const isRedirect = resAdmin.status === 307 || resAdmin.status === 308 || resAdmin.status === 302;
      const location = resAdmin.headers.get('location') || '';
      const redirectsToLogin = isRedirect && location.includes('/admin/connexion');
      console.log(`🔒 GET /admin sans session HTTP Status : ${resAdmin.status} (Location: ${location}) ${redirectsToLogin ? '✅' : '❌'}`);

      // GET /api/cron/daily-stats sans en-tête d'autorisation -> 401
      const resCron = await fetch(`${prodUrl}/api/cron/daily-stats`);
      console.log(`🛡️ GET /api/cron/daily-stats sans secret HTTP Status : ${resCron.status} ${resCron.status === 401 ? '✅' : '❌'}`);
    } catch (err: any) {
      console.error('❌ Erreur de requête HTTP vers la production :', err.message);
    }
  }

  // 3. Test de fuite REST Supabase avec la clé anon (doit retourner aucune donnée)
  if (supabaseUrl && anonKey && !supabaseUrl.includes('placeholder')) {
    console.log('\n--- 3. Test étanchéité PostgREST (clé anon) ---');
    try {
      const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      };

      const resPrayers = await fetch(`${supabaseUrl}/rest/v1/PrayerRequest?select=*`, { headers });
      const prayersData = resPrayers.ok ? await resPrayers.json() : null;
      const noPrayers = !resPrayers.ok || (Array.isArray(prayersData) && prayersData.length === 0);
      console.log(`🛡️ PostgREST /rest/v1/PrayerRequest Status : ${resPrayers.status} - Données accessibles : ${Array.isArray(prayersData) ? prayersData.length : 0} ${noPrayers ? '✅ (Étanche)' : '❌ (Fuite)'}`);

      const resAdmins = await fetch(`${supabaseUrl}/rest/v1/Admin?select=*`, { headers });
      const adminsData = resAdmins.ok ? await resAdmins.json() : null;
      const noAdmins = !resAdmins.ok || (Array.isArray(adminsData) && adminsData.length === 0);
      console.log(`🛡️ PostgREST /rest/v1/Admin Status : ${resAdmins.status} - Données accessibles : ${Array.isArray(adminsData) ? adminsData.length : 0} ${noAdmins ? '✅ (Étanche)' : '❌ (Fuite)'}`);
    } catch (err: any) {
      console.error('❌ Erreur lors du test PostgREST :', err.message);
    }
  }
}

main().catch(console.error);
