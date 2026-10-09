---
name: design-tokens-generator
description: >-
  Use esta skill sempre que tokens de design, variáveis de tema, arquivos de
  estilização global SCSS ou temas (Dark/Light mode) estiverem sendo criados ou
  modificados. Converte requisitos visuais em um sistema de Tokens de Design em
  SCSS nativo com nomenclatura semântica e suporte a temas.
---

# 🎨 Design System & Tokens Generator Skill

Converter requisitos visuais, briefings de branding ou especificações de UI em um sistema robusto de Tokens de Design em SCSS nativo, preparado para alta escalabilidade e alternância de temas.

## Diretrizes Técnicas

### 1. Nomenclatura Semântica
- Não use nomes atrelados a cores fixas (ex: nunca use `--color-blue` ou `--color-gray-100` diretamente nos componentes).
- Adote nomes semânticos atrelados à função e intenção:
  - Cores: `--color-primary`, `--color-primary-hover`, `--color-surface`, `--color-background`, `--color-text-primary`, `--color-error`.
  - Espaçamentos: `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`.
  - Tipografia: `--font-size-sm`, `--font-size-md`, `--font-size-lg`, `--font-weight-bold`.
  - Bordas e Raios: `--radius-sm`, `--radius-md`, `--radius-full`.
  - Sombras: `--shadow-sm`, `--shadow-md`, `--shadow-lg`.

### 2. Estrutura de Temas e Suporte a :root
- Declare as variáveis principais dentro do seletor `:root`.
- Para suporte a Dark Mode / Temas dinâmicos, forneça variações sob `[data-theme="dark"]` ou `@media (prefers-color-scheme: dark)`.

### 3. Formato de Saída
- Código SCSS puro e válido.
- Organize em seções claras: Paleta de Cores Semânticas, Tipografia, Espaçamentos, Sombras, Transições e Raios de Borda.
