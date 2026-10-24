'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Globe, Check, AlertCircle, Shield, HeartHandshake } from 'lucide-react';
import { submitPrayerAction } from '../../../server/actions/prayer.actions';
import { CATEGORIES } from '../../../lib/constants/design-tokens';
import { TurnstileWidget } from '../../../components/ui/TurnstileWidget';

export default function DeposerPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [category, setCategory] = useState<string>('');
  const [displayAsAnonymous, setDisplayAsAnonymous] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (firstName.trim().length < 2) {
      setError('Veuillez saisir votre prénom (au moins 2 caractères).');
      return;
    }
    if (lastName.trim().length < 2) {
      setError('Veuillez renseigner votre nom de famille.');
      return;
    }
    if (content.trim().length < 10) {
      setError('Votre sujet de prière doit contenir au moins 10 caractères.');
      return;
    }

    setIsSubmitting(true);

    try {
      const hiddenInput = document.querySelector<HTMLInputElement>(
        'input[name="cf-turnstile-response"]'
      );
      const effectiveToken = turnstileToken || hiddenInput?.value || '';

      const res = await submitPrayerAction(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          content: content.trim(),
          visibility,
          category: category || null,
          displayAsAnonymous,
        },
        effectiveToken
      );

      if (!res.success || !res.data) {
        setError(res.error || 'Une erreur est survenue lors de l’envoi.');
        setIsSubmitting(false);
        return;
      }

      // Stockage sécurisé en sessionStorage pour la page de confirmation (sans fuite dans l'URL)
      try {
        sessionStorage.setItem('mbap_last_manage_token', res.data.manageToken);
        sessionStorage.setItem('mbap_last_visibility', visibility);
        sessionStorage.setItem('mbap_last_slug', res.data.publicSlug);
      } catch {}

      // Mémorisation de confort dans le localStorage du navigateur
      try {
        const stored = JSON.parse(localStorage.getItem('mbap_my_prayers') || '[]');
        stored.unshift({
          id: res.data.id,
          publicSlug: res.data.publicSlug,
          manageToken: res.data.manageToken,
          firstName: firstName.trim(),
          visibility,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('mbap_my_prayers', JSON.stringify(stored.slice(0, 10)));
      } catch {
        // Ignorer si localStorage désactivé
      }

      // Redirection propre sans jeton sensible dans la barre d'adresse
      router.push('/deposer/merci');
    } catch (err: any) {
      setError(err.message || 'Une erreur réseau est survenue.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-4 sm:py-6">
      <div className="text-center mb-6 space-y-1">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-encre">
          Déposer un sujet de prière
        </h1>
        <p className="text-xs sm:text-sm text-encre-douce">
          Partage ton fardeau en toute liberté, une prière sera élevée pour toi.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-bordure rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
      >
        {error && (
          <div className="flex items-center gap-2 text-xs text-danger bg-danger-subtle p-3 rounded-xl border border-danger/20">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Choix de confidentialité */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-encre-douce uppercase tracking-wider">
            Confidentialité de votre sujet *
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option Public */}
            <button
              type="button"
              onClick={() => setVisibility('PUBLIC')}
              className={`p-4 rounded-xl border text-left transition-all duration-150 ${
                visibility === 'PUBLIC'
                  ? 'border-primaire bg-primaire/5 ring-2 ring-primaire/20'
                  : 'border-bordure bg-surface hover:bg-fond'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Globe size={18} className={visibility === 'PUBLIC' ? 'text-primaire' : 'text-encre-subtile'} />
                <span className={`font-bold text-sm ${visibility === 'PUBLIC' ? 'text-primaire' : 'text-encre'}`}>
                  Public
                </span>
              </div>
              <p className="text-xs text-encre-douce leading-relaxed">
                Visible par la communauté chrétienne pour qu'elle puisse prier pour vous.
              </p>
            </button>

            {/* Option Privé */}
            <button
              type="button"
              onClick={() => setVisibility('PRIVATE')}
              className={`p-4 rounded-xl border text-left transition-all duration-150 ${
                visibility === 'PRIVATE'
                  ? 'border-primaire bg-primaire/5 ring-2 ring-primaire/20'
                  : 'border-bordure bg-surface hover:bg-fond'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Lock size={18} className={visibility === 'PRIVATE' ? 'text-primaire' : 'text-encre-subtile'} />
                <span className={`font-bold text-sm ${visibility === 'PRIVATE' ? 'text-primaire' : 'text-encre'}`}>
                  Privé
                </span>
              </div>
              <p className="text-xs text-encre-douce leading-relaxed">
                Chiffré et accessible uniquement à l'équipe pastorale autorisée.
              </p>
            </button>
          </div>
        </div>

        {/* Nom & Prénom */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className="block text-xs font-bold text-encre-douce uppercase tracking-wider">
              Prénom *
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Ex. Samuel"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-bordure bg-fond focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primaire/20 text-sm text-encre"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="lastName" className="block text-xs font-bold text-encre-douce uppercase tracking-wider">
              Nom de famille *
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Ex. Dubois"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-bordure bg-fond focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primaire/20 text-sm text-encre"
            />
          </div>
        </div>

        <p className="text-[11px] text-encre-subtile flex items-center gap-1.5 -mt-2">
          <Shield size={13} className="text-paix" />
          <span>Votre nom de famille ne sera <strong>jamais</strong> affiché publiquement.</span>
        </p>

        {/* Anonymat facultatif pour les sujets publics */}
        {visibility === 'PUBLIC' && (
          <label htmlFor="displayAsAnonymous" className="flex items-center gap-3 p-3 rounded-xl border border-bordure bg-fond cursor-pointer hover:bg-surface transition-colors">
            <input
              id="displayAsAnonymous"
              name="displayAsAnonymous"
              type="checkbox"
              checked={displayAsAnonymous}
              onChange={e => setDisplayAsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded text-primaire focus:ring-primaire"
            />
            <span className="text-xs text-encre font-medium">
              Publier sans afficher mon prénom (« Un frère · une sœur »)
            </span>
          </label>
        )}

        {/* Catégorie */}
        <div className="space-y-1.5">
          <label htmlFor="category" className="block text-xs font-bold text-encre-douce uppercase tracking-wider">
            Catégorie (optionnelle)
          </label>
          <select
            id="category"
            name="category"
            aria-label="Catégorie (optionnelle)"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-bordure bg-fond focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primaire/20 text-sm text-encre"
          >
            <option value="">Sélectionnez un thème...</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sujet de prière */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="content" className="block text-xs font-bold text-encre-douce uppercase tracking-wider">
              Votre sujet de prière *
            </label>
            <span className="text-[11px] text-encre-subtile">
              {content.length}/1000 caractères
            </span>
          </div>
          <textarea
            id="content"
            name="content"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="Écrivez ce qui pèse sur votre cœur ou votre sujet de reconnaissance..."
            required
            className="w-full p-3.5 rounded-xl border border-bordure bg-fond focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primaire/20 text-sm text-encre leading-relaxed resize-none"
          />
          <p className="text-[11px] text-encre-subtile">
            Pour la sécurité de tous, les liens internet (URLs) ne sont pas autorisés.
          </p>
        </div>

        {/* Protection anti-robot Cloudflare Turnstile */}
        <TurnstileWidget
          onVerify={(tok) => setTurnstileToken(tok)}
          onExpire={() => setTurnstileToken('')}
        />

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-xl bg-primaire text-white font-bold text-sm shadow-md hover:bg-primaire-hover transition-all duration-150 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>Envoi de votre sujet en cours...</span>
          ) : (
            <>
              <HeartHandshake size={18} />
              <span>Déposer mon sujet de prière</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
