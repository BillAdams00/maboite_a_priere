'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { CheckCircle2, Copy, Check, Users, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export default function MerciPage() {
  const [token, setToken] = useState<string>('');
  const [visibility, setVisibility] = useState<string>('PUBLIC');
  const [copied, setCopied] = useState(false);
  const [managementUrl, setManagementUrl] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let resolvedToken = '';
    let resolvedVisibility = 'PUBLIC';

    try {
      // 1. Lecture prioritaire depuis sessionStorage (dépôt immédiat sans fuite URL)
      const sessionToken = sessionStorage.getItem('mbap_last_manage_token');
      const sessionVis = sessionStorage.getItem('mbap_last_visibility');

      if (sessionToken) {
        resolvedToken = sessionToken;
        if (sessionVis) resolvedVisibility = sessionVis;
      } else {
        // 2. Repli propre : si l'utilisateur a rafraîchi la page, lecture du dernier sujet mémorisé
        const localPrayers = JSON.parse(localStorage.getItem('mbap_my_prayers') || '[]');
        if (Array.isArray(localPrayers) && localPrayers.length > 0 && localPrayers[0]?.manageToken) {
          resolvedToken = localPrayers[0].manageToken;
          resolvedVisibility = localPrayers[0].visibility || 'PUBLIC';
        }
      }
    } catch {
      // Ignorer si le stockage local est inaccessible (navigation privée stricte)
    }

    setToken(resolvedToken);
    setVisibility(resolvedVisibility);
    if (resolvedToken && typeof window !== 'undefined') {
      setManagementUrl(`${window.location.origin}/mon-sujet/${resolvedToken}`);
    }
    setIsLoaded(true);
  }, []);

  const handleCopy = async () => {
    if (!managementUrl) return;
    try {
      await navigator.clipboard.writeText(managementUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      console.warn('Erreur lors de la copie');
    }
  };

  return (
    <div className="max-w-lg mx-auto py-6 sm:py-10">
      <div className="bg-surface border border-bordure rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-6">
        {/* Icône de succès */}
        <div className="w-16 h-16 rounded-full bg-paix/15 text-paix flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} />
        </div>

        {/* Titre & sous-titre */}
        <div className="space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-encre">
            Ton sujet a bien été déposé 🙏
          </h1>
          <p className="text-sm text-encre-douce leading-relaxed">
            {visibility === 'PRIVATE'
              ? 'Ton sujet est chiffré de bout en bout et transmis en toute confidentialité à l’équipe pastorale.'
              : 'Des frères et sœurs vont maintenant pouvoir intercéder et prier pour toi.'}
          </p>
        </div>

        {/* Bloc du lien de gestion privé */}
        {isLoaded && token ? (
          <div className="bg-fond border border-bordure rounded-2xl p-5 text-left space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-encre uppercase tracking-wider">
              <ShieldCheck size={16} className="text-primaire" />
              <span>Votre lien privé de gestion</span>
            </div>

            <p className="text-xs text-encre-douce leading-relaxed">
              Conservez précieusement ce lien ! Il vous permettra de voir le nombre de prières reçues, de
              témoigner d’un exaucement 🙌 ou de supprimer votre sujet à tout moment sans avoir de compte.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={managementUrl}
                className="flex-1 bg-surface border border-bordure rounded-xl px-3 py-2 text-xs text-encre font-mono select-all focus:outline-none"
              />

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primaire text-white text-xs font-semibold hover:bg-primaire-hover transition-colors shadow-sm"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-paix" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : isLoaded && !token ? (
          /* Repli propre si ni sessionStorage ni localStorage n'ont de jeton */
          <div className="bg-fond border border-bordure rounded-2xl p-4 text-left flex items-start gap-3">
            <HelpCircle size={18} className="text-encre-douce shrink-0 mt-0.5" />
            <p className="text-xs text-encre-douce leading-relaxed">
              Si tu avais déjà copié ton lien privé de gestion, conserve-le pour gérer ton sujet.
              Tu peux également continuer à visiter et soutenir la communauté ci-dessous.
            </p>
          </div>
        ) : null}

        {/* Boutons d'action */}
        <div className="pt-2 flex flex-col gap-3">
          {token && (
            <Link
              href={`/mon-sujet/${token}`}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primaire text-white font-bold text-sm hover:bg-primaire-hover transition-colors shadow-sm"
            >
              <span>Accéder à mon sujet</span>
              <ArrowRight size={16} />
            </Link>
          )}

          <Link
            href="/communaute"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-fond border border-bordure text-encre font-semibold text-sm hover:bg-surface transition-colors"
          >
            <Users size={16} className="text-primaire" />
            <span>Prier pour la communauté</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
