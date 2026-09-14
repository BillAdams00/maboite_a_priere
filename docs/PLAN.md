# Ma boîte à prière — Plan d'implémentation (mobile-first)

> Document de référence technique et fonctionnel. **Version 2.0 — 14 septembre 2026.**
> Pivot : le produit démarre comme **application mobile native (iOS + Android)**, sans site web
> public pour l'instant. Le site web reste possible plus tard sur la même base (§17) mais n'est
> **pas** construit dans cette phase.
> Statut : **à valider** (voir §16 « Décisions »).

---

## 1. Vision produit

**Ma boîte à prière** est une application chrétienne où chacun peut déposer un sujet de prière —
en privé (visible uniquement des administrateurs) ou en public (porté par la communauté) — et où
la communauté peut prier anonymement les uns pour les autres. Pour cette v1, l'unique porte d'entrée
est l'**application mobile**, installée sur téléphone.

### Principes directeurs (ils tranchent tous les arbitrages du projet)

| Principe | Conséquence concrète |
|---|---|
| **La confiance avant tout** | Le choix privé/public est expliqué *avant* l'envoi, jamais modifié en douce. Un sujet privé n'apparaît **jamais** dans une réponse d'API, ni dans aucun écran non-admin. |
| **Zéro friction pour déposer** | Aucun compte requis pour déposer un sujet ou prier. 3 champs + 1 choix. Moins de 45 secondes. |
| **Anonymat de celui qui prie** | On compte les prières, on n'affiche jamais qui a prié. Pas de profil, pas de classement. |
| **Chaleur et paix** | Aucun élément anxiogène : pas de badge rouge agressif, pas de « viralité ». Typographie douce, blancs généreux, animations lentes, retours haptiques discrets. |
| **Natif, pas un site déguisé** | On utilise ce que le mobile fait mieux que le web : notifications, retour haptique, « Mes sujets » sans lien à copier, partage système. |
| **Dignité du contenu** | Surveillance a posteriori, signalement, retrait rapide, suppression douce (soft delete) — jamais de perte de données. |

### Utilisateurs et rôles

1. **Le déposant** (anonyme, sans compte) — dépose un sujet depuis l'app, le retrouve dans l'onglet
   « Mes sujets » de son téléphone (plus besoin de sauvegarder un lien, voir §7.6).
2. **Le membre de la communauté** (anonyme, app installée) — consulte les sujets publics, appuie sur
   « Je prie pour toi ».
3. **Le modérateur** — surveille les dépôts publics, retire/modifie, confirme les exaucements signalés.
4. **L'administrateur** — tout le précédent + statistiques + invitation d'autres administrateurs.
5. **Le super-administrateur** (responsable du département) — tout + paramètres + révocation d'administrateurs. Compte indélébile.

**Note honnête sur le choix mobile-only :** un sujet public partagé (ex. sur WhatsApp) ne peut être
consulté que par quelqu'un qui a déjà installé l'app — il n'y a aucune page de secours dans un
navigateur. C'est le compromis assumé de cette phase ; §17 explique comment l'ouvrir plus tard sans
rien reconstruire.

---

## 2. Stack technique

| Couche | Choix | Justification |
|---|---|---|
| App mobile | **Expo (React Native) + Expo Router + TypeScript strict** | Une seule base de code pour iOS et Android. Expo Router reprend le modèle de routage par fichiers (proche de Next.js App Router), ce qui limite la courbe d'apprentissage. Mises à jour OTA du JS via EAS Update sans repasser par la validation des stores à chaque correctif mineur — important pour une petite équipe bénévole. |
| Styles | **NativeWind v4** (Tailwind pour React Native) | Même vocabulaire utilitaire et mêmes tokens de couleur/typo que prévu en §9, sans réapprendre un système de style propriétaire. |
| Navigation | **Expo Router** (pile de fichiers `app/`) + tab bar native | Onglets : Accueil · Communauté · Déposer · Exaucés · Mes sujets. Espace admin caché derrière la connexion (§7.7). |
| Données/serveur | **TanStack Query** | Cache, revalidation, état de chargement/erreur — mêmes patterns qu'en web. |
| Formulaires | **React Hook Form + Zod** (schémas partagés avec le backend) | Aucune règle de validation ressaisie côté app. |
| Stockage local | **expo-secure-store** (jetons admin, liste des sujets déposés) + **MMKV** (cache léger) | Le Keychain/Keystore protège les secrets bien mieux qu'AsyncStorage. |
| Notifications | **expo-notifications** + **EAS Push** (relais APNs/FCM) | Alertes admin (nouveau sujet, signalement) et notification au déposant quand quelqu'un prie pour lui (§5.6 — nouveauté rendue possible par le mobile). |
| Animations / retour | **Reanimated 3** + **Moti** + **expo-haptics** | La « douceur » demandée (§9) rendue par de vraies micro-interactions natives, pas des simili-CSS. |
| Backend API | **Next.js 15 (route handlers uniquement, pas de pages)** + TypeScript strict | Aucune UI web pour l'instant — seulement `app/api/v1/*`. Garde la compatibilité totale avec un site web ajouté plus tard (§17) sans migration. |
| Base de données | **PostgreSQL** (Neon, région EU) | Relationnel, agrégats temporels natifs pour les statistiques. |
| ORM | **Prisma 6** | Migrations versionnées, typage bout-en-bout, seed. |
| Auth (admins) | **Auth.js v5** pour l'émission du lien magique, échangé contre un **JWT access + refresh token** consommé par l'app (§5.7) | Pas de mot de passe à retenir pour des bénévoles ; le flux mobile via deep link est décrit en §5.7. |
| E-mail transactionnel | **Resend** + React Email | Lien magique de connexion admin, invitation d'administrateurs. |
| Anti-spam | **Cloudflare Turnstile** (mode « invisible »/managed compatible app) + honeypot + rate-limit | Protège les endpoints `api/v1` indépendamment du client. |
| Rate limiting | **Upstash Redis** | Dépôt, prière, connexion. |
| Validation | **Zod**, dans `packages/shared`, importé par l'app **et** le backend | Une seule source de vérité. |
| Tests | **Vitest** (services backend) + **Jest + React Native Testing Library** (composants) + **Maestro** (E2E mobile, iOS/Android) | Maestro pilote l'app compilée, plus robuste que Detox à maintenir pour une petite équipe. |
| Build & distribution | **EAS Build** + **EAS Submit** (App Store Connect, Google Play Console) + **EAS Update** (OTA) | Pipeline standard Expo, gère signing iOS/Android. |
| Qualité | ESLint + Prettier + TypeScript strict + Husky + lint-staged | |
| CI/CD | GitHub Actions → EAS (app) + Vercel (API) | Build mobile déclenché par tag, API déployée en continu. |
| Observabilité | **Sentry** (React Native + Node) + logs structurés (pino) | |

