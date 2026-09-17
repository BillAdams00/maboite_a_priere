import { PrismaClient } from '@prisma/client';
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

  // 2. Compte Super-Administrateur initial
  const superAdminEmail = process.env.INITIAL_SUPER_ADMIN_EMAIL || 'admin@maboiteapriere.fr';
  const superAdminAuthUserId = process.env.INITIAL_SUPER_ADMIN_AUTH_ID || 'seed-super-admin-auth-id';

  await prisma.admin.upsert({
    where: { email: superAdminEmail },
    create: {
      authUserId: superAdminAuthUserId,
      email: superAdminEmail,
      firstName: 'Responsable',
      lastName: 'Département',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
    update: {},
  });
  console.log(`✅ Super-Administrateur initial configuré : ${superAdminEmail}`);

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
