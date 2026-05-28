/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./src/app/shared/ui/**/*.{html,ts}",
  ],
  presets: [
    require('./src/app/shared/ui/tailwind.preset.js'),
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--tenant-primary-color)',
          accent: 'var(--tenant-accent-color)',
        }
      }
    }
  },
  plugins: [],
}
