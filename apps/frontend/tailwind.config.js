/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}', '../../libs/ui/src/**/*.{html,ts}'],
  presets: [require('../../libs/ui/src/tailwind.preset.js')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--tenant-primary-color)',
          accent: 'var(--tenant-accent-color)',
        },
      },
    },
  },
  plugins: [],
};
