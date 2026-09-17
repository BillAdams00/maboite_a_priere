import Link from 'next/link';
import { ShieldCheck, HeartHandshake } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-bordure mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 text-center sm:text-left">
          <div>
            <p className="font-serif font-bold text-base text-encre">
              Ma boîte à prière 🙏
            </p>
            <p className="text-xs text-encre-douce mt-1 max-w-sm">
              Un espace chrétien fraternel et sécurisé pour déposer vos fardeaux et intercéder dans la foi.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-encre-douce">
            <Link href="/a-propos" className="hover:text-primaire transition-colors">
              À propos
            </Link>
            <Link href="/confidentialite" className="hover:text-primaire transition-colors">
              Vie privée & RGPD
            </Link>
            <Link href="/mentions-legales" className="hover:text-primaire transition-colors">
              Mentions légales
            </Link>
            <Link href="/admin/connexion" className="text-encre-subtile hover:text-encre transition-colors">
              Espace Admin
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-bordure/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-encre-subtile gap-3">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-paix" />
            <span>Données confidentielles chiffrées · Confidentialité garantie</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} Ma boîte à prière · Tous droits réservés</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
