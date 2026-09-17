# Ma boîte à prière — Plan d'implémentation (web, budget zéro)

> Document de référence technique et fonctionnel. **Version 3.0 — 16 septembre 2026.**
> Pivot : retour à une **application web** (Next.js 14 App Router + Supabase + Tailwind CSS,
> déployée sur Vercel), pour raison budgétaire — pas de frais de compte développeur Apple/Google.
> Statut : **à valider** (voir §16 « Décisions »).

---

## 0. Ce qui change par rapport à la v2.0 (mobile), et ce qui ne change pas

**Ne change pas — travail déjà construit et testé en Phase 0, entièrement réutilisable :**
le schéma de données central (`PrayerRequest`, `PrayerAction`, `Admin`, `AnsweredClaim`, `Report`,
`AuditLog`, `Setting`, `DailyStat`), le chiffrement AES-256-GCM des sujets privés, le hachage du
`manageToken` en temps constant (corrigé le 15 septembre), la validation Zod, la séparation
service/repository, et toutes les règles métier (visibilité, exaucement, surveillance a posteriori).

**Change — tout ce qui était spécifique au mobile disparaît :** l'app Expo, l'authentification par
jeton/deep link, les modèles `MobileRefreshToken` et `AdminPushToken`, les notifications push,
l'onglet « Mes sujets » en stockage local. On revient au modèle web : pages Next.js, Server Actions,
cookies de session, lien de gestion envoyé au déposant.

**Nouveau dans cette version :** Supabase remplace à la fois l'hébergement Postgres (déjà décidé le
15 septembre) **et** le système d'authentification (Auth.js + JWT maison) pour les admins — un vrai
gain de simplicité, pas seulement un changement de nom.

---

## 1. Vision produit

**Ma boîte à prière** est un site chrétien où chacun peut déposer un sujet de prière — en privé
(visible uniquement des administrateurs) ou en public (porté par la communauté) — et où la communauté
peut prier anonymement les uns pour les autres. Retour à un point fort du web que le mobile-only avait
sacrifié : **un lien partagé (WhatsApp, e-mail) s'ouvre pour n'importe qui**, sans installation.

### Principes directeurs (inchangés)

| Principe | Conséquence concrète |
|---|---|
| La confiance avant tout | Le choix privé/public est expliqué *avant* l'envoi. Un sujet privé n'apparaît **jamais** dans une réponse publique. |
| Zéro friction pour déposer | Aucun compte requis pour déposer ou prier. 3 champs + 1 choix. |
| Anonymat de celui qui prie | On compte les prières, jamais qui a prié. |
| Chaleur et paix | Pas d'éléments anxiogènes, typographie douce, blancs généreux. |
| Mobile-first *(au sens web responsive)* | ~85 % de l'usage sur téléphone, via le navigateur. Conçu à 375 px d'abord. |
| Dignité du contenu | Surveillance a posteriori, signalement, retrait rapide, suppression douce. |

### Utilisateurs et rôles

1. **Le déposant** (anonyme, sans compte) — dépose un sujet, reçoit un **lien privé de gestion**.
2. **Le membre de la communauté** (anonyme) — consulte les sujets publics, prie.
3. **Le modérateur** — surveille, retire, confirme les exaucements signalés.
4. **L'administrateur** — tout le précédent + statistiques + invitation d'administrateurs.
5. **Le super-administrateur** — tout + paramètres + révocation. Compte indélébile.

---

## 2. Stack technique

