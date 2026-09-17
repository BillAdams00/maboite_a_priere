import { AdminService } from '../../../server/services/admin.service';
import { prisma } from '../../../server/db';
import { DEFAULT_SETTINGS } from '../../../lib/constants/settings';
import { Settings, ShieldCheck, Bell, Shield, Sliders } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminParametresPage() {
  await AdminService.requireAdmin(['SUPER_ADMIN']);

  const dbSettings = await prisma.setting.findMany();
  const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));

  const getVal = (k: string) => {
    return settingsMap.has(k) ? settingsMap.get(k) : DEFAULT_SETTINGS[k];
  };

  return (
    <div className="max-w-2xl mx-auto py-2 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-encre">
          Paramètres du Système
        </h1>
        <p className="text-xs text-encre-douce mt-0.5">
          Configuration des règles de modération, d'affichage et d'alertes (Réservé SUPER_ADMIN).
        </p>
      </div>

      <div className="bg-surface border border-bordure rounded-2xl p-6 shadow-sm space-y-6">
        {/* Modération */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-bordure/60 pb-2 text-primaire">
            <Shield size={18} />
            <h2 className="font-bold text-sm text-encre">Règles de Modération</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-fond rounded-xl">
              <div>
                <span className="font-bold text-encre block">Approbation préalable obligatoire</span>
                <span className="text-encre-douce">
                  Si activé, aucun sujet public n'apparaît sur le site sans validation d'un modérateur.
                </span>
              </div>
              <span className="font-mono font-bold text-primaire">
                {String(getVal('moderation.publicRequiresApproval'))}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-fond rounded-xl">
              <div>
                <span className="font-bold text-encre block">Auto-retenue des contenus suspects</span>
                <span className="text-encre-douce">
                  Retient automatiquement en PENDING tout sujet avec numéro de téléphone, email ou mots-clés spam.
                </span>
              </div>
              <span className="font-mono font-bold text-paix">
                {String(getVal('moderation.autoHoldSuspicious'))}
              </span>
            </div>
          </div>
        </section>

        {/* Exaucements & Archives */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-bordure/60 pb-2 text-lumiere">
            <Sliders size={18} />
            <h2 className="font-bold text-sm text-encre">Affichage & Cycle de Vie</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-fond rounded-xl">
              <div>
                <span className="font-bold text-encre block">Masquage du mur public après exaucement</span>
                <span className="text-encre-douce">
                  Nombre de jours pendant lesquels un sujet exaucé reste visible sur le mur avant d'être archivé.
                </span>
              </div>
              <span className="font-mono font-bold text-encre">
                {String(getVal('answered.hideAfterDays'))} jours
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-fond rounded-xl">
              <div>
                <span className="font-bold text-encre block">Afficher les archives publiquement</span>
                <span className="text-encre-douce">
                  Permet à la communauté de consulter l'onglet /exauces pour fortifier sa foi.
                </span>
              </div>
              <span className="font-mono font-bold text-paix">
                {String(getVal('answered.showArchivePublicly'))}
              </span>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-bordure/60 pb-2 text-primaire">
            <Bell size={18} />
            <h2 className="font-bold text-sm text-encre">Notifications & Alertes E-mail (Resend)</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-fond rounded-xl">
              <div>
                <span className="font-bold text-encre block">Alerte e-mail sur nouveau sujet public</span>
                <span className="text-encre-douce">
                  Envoie un e-mail à l'équipe pastorale avec le lien de retrait express en 1 clic.
                </span>
              </div>
              <span className="font-mono font-bold text-paix">
                {String(getVal('notifications.privateRequestEmail'))}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
