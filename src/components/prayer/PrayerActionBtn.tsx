'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { prayAction } from '../../server/actions/prayer.actions';
import { useLivePrayerCount } from './useLivePrayerCount';
import { Heart, Check } from 'lucide-react';

interface PrayerActionBtnProps {
  publicSlug: string;
  initialCount: number;
}

// 6 particules discrètes en cercle
const PARTICLES = [
  { id: 1, angle: 0, distance: 22 },
  { id: 2, angle: 60, distance: 24 },
  { id: 3, angle: 120, distance: 22 },
  { id: 4, angle: 180, distance: 25 },
  { id: 5, angle: 240, distance: 23 },
  { id: 6, angle: 300, distance: 24 },
];

export function PrayerActionBtn({ publicSlug, initialCount }: PrayerActionBtnProps) {
  const { count, setCount } = useLivePrayerCount(publicSlug, initialCount);
  const [hasPrayed, setHasPrayed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handlePray = async () => {
    if (isLoading || hasPrayed) return;

    setIsLoading(true);

    // Retour haptique doux sur mobile
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(22);
      } catch {}
    }

    // Déclenchement des particules visuelles discrètes
    if (!shouldReduceMotion) {
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 700);
    }

    // Enregistrement de la date pour le suivi de fidélité positive (sans compte)
    try {
      const today = new Date().toISOString().slice(0, 10);
      const existing: string[] = JSON.parse(localStorage.getItem('mbap_prayer_days') || '[]');
      if (!existing.includes(today)) {
        existing.unshift(today);
        localStorage.setItem('mbap_prayer_days', JSON.stringify(existing.slice(0, 30)));
      }
    } catch {}

    // Mise à jour optimiste
    setCount(prev => prev + 1);
    setHasPrayed(true);

    try {
      const res = await prayAction(publicSlug);
      if (res.success && res.data) {
        setCount(res.data.prayerCount);
        setHasPrayed(true);
      } else {
        console.warn('Erreur prière :', res.error);
      }
    } catch (err) {
      console.error('Erreur :', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Particules / Éclat lumineux discret (Framer Motion) */}
      <AnimatePresence>
        {showParticles && !shouldReduceMotion && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {PARTICLES.map(p => {
              const rad = (p.angle * Math.PI) / 180;
              const targetX = Math.cos(rad) * p.distance;
              const targetY = Math.sin(rad) * p.distance;
              return (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [1, 0.9, 0],
                    scale: [0, 1.3, 0.4],
                    x: targetX,
                    y: targetY,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                  className="absolute w-1.5 h-1.5 rounded-full bg-lumiere shadow-xs"
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <button
        onClick={handlePray}
        disabled={isLoading || hasPrayed}
        className={`relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 active:scale-95 ${
          hasPrayed
            ? 'bg-paix/15 text-paix border border-paix/30 cursor-default'
            : 'bg-primaire/10 text-primaire hover:bg-primaire hover:text-white border border-primaire/20'
        }`}
      >
        {hasPrayed ? (
          <motion.span
            initial={shouldReduceMotion ? false : { scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-1.5"
          >
            <Check size={16} className="text-paix" />
            <span>J'ai prié</span>
          </motion.span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <Heart size={16} className={isLoading ? 'animate-pulse' : ''} />
            <span>Je prie pour toi</span>
          </span>
        )}

        {/* Compteur animé avec transition douce */}
        <span className="font-mono text-xs font-semibold px-1 rounded bg-black/5 dark:bg-white/10">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={count}
              initial={shouldReduceMotion ? false : { y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { y: 8, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="inline-block"
            >
              {count}
            </motion.span>
          </AnimatePresence>
        </span>
      </button>
    </div>
  );
}