---

## 3. Architecture — monorepo

```
ma-boite-a-priere/
├─ apps/
│  ├─ mobile/                          # Expo Router — LE produit de cette phase
│  │  └─ src/
│  │     ├─ app/                       # routage par fichiers
│  │     │  ├─ (public)/
│  │     │  │  ├─ index.tsx            # Accueil
│  │     │  │  ├─ deposer.tsx
│  │     │  │  ├─ communaute/index.tsx
│  │     │  │  ├─ communaute/[slug].tsx
│  │     │  │  ├─ exauces/index.tsx
│  │     │  │  └─ mes-sujets/index.tsx
│  │     │  ├─ (admin)/
│  │     │  │  ├─ connexion.tsx
│  │     │  │  ├─ tableau-de-bord.tsx
│  │     │  │  ├─ sujets/index.tsx
│  │     │  │  ├─ sujets/[id].tsx
│  │     │  │  ├─ statistiques.tsx
│  │     │  │  ├─ administrateurs.tsx
│  │     │  │  ├─ parametres.tsx
│  │     │  │  └─ journal.tsx
│  │     │  ├─ _layout.tsx             # tab bar + guards
│  │     │  └─ +not-found.tsx
│  │     ├─ components/  ui/ · prayer/ · admin/
│  │     ├─ features/    # logique d'écran (hooks TanStack Query par domaine)
│  │     ├─ lib/         # api-client, stockage sécurisé, notifications, haptics
│  │     └─ theme/        # tokens NativeWind (§9)
│  └─ api/                             # Next.js — route handlers uniquement, aucune page UI
│     └─ src/
│        ├─ app/api/v1/                # ← contrat canonique (§10), seul et unique client aujourd'hui : l'app
│        ├─ server/
│        │  ├─ services/               # logique métier pure et testable
│        │  ├─ repositories/           # accès Prisma
│        │  ├─ auth/                   # Auth.js, guards, RBAC, émission de jetons mobiles
│        │  └─ lib/                    # crypto, rate-limit, mailer, dates, ip-hash, push
│        └─ prisma/  schema.prisma · migrations/ · seed.ts
├─ packages/
│  ├─ shared/         # schémas Zod, types, constantes, tokens de design
│  ├─ api-client/      # client HTTP typé pour /api/v1, importé par apps/mobile
│  └─ config/          # eslint, tsconfig, prettier communs
├─ pnpm-workspace.yaml
└─ turbo.json
```

**Règle d'or, inchangée du plan v1 :** un écran ne contient jamais de logique métier.
`app/route.tsx` (mobile) ou `api/v1/route.ts` (backend) → `service` → `repository`. Les services sont
testables sans HTTP ni base (injection du repository) et sont **le seul endroit où une règle métier
est écrite** — l'app et, plus tard, un site web, ne font qu'appeler `api/v1`.

**Sécurité par construction :** un seul point d'accès aux sujets publics
(`prayerRepository.findPublicFeed()`) qui applique systématiquement les filtres
`visibility = PUBLIC AND status = APPROVED AND deletedAt IS NULL AND (non exaucé OU exaucé < 5 j)`.
Aucune autre requête publique ne touche la table. Test unitaire dédié + test E2E de non-fuite.

---

## 4. Modèle de données (Prisma)

Identique au plan v1 dans son ensemble — le modèle de données n'a jamais été « web » ou « mobile »,
c'est le bénéfice direct d'avoir isolé la logique métier dès le départ. Deux évolutions pour le mobile :

