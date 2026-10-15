# Rapport d'Exécution — Phase Déploiement Production & Vraies Clés

**Projet :** Ma boîte à prière (v3.0 Web)  
**Date d'exécution :** 14 octobre 2026  
**Statut :** Socle technique validé & en attente des accès externes (Supabase / Resend / Vercel)

---

## 1. Synthèse Globale des 8 Étapes

| Étape | Intitulé | Statut | Preuve / Action Réalisée |
|---|---|---|---|
| **1** | **Supabase (Projet UE & Clés)** | ⏳ En attente des clés | Vérification navigateur effectuée : session non connectée dans le bac à sable. Clés requises listées ci-après. |
| **2** | **Resend (API Key & Domaine)** | ⏳ En attente de clé | Session non connectée. Prêt à basculer sur `onboarding@resend.dev` en attendant la validation du domaine. |
| **3** | **Variables d'environnement Vercel** | 🟢 Clés crypto prêtes | Secrets cryptographiques haute entropie générés (`APP_SECRET`, `PEPPER`, `CRON_SECRET`). Schéma de variables Vercel prêt. |
| **4** | **Connexion Git & Déploiement Vercel** | ⏳ Dépôt distant à lier | `git remote` actuellement vide en local. Prêt pour `git remote add origin` ou déploiement CLI. |
| **5** | **Migrations Prisma & Seed Super-Admin** | 🟢 Script de seed prêt | `prisma/seed.ts` configuré avec `auth.admin.inviteUserByEmail`. Prêt pour `prisma db push` dès injection de `DIRECT_URL`. |
| **6** | **Protection RLS Supabase (SQL)** | 🟢 Script prêt (`npm run db:rls`) | Activation RLS sur toutes les tables et révocation des privilèges `anon`/`authenticated` pour bloquer PostgREST. |
| **7** | **Vercel Cron (`/api/cron/daily-stats`)** | ✅ Réalisé & Validé | Fichier `vercel.json` créé et validé (`0 2 * * *`), sécurisé par `CRON_SECRET`. Commit Git : `c362d7c`. |
| **8** | **URL de Production Finale** | ⏳ Dépend de l'étape 4 | En attente de la création/liaison du projet Vercel. |

---

## 2. Preuves Techniques & Résultats d'Exécution

### Étape 7 : Configuration Vercel Cron
Création du fichier `vercel.json` à la racine pour planifier l'agrégation quotidienne nocturne à 02:00 UTC :
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-stats",
      "schedule": "0 2 * * *"
    }
  ]
}
```
**Preuve de commit Git :**
```text
[master c362d7c] chore(deployment): configure Vercel Cron for daily-stats
 1 file changed, 8 insertions(+)
 create mode 100644 vercel.json
```

---

### Validation du Build de Production (`npm run build`)
Le projet a été compilé en environnement de production pour s'assurer de l'absence d'erreurs TypeScript, de build ou de routage :
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
*Résultat : Code de sortie 0 — 0 erreur.*

---

### Étape 3 : Secrets Cryptographiques Générés pour la Production
Génération de clés cryptographiques à haute entropie (via `crypto.randomBytes`) :
- **`APP_SECRET`** (AES-256-GCM, 64 caractères hex) : `[RÉGÉNÉRÉ — non consigné]`
- **`PEPPER`** (Salage HMAC temps constant, 32 caractères hex) : `[RÉGÉNÉRÉ — non consigné]`
- **`CRON_SECRET`** (Jeton d'autorisation Vercel Cron, 48 caractères hex) : `[RÉGÉNÉRÉ — non consigné]`

---

### Étape 1 & 2 : Constat d'Authentification Navigateur (Sous-Agent)
Vérification des sessions ouvertes dans l'environnement de navigation isolé :
- **Supabase Dashboard** (`https://supabase.com/dashboard`) : Redirigé vers la mire de connexion (`/sign-in`).
- **Resend** (`https://resend.com/overview`) : Redirigé vers la mire de connexion (`/login`).
- **Vercel** (`https://vercel.com`) : Redirigé vers la mire de connexion (`/login`).

---

## 3. Données Requises pour Finaliser le Déploiement

Pour achever le déploiement sur les plateformes réelles, veuillez nous fournir les éléments suivants (ou les injecter directement dans Vercel) :

### A. Supabase (Projet en région Frankfurt `eu-central-1` ou Paris `eu-west-3`)
1. **`DATABASE_URL`** (Transaction pooler, port 6543) :
   `postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
2. **`DIRECT_URL`** (Connexion directe, port 5432, pour Prisma) :
   `postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`
3. **`NEXT_PUBLIC_SUPABASE_URL`** : `https://[REF].supabase.co`
4. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** : `eyJhbGciOi...`
5. **`SUPABASE_SERVICE_ROLE_KEY`** : `eyJhbGciOi...`

### B. Resend
1. **`RESEND_API_KEY`** : `re_...`
2. Domaine : Si le domaine `maboiteapriere.fr` n'est pas encore vérifié sur Resend, le système utilisera le domaine de test Resend (`onboarding@resend.dev`) sans bloquer le démarrage.

### C. Dépôt Git & Administrateur
1. **URL du dépôt distant GitHub** (ex: `https://github.com/BillAdams00/ma-boite-a-priere.git`) pour synchroniser la branche `master` avec Vercel.
2. **`INITIAL_SUPER_ADMIN_EMAIL`** : Confirmation de l'adresse du responsable (ex: `billkamagate00@gmail.com`).

---

## 4. Procédure Automatisée dès Réception des Clés

Dès transmission ou injection de ces paramètres :
1. **Application du schéma :** Exécution immédiate de `npx prisma db push` avec la chaîne `DIRECT_URL`.
2. **Amorçage Super-Admin :** Exécution de `npx tsx prisma/seed.ts` pour inviter le responsable via Supabase Auth.
3. **Activation RLS & Sécurisation PostgREST :** Exécution de :
   ```bash
   npm run db:rls
   ```
   (applique `prisma/sql/enable-rls.sql` sur `DIRECT_URL` et vérifie `pg_tables.rowsecurity`).
4. **Validation de l'URL finale de production.**