| Couche | Choix | Justification |
|---|---|---|
| Framework | **Next.js 14 (App Router) + TypeScript strict** *(demandé explicitement)* | Rendu serveur, Server Actions, un seul déploiement. Next 14 → React 18 (pas 19). |
| Styles | **Tailwind CSS** *(demandé explicitement)* | shadcn/ui reste une option libre au-dessus si l'agent veut accélérer les composants accessibles — pas une obligation, tu n'as demandé que Tailwind. |
| Base de données | **Supabase Postgres** *(décidé le 15/09)* | Palier gratuit, interface déjà connue. |
| ORM | **Prisma 6, conservé** | Le schéma, les repositories, les services et les tests de la Phase 0 sont déjà écrits et validés dessus — les jeter pour réécrire en client Supabase natif coûterait du temps qu'on n'a justement plus à perdre. Prisma se connecte à Supabase comme à n'importe quel Postgres (§13, piège de connexion à lire absolument). |
| Authentification admin | **Supabase Auth** (lien magique via `signInWithOtp`, invitation via `auth.admin.inviteUserByEmail`) *(demandé explicitement)* | Remplace entièrement Auth.js + JWT maison construits pour le mobile. Sessions en cookies httpOnly gérées par `@supabase/ssr` — plus simple, et l'envoi d'e-mail est inclus gratuitement dans Supabase (utile aussi pour l'invitation d'admins). |
| E-mail transactionnel (alertes admin) | **Resend**, palier gratuit (100/jour) | Supabase Auth n'envoie que ses propres e-mails d'authentification — les alertes « nouveau sujet », « signalement » restent un besoin séparé. |
| Anti-spam | **Cloudflare Turnstile** (gratuit) + honeypot + rate-limit | Inchangé. |
| Rate limiting | **Upstash Redis** (palier gratuit) | Inchangé. |
| Validation | **Zod**, partagé entre Server Actions et services | Inchangé dans l'esprit, déplacé dans `src/lib/validation`. |
| Tests | **Vitest** (unitaire) + **Playwright** (E2E web) | Remplace Maestro (mobile), plus rien à faire côté app native. |
| Déploiement | **Vercel** *(demandé explicitement)*, palier Hobby gratuit | Domaine `*.vercel.app` gratuit pour démarrer ; domaine personnalisé plus tard si budget. |
| Qualité | ESLint + Prettier + TypeScript strict + Husky | Inchangé. |
| Observabilité | Vercel Analytics (inclus) ; Sentry facultatif (palier gratuit) | Simplifié — pas de coût obligatoire. |

**Coût total pour démarrer : 0 €.** Le seul palier payant à anticiper plus tard est Supabase Pro
(~25 $/mois) si le projet gratuit se met en pause par inactivité une fois en production réelle (§13).

---

## 3. Architecture — un seul projet Next.js, pas de monorepo

Le monorepo (pnpm + Turborepo, `apps/mobile` + `apps/api` + 3 packages) avait du sens pour partager du
code entre une app mobile et une API. **Sans mobile, cette séparation n'apporte plus rien et ajoute de
la friction.** On aplatit en un seul projet Next.js à la racine :

```
ma-boite-a-priere/
├─ prisma/
│  ├─ schema.prisma        # repris de apps/api, débarrassé des modèles mobile (§4)
│  ├─ migrations/
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ (public)/
│  │  │  ├─ page.tsx                     # Accueil
│  │  │  ├─ deposer/page.tsx
│  │  │  ├─ deposer/merci/page.tsx
│  │  │  ├─ communaute/page.tsx
│  │  │  ├─ communaute/[slug]/page.tsx
│  │  │  ├─ exauces/page.tsx
│  │  │  ├─ mon-sujet/[token]/page.tsx   # remplace « Mes sujets » mobile
│  │  │  └─ a-propos, confidentialite, mentions-legales
│  │  ├─ admin/
│  │  │  ├─ connexion/page.tsx           # Supabase Auth — lien magique
│  │  │  ├─ page.tsx                     # Tableau de bord
│  │  │  ├─ sujets/page.tsx
│  │  │  ├─ sujets/[id]/page.tsx
│  │  │  ├─ statistiques/page.tsx
│  │  │  ├─ administrateurs/page.tsx
│  │  │  ├─ parametres/page.tsx
│  │  │  └─ journal/page.tsx
│  │  ├─ auth/callback/route.ts          # échange du lien magique Supabase (PKCE)
│  │  ├─ api/
│  │  │  └─ cron/daily-stats/route.ts    # seul endpoint HTTP restant, pour Vercel Cron
│  │  └─ layout.tsx, error.tsx, not-found.tsx, opengraph-image.tsx
│  ├─ components/  ui/ · prayer/ · admin/ · layout/
│  ├─ server/
│  │  ├─ actions/        # Server Actions = seul mécanisme de mutation (plus besoin d'api/v1 public)
│  │  ├─ services/       # repris tels quels depuis apps/api/src/server/services
│  │  ├─ repositories/   # repris tels quels depuis apps/api/src/server/repositories
│  │  ├─ supabase/       # clients Supabase : browser.ts, server.ts, middleware.ts
│  │  └─ lib/            # crypto.ts (repris tel quel), rate-limit, dates
│  └─ lib/validation/    # schémas Zod (repris depuis packages/shared/src/schemas)
├─ middleware.ts          # rafraîchit la session Supabase à chaque requête
└─ .env.local
```

