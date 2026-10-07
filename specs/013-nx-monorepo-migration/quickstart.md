# Quickstart: Trabalhando com o Monorepo Nx

**Feature**: `013-nx-monorepo-migration`  
**Data**: 2026-10-07

## 1. Comandos Frequentes de Desenvolvimento

### Iniciar Aplicações
```bash
# Iniciar backend e frontend simultaneamente
npm start

# Iniciar apenas o backend
npx nx serve backend
# ou
npm run dev:backend

# Iniciar apenas o frontend
npx nx serve frontend
# ou
npm run dev:frontend
```

### Compilar Projetos
```bash
# Compilar todos os projetos
npx nx run-many -t build

# Compilar apenas o backend
npx nx build backend

# Compilar apenas o frontend
npx nx build frontend
```

### Testes e Lint
```bash
# Rodar testes em todos os projetos
npx nx run-many -t test

# Rodar linter em todos os projetos
npx nx run-many -t lint

# Rodar testes apenas nos projetos afetados pela branch atual
npx nx affected -t test
```

### Visualizar Grafo de Dependências
```bash
npx nx graph
```

---

## 2. Consumindo Componentes de `libs/ui` no Frontend

Para utilizar componentes da biblioteca no frontend, mantenha as importações padronizadas:

```typescript
import { UiButtonComponent, UiModalComponent } from '@shared/ui';
```

Nenhuma importação relativa longa (como `../../shared/ui/...`) deve ser utilizada.
