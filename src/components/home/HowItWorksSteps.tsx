'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface StepItem {
  number: number;
  numberBg: string;
  numberColor: string;
  title: string;
  description: React.ReactNode;
  direction: 'left' | 'right';
}

const STEPS: StepItem[] = [
  {
    number: 1,
    numberBg: 'bg-primaire/10',
    numberColor: 'text-primaire',
    title: 'Tu écris',
    description:
      'Confie tes besoins, tes épreuves ou tes actions de grâce en moins de 45 secondes, sans créer de compte.',
    direction: 'left', // Glisse depuis la gauche
  },
  {
    number: 2,
    numberBg: 'bg-lumiere/15',
    numberColor: 'text-lumiere',
    title: 'Tu choisis',
    description: (
      <>
        🔒 <strong>Privé</strong> (chiffré et visible uniquement par l'équipe pastorale) ou 🌍{' '}
        <strong>Public</strong> pour être porté par l'intercession de tous.
      </>
    ),
    direction: 'right', // Glisse depuis la droite (alternance)
  },
  {
    number: 3,
    numberBg: 'bg-paix/15',
    numberColor: 'text-paix',
    title: 'La communauté prie',
    description:
      'Des frères et sœurs intercèdent fidèlement pour toi. Tu conserves un lien privé pour suivre le soutien reçu et partager ton exaucement.',
    direction: 'left', // Glisse depuis la gauche (alternance)
  },
];

export function HowItWorksSteps() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="space-y-6 overflow-hidden">
      <div className="text-center">
        <h2 className="font-serif text-2xl font-bold text-encre">Comment ça marche ?</h2>
        <p className="text-xs sm:text-sm text-encre-douce mt-1">Simple, gratuit et sans friction.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STEPS.map(step => {
          // Alternance : gauche (-70px) ou droite (+70px)
          const initialX = step.direction === 'left' ? -70 : 70;

          return (
            <motion.div
              key={step.number}
              initial={
                shouldReduceMotion
                  ? { opacity: 1, x: 0 }
                  : { opacity: 0, x: initialX }
              }
              whileInView={
                shouldReduceMotion
                  ? { opacity: 1, x: 0 }
                  : { opacity: 1, x: 0 }
              }
              viewport={{
                once: true,
                margin: '-35% 0px',
              }}
              transition={{
                duration: 0.65,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="bg-surface/80 dark:bg-surface/70 backdrop-blur-md border border-bordure/90 rounded-2xl p-5 shadow-xs space-y-2 hover:border-primaire/30 hover:shadow-md transition-all duration-300"
            >
              <div
                className={`w-9 h-9 rounded-full ${step.numberBg} ${step.numberColor} flex items-center justify-center font-bold text-sm`}
              >
                {step.number}
              </div>
              <h3 className="font-bold text-sm text-encre">{step.title}</h3>
              <p className="text-xs text-encre-douce leading-relaxed">{step.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