**Règle d'or, inchangée :** une page ou une Server Action ne contient jamais de logique métier —
`page.tsx` → `action` → `service` → `repository`. C'est exactement la structure déjà en place dans
`apps/api/src/server/`, il n'y a qu'à la déplacer.

**Sécurité par construction, inchangée :** `PrayerRepository.findPublicFeed()` reste l'unique point
d'accès aux sujets publics, avec son filtre strict déjà écrit et testé.

**Point d'architecture important pour l'agent :** Prisma se connecte avec un rôle Postgres privilégié
qui **contourne le Row Level Security (RLS) de Supabase**. Ce n'est pas un oubli à corriger — la
frontière de sécurité de cette application, c'est le code serveur (RBAC dans les services, filtre de
visibilité dans les repositories), exactement comme conçu depuis le début. Ne pas essayer de dupliquer
la protection en RLS, ça ajouterait de la complexité sans bénéfice ici.

---

## 4. Modèle de données — deltas précis à appliquer sur `apps/api/prisma/schema.prisma`

```prisma
model PrayerRequest {
  // ... tous les champs existants, SAUF :
  // ownerPushToken String?  ← À SUPPRIMER (mobile uniquement)
}

model Admin {
  id            String      @id @default(cuid())
  authUserId    String      @unique   // ★ NOUVEAU — lie la ligne au user Supabase Auth (auth.users.id)
  email         String      @unique
  firstName     String
  lastName      String
  role          AdminRole   @default(MODERATOR)
  status        AdminStatus @default(INVITED)
  invitedById   String?
  lastLoginAt   DateTime?
  createdAt     DateTime    @default(now())
  deletedAt     DateTime?
  // refreshTokens MobileRefreshToken[]  ← SUPPRIMÉ
  // pushTokens    AdminPushToken[]      ← SUPPRIMÉ
}

// MobileRefreshToken   ← MODÈLE ENTIER À SUPPRIMER
// AdminPushToken       ← MODÈLE ENTIER À SUPPRIMER
// VerificationToken    ← MODÈLE ENTIER À SUPPRIMER (c'était pour Auth.js ; Supabase Auth gère
//                         son propre schéma `auth.*`, invisible et intouché par Prisma)
```

Tout le reste (`PrayerAction`, `AdminInvitation`, `AnsweredClaim`, `Report`, `AuditLog`, `Setting`,
`DailyStat`) est repris sans modification.

### Paramètres (`Setting`) — inchangés dans leur ensemble
`moderation.publicRequiresApproval` (`false`), `moderation.autoHoldSuspicious` (`true`),
`answered.hideAfterDays` (`5`), `answered.showArchivePublicly` (`true`), `community.accessMode`
(`"open"`), `site.timezone` (`"Europe/Paris"`), `notifications.privateRequestEmail` (`true`),
`notifications.weeklyDigest` (`true`). Les clés `notifications.*Push` de la v2.0 disparaissent.

---

## 5. Règles métier