```prisma
enum Visibility   { PRIVATE PUBLIC }
enum RequestStatus{ PENDING APPROVED REJECTED ARCHIVED }
enum AdminRole    { SUPER_ADMIN ADMIN MODERATOR }
enum AdminStatus  { INVITED ACTIVE SUSPENDED }

model PrayerRequest {
  id            String    @id @default(cuid())
  publicSlug    String    @unique
  manageToken   String    @unique               // conservé pour la récupération admin (§5.6), l'app ne le montre plus à l'utilisateur

  firstName     String    @db.VarChar(60)
  lastName      String    @db.VarChar(60)       // jamais exposé publiquement
  displayAsAnonymous Boolean @default(false)
  content       String    @db.Text              // chiffré si visibility = PRIVATE (§11)
  contentIv     String?
  category      String?   @db.VarChar(40)

  visibility    Visibility
  status        RequestStatus @default(PENDING)
  moderatedById String?
  moderatedAt   DateTime?
  moderationNote String?  @db.Text

  isAnswered    Boolean   @default(false)
  answeredAt    DateTime?
  answeredNote  String?   @db.Text
  answeredBy    String?

  prayerCount   Int       @default(0)
  viewCount     Int       @default(0)

  ownerPushToken String?  @db.VarChar(255)      // ★ nouveau — jeton Expo Push du device déposant, pour le notifier (§5.6)

  ipHash        String?   @db.VarChar(64)
  userAgent     String?   @db.VarChar(255)
  locale        String    @default("fr")

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  prayers       PrayerAction[]
  reports       Report[]
  answeredClaim AnsweredClaim?

  @@index([visibility, status, isAnswered, createdAt(sort: Desc)])
  @@index([createdAt])
  @@index([answeredAt])
}

model PrayerAction {
  id         String   @id @default(cuid())
  requestId  String
  request    PrayerRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  visitorId  String   @db.VarChar(64)           // uuid généré et stocké dans expo-secure-store (équivalent du cookie web)
  ipHash     String?  @db.VarChar(64)
  createdAt  DateTime @default(now())

  @@unique([requestId, visitorId])
  @@index([createdAt])
}

model Admin {
  id           String      @id @default(cuid())
  email        String      @unique
  firstName    String
  lastName     String
  role         AdminRole   @default(MODERATOR)
  status       AdminStatus @default(INVITED)
  invitedById  String?                          // pas de mot de passe : lien magique uniquement
  lastLoginAt  DateTime?
  createdAt    DateTime    @default(now())
  deletedAt    DateTime?
  refreshTokens MobileRefreshToken[]
  pushTokens    AdminPushToken[]
}

model AdminInvitation {
  id         String    @id @default(cuid())
  email      String
  role       AdminRole
  tokenHash  String    @unique
  invitedById String
  expiresAt  DateTime
  acceptedAt DateTime?
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())
  @@index([email])
}

model VerificationToken {                        // requis par Auth.js (émission du lien magique)
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model MobileRefreshToken {                        // ★ central dès la v1 — l'app EST le client
  id         String   @id @default(cuid())
  adminId    String
  admin      Admin    @relation(fields: [adminId], references: [id], onDelete: Cascade)
  tokenHash  String   @unique                     // le clair ne vit que dans expo-secure-store
  deviceLabel String?                             // "iPhone de Marie" — affiché dans /parametres
  expiresAt  DateTime                             // 30 jours glissants
  revokedAt  DateTime?
  createdAt  DateTime @default(now())
  @@index([adminId])
}

model AdminPushToken {                            // ★ nouveau — alertes de modération en push natif
  id         String   @id @default(cuid())
  adminId    String
  admin      Admin    @relation(fields: [adminId], references: [id], onDelete: Cascade)
  expoPushToken String @unique
  createdAt  DateTime @default(now())
  @@index([adminId])
}

model AnsweredClaim {
  id         String   @id @default(cuid())
  requestId  String   @unique
  request    PrayerRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  note       String?  @db.Text
  confirmedById String?
  confirmedAt   DateTime?
  rejectedAt    DateTime?
  createdAt  DateTime @default(now())
}

model Report {
  id         String   @id @default(cuid())
  requestId  String
  request    PrayerRequest @relation(fields: [requestId], references: [id])
  reason     String
  visitorId  String?
  handledAt  DateTime?
  createdAt  DateTime @default(now())
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?
  actorEmail String?
  action     String
  entityType String
  entityId   String
  metadata   Json?
  ipHash     String?
  createdAt  DateTime @default(now())
  @@index([createdAt(sort: Desc)])
  @@index([entityType, entityId])
}

model Setting {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt
  updatedBy String?
}

model DailyStat {
  day             DateTime @id @db.Date
  requestsTotal   Int  @default(0)
  requestsPublic  Int  @default(0)
  requestsPrivate Int  @default(0)
  requestsAnswered Int @default(0)
  prayers         Int  @default(0)
  uniquePrayers   Int  @default(0)
  visits          Int  @default(0)
}
```

### Paramètres (`Setting`) livrés par défaut

| clé | défaut | effet |
|---|---|---|
| `moderation.publicRequiresApproval` | `false` | Publication immédiate. Réactivable en un clic depuis l'app admin si besoin. |
| `moderation.autoHoldSuspicious` | `true` | URL, e-mail, téléphone ou terme de liste noire → mis en attente + alerte push admin. |
| `answered.hideAfterDays` | `5` | Délai de masquage des sujets exaucés dans le mur. |
| `answered.showArchivePublicly` | `true` | Onglet « Exaucés » visible sans connexion. |
| `community.accessMode` | `"open"` | Ouvert à tous ceux qui ont l'app installée. |
| `site.timezone` | `"Europe/Paris"` | Base des découpages hebdo/mensuel/annuel. |
| `notifications.privateRequestPush` | `true` | Alerte push immédiate aux admins pour un sujet privé. |
| `notifications.ownerPrayedPush` | `true` | Notifie le déposant quand quelqu'un prie pour son sujet (§5.6). |
| `notifications.weeklyDigest` | `true` | Récapitulatif hebdomadaire push + e-mail aux admins. |

---

## 5. Règles métier

