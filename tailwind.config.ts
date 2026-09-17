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
        fond: 'rgb(var(--fond-rgb) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface-rgb) / <alpha-value>)',
          subtle: 'rgb(var(--surface-subtle-rgb) / <alpha-value>)',
        },
        encre: {
          DEFAULT: 'rgb(var(--encre-rgb) / <alpha-value>)',
          douce: 'rgb(var(--encre-douce-rgb) / <alpha-value>)',
          subtile: 'rgb(var(--encre-subtile-rgb) / <alpha-value>)',
        },
        primaire: {
          DEFAULT: 'rgb(var(--primaire-rgb) / <alpha-value>)',
          hover: 'rgb(var(--primaire-hover-rgb) / <alpha-value>)',
          light: 'rgb(var(--primaire-light-rgb) / <alpha-value>)',
        },
        lumiere: {
          DEFAULT: 'rgb(var(--lumiere-rgb) / <alpha-value>)',
          subtle: 'rgb(var(--lumiere-subtle-rgb) / <alpha-value>)',
        },
        paix: {
          DEFAULT: 'rgb(var(--paix-rgb) / <alpha-value>)',
          subtle: 'rgb(var(--paix-subtle-rgb) / <alpha-value>)',
        },
        bordure: {
          DEFAULT: 'rgb(var(--bordure-rgb) / <alpha-value>)',
          strong: 'rgb(var(--bordure-strong-rgb) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger-rgb) / <alpha-value>)',
          subtle: 'rgb(var(--danger-subtle-rgb) / <alpha-value>)',
        },
        glow: {
          or: 'var(--glow-or)',
          bleu: 'var(--glow-bleu)',
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