### 5.1 Dépôt d'un sujet — inchangé, retirer `pushToken` de l'entrée
Validation Zod identique (prénom/nom 2–40, sujet 10–1000, URLs interdites, HTML nettoyé). Turnstile +
rate-limit (3/h, 10/jour). `PRIVATE` → chiffré, `APPROVED` immédiat. `PUBLIC` → `APPROVED` immédiat
sauf contenu suspect → `PENDING` + e-mail Resend aux admins. Génération de `publicSlug` et
`manageToken` (haché avant stockage, comme déjà corrigé).

### 5.2 « Je prie pour toi »
`visitorId` en cookie httpOnly (au lieu de `expo-secure-store`), généré à la première visite. Le reste
— transaction idempotente, `ON CONFLICT DO NOTHING`, rate-limit 60/h — est identique.

### 5.3 Sujets exaucés — retour au lien de gestion web
Le déposant utilise son **lien privé `/mon-sujet/[token]`** (au lieu de l'onglet « Mes sujets ») pour
créer un `AnsweredClaim`. Seul un admin confirme (`isAnswered = true`). Masquage du mur à J+5, jamais
de suppression, toujours retrouvable dans `/exauces` et côté admin.

### 5.4 Surveillance a posteriori — alertes par e-mail (Resend) au lieu de push
File `PENDING` pour les contenus auto-retenus. Alerte Resend à chaque nouveau sujet public avec un
**lien de retrait en un clic** (jeton signé, sans connexion). Signalement → e-mail dès 1, retrait
automatique réversible au 3ᵉ. Actions admin identiques (Publier, Retirer, Modifier, Basculer en privé,
Supprimer), toutes journalisées.

### 5.5 Administration des comptes — via Supabase Auth
- Un `ADMIN`/`SUPER_ADMIN` invite par e-mail via `supabase.auth.admin.inviteUserByEmail(email)` —
  Supabase envoie l'e-mail et crée l'utilisateur Auth ; à l'acceptation, une ligne `Admin` est créée
  (ou complétée) avec `authUserId` renseigné et le rôle choisi à l'invitation.
- Connexion ultérieure : `signInWithOtp({ email })` (lien magique), session en cookie via
  `@supabase/ssr`, `middleware.ts` la rafraîchit à chaque requête.
- RBAC : chaque Server Action admin vérifie la session Supabase **et** relit la ligne `Admin`
  correspondante (rôle, `status = ACTIVE`) avant d'agir — la session Supabase prouve *qui*, la table
  `Admin` autorise *quoi*.
- Seul un `SUPER_ADMIN` promeut/suspend/supprime/modifie les paramètres. Le dernier `SUPER_ADMIN` est
  protégé (garde-fou serveur + test), inchangé.

### 5.6 Lien de gestion (remplace « Mes sujets » mobile)
Retour au mécanisme de la v1.1 : à la confirmation de dépôt, la page affiche le lien
`/mon-sujet/<token>` avec bouton copier + rappel explicite de le conserver. Amélioration simple et
gratuite par rapport à la v1.1 : mémoriser les derniers sujets déposés dans le `localStorage` du
navigateur (confort, pas mécanisme de sécurité) pour que l'utilisateur qui revient sur le même
appareil retrouve ses sujets sans ressortir le lien.

---

## 6. Statistiques — inchangé dans le fond, rendu web

Hebdomadaire / mensuel / annuel, fuseau `Europe/Paris`, agrégats sur `DailyStat` (cron nocturne),
export CSV téléchargeable directement (plus besoin de l'envoyer par e-mail comme sur mobile — un vrai
gain de simplicité du web). Graphiques via une lib légère (Recharts ou Chart.js) sur `/admin/statistiques`.

---

## 7. Écrans (reprend la spec « page par page » de la v1.1, toujours valide)

| Page | Contenu clé |
|---|---|
| **Accueil `/`** | Texte d'intro fourni, verset Matthieu 18:19 (LSG), CTA « Déposer un sujet de prière » + « Découvrir les sujets de prière », bandeau vivant, 3 étapes, derniers exaucés, FAQ. |
| **Déposer `/deposer`** | Prénom, Nom, Sujet, catégorie facultative, bloc confidentialité (texte exact fourni par l'utilisateur — 🔒 Privé / 🌍 Public), bouton « Déposer mon sujet ». |
| **Confirmation `/deposer/merci`** | *« Ton sujet a bien été déposé 🙏 — Des personnes pourront maintenant prier pour toi. »* + lien de gestion à copier (§5.6). |
| **Communauté `/communaute`** | Cartes des sujets publics : prénom, sujet, date, nombre de prières, bouton « Je prie pour toi 🙏 », filtres, pagination. |
| **Exaucés `/exauces`** | Archives par mois, témoignages, recherche. |
| **Mon sujet `/mon-sujet/[token]`** | Statut, nombre de prières, actions (signaler exaucement, passer en privé, supprimer). |
| **Admin `/admin/*`** | Connexion (lien magique), tableau de bord, sujets, statistiques, administrateurs, paramètres, journal — détail identique à la v1.1 §7.7. |

*(Cette spec sera affinée dès que tes captures d'écran d'inspiration seront disponibles — voir ma
question plus haut dans la conversation.)*

---

## 8. Accès à la communauté

Inchangé : **`open`** par défaut. Bénéfice concret du retour au web : un sujet partagé sur WhatsApp ou
par SMS s'ouvre directement dans le navigateur, pour n'importe qui — la limite du mobile-only (§1 de la
v2.0) disparaît d'elle-même.

---

## 9. Identité visuelle

Tokens inchangés (à réajuster avec tes captures) :

```css
--fond #FBF8F3   --surface #FFFFFF   --encre #1C2541   --encre-douce #55607A
--primaire #2F4A78   --lumiere #E8A33D   --paix #6FA287   --bordure #EAE3D8
```

Typographie serif chaleureuse pour les titres (Fraunces/Lora), sans humaniste pour le texte (Inter/Plus
Jakarta Sans). Mode sombre prévu dès les tokens. WCAG 2.2 AA. PWA installable en option gratuite plus
tard — un bon compromis « sensation d'app » sans frais de store (voir §17 de la v2.0, toujours valable).

---

## 10. Contrats — Server Actions comme mécanisme principal

Sans client mobile à servir, plus besoin d'exposer un `api/v1` public : les Server Actions
redeviennent le mécanisme direct, comme dans le plan v1.1. Seule exception HTTP : l'endpoint de cron
(`GET /api/cron/daily-stats`, protégé par le secret Vercel Cron) et le callback Supabase Auth
(`/auth/callback`).

| Opération | Mécanisme | Notes |
|---|---|---|
| Créer un sujet | Server Action `createPrayerRequest` | rate-limit, Turnstile |
| Flux communauté | Lecture directe (Server Component) via `PrayerRepository.findPublicFeed()` | pagination par curseur |
| Prier | Server Action `prayForRequest` | idempotent |
| Signaler | Server Action `reportRequest` | |
| Gérer son sujet | Server Action `updateOwnRequest` | vérifie le hash du `manageToken` |
| Modérer / confirmer exaucement | Server Actions admin | RBAC (session Supabase + table `Admin`) + audit |
| Inviter un admin | Server Action `inviteAdmin` | `supabase.auth.admin.inviteUserByEmail` |
| Stats | Server Component / Server Action | agrégats `DailyStat` |
| Cron agrégat | `GET /api/cron/daily-stats` | header secret Vercel Cron |

---

## 11. Sécurité et vie privée (RGPD)

Inchangé dans ses principes : cloisonnement strict du privé (testé), chiffrement AES-256-GCM,
`manageToken` haché + comparaison à temps constant (déjà corrigé), pas d'IP en clair, secrets validés
au démarrage sans fallback (déjà corrigé), CSP/HSTS, rate-limit partout, RGPD (base légale =
consentement, droit de suppression via le lien de gestion, hébergement UE — vérifier la région du
projet Supabase), message d'orientation d'urgence dans la confirmation et les CGU.

**Nouveau point Supabase :** `SUPABASE_SERVICE_ROLE_KEY` (si utilisée, par ex. pour
`auth.admin.inviteUserByEmail`) ne doit **jamais** être exposée côté client — uniquement dans les
Server Actions/route handlers, jamais dans une variable `NEXT_PUBLIC_*`.

---

## 12. Tests

Vitest (déjà en place pour les services/crypto/env, à étendre), Playwright pour l'E2E web (remplace
Maestro) : dépôt public/privé, non-fuite du privé, « je prie » idempotent, cycle exaucement complet,
invitation admin → connexion → RBAC, accessibilité (axe-core), responsive 375 px.

---

## 13. Déploiement — Vercel + Supabase, budget zéro

### Variables d'environnement

```
DATABASE_URL=            # Supabase → connexion "Transaction pooler" (port 6543), PAS la connexion directe
DIRECT_URL=               # Supabase → connexion directe (port 5432), utilisée uniquement par `prisma migrate`
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # jamais NEXT_PUBLIC_, jamais côté client
APP_SECRET=               # 32+ caractères, chiffrement AES-256 (déjà en place)
PEPPER=                   # 16+ caractères, hachage IP + manageToken (déjà en place)
RESEND_API_KEY=
TURNSTILE_SECRET_KEY= / NEXT_PUBLIC_TURNSTILE_SITE_KEY=
UPSTASH_REDIS_REST_URL= / UPSTASH_REDIS_REST_TOKEN=
CRON_SECRET=               # protège /api/cron/daily-stats
```

> ⚠️ **Piège le plus fréquent de cette combinaison Prisma + Vercel + Supabase :** les fonctions
> serverless de Vercel ouvrent potentiellement des dizaines de connexions Postgres simultanées ; sans
> passer par le **pooler** de Supabase (Supavisor, port 6543, `DATABASE_URL`), les connexions
> s'épuisent rapidement et l'app tombe en erreur sous charge modeste. Le schéma Prisma doit déclarer
> `directUrl = env("DIRECT_URL")` en plus de `url = env("DATABASE_URL")` dans le bloc `datasource`, et
> `DATABASE_URL` doit se terminer par `?pgbouncer=true` (ou l'équivalent Supavisor documenté au moment
> de la mise en place). À vérifier explicitement pendant la Phase 0 de cette version — c'est le genre
> d'erreur qui ne se voit qu'en charge réelle, pas en développement local.

- **Vercel** : palier Hobby (gratuit), domaine `*.vercel.app` pour démarrer, Vercel Cron pour
  l'agrégat quotidien (gratuit sur Hobby avec une limite de fréquence — un run par jour suffit
  largement ici).
