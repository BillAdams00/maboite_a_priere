import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_SETTINGS } from '../src/lib/constants/settings.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Amorçage de la base de données Ma boîte à prière (Web)...');

  // 1. Paramètres par défaut
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      create: {
        key,
        value: value as any,
        updatedBy: 'system-seed',
      },
      update: {},
    });
  }
  console.log('✅ Paramètres système initialisés.');

  // 2. Compte Super-Administrateur initial via Supabase Auth Admin
  const superAdminEmail = (
    process.env.INITIAL_SUPER_ADMIN_EMAIL || 'admin@maboiteapriere.fr'
  )
    .trim()
    .toLowerCase();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let authUserId: string | null = null;

  const hasRealSupabaseConfig =
    supabaseUrl &&
    serviceRoleKey &&
    !supabaseUrl.includes('placeholder') &&
    !serviceRoleKey.includes('placeholder');

  if (hasRealSupabaseConfig) {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log(`📡 Connexion à Supabase Auth pour inviter ${superAdminEmail}...`);

    // Tentative d'invitation directe (crée l'utilisateur Auth et envoie l'e-mail officiel)
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(superAdminEmail, {
        redirectTo: `${siteUrl}/admin`,
        data: {
          firstName: 'Responsable',
          lastName: 'Département',
          role: 'SUPER_ADMIN',
        },
      });

    if (!inviteError && inviteData.user) {
      authUserId = inviteData.user.id;
      console.log(
        `✉️ Invitation Supabase envoyée à ${superAdminEmail} (authUserId: ${authUserId})`
      );
    } else {
      // Idempotence : si l'utilisateur existe déjà dans Supabase Auth, récupérer son identifiant
      console.log(
        `ℹ️ Compte potentiellement déjà existant dans Supabase (${inviteError?.message || '422'}). Recherche du compte...`
      );
      const { data: usersData, error: listError } =
        await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 100,
        });

      if (!listError && usersData?.users) {
        const found = usersData.users.find(
          u => u.email?.toLowerCase() === superAdminEmail
        );
        if (found) {
          authUserId = found.id;
          console.log(
            `🔍 Compte Supabase existant trouvé pour ${superAdminEmail} (authUserId: ${authUserId})`
          );
        }
      }

      if (!authUserId) {
        console.warn(
          `⚠️ Impossible de déterminer l'authUserId Supabase : ${inviteError?.message}`
        );
        authUserId =
          process.env.INITIAL_SUPER_ADMIN_AUTH_ID || 'seed-super-admin-auth-id';
      }
    }
  } else {
    console.warn(
      '⚠️ SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL manquants ou factices (placeholder).\n' +
        "   Un identifiant factice est utilisé pour permettre l'exécution en local sans clés réelles.\n" +
        "   Pour envoyer le vrai e-mail d'invitation, connectez les vraies clés Supabase."
    );
    authUserId =
      process.env.INITIAL_SUPER_ADMIN_AUTH_ID || 'seed-super-admin-auth-id';
  }

  await prisma.admin.upsert({
    where: { email: superAdminEmail },
    create: {
      authUserId,
      email: superAdminEmail,
      firstName: 'Responsable',
      lastName: 'Département',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
    update: {
      authUserId,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Super-Administrateur configuré : ${superAdminEmail} (authUserId: ${authUserId})`);

  console.log('🎉 Amorçage terminé avec succès.');
}

main()
  .catch(e => {
    console.error('❌ Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
