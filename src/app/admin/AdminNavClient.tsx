'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  BarChart3,
  Users,
  Settings,
  History,
  LogOut,
  Shield,
} from 'lucide-react';
import { createClient } from '../../server/supabase/browser';

const ADMIN_LINKS = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/sujets', label: 'Sujets & Modération', icon: Inbox, exact: false },
  { href: '/admin/statistiques', label: 'Statistiques', icon: BarChart3, exact: false },
  { href: '/admin/administrateurs', label: 'Administrateurs', icon: Users, exact: false },
  { href: '/admin/parametres', label: 'Paramètres', icon: Settings, exact: false },
  { href: '/admin/journal', label: 'Journal d’audit', icon: History, exact: false },
];

export function AdminNavClient() {
  const pathname = usePathname();
  const router = useRouter();

  // Ne pas afficher la barre d'onglets sur la page de connexion
  if (pathname === '/admin/connexion') return null;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/connexion');
    router.refresh();
  };

  return (
    <div className="bg-surface border border-bordure rounded-2xl p-2 sm:p-3 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 mr-1 text-xs font-bold text-primaire border-r border-bordure">
          <Shield size={16} />
          <span>ADMIN</span>
        </div>

        {ADMIN_LINKS.map(link => {
          const Icon = link.icon;
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primaire text-white shadow-xs'
                  : 'text-encre-douce hover:text-encre hover:bg-fond'
              }`}
            >
              <Icon size={15} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      <button
        onClick={handleSignOut}
        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-danger hover:bg-danger-subtle transition-colors shrink-0"
        title="Se déconnecter"
      >
        <LogOut size={15} />
        <span className="sm:inline">Déconnexion</span>
      </button>
    </div>
  );
}