- **Supabase** : palier gratuit. **Le projet se met en pause après 7 jours d'inactivité** (déjà
  signalé le 15/09) — sans conséquence en développement, à surveiller une fois en production réelle
  (upgrade Pro ~25 $/mois si ça devient gênant, pas avant).
- **Resend** : palier gratuit (100 e-mails/jour, 3 000/mois) — largement suffisant pour les alertes
  admin et les invitations à l'échelle d'un département d'église.

---

## 14. Feuille de route

| Phase | Contenu | Estimation |
|---|---|---|
| **0 — Migration du socle** | Aplatir le monorepo en un seul projet Next.js 14, adapter `schema.prisma` (§4), reconnecter Prisma à Supabase (pooler + direct URL), retirer `apps/mobile` et les packages devenus inutiles, Tailwind configuré avec les tokens (§9) | 1 j *(work déjà fait en Phase 0 mobile largement réutilisé)* |
| **1 — Authentification admin** | Intégration Supabase Auth (`@supabase/ssr`), `middleware.ts`, page de connexion, invitation via `inviteUserByEmail`, RBAC branché sur la table `Admin` | 1,5 j |
| **2 — Cœur du produit** | Accueil, Déposer, Confirmation avec lien de gestion, Communauté, « Je prie » | 3 j |
| **3 — Exaucés & archives** | Signalement via `/mon-sujet/[token]`, confirmation admin, masquage J+5, page `/exauces` | 1 j |
| **4 — Administration** | Surveillance a posteriori (alertes Resend, retrait express), tableau de bord, journal d'audit | 2 j |
| **5 — Statistiques** | `DailyStat`, cron Vercel, tableau de bord hebdo/mensuel/annuel, export CSV | 1,5 j |
| **6 — Durcissement** | Turnstile, rate-limit Upstash, vérification RGPD, revue de sécurité finale | 1 j |
| **7 — Finition & lancement** | Accessibilité, mode sombre, SEO/OpenGraph, tests Playwright complets, contenu réel, déploiement Vercel production | 2 j |