### 5.1 Dépôt d'un sujet
1. Validation Zod : prénom 2–40, nom 2–40, sujet **10–1000 caractères**, visibilité obligatoire, catégorie facultative.
2. Nettoyage : trim, normalisation des espaces, suppression de tout HTML, refus des URLs, détection de doublon (même `ipHash` + contenu identique < 10 min → rejet silencieux).
3. Turnstile + rate-limit **3 dépôts / heure / appareil**, 10 / jour.
4. Statut initial :
   - `PRIVATE` → `APPROVED` immédiatement, contenu chiffré, push aux admins.
   - `PUBLIC` → `APPROVED` immédiatement, sauf contenu suspect (§5.4) → `PENDING` + push admin.
5. Génération de `publicSlug` et `manageToken` côté serveur. **L'app ne montre plus de lien à copier** :
   dès la création réussie, `{requestId, manageToken}` est ajouté à une liste locale chiffrée dans
   `expo-secure-store` et le sujet apparaît instantanément dans l'onglet **« Mes sujets »** (§5.6, §7.6).
   Si l'utilisateur accepte les notifications, `ownerPushToken` est enregistré.
6. Réponse : écran de confirmation chaleureux, animé, avec retour haptique doux.

### 5.2 « Je prie pour toi »
- `visitorId` (uuid v4) généré à la première ouverture de l'app, stocké dans `expo-secure-store`
  (équivalent mobile du cookie web).
- Insertion `PrayerAction` + `prayerCount++` en transaction, `ON CONFLICT DO NOTHING` : idempotent.
- Retour haptique léger (`expo-haptics`) + animation du compteur en fondu. État persistant :
  « Tu as prié pour ce sujet 🙏 ». Action non annulable.
- Rate-limit 60 prières / heure / appareil.
- Si `notifications.ownerPrayedPush` et que le sujet a un `ownerPushToken` : notification discrète et
  **groupée** au déposant (« 3 personnes ont prié pour toi aujourd'hui » plutôt qu'un push par prière —
  évite le spam de notifications, respecte le principe de calme du §1). Envoi différé et agrégé par
  cron (toutes les 3 h), pas en temps réel.

### 5.3 Sujets exaucés
- **Seul un administrateur confirme.** Le déposant, depuis « Mes sujets », a un bouton
  « Dieu a répondu 🙌 » qui crée un `AnsweredClaim` — un **signalement**, pas un marquage — visible
  dans le tableau de bord admin (push immédiat).
- À la confirmation : `isAnswered = true`, `answeredAt = now()`, `answeredBy = adminId`, témoignage
  facultatif (≤ 500 caractères).
- **Masquage du mur après 5 jours**, jamais de suppression :
  `WHERE NOT (isAnswered AND answeredAt < now() - interval '5 days')`
- Toujours retrouvable dans l'onglet **« Exaucés »** (archives, filtre par mois, recherche) et dans la
  recherche admin complète.

### 5.4 Surveillance a posteriori *(publication immédiate)*
- **Flux « Derniers dépôts »** en tête du tableau de bord admin, avec push instantané à chaque nouveau
  sujet public.
- **Retrait en un clic depuis la notification push** (deep link direct vers l'action de retrait,
  sans naviguer dans l'app).
- **Bouton « Signaler »** sur chaque carte → `Report` → push admin dès 1 signalement, retrait
  automatique réversible au 3ᵉ.
- **File `PENDING`** pour les contenus auto-retenus (§5.1) et réactivable comme file principale via
  `moderation.publicRequiresApproval`.
- Actions admin : **Publier**, **Retirer** (motif), **Modifier**, **Basculer en privé**, **Supprimer**
  (soft delete). Tout est journalisé dans `AuditLog`.

> **Exigence App Store / Play Store à ne pas sous-estimer :** une app avec contenu public généré par
> les utilisateurs doit démontrer, dès la soumission, un mécanisme de signalement, un moyen de bloquer/
> retirer un contenu rapidement, et un contact de support visible dans l'app (règle 1.2 d'Apple —
> équivalent côté Google). Ce plan les couvre déjà nativement (signalement, retrait express, audit) —
> à vérifier explicitement pendant la préparation de la fiche store (§13).

### 5.5 Administration des comptes
- Un `ADMIN`/`SUPER_ADMIN` invite par e-mail depuis l'app : `AdminInvitation` + lien signé (7 j),
  ouvrable depuis n'importe quel client mail, qui déclenche un **deep link** vers l'app pour finaliser.
- Seul le `SUPER_ADMIN` peut promouvoir, suspendre, supprimer, modifier les paramètres.
- Le dernier `SUPER_ADMIN` ne peut être ni supprimé ni rétrogradé (garde-fou serveur + test).

### 5.6 « Mes sujets » — remplace le lien de gestion web
Avantage direct du mobile sur le web : plus besoin de demander à l'utilisateur de sauvegarder un lien.
- À chaque dépôt réussi, `{requestId, manageToken}` est ajouté à une liste locale (`expo-secure-store`).
- L'onglet **« Mes sujets »** liste tous les sujets déposés depuis cet appareil : statut, nombre de
  prières reçues, bouton « Dieu a répondu 🙌 », bouton « Passer en privé », bouton « Supprimer ».
