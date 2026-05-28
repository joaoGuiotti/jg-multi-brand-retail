# Implementation Plan: Identificação Dinâmica de Inquilinos na Tela de Login

**Branch**: `007-dynamic-tenant-resolution` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-dynamic-tenant-resolution/spec.md`

---

## Summary

O principal objetivo deste recurso é permitir o carregamento dinâmico da identidade visual de cada inquilino (*tenant*) na tela de login através do subdomínio acessado (ex: `loja-demo.localhost`). O backend fornecerá uma rota pública segura usando o Prisma para buscar e retornar as propriedades estéticas públicas do tenant. O frontend (Angular 17) interceptará o domínio na tela de login, consultará o backend e atualizará os elementos visuais (logo, nome e cores) antes de o usuário inserir suas credenciais.

---

## Technical Context

**Language/Version**: TypeScript 5.x (NestJS v10+, Angular v17+)  
**Primary Dependencies**: `@nestjs/common`, `@angular/router`, Prisma Client  
**Storage**: PostgreSQL 15+ via Prisma ORM (Leitura da tabela `tenants`)  
**Testing**: Jest (para testes de unidade do NestJS) e validação manual via navegador  
**Target Platform**: Web Browsers (Chrome, Firefox, Safari) e Linux Server (Node.js 20+)  
**Project Type**: Monorepo Web Service + Web Client  
**Performance Goals**: Endpoint de resolução de tenant pública com p95 < 100ms  
**Constraints**: Sem vazamento de credenciais ou dados administrativos, suporte a fallback dinâmico para marca padrão  
**Scale/Scope**: 1 caso de uso, 1 endpoint público, 1 componente Angular modificado, 1 serviço Angular atualizado  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio Constitucional | Status | Justificativa de Conformidade |
| :--- | :---: | :--- |
| **I. Multi-Tenancy First** | ✅ PASS | Rota de leitura pública baseada em `slug` (extraída da URL de origem). Nenhuma informação de transação ou dados administrativos/operacionais de outros tenants é trafegada. |
| **II. RBAC Everywhere** | ✅ PASS | A resolução estática da tela de login pré-autenticação é pública por natureza (sem necessidade de token). Os endpoints protegidos existentes continuam sob guards rigorosas. |
| **III. Type-Safety** | ✅ PASS | Uso integral de TypeScript estrito. DTOs de retorno e requisições bem estruturados, mapeamento de tipos do Prisma respeitado. |
| **IV. Observability** | ✅ PASS | Erros de tenant não encontrado ou inativo são interceptados e propagados como exceções HTTP padrão do NestJS (`NotFoundException`, `ForbiddenException`). |
| **V. Simplicity & YAGNI** | ✅ PASS | Escopo focado exclusivamente na resolução de subdomínio, conforme decisão "A" do usuário. Funcionalidade de e-mail adiada. |

---

## Project Structure

### Documentation (this feature)

```text
specs/007-dynamic-tenant-resolution/
├── spec.md              # Feature Specification (Aprovada)
├── plan.md              # This file (Planejamento de Implementação)
├── research.md          # Phase 0: Análise e Pesquisa Técnica
├── data-model.md        # Phase 1: Mapeamento de Entidades Visuais
├── quickstart.md        # Phase 1: Manual de Execução e Testes
└── checklists/
    └── requirements.md  # Checklist de Qualidade da Especificação
```

### Source Code (repository root)

Mapeamento da fiação física que será alterada/adicionada para o recurso:

```text
apps/backend/
├── src/
│   ├── application/
│   │   └── use-cases/
│   │       └── auth/
│   │           └── get-public-tenant.use-case.ts  # [NEW] Busca dados públicos do Tenant
│   ├── infrastructure/
│   │   ├── controllers/
│   │   │   └── auth.controller.ts                 # [MODIFY] Adiciona endpoint público GET /auth/tenants/by-slug/:slug
│   │   └── dtos/
│   │       └── auth/
│   │           └── public-tenant-output.dto.ts    # [NEW] DTO de resposta pública segura
│   └── domain/
│       └── repositories/
│           └── tenant-repository.ts               # [EXISTING] Interface que contém findBySlug

apps/frontend/
├── src/
│   └── app/
│       ├── core/
│       │   └── services/
│       │       └── auth.service.ts                # [MODIFY] Adiciona getPublicTenant(slug)
│       └── features/
│           └── auth/
│               └── login/
│                   ├── login.component.ts         # [MODIFY] Carrega dados do tenant no OnInit
│                   └── login.component.html       # [MODIFY] Renderiza logo e nome do tenant dinamicamente
```

**Structure Decision**: Adotamos a arquitetura do monorepo separando as mudanças de backend no NestJS e de frontend no AngularStandalone, utilizando as interfaces e DTOs existentes na estrutura do projeto.
