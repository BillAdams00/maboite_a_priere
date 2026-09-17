import Link from 'next/link';
import { ArrowLeft, Heart } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-primaire/10 text-primaire flex items-center justify-center mx-auto">
        <Heart size={28} className="fill-current" />
      </div>
      <h1 className="font-serif text-3xl font-bold text-encre">Page introuvable</h1>
      <p className="text-xs sm:text-sm text-encre-douce leading-relaxed">
        Le sujet ou la page demandée n'existe pas ou a peut-être été retiré.
      </p>
      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primaire text-white font-bold text-xs hover:bg-primaire-hover transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Retourner à l'accueil</span>
        </Link>
      </div>
    </div>
  );
}
