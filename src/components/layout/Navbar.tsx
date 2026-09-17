import Link from 'next/link';
import { Heart, PlusCircle, Users, Sparkles } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-fond/90 backdrop-blur-md border-b border-bordure">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-full bg-primaire/10 flex items-center justify-center text-primaire group-hover:bg-primaire group-hover:text-white transition-colors duration-200">
            <Heart size={20} className="fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg text-encre tracking-tight leading-none">
              Ma boîte à prière
            </span>
            <span className="text-[11px] text-encre-douce font-sans">
              Intercéder les uns pour les autres
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3 text-sm font-medium">
          <Link
            href="/communaute"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-encre-douce hover:text-encre hover:bg-surface transition-colors"
          >
            <Users size={17} />
            <span className="hidden sm:inline">Communauté</span>
          </Link>

          <Link
            href="/exauces"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-encre-douce hover:text-encre hover:bg-surface transition-colors"
          >
            <Sparkles size={17} className="text-lumiere" />
            <span className="hidden sm:inline">Exaucés</span>
          </Link>

          <Link
            href="/deposer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primaire text-white hover:bg-primaire-hover shadow-sm transition-all duration-150 active:scale-[0.98]"
          >
            <PlusCircle size={17} />
            <span>Déposer</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
