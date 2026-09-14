export const COLORS = {
  light: {
    background: '#FBF8F3', // Crème chaud
    surface: '#FFFFFF',
    surfaceSubtle: '#F4EFE6',
    ink: '#1C2541', // Bleu nuit profond
    inkMuted: '#55607A',
    inkSubtle: '#8C96AB',
    primary: '#2F4A78', // Bleu confiance
    primaryHover: '#23385C',
    primaryLight: '#EBF0F8',
    lightGold: '#E8A33D', // Ambre doré (espérance, exaucé)
    lightGoldSubtle: '#FDF6EC',
    peace: '#6FA287', // Vert sauge (validations, sérénité)
    peaceSubtle: '#F0F7F3',
    border: '#EAE3D8',
    borderStrong: '#D6CBBF',
    danger: '#C85250',
    dangerSubtle: '#FDF2F2',
  },
  dark: {
    background: '#121826', // Bleu nuit très sombre
    surface: '#1C2541', // Carte sombre
    surfaceSubtle: '#222F52',
    ink: '#FBF8F3', // Texte clair
    inkMuted: '#9DA9C3',
    inkSubtle: '#6B7A99',
    primary: '#4D6EA8',
    primaryHover: '#5B7FB9',
    primaryLight: '#233252',
    lightGold: '#F3B556',
    lightGoldSubtle: '#332717',
    peace: '#7FB899',
    peaceSubtle: '#1C3127',
    border: '#2A3656',
    borderStrong: '#3A4B75',
    danger: '#E57373',
    dangerSubtle: '#3B1F20',
  },
} as const;

export const CATEGORIES = [
  { id: 'sante', label: 'Santé & Guérison', icon: 'heart-pulse' },
  { id: 'famille', label: 'Famille & Foyer', icon: 'home-heart' },
  { id: 'travail', label: 'Travail & Études', icon: 'briefcase-outline' },
  { id: 'foi', label: 'Croissance spirituelle', icon: 'book-cross' },
  { id: 'reconnaissance', label: 'Action de grâce', icon: 'sparkles' },
  { id: 'autre', label: 'Autre sujet', icon: 'hand-heart' },
] as const;

export const THEME_CONFIG = {
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  animation: {
    durationNormal: 250,
    durationSlow: 450,
  },
};
