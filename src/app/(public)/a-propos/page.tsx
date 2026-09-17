import Link from 'next/link';
import { Heart, ShieldCheck, Users, Sparkles, BookOpen } from 'lucide-react';

export default function AProposPage() {
  return (
    <div className="max-w-2xl mx-auto py-6 space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-serif text-3xl font-bold text-encre">À propos de Ma boîte à prière</h1>
        <p className="text-xs sm:text-sm text-encre-douce">
          Une initiative chrétienne dédiée à l'intercession mutuelle et à l'édification de la foi.
        </p>
      </div>

      <div className="bg-surface border border-bordure rounded-2xl p-6 sm:p-8 space-y-6 text-sm text-encre leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-encre flex items-center gap-2">
            <Heart size={20} className="text-primaire" />
            <span>Notre vocation</span>
          </h2>
          <p>
            <strong>Ma boîte à prière</strong> est née d'une conviction biblique fondamentale : nous sommes appelés
            à « porter les fardeaux les uns des autres, et accomplir ainsi la loi de Christ » (Galates 6:2).
          </p>
          <p>
            Que vous traversiez une épreuve difficile, un combat de santé, une décision professionnelle majeure
            ou que vous ayez une action de grâce à partager, ce lieu vous offre un espace sécurisé et bienveillant
            pour être entouré dans la prière.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-encre flex items-center gap-2">
            <ShieldCheck size={20} className="text-paix" />
            <span>Nos engagements</span>
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-encre-douce">
            <li><strong>Gratuité totale :</strong> aucun frais, aucun abonnement, aucune publicité.</li>
            <li><strong>Respect de l'anonymat :</strong> votre nom de famille n'est jamais divulgué.</li>
            <li><strong>Sécurité des confidences :</strong> les sujets privés sont chiffrés de bout en bout et réservés aux ministères pastoraux.</li>
            <li><strong>Zéro barrière :</strong> pas de compte utilisateur obligatoire ni d'application payante à installer.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-encre flex items-center gap-2">
            <Sparkles size={20} className="text-lumiere" />
            <span>Témoigner de la grâce</span>
          </h2>
          <p>
            Chaque prière exaucée est une occasion de rendre gloire à Dieu. Les déposants peuvent
            facilement transformer leur demande en témoignage pour encourager toute la communauté.
          </p>
        </section>
      </div>
    </div>
  );
}
