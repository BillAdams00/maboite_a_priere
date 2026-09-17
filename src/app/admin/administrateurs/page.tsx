import { AdminService } from '../../../server/services/admin.service';
import { AdminRepository } from '../../../server/repositories/admin.repository';
import { AdminInviteModal } from './AdminInviteModal';
import { Shield, ShieldAlert, ShieldCheck, Mail, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  await AdminService.requireAdmin(['ADMIN', 'SUPER_ADMIN']);

  const admins = await AdminRepository.findAll();

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-encre">
            Équipe Pastorale & Administrateurs
          </h1>
          <p className="text-xs text-encre-douce mt-0.5">
            Gestion des accès sécurisés Supabase Auth et des rôles RBAC.
          </p>
        </div>

        <AdminInviteModal />
      </div>

      <div className="bg-surface border border-bordure rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-encre">
            <thead className="bg-fond border-b border-bordure text-[11px] font-bold text-encre-douce uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Membre</th>
                <th className="p-3.5">E-mail</th>
                <th className="p-3.5">Rôle</th>
                <th className="p-3.5">Statut</th>
                <th className="p-3.5">Dernière connexion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bordure/60">
              {admins.map(adm => (
                <tr key={adm.id} className="hover:bg-fond/50 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-encre">
                      {adm.firstName} {adm.lastName}
                    </div>
                    <div className="text-[10px] text-encre-subtile font-mono">
                      ID Auth: {adm.authUserId.slice(0, 8)}...
                    </div>
                  </td>

                  <td className="p-3.5 text-encre-douce">
                    {adm.email}
                  </td>

                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        adm.role === 'SUPER_ADMIN'
                          ? 'bg-primaire text-white'
                          : adm.role === 'ADMIN'
                          ? 'bg-primaire/15 text-primaire'
                          : 'bg-fond text-encre-douce border border-bordure'
                      }`}
                    >
                      <Shield size={12} />
                      <span>{adm.role}</span>
                    </span>
                  </td>

                  <td className="p-3.5">
                    <span
                      className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        adm.status === 'ACTIVE'
                          ? 'bg-paix-subtle text-paix'
                          : adm.status === 'INVITED'
                          ? 'bg-lumiere-subtle text-lumiere'
                          : 'bg-danger-subtle text-danger'
                      }`}
                    >
                      {adm.status}
                    </span>
                  </td>

                  <td className="p-3.5 text-encre-subtile text-[11px]">
                    {adm.lastLoginAt
                      ? new Date(adm.lastLoginAt).toLocaleString('fr-FR')
                      : 'Jamais connecté'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
