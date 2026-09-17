import { AdminService } from '../../../server/services/admin.service';
import { AuditRepository } from '../../../server/repositories/audit.repository';
import { History, Shield, Calendar, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminJournalPage() {
  await AdminService.requireAdmin(['ADMIN', 'SUPER_ADMIN']);

  const logs = await AuditRepository.findRecent(50);

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="font-serif text-2xl font-bold text-encre">
          Journal d'Audit & Sécurité
        </h1>
        <p className="text-xs text-encre-douce mt-0.5">
          Traçabilité immuable des actions d'administration et de modération pastorale.
        </p>
      </div>

      <div className="bg-surface border border-bordure rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-encre">
            <thead className="bg-fond border-b border-bordure text-[11px] font-bold text-encre-douce uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Date & Heure</th>
                <th className="p-3.5">Acteur</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Entité visée</th>
                <th className="p-3.5">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bordure/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-encre-douce">
                    Aucune entrée dans le journal d'audit pour le moment.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-fond/50 transition-colors">
                    <td className="p-3.5 text-encre-subtile font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-encre">
                        {log.actorEmail || 'Système / Lien Express'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono text-[11px] font-bold text-primaire bg-primaire/10 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-3.5 text-encre-douce text-[11px]">
                      {log.entityType} ({log.entityId.slice(0, 10)}...)
                    </td>

                    <td className="p-3.5 text-[11px] text-encre-subtile font-mono max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
