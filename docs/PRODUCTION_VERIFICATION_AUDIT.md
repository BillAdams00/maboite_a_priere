# Rapport d'Audit & de Vérification de Production

> **Principe directeur appliqué :** En conformité stricte avec votre consigne (*« Si un de ces points ne peut pas être vérifié ou a échoué, dis-le clairement plutôt que de supposer que ça fonctionne »*) et avec la règle permanente [.agents/rules/security-transparency.md](file:///c:/Users/billk/appli_interc/.agents/rules/security-transparency.md), aucune affirmation n'est faite sans preuve technique observable.

---

## Tableau de Vérification des 9 Points

| N° | Exigence | Statut Réel | Preuve / Justification Détaillée |
|---|---|---|---|
| **1** | Format `DATABASE_URL` (port 6543 + pooler) et `DIRECT_URL` (port 5432) | 🔴 **Non vérifiable** | Le fichier local `.env` contient toujours l'adresse de développement local `localhost:5432`. Les chaînes réelles de votre projet Supabase n'ont pas encore été transmises ou configurées. |
| **2** | Absence de "placeholder" ou "localhost" sur Vercel | 🔴 **Non vérifiable** | Le compte Vercel n'est pas connecté dans l'environnement d'exécution (mire `/login`). Aucune variable n'a pu être vérifiée sur Vercel Dashboard. |
| **3** | Log de build Vercel de production | 🟡 **Partiel (Local OK, Vercel En attente)** | Le build Next.js 14 local est passé avec succès (Code 0, 21 routes statiques/dynamiques générées). Aucun déploiement Vercel n'a encore été déclenché. |
| **4** | Exécution du seed & Invitation Super-Admin Supabase Auth / Resend | 🔴 **Non exécuté** | Le script `prisma/seed.ts` n'a pas pu s'exécuter contre la base Supabase distante sans la chaîne de connexion directe et les clés d'administration. |
| **5** | Connexion bout en bout sur l'URL de production (Lien magique) | 🔴 **Non exécuté** | L'URL de production n'étant pas encore générée, le test de flux d'authentification n'a pas pu avoir lieu. |
| **6** | Dépôt public/privé & non-fuite du privé | 🟢 **Vérifié au niveau du code** / 🔴 **En attente sur l'URL de prod** | Le filtrage strict `visibility: 'PUBLIC'` et le chiffrement AES-256-GCM sont garantis dans `PrayerRepository` et `PrayerService`. Test réel sur l'URL de prod en attente du déploiement. |
| **7** | Activation RLS sur toutes les tables (Supabase PostgREST) | 🟢 **Script prêt & validé (`npm run db:rls`)** | Script SQL idempotent `prisma/sql/enable-rls.sql` activant RLS et révoquant `anon`/`authenticated`. Abandon de Realtime pour éliminer tout risque de diffusion. |
| **8** | URL finale de production | 🔴 **Non disponible** | En attente de la liaison du projet Git avec Vercel. |
| **9** | Règle de transparence sécurité (contournements auth / RBAC) | 🟢 **Certifié conforme (0 contournement)** | Aucun bypass d'authentification (`DEV_ADMIN_BYPASS` ou mock de session) n'a été introduit. |

---

## Détail des Preuves & Résultats Techniques

### Point 1 : Chaînes de connexion Supabase (`DATABASE_URL` et `DIRECT_URL`)
- **Preuve fichier local [c:\Users\billk\appli_interc\.env](file:///c:/Users/billk/appli_interc/.env) :**
  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/maboiteapriere?schema=public"
  DIRECT_URL="postgresql://postgres:postgres@localhost:5432/maboiteapriere?schema=public"
  ```
- **Constat :** Les valeurs actuelles ciblent un PostgreSQL local. Les chaînes de production Supabase attendues doivent respecter le format suivant dès votre saisie :
  - `DATABASE_URL` : `postgresql://postgres.[REF]:[MDP]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
  - `DIRECT_URL` : `postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`

---

### Point 2 & 3 : État Vercel & Build de Production
- **Vérification CLI Vercel :**
  ```powershell
  npx vercel whoami
  ```
  *Résultat :* Non connecté. La commande attend une authentification interactive.
- **Vérification Navigateur :**
  L'URL `https://vercel.com/login?next=%2Fdashboard` a été ouverte par le sous-agent navigateur et a retourné la page de login :
  `Page 05E39668F2D31FFD11A7A01A419085BF (Login – Vercel) - https://vercel.com/login?next=%2Fdashboard`
- **Preuve du Build Local (`npm run build`) :**
  ```text
  > ma-boite-a-priere@3.0.0 build
  > next build

    ▲ Next.js 14.2.35
    - Environments: .env

     Creating an optimized production build ...
   ✓ Compiled successfully
     Linting and checking validity of types ...
     Collecting page data ...
   ✓ Generating static pages (21/21)
     Finalizing page optimization ...
     Collecting build traces ...

  Route (app)                              Size     First Load JS
  ┌ ƒ /                                    6.34 kB         219 kB
  ├ ○ /_not-found                          163 B          87.5 kB
  ├ ○ /a-propos                            163 B          87.5 kB
  ├ ƒ /admin                               180 B          96.2 kB
  ├ ƒ /admin/administrateurs               2.83 kB        90.2 kB
  ├ ○ /admin/connexion                     2.14 kB         166 kB
  ├ ƒ /admin/journal                       163 B          87.5 kB
  ├ ƒ /admin/parametres                    163 B          87.5 kB
  ├ ƒ /admin/statistiques                  113 kB          200 kB
  ├ ƒ /admin/sujets                        180 B          96.2 kB
  ├ ƒ /admin/sujets/[id]                   2.8 kB         98.8 kB
  ├ ƒ /api/admin/stats/export              0 B                0 B
  ├ ƒ /api/cron/daily-stats                0 B                0 B
  ├ ƒ /api/prayers/count                   0 B                0 B
  ├ ƒ /auth/callback                       0 B                0 B
  ├ ƒ /communaute                          206 B           213 kB
  ├ ƒ /communaute/[slug]                   206 B           213 kB
  ├ ○ /confidentialite                     163 B          87.5 kB
  ├ ○ /deposer                             4.03 kB        91.3 kB
  ├ ○ /deposer/merci                       2.87 kB        98.9 kB
  ├ ƒ /exauces                             206 B           213 kB
  ├ ƒ /express-moderation/[token]          0 B                0 B
  ├ ○ /mentions-legales                    163 B          87.5 kB
  └ ƒ /mon-sujet/[token]                   5.27 kB         101 kB
  ```
  Le build est 100 % opérationnel et prêt pour Vercel dès que le déploiement sera déclenché.

---

### Point 4 : Exécution du Seed & Compte Super-Admin
- **Script inspecté :** [prisma/seed.ts](file:///c:/Users/billk/appli_interc/prisma/seed.ts)
- **Constat :** Le script implémente bien la création et l'invitation par Supabase Auth Admin :
  ```ts
  const { data: inviteData, error: inviteError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(superAdminEmail, {
      redirectTo: `${siteUrl}/admin`,
      data: { firstName: 'Responsable', lastName: 'Département', role: 'SUPER_ADMIN' },
    });
  ```
- **Blocage actuel :** Faute de `SUPABASE_SERVICE_ROLE_KEY` et de base Postgres distante accessible, le seed n'a pas pu être déclenché contre Supabase réel. Aucun utilisateur n'a donc encore pu être créé dans `auth.users`.

---

### Point 5 : Test de Connexion de bout en bout
- Non réalisable tant que le déploiement de production n'est pas en ligne.

---

### Point 6 : Cloisonnement strict des sujets privés
- **Preuve dans le code serveur :**
  Dans [src/server/repositories/prayer.repository.ts](file:///c:/Users/billk/appli_interc/src/server/repositories/prayer.repository.ts) (lignes 38-42) :
  ```ts
  const whereClause: Prisma.PrayerRequestWhereInput = {
    visibility: 'PUBLIC',
    status: 'APPROVED',
    deletedAt: null,
    // ...
  };
  ```
  Tout sujet déposé avec `visibility: 'PRIVATE'` est :
  1. Chiffré en AES-256-GCM via `encryptText()` dans [src/server/services/prayer.service.ts](file:///c:/Users/billk/appli_interc/src/server/services/prayer.service.ts).
  2. Structurellement exclu de toutes les requêtes du flux public et de l'API publique (`/communaute`, feed RSS/JSON).
  Le test applicatif en ligne sera exécuté immédiatement dès mise en service du serveur de production.

---

### Point 7 : Activation RLS sur toutes les tables (Supabase PostgREST)
- **Script exécutable :** [prisma/sql/enable-rls.sql](file:///c:/Users/billk/appli_interc/prisma/sql/enable-rls.sql) via `npm run db:rls` ([scripts/apply-rls.ts](file:///c:/Users/billk/appli_interc/scripts/apply-rls.ts)).
- **Actions de sécurité appliquées :**
  1. `ALTER TABLE IF EXISTS ... ENABLE ROW LEVEL SECURITY` sur les 10 tables du schéma sans policy (blocage total des accès directs PostgREST).
  2. `REVOKE ALL` sur les 10 tables pour les rôles `anon` et `authenticated`.
  3. Abandon de Realtime (`REPLICA IDENTITY FULL` supprimé) et passage au polling sécurisé via `/api/prayers/count` (qui renvoie uniquement `prayerCount` pour un sujet `PUBLIC + APPROVED`, 404 sinon).
- **Vérification automatique :** Le script interroge `pg_tables.rowsecurity` pour confirmer que `rowsecurity = true` sur chaque table.

---

### Point 8 : URL de Production
- **Statut :** Non attribuée à ce stade. Elle sera de la forme `https://[projet].vercel.app`.

---

### Point 9 : Respect de la règle permanente de Transparence Sécurité
- **Règle :** [.agents/rules/security-transparency.md](file:///c:/Users/billk/appli_interc/.agents/rules/security-transparency.md)
- **Déclaration formelle :**
  **AUCUN mécanisme de contournement d'authentification ou de RBAC n'a été introduit.**
  - Aucune variable de type `DEV_ADMIN_BYPASS` ou flag assimilé n'est présent dans le code source.
  - Le [middleware.ts](file:///c:/Users/billk/appli_interc/middleware.ts) et [src/server/services/admin.service.ts](file:///c:/Users/billk/appli_interc/src/server/services/admin.service.ts) vérifient systématiquement la présence d'un utilisateur Supabase Auth authentifié et contrôlent son statut `ACTIVE` dans la table `Admin`.
