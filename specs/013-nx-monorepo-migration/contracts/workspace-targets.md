# Contrato de Alvos e Comandos do Workspace Nx

**Feature**: `013-nx-monorepo-migration`  
**Data**: 2026-10-07

## 1. Contrato de Targets por Projeto

| Projeto | Target | Descrição | Dependências (`dependsOn`) | Cacheável |
|---------|--------|-----------|----------------------------|-----------|
| `backend` | `build` | Compila o NestJS para `dist/` | `["prisma:generate"]` | Sim |
| `backend` | `start` / `serve` | Inicia o NestJS em modo desenvolvimento (`nest start --watch`) | `["prisma:generate"]` | Não |
| `backend` | `test` | Executa testes unitários com Jest | Nenhuma | Sim |
| `backend` | `test:cov` | Executa testes com cobertura | Nenhuma | Sim |
| `backend` | `lint` | Executa ESLint no backend | Nenhuma | Sim |
| `backend` | `prisma:generate` | Gera o Prisma Client | Nenhuma | Sim |
| `backend` | `prisma:migrate` | Executa migrações do banco | Nenhuma | Não |
| `backend` | `prisma:seed` | Popula o banco de dados | `["prisma:generate"]` | Não |
| `frontend` | `build` | Compila a aplicação Angular para produção | `["^build"]` (se lib compilável) | Sim |
| `frontend` | `start` / `serve` | Inicia o servidor Angular de desenvolvimento (`ng serve`) | Nenhuma | Não |
| `frontend` | `test` | Executa testes com Vitest | Nenhuma | Sim |
| `frontend` | `test:cov` | Executa cobertura de testes com Vitest | Nenhuma | Sim |
| `ui` | `lint` | Executa linter ou validação nos componentes da biblioteca | Nenhuma | Sim |
| `ui` | `build` (se aplicável) | Empacotamento ou validação de tipos da lib | Nenhuma | Sim |

---

## 2. Contrato de Resolução de Módulos (TypeScript Paths)

No arquivo `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/ui": ["libs/ui/src/index.ts"],
      "@shared/ui/*": ["libs/ui/src/*"]
    }
  }
}
```

Qualquer importação dentro de `apps/frontend` que referencia `@shared/ui` resolverá para os arquivos fontes exportados em `libs/ui/src/index.ts`.

---

## 3. Contrato de Comandos Globais

| Comando | Descrição |
|---------|-----------|
| `npx nx run-many -t build` | Compila todas as aplicações e bibliotecas |
| `npx nx run-many -t test` | Executa os testes de todos os projetos |
| `npx nx run-many -t lint` | Executa linters em todos os projetos |
| `npx nx affected -t test` | Executa testes apenas nos projetos alterados em relação à base |
| `npx nx affected -t build` | Compila apenas os projetos alterados |
| `npx nx graph` | Abre visualização gráfica do grafo de dependências do monorepo |
