'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, X, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { inviteAdminAction } from '../../../server/actions/admin.actions';
import { withTimeout } from '../../../lib/utils/async';

export function AdminInviteModal() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'MODERATOR' | 'ADMIN'>('MODERATOR');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await withTimeout(
        inviteAdminAction({
          email: email.trim().toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role,
        }),
        15000,
        'L’envoi de l’invitation met plus de 15 secondes à aboutir. Veuillez réessayer.'
      );

      if (res.success) {
        setSuccessMessage(`Invitation envoyée avec succès à ${email} via Supabase Auth !`);
        setTimeout(() => {
          setIsOpen(false);
          setSuccessMessage(null);
          setEmail('');
          setFirstName('');
          setLastName('');
          router.refresh();
        }, 2500);
      } else {
        setErrorMessage(res.error || 'Erreur lors de l’invitation.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Une erreur réseau est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primaire text-white text-xs sm:text-sm font-bold shadow-sm hover:bg-primaire-hover transition-colors"
      >
        <UserPlus size={16} />
        <span>Inviter un administrateur</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-encre/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-bordure rounded-2xl max-w-md w-full p-6 shadow-xl relative space-y-4">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-encre-subtile hover:text-encre p-1"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 text-primaire">
              <UserPlus size={20} />
              <h3 className="font-serif font-bold text-base text-encre">
                Inviter un membre de l'équipe
              </h3>
            </div>

            <p className="text-xs text-encre-douce leading-relaxed">
              Un e-mail d'invitation officiel Supabase Auth sera immédiatement envoyé avec un lien sécurisé d'activation.
            </p>

            {successMessage ? (
              <div className="p-4 bg-paix-subtle text-paix border border-paix/30 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {errorMessage && (
                  <div className="p-3 bg-danger-subtle text-danger border border-danger/20 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-encre-douce uppercase">Prénom</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Jean"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-bordure bg-fond text-xs text-encre focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primaire/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-encre-douce uppercase">Nom</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Dupont"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-bordure bg-fond text-xs text-encre focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primaire/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-encre-douce uppercase">Adresse e-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jean.dupont@eglise.fr"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-bordure bg-fond text-xs text-encre focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primaire/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-encre-douce uppercase">Rôle attribué</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-bordure bg-fond text-xs text-encre focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primaire/20"
                  >
                    <option value="MODERATOR">Modérateur (Validation & surveillance)</option>
                    <option value="ADMIN">Administrateur (Tout + Stats + Invitations)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-encre-douce hover:text-encre"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-primaire text-white text-xs font-bold rounded-xl hover:bg-primaire-hover disabled:opacity-50"
                  >
                    {isLoading ? 'Envoi en cours...' : 'Envoyer l’invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
