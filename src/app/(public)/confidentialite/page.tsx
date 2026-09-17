import { Shield, Lock, EyeOff, Server, Trash2 } from 'lucide-react';

export default function ConfidentialitePage() {
  return (
    <div className="max-w-2xl mx-auto py-6 space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-serif text-3xl font-bold text-encre">Politique de Confidentialité & RGPD</h1>
        <p className="text-xs sm:text-sm text-encre-douce">
          Comment nous protégeons scrupuleusement vos données et votre vie privée.
        </p>
      </div>

      <div className="bg-surface border border-bordure rounded-2xl p-6 sm:p-8 space-y-6 text-sm text-encre leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-encre flex items-center gap-2">
            <Lock size={18} className="text-primaire" />
            <span>1. Chiffrement fort des sujets privés</span>
          </h2>
          <p className="text-encre-douce">
            Lorsque vous sélectionnez l'option <strong>« Privé »</strong>, le contenu de votre sujet est
            immédiatement chiffré de manière symétrique avec l'algorithme <code>AES-256-GCM</code> avant
            tout enregistrement en base de données. Même en cas d'accès direct à la base, votre texte reste
            indéchiffrable. Seuls les administrateurs et modérateurs connectés disposent de la clé applicative.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-encre flex items-center gap-2">
            <EyeOff size={18} className="text-paix" />
            <span>2. Protection du nom de famille</span>
          </h2>
          <p className="text-encre-douce">
            Votre nom de famille est conservé uniquement pour permettre à l'équipe pastorale d'identifier
            votre demande si nécessaire. Il n'est <strong>jamais</strong> transmis dans les flux publics,
            ni dans les réponses API de la communauté. Si vous cochez « Publier de façon anonyme », même votre
            prénom est masqué.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-encre flex items-center gap-2">
            <Server size={18} className="text-encre" />
            <span>3. Pas de traçage abusif</span>
          </h2>
          <p className="text-encre-douce">
            Nous n'utilisons aucun tracker publicitaire tiers. Les adresses IP sont systématiquement hachées
            avec un sel cryptographique (Pepper) et ne sont jamais stockées en clair.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-encre flex items-center gap-2">
            <Trash2 size={18} className="text-danger" />
            <span>4. Droit d'effacement en toute autonomie</span>
          </h2>
          <p className="text-encre-douce">
            Grâce à votre <strong>lien privé de gestion</strong> remis lors du dépôt, vous pouvez à tout moment
            supprimer définitivement votre sujet sans avoir à créer de compte ni à envoyer de formulaire de contact.
          </p>
        </section>
      </div>
    </div>
  );
}
