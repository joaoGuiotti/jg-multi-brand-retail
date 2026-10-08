# Implementation Plan: Migração do Repositório para Nx Monorepo

**Branch**: `013-nx-monorepo-migration` | **Date**: 2026-10-07 | **Spec**: [spec.md](file:///c:/DEV/github/antigravity-test-app-01/specs/013-nx-monorepo-migration/spec.md)
**Input**: Feature specification from `specs/013-nx-monorepo-migration/spec.md`

## Summary

Migrar o repositório para um monorepo gerenciado pelo Nx, organizando os projetos executáveis em `apps/` (`frontend` e `backend`) e os pacotes compartilhados em `libs/` (`ui` em Angular, desacoplada de `apps/frontend/src/app/shared/ui`). Configurar `nx.json`, `project.json` para cada projeto, atualizar mapeamento de paths TypeScript (`@shared/ui`), atualizar scripts Docker e reestruturar o pipeline do GitHub Actions (`.github/workflows/ci.yml`) com execução otimizada e cache do Nx. Toda a execução será conduzida estritamente com paradas para confirmação a cada etapa.

## Technical Context

**Language/Version**: TypeScript 5.7+ / Node.js 20+ (Node 24 Alpine em containers)  
**Primary Dependencies**: Nx 23+, Angular 22, NestJS 11, Prisma 7, Tailwind CSS 3.4  
**Storage**: PostgreSQL 15 (Docker), Redis 7  
**Testing**: Vitest 4 + Playwright (frontend), Jest 30 (backend)  
**Target Platform**: Node.js runtime / Nginx (frontend SPA) / Linux Docker  
**Project Type**: Monorepo (Web SPA + REST/WebSocket API + Shared UI Library)  
**Performance Goals**: Builds e testes em CI com tempo reduzido através de cache inteligente e `nx affected`  
**Constraints**: Zero quebras de rotas ou regressões funcionais; retrocompatibilidade com scripts Docker e Docker Compose existentes  
**Scale/Scope**: 2 aplicações (`frontend`, `backend`), 1 biblioteca (`libs/ui`), pipeline de CI completo  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Princípio I: Multi-Tenancy First**: PASS. A migração é estritamente infraestrutural/arquitetural. O isolamento de tenant existente no NestJS e no frontend permanece 100% inalterado.
- **Princípio II: RBAC Everywhere**: PASS. Os guards de rota do backend e do frontend permanecem preservados.
- **Princípio III: Type-Safety & Contract Integrity**: PASS. TypeScript strict mode é mantido; os path aliases no `tsconfig.base.json` garantem tipagem forte e resolução transparente de `@shared/ui`.
- **Princípio IV: Observability & Structured Error Handling**: PASS. Configurações de logging e tratamento de erro de runtime não são afetadas.
- **Princípio V: Simplicity & YAGNI**: PASS. Adoção do Nx com `project.json` minimalistas e declarativos em vez de plugins ou geradores invasivos, mantendo o repositório simples e resiliente.

## Project Structure

### Documentation (this feature)

```text
specs/013-nx-monorepo-migration/
├── plan.md              # Este arquivo (Implementation Plan)
├── research.md          # Pesquisa técnica e decisões de arquitetura
├── data-model.md        # Modelo de entidades e configurações do Nx
├── quickstart.md        # Guia rápido de execução de comandos Nx
├── contracts/           # Contratos de targets e resolução de módulos
│   └── workspace-targets.md
└── tasks.md             # Tarefas detalhadas (/speckit.tasks)
```

### Source Code Layout

```text
c:/DEV/github/antigravity-test-app-01/
├── apps/
│   ├── backend/
│   │   ├── project.json          # Target configs do backend NestJS
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── src/
│   └── frontend/
│       ├── project.json          # Target configs do frontend Angular
│       ├── package.json
│       ├── Dockerfile
│       ├── tailwind.config.js
│       └── src/                  # Sem shared/ui local
├── libs/
│   └── ui/
│       ├── project.json          # Configuração da biblioteca de UI
│       ├── package.json (opcional/metadata)
│       ├── src/
│       │   ├── index.ts          # Public API (@shared/ui)
│       │   ├── components/
│       │   ├── directives/
│       │   ├── pipes/
│       │   ├── services/
│       │   ├── styles/
│       │   └── tailwind.preset.js
├── .github/
│   └── workflows/
│       └── ci.yml                # CI adaptado com Nx cache e run-many/affected
├── nx.json                       # Configuração global do workspace Nx
├── tsconfig.base.json            # Base tsconfig com alias @shared/ui
├── package.json                  # Scripts globais e devDependencies (nx)
└── docker-compose.prod.yml       # Compatibilizado com a nova estrutura
```

**Structure Decision**: Monorepo padrão Nx com separação nítida entre executáveis (`apps/*`) e código reutilizável (`libs/*`), permitindo escalabilidade para futuras bibliotecas sem acoplamento indevido.

## Complexity Tracking

Nenhuma violação aos princípios da constituição.

---

## Fases Mapeadas de Implementação

Seguindo a **Regra Mandatória** (*Para cada etapa mapeada parar e me perguntar se desejo seguir*):

1. **Etapa 1 - Fundação do Monorepo Nx**:
   - Adicionar `nx` como devDependency raiz.
   - Criar `nx.json` e `tsconfig.base.json`.
   - Ajustar `package.json` raiz com scripts Nx convenientes.
   - *Pausa para validação e confirmação do usuário.*

2. **Etapa 2 - Integração da Aplicação Backend**:
   - Criar `apps/backend/project.json` com targets (`build`, `serve`, `test`, `test:cov`, `lint`, `prisma:*`).
   - Testar execução do backend via `npx nx run backend:build` e `npx nx run backend:test`.
   - *Pausa para validação e confirmação do usuário.*

3. **Etapa 3 - Extração e Isolamento de `libs/ui`**:
   - Criar `libs/ui/src/` e mover arquivos de `apps/frontend/src/app/shared/ui`.
   - Criar `libs/ui/project.json`.
   - Configurar paths no `tsconfig.base.json` e `apps/frontend/tsconfig.json`.
   - Atualizar `apps/frontend/tailwind.config.js` para ler o preset e classes de `libs/ui`.
   - Remover resíduos de `shared/ui` de `apps/frontend`.
   - *Pausa para validação e confirmação do usuário.*

4. **Etapa 4 - Integração e Validação do Frontend**:
   - Criar `apps/frontend/project.json` com targets (`build`, `serve`, `test`, `lint`).
   - Validar compilação (`npx nx build frontend`) e testes (`npx nx test frontend`).
   - Validar compatibilidade do Dockerfile com o novo caminho de `libs/ui`.
   - *Pausa para validação e confirmação do usuário.*

5. **Etapa 5 - Modernização do CI e Docker Compose**:
   - Atualizar `.github/workflows/ci.yml` para orquestração com Nx e cache de targets.
   - Validar `docker-compose.prod.yml` com smoke tests locais ou sintáticos.
   - Validar grafo final com `npx nx graph`.
   - *Pausa e relatório final ao usuário.*
