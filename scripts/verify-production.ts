import { createClient } from '@supabase/supabase-js';

async function main() {
  const prodUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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
        console.log(`   - ID : ${found.id}`);
        console.log(`   - Email : ${found.email}`);
        console.log(`   - Confirmé / Invité : ${found.invited_at || found.created_at}`);
      } else {
        console.warn(`⚠️ Compte introuvable dans Supabase Auth pour : ${superAdminEmail}`);
        console.log(`   Comptes existants : ${data.users.map((u) => u.email).join(', ') || 'aucun'}`);
      }
    }
  }

  // 2. Test des endpoints HTTP sur l'URL de production
  if (prodUrl && !prodUrl.includes('localhost')) {
    console.log('\n--- 2. Test des endpoints de production ---');
    try {
      const resCommunaute = await fetch(`${prodUrl}/communaute`);
      console.log(`📡 GET /communaute HTTP Status : ${resCommunaute.status}`);

      const resHome = await fetch(prodUrl);
      console.log(`📡 GET / HTTP Status : ${resHome.status}`);
    } catch (err: any) {
      console.error('❌ Erreur de requête HTTP vers la production :', err.message);
    }
  }
}

main().catch(console.error);
