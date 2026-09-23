'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { BookOpen, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export interface BibleVerse {
  id: string;
  reference: string;
  text: string;
  theme: string;
}

export const FLOATING_VERSES: BibleVerse[] = [
  {
    id: 'matthieu-18-19',
    reference: 'Matthieu 18:19 (LSG)',
    theme: 'Accord dans la prière',
    text: '« Je vous dis encore que, si deux d’entre vous s’accordent sur la terre pour demander une chose quelconque, elle leur sera accordée par mon Père qui est dans les cieux. »',
  },
  {
    id: 'philippiens-4-6-7',
    reference: 'Philippiens 4:6-7 (LSG)',
    theme: 'Paix de Dieu',
    text: '« Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces. Et la paix de Dieu gardera vos cœurs. »',
  },
  {
    id: '1-thessaloniciens-5-17',
    reference: '1 Thessaloniciens 5:16-18 (LSG)',
    theme: 'Prière continuelle',
    text: '« Soyez toujours joyeux. Priez sans cesse. Rendez grâces en toutes choses, car c’est à votre égard la volonté de Dieu en Jésus-Christ. »',
  },
  {
    id: 'psaume-34-18',
    reference: 'Psaume 34:18 (LSG)',
    theme: 'Consolation divine',
    text: '« L’Éternel est près de ceux qui ont le cœur brisé, et il sauve ceux qui ont l’esprit dans l’abattement. »',
  },
  {
    id: 'jean-14-27',
    reference: 'Jean 14:27 (LSG)',
    theme: 'Espérance & Paix',
    text: '« Je vous laisse la paix, je vous donne ma paix. Que votre cœur ne se trouble point, et ne s’alarme point. »',
  },
];

export function FloatingVerseCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Rotation douce toutes les 7 secondes si non survolé et motion autorisé
  useEffect(() => {
    if (isPaused || shouldReduceMotion) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % FLOATING_VERSES.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [isPaused, shouldReduceMotion]);

  const verse = FLOATING_VERSES[currentIndex];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + FLOATING_VERSES.length) % FLOATING_VERSES.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % FLOATING_VERSES.length);
  };

  return (
    <div
      className="relative max-w-2xl mx-auto my-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Halos lumineux d'ambiance lents en pur CSS (aucun re-render JS) */}
      <div
        aria-hidden="true"
        className="absolute -top-6 -left-8 w-48 h-48 rounded-full bg-glow-or/40 blur-3xl pointer-events-none animate-halo-or"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-6 -right-8 w-52 h-52 rounded-full bg-glow-bleu/45 blur-3xl pointer-events-none animate-halo-bleu"
      />

      {/* Badge flottant façon tooltip Apple en verre dépoli avec oscillation douce */}
      <div
        className={`absolute -top-3.5 left-6 z-20 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold text-primaire dark:text-lumiere bg-surface/85 dark:bg-surface/75 backdrop-blur-md border border-bordure/90 shadow-xs pointer-events-none select-none ${
          shouldReduceMotion ? '' : 'animate-float'
        }`}
      >
        <Sparkles size={12} className="text-lumiere fill-current" />
        <span>Parole vivante</span>
      </div>

      {/* Boîtier principal du verset */}
      <section className="relative z-10 bg-surface/90 dark:bg-surface/80 backdrop-blur-md border border-bordure rounded-2xl p-6 sm:p-7 shadow-sm transition-colors duration-300 min-h-[175px] flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-lumiere">
            <BookOpen size={17} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {verse.theme}
            </span>
          </div>

          {/* Navigation manuelle discrète */}
          <div className="flex items-center gap-1 text-encre-douce">
            <button
              onClick={handlePrev}
              className="p-1 rounded-lg hover:bg-fond hover:text-encre transition-colors"
              aria-label="Verset précédent"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[11px] font-mono px-1">
              {currentIndex + 1}/{FLOATING_VERSES.length}
            </span>
            <button
              onClick={handleNext}
              className="p-1 rounded-lg hover:bg-fond hover:text-encre transition-colors"
              aria-label="Verset suivant"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Texte du verset en transition douce */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={verse.id}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <blockquote className="font-serif italic text-base sm:text-lg text-encre leading-relaxed">
                {verse.text}
              </blockquote>
              <p className="text-right text-xs font-bold text-encre-douce mt-3">
                {verse.reference}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicateurs de progression en points */}
        <div className="flex items-center justify-center gap-1.5 mt-3 pt-2 border-t border-bordure/40">
          {FLOATING_VERSES.map((v, i) => (
            <button
              key={v.id}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-6 bg-primaire'
                  : 'w-1.5 bg-bordure-strong/60 hover:bg-encre-douce'
              }`}
              aria-label={`Afficher le verset ${i + 1} : ${v.reference}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