**Total ≈ 13 jours-homme** — comparable à l'estimation web v1.1 initiale, malgré le détour par le
mobile, parce que l'essentiel du backend (schéma, chiffrement, services, sécurité) reste acquis.
Aucun délai de revue externe cette fois (pas d'App Store) : le calendrier dépend uniquement du rythme
de travail.

---

## 15. Risques et parades

| Risque | Impact | Parade |
|---|---|---|
| Épuisement des connexions Postgres (Prisma + Vercel + pas de pooler) | Panne sous charge, difficile à diagnostiquer | Pooler Supabase configuré dès la Phase 0 (§13), pas laissé pour plus tard |
| Pause du projet Supabase gratuit après 7 jours d'inactivité | Site indisponible sans prévenir en début de vie du projet | Surveiller à l'approche du lancement réel, upgrade Pro avant l'annonce publique |
| Contenu inapproprié en ligne immédiatement (publication immédiate) | Image de l'église | Turnstile + rate-limit, auto-retenue des contenus suspects, alerte e-mail instantanée avec retrait en un clic |
| Perte du lien de gestion par le déposant | Support | Rappel explicite + copie en un clic + `localStorage` de confort + récupération admin après vérification |
| `SUPABASE_SERVICE_ROLE_KEY` exposée par erreur côté client | Compromission totale de la base | Revue explicite en Phase 6 : grep du code pour toute variable `NEXT_PUBLIC_` mal nommée |

---

## 16. Décisions

### Validées le 16 septembre 2026

| Sujet | Décision | Impact |
|---|---|---|
| Plateforme | **Web** (abandon du mobile pour raison budgétaire) | Réécriture complète en v3.0 |
| Framework | Next.js 14 (App Router) | §2, §3 |
| Base de données | Supabase Postgres | déjà en place depuis le 15/09 |
| Authentification | Supabase Auth (remplace Auth.js) | §5.5, §11 |
| Styles | Tailwind CSS | §9 |
| Déploiement | Vercel | §13 |

**Décisions d'architecture prises de mon côté, à valider par toi :**
1. **Prisma conservé** plutôt qu'un passage au client Supabase natif — pour ne pas jeter le travail de
   la Phase 0 déjà testé. Dis-moi si tu voulais au contraire repartir sur le client Supabase natif
   (par ex. pour t'appuyer sur le Row Level Security) — c'est un choix défendable aussi, mais qui
   coûterait une réécriture du backend.
2. **Monorepo aplati** en un seul projet Next.js — la séparation `apps/mobile` / `apps/api` n'a plus
   de raison d'être sans client mobile.

### Questions ouvertes

1. **Captures d'écran** : pas encore reçues dans cet échange — à transmettre ici, ou déjà données à
   l'agent qui code ?
2. **Nom de domaine** : `*.vercel.app` pour démarrer, ou domaine personnalisé déjà réservé ?
3. **Premier super-administrateur** : quelle adresse e-mail pour l'amorçage ?
4. **Nom de famille** : conservé en base, jamais affiché publiquement — confirmé ?

---

## 17. Retour possible vers le mobile, plus tard

Le pivot n'est pas définitif — si le budget le permet un jour, l'architecture Server Actions +
services + repositories se réexpose facilement en `api/v1` (comme fait pour la v2.0) sans toucher au
cœur métier. Rien dans ce choix web n'est un cul-de-sac technique, juste une priorité budgétaire
actuelle.
