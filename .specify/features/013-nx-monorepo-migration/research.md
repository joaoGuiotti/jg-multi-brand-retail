# Research: Migração do Repositório para Nx Monorepo

**Feature**: `013-nx-monorepo-migration`  
**Data**: 2026-10-07  
**Status**: Concluído

## 1. Arquitetura do Workspace Nx

### Decisão
Configurar o repositório como um monorepo gerenciado por **Nx** moderno, adicionando `nx` no `package.json` raiz, gerando o `nx.json` e definindo configurações explícitas com `project.json` para cada projeto (`apps/frontend`, `apps/backend` e `libs/ui`).

### Justificativa
- Os arquivos `project.json` fornecem controle declarativo, isolamento e transparência total sobre os targets (`build`, `test`, `lint`, `serve`, `prisma:*`).
- Permite configurar caching inteligente com `inputs` e `outputs`, além de habilitar comandos unificados como `npx nx run-many -t build test lint` e `npx nx affected`.
- Evita sobrescrever ou quebrar scripts customizados que já funcionam (Angular 22 com Vitest e Playwright no frontend, NestJS com Prisma e Jest no backend).

### Alternativas Avaliadas
- **Executores complexos `@nx/angular` e `@nx/nest` adicionados via migração invasiva**: Descartado devido ao risco de sobrescrever configs sensíveis do Vitest 4 e NestJS 11 já homologadas. Utilizar targets com comandos delegados ou executores leves garante 100% de retrocompatibilidade.
- **Apenas NPM Workspaces sem Nx**: Descartado porque não atende ao requisito explícito de migrar para Nx nem oferece caching de build/testes.

---

## 2. Extração da Biblioteca de UI (`libs/ui`)

### Decisão
Criar o diretório `libs/ui/` no monorepo e mover o conteúdo de `apps/frontend/src/app/shared/ui` para `libs/ui/src/`. Configurar o `tsconfig.base.json` raiz para mapear `@shared/ui` para `libs/ui/src/index.ts` e `@shared/ui/*` para `libs/ui/src/*`.

### Justificativa
- A aplicação `apps/frontend` já utiliza intensamente o path alias `@shared/ui` em mais de 50 componentes e páginas.
- Manter o alias `@shared/ui` no `tsconfig.base.json` garante que o frontend continue compilando sem exigir alterações manuais em dezenas de imports nos componentes.
- A biblioteca passa a ter seu próprio `project.json` com targets próprios de lint, formatação ou build se necessário.

### Alternativas Avaliadas
- **Renomear o alias para `@retail/ui` imediatamente**: Exigiria refatorar mais de 50 arquivos na aplicação frontend de uma vez só, aumentando riscos de merge e erros tipográficos. A melhor estratégia é mapear `@shared/ui` para a lib (e adicionar alias `@retail/ui` como opcional).

---

## 3. Integração do Backend NestJS no Grafo Nx

### Decisão
Configurar `apps/backend/project.json` expondo os targets essenciais: `build`, `start`, `start:dev`, `lint`, `test`, `test:cov`, `prisma:generate`, `prisma:migrate`, `prisma:seed`.

### Justificativa
- O backend mantém sua autonomia para execução local e scripts Prisma, mas ganha visibilidade completa no grafo de dependências do Nx (`nx graph`).
- Permite orquestrar paralelamente `nx run-many -t build` para compilar backend e frontend simultaneamente.

---

## 4. Compatibilidade com Docker e Docker Compose

### Decisão
Ajustar o `context` e Dockerfile do frontend ou estruturar a cópia de `libs/ui` durante o build do container.

### Justificativa
- No build de produção Docker (`docker-compose.prod.yml`), o frontend precisará de acesso aos arquivos de `libs/ui` durante `npm run build`.
- Ajustar o contexto do Dockerfile do frontend para permitir acesso à pasta `libs/ui` garante que `docker compose -f docker-compose.prod.yml build` execute sem interrupções.

---

## 5. Estratégia de CI (`.github/workflows/ci.yml`)

### Decisão
Refatorar os jobs do GitHub Actions para:
1. Instalar as dependências do monorepo na raiz.
2. Utilizar comandos do Nx (`npx nx run backend:test`, `npx nx run frontend:test`, `npx nx run-many -t build`) ou `npx nx affected`.
3. Habilitar cache do Nx no CI para acelerar execuções subsequentes.
4. Preservar intactos os passos de smoke test com Docker Compose e publicação da imagem de migração no GHCR.

---

## 6. Governança por Etapas (Regra Obrigatória)

### Decisão
Dividir todo o processo de implementação em 5 etapas discretas e sequenciais:
1. **Etapa 1**: Instalação e Inicialização do Nx Workspace raiz (`nx.json`, `package.json`, `tsconfig.base.json`).
2. **Etapa 2**: Configuração de `apps/backend` como projeto Nx (`project.json`).
3. **Etapa 3**: Extração e configuração de `libs/ui` e desacoplamento do `apps/frontend` (`project.json`, imports, tailwind preset).
4. **Etapa 4**: Testes e validação local de build/execução dos apps e libs (`nx run-many -t build, test, lint`).
5. **Etapa 5**: Atualização do CI no GitHub Actions (`.github/workflows/ci.yml`) e validação de Docker.

**Para cada etapa concluída, a execução DEVE parar e solicitar confirmação explícita do usuário para prosseguir.**
