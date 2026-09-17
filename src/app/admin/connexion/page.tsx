'use client';

import { useState } from 'react';
import { createClient } from '../../../server/supabase/browser';
import { Heart, Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminConnexionPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const supabase = createClient();
    const redirectOrigin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${redirectOrigin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Impossible d’envoyer le lien magique.');
    } else {
      setIsSent(true);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primaire hover:underline mb-6"
      >
        <ArrowLeft size={16} />
        <span>Retour à l'accueil</span>
      </Link>

      <div className="bg-surface border border-bordure rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primaire/10 text-primaire flex items-center justify-center mx-auto">
            <Heart size={24} className="fill-current" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-encre">Espace Administrateur</h1>
          <p className="text-xs text-encre-douce">
            Connexion sécurisée par lien magique Supabase Auth.
          </p>
        </div>

        {isSent ? (
          <div className="bg-paix-subtle border border-paix/30 rounded-2xl p-5 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-paix/20 text-paix flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-bold text-sm text-encre">Vérifiez vos e-mails ✉️</h3>
            <p className="text-xs text-encre-douce leading-relaxed">
              Un lien de connexion sans mot de passe a été envoyé à <strong>{email}</strong>. Cliquez dessus
              pour accéder directement à votre espace.
            </p>
            <button
              onClick={() => setIsSent(false)}
              className="text-xs font-semibold text-primaire hover:underline pt-2"
            >
              Renvoyer un autre lien
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 text-xs text-danger bg-danger-subtle p-3 rounded-xl border border-danger/20">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-encre-douce uppercase tracking-wider">
                Adresse e-mail pastorale
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@maboiteapriere.fr"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-bordure bg-fond focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primaire/20 text-sm text-encre"
                />
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-encre-subtile"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-primaire text-white font-bold text-sm shadow-md hover:bg-primaire-hover transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Envoi du lien en cours...' : 'M’envoyer un lien magique'}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <p className="text-[11px] text-encre-subtile">
            Réservé aux membres habilités de l'équipe pastorale et aux modérateurs.
          </p>
        </div>
      </div>
    </div>
  );
}