- **Limite assumée** : en cas de réinstallation ou de changement de téléphone, la liste locale est
  perdue (le sujet reste en base, juste plus « retrouvable » depuis l'app). Parade : un admin peut
  toujours le retrouver et agir dessus après vérification d'identité de vive voix — comme en v1 web.
  Un export/sauvegarde chiffrée de cette liste (optionnelle, hors scope v1) pourra être ajoutée si le
  besoin se confirme à l'usage.

### 5.7 Authentification admin par deep link (remplace le cookie de session web)
1. L'admin saisit son e-mail dans `(admin)/connexion`.
2. Le backend envoie un e-mail (Resend) contenant un lien `maboiteapriere://auth?token=...`
   (+ un lien HTTPS universel de repli qui redirige vers l'app si installée, sinon vers une page
   minimale « Ouvre le lien depuis ton téléphone »).
3. Le tap sur le lien ouvre l'app, qui poste le jeton à `POST /api/v1/auth/mobile/exchange` (§10) et
   reçoit `{accessToken (15 min), refreshToken (30 j)}`, stockés dans `expo-secure-store`.
4. `accessToken` est renouvelé silencieusement via `refreshToken` ; chaque appareil connecté apparaît
   dans `(admin)/parametres` (`deviceLabel`) et peut être révoqué à distance par un `SUPER_ADMIN`.

---

## 6. Statistiques (dans l'app admin)

Trois périodes : **hebdomadaire** (semaine ISO), **mensuelle**, **annuelle**, fuseau `Europe/Paris`.
Écran `(admin)/statistiques` avec sélecteur de période et navigation précédent/suivant.

**Indicateurs** : sujets déposés (total, privé/public, évolution %), sujets publiés/retirés et délai
médian avant retrait s'il y a lieu, prières et **prieurs uniques**, sujets exaucés et délai médian
dépôt→exaucement, moyenne de prières par sujet, top des sujets les plus portés (anonymisé si besoin),
répartition par catégorie, courbe d'évolution, heatmap jours/heures de dépôt.

**Choix de rendu sur mobile :** graphiques simplifiés (courbes et barres, `victory-native` ou
`react-native-gifted-charts`) — pas de tableaux denses façon tableur, l'écran reste tactile et lisible
à une main. **Export CSV** envoyé par e-mail à l'admin depuis l'app plutôt qu'un téléchargement de
fichier (contrainte des sandboxes mobiles).

**Implémentation inchangée** : requêtes sur `DailyStat`, pré-agrégée par cron nocturne + rattrapage du
jour en cours en direct.

---

## 7. Spécification écran par écran

### 7.1 Accueil (onglet)
- Titre « Ma boîte à prière », texte d'intro fourni, verset Matthieu 18:19 (LSG) en belle composition.
- **CTA primaire** flottant « Déposer un sujet de prière » (bouton central de la tab bar, très visible).
- **CTA secondaire** « Découvrir les sujets de prière » → onglet Communauté.
- Bandeau vivant : « X sujets portés cette semaine · Y prières élevées ».
- 3 étapes : *Tu écris · Tu choisis · La communauté prie*. Derniers exaucés (3 cartes). FAQ courte.
- Demande de permission notifications introduite ici, avec explication du bénéfice (« sois prévenu
  quand quelqu'un prie pour toi »), **jamais** au premier lancement brut (meilleur taux d'acceptation).

### 7.2 Déposer
- Prénom · Nom · Sujet (compteur de caractères) · Catégorie facultative · « Publier sans mon prénom ».
- Bloc confidentialité, cartes appuyables, texte exact :
  > **Confidentialité de votre sujet**
  > 🔒 **Privé** — Votre sujet sera uniquement accessible aux administrateurs de Ma boîte à prière.
  > 🌍 **Public** — Votre sujet sera visible par la communauté afin que d'autres personnes puissent prier pour vous.
- Bouton **« Déposer mon sujet »**, état de chargement, clavier géré proprement (KeyboardAvoidingView).
- Brouillon sauvegardé localement (perte de réseau/appli fermée par erreur).

### 7.3 Confirmation
- **« Ton sujet a bien été déposé 🙏 — Des personnes pourront maintenant prier pour toi. »**
- Animation douce (Moti/Reanimated) + haptique léger, respecte la réduction de mouvement système.
- Rappel du choix de confidentialité. CTA « Voir dans Mes sujets » et « Prier pour les autres ».

### 7.4 Communauté (onglet)
- Liste native performante (`FlashList`) de cartes : prénom (ou « Un frère · une sœur »), sujet
  (repliable), date relative, **« N personnes ont prié »**, bouton **« Je prie pour toi 🙏 »** (retour
  haptique), badge catégorie, badge « Exaucé 🙌 » le cas échéant, action « Signaler ».
- Filtres : Tous · Par catégorie · Plus récents / Ceux qui ont besoin de toi. Pull-to-refresh natif.
- Pagination par curseur, squelettes de chargement, état vide chaleureux.

### 7.5 Exaucés (onglet)
- Frise par mois, témoignages, recherche plein texte.

### 7.6 Mes sujets (onglet) — voir §5.6
- Liste des sujets déposés depuis cet appareil, statut, actions (« Dieu a répondu 🙌 », passer en
  privé, supprimer).

### 7.7 Espace admin (accès caché, pas un onglet public)
- Point d'entrée discret depuis un écran « Plus » ou un tap long sur le logo (à trancher avec le
  responsable du département).
- `(admin)/connexion` → lien magique (§5.7).
- `tableau-de-bord` : derniers dépôts à relire, exaucements à confirmer, signalements en attente,
  contenus auto-retenus, chiffres du jour/semaine.
