/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "../../libs/shared/ui/src/**/*.{html,ts}",
  ],
  presets: [
    require('../../libs/shared/ui/tailwind.preset.js'),
  ],
  plugins: [],
}
