# Règle de transparence : Contournements d'authentification et de RBAC

Tout mécanisme qui contourne l'authentification ou le contrôle d'accès basé sur les rôles (RBAC) — même temporaire, même à des fins de test local ou de développement, et même conditionné par `process.env.NODE_ENV === 'development'` (ex. flags de type `DEV_ADMIN_BYPASS`, mock d'utilisateurs ou de sessions) — **DOIT être mentionné de manière explicite et visible dans le rapport dès son introduction**, et pas uniquement lors de son retrait ou nettoyage.
