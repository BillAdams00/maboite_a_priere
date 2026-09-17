import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fond: '#FBF8F3',
        surface: '#FFFFFF',
        'surface-subtle': '#F4EFE6',
        encre: '#1C2541',
        'encre-douce': '#55607A',
        'encre-subtile': '#8C96AB',
        primaire: {
          DEFAULT: '#2F4A78',
          hover: '#23385C',
          light: '#EBF0F8',
        },
        lumiere: {
          DEFAULT: '#E8A33D',
          subtle: '#FDF6EC',
        },
        paix: {
          DEFAULT: '#6FA287',
          subtle: '#F0F7F3',
        },
        bordure: {
          DEFAULT: '#EAE3D8',
          strong: '#D6CBBF',
        },
        danger: {
          DEFAULT: '#C85250',
          subtle: '#FDF2F2',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