- `sujets` : liste filtrable (visibilité, statut, exaucé, période, recherche), détail, actions.
- `statistiques` : §6.
- `administrateurs` : liste, rôle, dernière connexion, inviter, révoquer.
- `parametres` : clés de `Setting` expliquées simplement, liste des appareils connectés (révocation).
- `journal` : audit consultable.

---

## 8. Accès à la communauté

**Décision validée : `open`.** N'importe qui ayant installé l'app peut consulter et prier, sans
compte. Les modes `code` et `members` restent possibles via `community.accessMode` sans changement
d'architecture, si l'église souhaite un jour restreindre l'accès.

---

## 9. Identité visuelle et design system (mobile)

Intention inchangée : paix, espérance, chaleur, lumière.

```
--fond          #FBF8F3   crème chaud
--surface       #FFFFFF
--encre         #1C2541   bleu nuit profond — textes
--encre-douce   #55607A
--primaire      #2F4A78   bleu confiance — CTA
--lumiere       #E8A33D   ambre doré — espérance, badge exaucé
--paix          #6FA287   vert sauge — validations
--bordure       #EAE3D8
```
*(À réaligner sur les captures d'inspiration à venir.)*

- **Typographie** : titres serif chaleureux (Fraunces/Lora via `expo-font`), texte sans humaniste
  (Inter/Plus Jakarta Sans). Respect du **Dynamic Type** (iOS) / mise à l'échelle système (Android) —
  ne jamais figer une taille de police en dur.
- **Formes** : rayons 16–24, ombres douces, cartes respirantes.
- **Retour tactile** : haptique léger sur « Je prie », sur la confirmation de dépôt, jamais sur la
  navigation courante (pour ne pas fatiguer).
- **Mode sombre** natif (beaucoup de prières se déposent le soir), tokens définis pour les deux thèmes.
- **Accessibilité** : VoiceOver/TalkBack sur tous les éléments interactifs, cibles tactiles ≥ 44×44 pt,
  contrastes ≥ 4.5:1, `reduceMotion` respecté, focus clavier pour les claviers Bluetooth.
- **Icône d'app et écran de lancement** soignés — c'est la première image de la confiance donnée avant
  même l'ouverture.

---

## 10. Contrats d'API

`app/api/v1/*` est **le seul et unique contrat** consommé aujourd'hui par l'app mobile (et,
demain, par un site web sans aucune modification — §17).

| Opération | Endpoint `api/v1` | Entrée | Sortie / règles |
|---|---|---|---|
| Créer un sujet | `POST /api/v1/prayer-requests` | `{firstName,lastName,content,visibility,category?,anonymous?,turnstileToken,pushToken?}` | `{id, manageToken}` · rate-limit · Turnstile |
| Flux communauté | `GET /api/v1/prayer-requests?cursor&category&sort` | — | `{items[], nextCursor}` · jamais de `lastName`, ni de contenu privé |
| Prier | `POST /api/v1/prayer-requests/:slug/prayers` | `{slug}` | `{prayerCount, alreadyPrayed}` · idempotent |
| Signaler | `POST /api/v1/prayer-requests/:slug/reports` | `{slug, reason}` | `204` |
| Gérer un de mes sujets | `PATCH /api/v1/my-requests/:id` (header `X-Manage-Token`) | `{action:'claimAnswered'\|'private'\|'delete', note?}` | Vérif. hash à temps constant ; `claimAnswered` crée un `AnsweredClaim` |
| Modérer | `PATCH /api/v1/admin/prayer-requests/:id` | `{decision, note?}` | RBAC (Bearer) + audit |
| Confirmer un exaucement | `POST /api/v1/admin/answered-claims/:id/resolve` | `{confirm, note?}` | RBAC + audit |
| Retrait express (depuis push) | `POST /api/v1/moderation/retirer` | `{token signé}` | Jeton HMAC 48 h, usage unique |
| Stats | `GET /api/v1/admin/stats?period=week\|month\|year&offset=0` | — | Agrégats §6 |
| Inviter un admin | `POST /api/v1/admin/administrators/invitations` | `{email, role}` | `ADMIN`+ requis |
| Connexion mobile | `POST /api/v1/auth/mobile/exchange` | `{magicLinkToken}` | `{accessToken, refreshToken}` (§5.7) |
| Rafraîchir la session | `POST /api/v1/auth/mobile/refresh` | `{refreshToken}` | `{accessToken}` ; révocable dans `parametres` |
| Enregistrer un jeton push (déposant) | `PATCH /api/v1/prayer-requests/:id/push-token` (header `X-Manage-Token`) | `{expoPushToken}` | Alimente `ownerPushToken` |
| Enregistrer un jeton push (admin) | `POST /api/v1/admin/push-tokens` | `{expoPushToken, deviceLabel}` | RBAC |
| Cron agrégat | `GET /api/v1/cron/daily-stats` | header secret | Remplit `DailyStat` |

Toutes les entrées passent par `packages/shared` (Zod). Toutes les mutations admin passent par
`requireRole()` côté serveur, sur la base du `Authorization: Bearer <accessToken>`.

---

## 11. Sécurité et vie privée (RGPD)

1. **Cloisonnement strict** des sujets privés, test E2E qui tente d'y accéder par id, par API et par flux.
2. **Chiffrement applicatif** du contenu privé (AES-256-GCM, clé en variable d'environnement).
3. **Jetons en Keychain/Keystore** via `expo-secure-store` — jamais dans AsyncStorage en clair.
4. **Pas d'IP en clair** — uniquement `SHA-256(ip + PEPPER)`, purgé à 90 jours.
5. **Tokens serveur** (`manageToken`, invitations, refresh) : aléatoire cryptographique, stockés hachés,
   comparaison à temps constant.
6. **API** : CORS restreint à l'origine de l'app (scheme + bundle id), CSP/HSTS sur les rares pages web
   de repli (universal links, retrait express), rate-limit partout.
7. **Auth** : access token 15 min, refresh token 30 j révocable par appareil, rate-limit login 5/15 min,
   journalisation des connexions.
8. **RGPD** : écran de confidentialité clair dans l'app, base légale = consentement explicite à la
   publication, droit de suppression via « Mes sujets » ou demande admin, aucun tracker publicitaire,
   hébergement UE, durée de conservation documentée. **App Tracking Transparency (iOS)** : non
   applicable, l'app ne fait aucun tracking publicitaire — le préciser dans la fiche store évite un
   aller-retour de revue.
9. **Sauvegardes** : PITR de l'hébergeur + export hebdomadaire chiffré.
10. **Contenu sensible** : message d'orientation d'urgence dans l'écran de confirmation et les CGU
    (« En cas d'urgence ou de danger, contacte les secours (112) ou un responsable de l'église »).

---

## 12. Tests

- **Unitaires (Vitest)** : validation Zod, matrice de visibilité, calcul des périodes avec fuseau,
  RBAC, chiffrement, hash de token, agrégation de push (§5.2).
- **Composants (Jest + React Native Testing Library)** : cartes de sujet, formulaire de dépôt, écran
  « Mes sujets ».
- **E2E (Maestro, iOS + Android)** :
  1. dépôt public → apparition immédiate dans le mur ; dépôt avec URL → mis en attente ;
  2. dépôt privé → absent du mur et de l'API ;
  3. « Je prie » → compteur +1, relance de l'app → toujours +1, pas de double comptage ;
  4. signalement d'exaucement → confirmation admin → visible 5 j → masqué à J+6 → retrouvable dans
     « Exaucés » (horloge simulée) ;
  5. invitation admin par deep link → connexion → accès ; modérateur bloqué sur `administrateurs` ;
  6. audit d'accessibilité (VoiceOver/TalkBack) sur les parcours critiques.
- **Distribution de test** : builds internes EAS → TestFlight (iOS) et Google Play Internal Testing,
  avec un petit groupe de l'église avant la mise en production.
- **Objectif de couverture** : ≥ 85 % sur `server/services`.

---

## 13. Déploiement, exploitation et soumission aux stores

- **Backend** : Vercel (route handlers uniquement) + Neon (Postgres, UE). Cron Vercel : agrégat
  quotidien 00 h 10, digest hebdomadaire, purge des hash d'IP à 90 j, agrégation push différée (§5.2).
- **Mobile** : `eas build` (iOS + Android) → `eas submit` → App Store Connect / Google Play Console ;
  `eas update` pour les correctifs JS sans nouvelle revue store.
- **Comptes développeur requis dès la phase 0** : Apple Developer Program (99 $/an) et Google Play
  Console (25 $ une fois) — **à créer tôt**, les délais de vérification Apple peuvent prendre plusieurs
  jours et bloquent la première soumission s'ils ne sont pas anticipés.
- **Exigences store à préparer en phase 6** : politique de confidentialité (une page web minimale,
  hébergée séparément — c'est une obligation légale des deux stores, pas « le site » abandonné en
  §16), coordonnées de support visibles dans l'app, captures d'écran, description, catégorie « Style de
  vie » ou « Réseautage social », classification d'âge, justification du contenu généré par les
  utilisateurs (§5.4) pour la revue Apple.
- **Notifications push** : projet Expo/EAS configuré avec les certificats APNs et la clé FCM.
- **Runbook** : restauration de sauvegarde, révocation d'un admin compromis (et de ses appareils),
  retrait d'urgence d'un sujet, procédure de rejet de revue store et resoumission.

---

## 14. Feuille de route

| Phase | Contenu | Estimation |
|---|---|---|
| **0 — Socle** | Monorepo pnpm, `apps/api` (routes uniquement), `apps/mobile` (Expo Router, NativeWind), Prisma + base, comptes développeur Apple/Google, CI, Sentry | 2 j |
| **1 — Cœur du produit** | Accueil, Déposer, Confirmation, Communauté, « Je prie », « Mes sujets » — via `api/v1` | 4 j |
| **2 — Exaucés & archives** | Signalement, confirmation admin, masquage J+5, onglet Exaucés, témoignages | 1 j |
| **3 — Administration** | Auth par deep link + jetons mobiles, RBAC, surveillance a posteriori + retrait express (push), invitations, audit | 3 j |
| **4 — Statistiques** | `DailyStat`, cron, écran statistiques mobile (graphiques simplifiés), export CSV par e-mail | 1,5 j |
| **5 — Durcissement** | Turnstile, rate-limit, chiffrement, RGPD, e-mails, notifications push agrégées | 1,5 j |
| **6 — Finition & préparation store** | Accessibilité, mode sombre, icône/splash, page de confidentialité minimale, fiches App Store/Play Store, tests Maestro complets, contenu | 2,5 j |
| **7 — Bêta puis lancement** | TestFlight + Google Play Internal Testing avec un groupe pilote, corrections, soumission, seed du super-admin, formation de l'équipe | 2 j |

**Total ≈ 17,5 jours-homme.** MVP démontrable en interne (TestFlight/Internal Testing) dès la fin de
la phase 3 (jour ~10). Le délai de revue Apple (1–3 jours ouvrés en général, parfois plus en cas
d'aller-retour sur le contenu généré par les utilisateurs) s'ajoute en phase 7 et n'est pas
compressible par l'équipe.

---

## 15. Risques et parades

| Risque | Impact | Parade |
|---|---|---|
| Rejet App Store (contenu généré par les utilisateurs, règle 1.2) | Blocage du lancement iOS | Signalement, retrait express, contact support visibles dès la première soumission (§5.4, §13) — pas ajoutés après coup |
| Portée limitée sans page web de secours | Un lien partagé hors app est inutilisable par qui ne l'a pas installée | Assumé pour cette phase (§1) ; §17 explique le chemin vers une page web de secours plus tard |
| Contenu inapproprié en ligne immédiatement (publication immédiate) | Image de l'église | Turnstile + rate-limit, auto-retenue des contenus suspects, push admin instantané avec retrait en un clic, retrait auto au 3ᵉ signalement |
| Aucun admin disponible la nuit / le week-end | Contenu gênant visible plusieurs heures | Push à tous les admins + retrait automatique au seuil de signalements sans intervention humaine |
| Perte de la liste « Mes sujets » (réinstallation, changement de téléphone) | Le déposant ne retrouve plus son sujet depuis l'app | Récupération possible par un admin après vérification d'identité (comme en v1 web) |
| Notifications trop fréquentes perçues comme intrusives | Désinstallation | Push agrégés (§5.2), jamais un push par prière individuelle |
| Délai de revue store imprévisible | Décale la date de lancement | Comptes développeur créés dès la phase 0, soumission anticipée avec marge, bêta TestFlight/Internal Testing en parallèle |

---

## 16. Décisions

### Validées le 12–14 septembre 2026

| Sujet | Décision | Impact sur le plan |
|---|---|---|
| Accès à la communauté | Ouvert à tous | §8 |
| Marquage « exaucé » | Administrateurs uniquement (signalement du déposant + confirmation admin) | §5.3 |
| Connexion admin | Lien magique e-mail uniquement | §5.7 |
| Modération | Publication immédiate + surveillance a posteriori | §5.4 |
| **Produit de départ** | **Application mobile, sans site web pour l'instant** | Réécriture complète de ce document en v2.0 |
| **Plateformes** | **iOS + Android ensemble, via Expo** | §2, §13 |

**Conséquence assumée à valider explicitement avec le responsable du département :** sans site web,
l'espace d'administration (modération, statistiques, invitations) vit **dans l'app mobile**, pas dans
un panneau web séparé. C'est cohérent avec « mobile uniquement pour l'instant », mais ça veut dire que
les admins modèrent et consultent les stats depuis leur téléphone — plus rapide au quotidien, mais des
tableaux denses ou une modération en masse seraient plus confortables sur grand écran. Si ce confort
s'avère nécessaire à l'usage, §17 explique que rien n'empêche d'ajouter un panneau web léger plus tard
sans toucher au backend.

### Questions ouvertes

1. **Page de confidentialité minimale** (obligatoire pour les deux stores, indépendante du « site web »
   abandonné) : je la génère et l'héberge sur un sous-domaine simple — un nom à me donner ?
2. **Nom de famille** : conservé en base pour les admins, jamais affiché publiquement — confirmé ?
3. **Fuseau horaire et langue** : Europe/Paris et français uniquement pour la v1 ?
4. **Comptes développeur** : qui crée/possède le compte Apple Developer Program et le compte Google
   Play Console — le département, ou un compte personnel à transférer ensuite ? À faire tôt (§13).
5. **Nom exact de l'app, icône, identifiants de bundle** (`com.eglise.maboiteapriere` par exemple) ?
6. **Premier super-administrateur** : quelle adresse e-mail pour le seed initial ?
7. **Point d'entrée de l'espace admin** (§7.7) : tap long sur le logo, écran « Plus » dédié, ou autre
   convention — j'ai une préférence pour un écran « Plus » explicite (plus découvrable, moins « caché »
   qu'un geste secret) mais c'est un choix d'ergonomie ouvert.

---

## 17. Trajectoire vers un site web (plus tard, si besoin)

Rien dans ce plan ne ferme la porte à un site web futur — c'est même la raison d'être de l'architecture
API-first posée dès la phase 0.

**Ce qui se réutilise intégralement le jour où un site web est décidé :**
- Toute la base de données, les services métier, le RBAC, l'audit, le chiffrement, les crons de stats.
- Tous les endpoints `api/v1` et leurs schémas Zod (`packages/shared`) — zéro nouvel endpoint à écrire.
- Le vocabulaire produit (statuts, workflow de modération, catégories) — identique sur les deux fronts.
- Les tokens de design (§9) comme valeurs, transposables en CSS/Tailwind pour le web.

**Ce qu'il faudrait reconstruire, à ce moment-là seulement :**
- L'interface web (Next.js pages, comme décrites dans la v1.1 de ce document, conservée en historique
  git) et l'authentification par cookie de session en plus de l'auth par jeton déjà en place pour le
  mobile.
- Une page de secours pour les liens partagés (`communaute/[slug]`) consultable sans avoir l'app —
  ce serait le gain le plus immédiat d'un site web, avant même un espace admin web.

**Ordre recommandé si ce jour arrive :** (1) une page web de secours pour les sujets publics partagés
(lecture seule, sans dépôt ni prière) — quelques jours ; (2) éventuellement un panneau admin web léger
si la modération depuis le mobile devient inconfortable à l'usage ; (3) un site vitrine complet en
dernier, seulement si le besoin d'acquisition/SEO se confirme.
