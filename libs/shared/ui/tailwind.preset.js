/**
 * Tailwind CSS Preset — @shared/ui
 *
 * Use this in any app's tailwind.config.js:
 *   presets: [require('../../libs/shared/ui/tailwind.preset.js')]
 *
 * The preset maps Tailwind class names to the CSS custom properties
 * defined in design-tokens.css, so the same classes work in any theme.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
    theme: {
        extend: {
            colors: {
                // ── Brand ──────────────────────────────────────────
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    hover: 'var(--color-primary-hover)',
                    light: 'var(--color-primary-light)',
                },

                // ── Surfaces (backgrounds) ──────────────────────────
                surface: {
                    DEFAULT: 'var(--color-bg-primary)',
                    secondary: 'var(--color-bg-secondary)',
                    tertiary: 'var(--color-bg-tertiary)',
                    hover: 'var(--color-bg-hover)',
                },

                // ── Typography ──────────────────────────────────────
                content: {
                    DEFAULT: 'var(--color-text-primary)',
                    secondary: 'var(--color-text-secondary)',
                    tertiary: 'var(--color-text-tertiary)',
                    inverse: 'var(--color-text-inverse)',
                },

                // ── Borders ─────────────────────────────────────────
                outline: {
                    DEFAULT: 'var(--color-border)',
                    hover: 'var(--color-border-hover)',
                },

                // ── Status ──────────────────────────────────────────
                success: {
                    DEFAULT: 'var(--color-success)',
                    bg: 'var(--color-success-bg)',
                },
                warning: {
                    DEFAULT: 'var(--color-warning)',
                    bg: 'var(--color-warning-bg)',
                },
                error: {
                    DEFAULT: 'var(--color-error)',
                    bg: 'var(--color-error-bg)',
                },
                info: {
                    DEFAULT: 'var(--color-info)',
                    bg: 'var(--color-info-bg)',
                },
            },

            // ── Shadows ────────────────────────────────────────────
            boxShadow: {
                sm: 'var(--shadow-sm)',
                DEFAULT: 'var(--shadow-md)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
            },

            // ── Transitions ────────────────────────────────────────
            transitionDuration: {
                fast: 'var(--transition-fast)',
                base: 'var(--transition-base)',
                slow: 'var(--transition-slow)',
            },

            // ── Typography ─────────────────────────────────────────
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },

            // ── Border Radius ──────────────────────────────────────
            borderRadius: {
                sm: 'var(--radius-sm)',
                md: 'var(--radius-md)',
                lg: 'var(--radius-lg)',
                xl: 'var(--radius-xl)',
                full: 'var(--radius-full)',
            },
        },
    },
    plugins: [],
};
