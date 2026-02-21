
import { effect, inject, Injectable, Renderer2, RendererFactory2, signal, DOCUMENT } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly THEME_KEY = 'app-theme';
    private currentTheme = signal<Theme>('light');

    private document = inject(DOCUMENT);
    private rendererFactory = inject(RendererFactory2);
    private renderer: Renderer2;
    private themeStyleElement: HTMLLinkElement | null = null;

    // Public readonly signal
    theme = this.currentTheme.asReadonly();

    constructor() {
        this.renderer = this.rendererFactory.createRenderer(null, null);
        this.setupThemeEffect();

        // Effect to inject stylesheet when theme changes
        effect(() => {
            this.injectThemeStylesheet(this.currentTheme());
        });
    }

    /**
     * Initialize theme from localStorage or system preference
     */
    public initializeTheme(): void {
        const savedTheme = this.getSavedTheme();
        const systemTheme = this.getSystemTheme();
        const initialTheme = savedTheme || systemTheme;

        this.setTheme(initialTheme, false);
    }

    /**
     * Setup effect to listen for system theme changes
     */
    private setupThemeEffect(): void {
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            // Only apply system theme if user hasn't set a preference
            if (!this.getSavedTheme()) {
                this.setTheme(e.matches ? 'dark' : 'light', false);
            }
        });
    }

    /**
     * Get saved theme from localStorage
     */
    private getSavedTheme(): Theme | null {
        const saved = localStorage.getItem(this.THEME_KEY);
        return saved === 'light' || saved === 'dark' ? saved : null;
    }

    /**
     * Get system theme preference
     */
    private getSystemTheme(): Theme {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    }

    /**
     * Inject theme stylesheet dynamically
     */
    private injectThemeStylesheet(theme: Theme): void {
        // Remove existing theme stylesheet if it exists
        if (this.themeStyleElement) {
            this.renderer.removeChild(this.document.head, this.themeStyleElement);
            this.themeStyleElement = null;
        }

        // Create new link element for theme stylesheet
        const link = this.renderer.createElement('link') as HTMLLinkElement;
        this.renderer.setAttribute(link, 'rel', 'stylesheet');
        this.renderer.setAttribute(link, 'type', 'text/css');
        this.renderer.setAttribute(link, 'href', `styles/themes/${theme}-theme.css`);
        this.renderer.setAttribute(link, 'data-theme-stylesheet', theme);

        // Append to head
        this.renderer.appendChild(this.document.head, link);
        this.themeStyleElement = link;
    }

    /**
     * Set theme and update DOM
     */
    setTheme(theme: Theme, saveToStorage = true): void {
        // Add transitioning class to prevent flash
        this.document.documentElement.classList.add('theme-transitioning');

        // Update theme
        this.currentTheme.set(theme);
        this.document.documentElement.setAttribute('data-theme', theme);

        // Save to localStorage if requested
        if (saveToStorage) {
            localStorage.setItem(this.THEME_KEY, theme);
        }

        // Remove transitioning class after a short delay
        setTimeout(() => {
            this.document.documentElement.classList.remove('theme-transitioning');
        }, 50);
    }

    /**
     * Toggle between light and dark theme
     */
    toggleTheme(saveToStorage = true): void {
        const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme, saveToStorage);
    }

    /**
     * Check if current theme is dark
     */
    isDark(): boolean {
        return this.currentTheme() === 'dark';
    }

    /**
     * Check if current theme is light
     */
    isLight(): boolean {
        return this.currentTheme() === 'light';
    }

    /**
     * Clear saved theme preference (will use system preference)
     */
    clearThemePreference(): void {
        localStorage.removeItem(this.THEME_KEY);
        const systemTheme = this.getSystemTheme();
        this.setTheme(systemTheme, false);
    }
}
