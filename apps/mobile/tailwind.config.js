/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: '#FBF8F3',
        surface: '#FFFFFF',
        'surface-subtle': '#F4EFE6',
        ink: '#1C2541',
        'ink-muted': '#55607A',
        'ink-subtle': '#8C96AB',
        primary: {
          DEFAULT: '#2F4A78',
          hover: '#23385C',
          light: '#EBF0F8',
        },
        gold: {
          DEFAULT: '#E8A33D',
          light: '#FDF6EC',
        },
        peace: {
          DEFAULT: '#6FA287',
          light: '#F0F7F3',
        },
        border: {
          DEFAULT: '#EAE3D8',
          strong: '#D6CBBF',
        },
        danger: {
          DEFAULT: '#C85250',
          light: '#FDF2F2',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
