import Link from 'next/link';
import {
  LayoutDashboard,
  Inbox,
  BarChart3,
  Users,
  Settings,
  History,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { AdminNavClient } from './AdminNavClient';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {/* Barre de navigation Admin */}
      <AdminNavClient />

      {/* Contenu de la section */}
      <div>{children}</div>
    </div>
  );
}
