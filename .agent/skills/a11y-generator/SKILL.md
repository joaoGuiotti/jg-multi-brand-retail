---
name: a11y-generator
description: >-
  Use esta skill sempre que componentes Angular de UI (Presenters, templates HTML, SCSS)
  estiverem sendo criados, avaliados ou refatorados. Garante acessibilidade nativa WCAG 2.1/2.2
  Nível AA/AAA, navegação por teclado e conformidade WAI-ARIA em todo componente visual.
---

# ♿ A11y Component Generator Skill

Garantir que todo componente Angular (v21+) nasça com acessibilidade nativa completa (WCAG 2.1/2.2 Nível AA/AAA e conformidade W3C WAI-ARIA), navegabilidade universal por teclado e consumo estrito de Design Tokens do sistema.

## Diretrizes de Acessibilidade (Obrigatórias)

### 1. HTML Semântico em Primeiro Lugar
- **Nunca use `<div>` ou `<span>`** se existir uma tag HTML5 semântica equivalente (`<button>`, `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, `<article>`, `<fieldset>`, `<legend>`).
- Elementos clicáveis que executam ações devem SEMPRE ser `<button type="button">` ou `<button type="submit">`.
- Links de navegação entre rotas/páginas devem SEMPRE ser `<a href="...">` ou `<a [routerLink]="...">`. Nunca use botões para links nem links para botões.

### 2. Formulários e Inputs
- Todo `<input>`, `<select>` ou `<textarea>` **DEVE ter um `<label>` explicitamente associado** através de `for="id"` / `[id]="id"` nativo ou via `aria-labelledby` / `aria-label`.
- Mensagens de erro e textos de ajuda devem ser associados aos campos de formulário via `aria-describedby="error-id help-id"`.
- Campos com erro de validação devem conter `[attr.aria-invalid]="hasError()"`.
- Campos obrigatórios devem declarar `required` e `aria-required="true"`.

### 3. Marcações WAI-ARIA
- Use atributos ARIA corretos quando a semântica nativa não for suficiente:
  - Alertas dinâmicos e feedbacks de status: `role="status"` ou `role="alert"` com `aria-live="polite"` ou `aria-live="assertive"`.
  - Botões de alternância ou expansão: `aria-expanded="isOpen()"`, `aria-controls="panel-id"`.
  - Elementos puramente decorativos (ícones visuais): `aria-hidden="true"`.
  - Modais e Diálogos: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="dialog-title-id"`.

### 4. Navegação por Teclado e Foco
- Todos os elementos interativos devem ser navegáveis via teclado (`Tab` e `Shift+Tab`).
- Ações devem responder a `Enter` e/ou `Space`.
- Diálogos, gavetas (drawers) e modais devem implementar **Focus Trap** e fechar com a tecla `Escape`.
- **Nunca remova o outline de foco** sem fornecer uma alternativa visível de alto contraste usando `:focus-visible` no SCSS.

### 5. Estilização Restrita & Tokens de Design (SCSS)
- O arquivo `.scss` do componente **NÃO DEVE** conter valores absolutos hardcoded de cor (ex: `#FFFFFF`, `rgba(...)`) ou espaçamentos/raios arbitrários.
- OBRIGATÓRIO consumir variáveis globais do Design System com a sintaxe:
  ```scss
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  ```
- Garanta contraste mínimo de texto (4.5:1 para texto normal, 3:1 para texto grande) conforme WCAG AA.

## Formato de Saída para Componentes Angular
Sempre que gerar um componente visual acessível, forneça:
1. **TypeScript (`*.component.ts`)**: Standalone Component, `ChangeDetectionStrategy.OnPush`, usando `input()`, `output()` e Signals reativos.
2. **HTML Template (`*.component.html`)**: HTML 100% semântico com marcações WAI-ARIA, suporte a teclado e `aria-live` quando necessário.
3. **SCSS (`*.component.scss`)**: Estilização consumindo estritamente `var(--...)`, com suporte obrigatório a `:focus-visible` e estados interativos (`:hover`, `:active`, `:disabled`).
