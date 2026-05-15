# Implementation Plan: Sale Detail View

**Branch**: `006-sale-detail-view` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `.specify/features/006-sale-detail-view/spec.md`

## Summary

Extender o modal de detalhes de venda (`SaleDetailModalComponent`) já existente para cobrir todos os requisitos da spec: exibir pagamentos (já parcialmente presentes no template mas sem dados do backend), adicionar o botão "Iniciar Devolução" condicionado ao status COMPLETED, e exibir devoluções (ReturnOrders) associadas à venda. O backend precisa incluir `payments` e `returns` no `SaleOutput` do endpoint `GET /api/v1/sales/:id`.

**Diagnóstico pós-exploração de código**:
- ✅ `SaleDetailModalComponent` já existe com UI de itens + pagamentos + resumo financeiro
- ✅ Frontend `Sale` model já tem campo `payments: Payment[]`
- ❌ Backend `SaleOutput` **não inclui** `payments` na resposta do `GetSaleUseCase`
- ❌ Backend `SaleOutput` **não inclui** `returns` associados
- ❌ Modal não tem botão "Iniciar Devolução"
- ❌ Modal não exibe devoluções associadas à venda

## Technical Context

**Language/Version**: TypeScript 5.x (monorepo)  
**Primary Dependencies**:
- Backend: NestJS, Prisma ORM, PostgreSQL
- Frontend: Angular 17, Angular Signals, Tailwind CSS, Shared UI library (`@shared/ui`)
**Storage**: PostgreSQL via Prisma — tabelas `Sale`, `SaleItem`, `Payment`, `ReturnOrder`  
**Testing**: Jest (backend unit), Karma/Jasmine (frontend)  
**Target Platform**: Web SPA (desktop-first, responsivo)  
**Project Type**: Monorepo fullstack (apps/backend + apps/frontend)  
**Performance Goals**: Detalhes de venda carregados em < 1s (chamada única ao endpoint)  
**Constraints**: Multi-tenancy obrigatório em todas as queries; isolamento por `tenant_id`  
**Scale/Scope**: Feature pontual — 2-3 arquivos backend, 1-2 arquivos frontend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Evidência |
|-----------|--------|-----------|
| **I. Multi-Tenancy First** | ✅ OK | `GetSaleUseCase` já recebe `tenantId` e usa `saleRepository.findById(tenantId, id)`. Toda extensão de dados (payments, returns) seguirá o mesmo padrão. |
| **II. RBAC Everywhere** | ✅ OK | `SalesController` já tem `@UseGuards(JwtAuthGuard, RolesGuard)` e `@Roles(ADMIN, USER)`. Nenhuma nova rota criada. |
| **III. Type-Safety & Contract Integrity** | ⚠️ ATENÇÃO | `SaleOutput` não inclui `payments` — será corrigido. Frontend `Sale` model já inclui `payments` (bem). DTOs devem ser sincronizados. |
| **IV. Observability** | ✅ OK | Sem novos serviços críticos. Erros já tratados no use case com `NotFoundException`. |
| **V. Simplicity & YAGNI** | ✅ OK | Zero novas entidades, zero novas rotas. Extensão do endpoint `GET /sales/:id` e do modal existente. |

**Resultado**: ✅ Aprovado. Nenhuma violação grave. Correção de type-safety necessária (incluir `payments` e `returns` no `SaleOutput`).

## Project Structure

### Documentation (this feature)

```text
.specify/features/006-sale-detail-view/
├── spec.md              ✅ criado
├── plan.md              ✅ este arquivo
├── research.md          ✅ criado (fase 0)
├── data-model.md        ✅ criado (fase 1)
├── quickstart.md        ✅ criado (fase 1)
├── contracts/           ✅ criado (fase 1)
│   └── api-v1.md
└── tasks.md             (próxima etapa: /speckit-tasks)
```

### Source Code (repository root)

```text
# Backend — extensão do módulo Sales
apps/backend/src/
├── application/use-cases/sales/
│   ├── common/sale-output.ts           [MODIFY] adicionar payments + returns ao SaleOutput
│   └── get-sale.use-case.ts            [MODIFY] incluir payments + returns na query
├── domain/repositories/
│   └── sale-repository.ts              [MODIFY] incluir payments + returns no findById
├── infrastructure/
│   ├── persistence/sales/
│   │   └── prisma-sale.repository.ts   [MODIFY] include payments + returnOrders no Prisma query
│   ├── presenters/
│   │   └── sale.presenter.ts           [MODIFY] adicionar PaymentPresenter + ReturnSummaryPresenter
│   └── dtos/sales/                     (sem alteração)

# Frontend — extensão do modal existente
apps/frontend/src/app/
├── core/models/
│   └── sale.model.ts                   [VERIFY] payments já está; adicionar ReturnSummary se necessário
├── features/sales/
│   ├── components/sale-detail-modal/
│   │   ├── sale-detail-modal.component.ts   [MODIFY] injetar Router; lógica "Iniciar Devolução"
│   │   └── sale-detail-modal.component.html [MODIFY] botão RMA + seção de devoluções associadas
│   └── (sem novos arquivos de componente)
```

**Structure Decision**: Web application (backend + frontend). Feature concentrada — nenhum arquivo novo necessário além dos existentes. Reutiliza modal e serviços já em produção.

## Phase 0: Research

### Investigação Realizada

**Decisão 1: Modal vs. Página dedicada**
- **Escolhido**: Manter `SaleDetailModalComponent` (modal existente) como ponto principal
- **Rationale**: Já está em produção e integrado no `SalesHistoryComponent`. Criar uma nova página `/sales/:id` adicionaria rota, lazy-load e duplicação de lógica desnecessários.
- **Alternativa rejeitada**: Página dedicada `/sales/:id` — complexidade extra sem benefício funcional nesta versão.

**Decisão 2: Como incluir `payments` no backend**
- **Escolhido**: Estender `SaleRepository.findById` para fazer `include: { payments: true }` no Prisma.
- **Rationale**: O `SalePresenter` do frontend já espera `payments`. A omissão foi um gap de implementação.
- **Alternativa rejeitada**: Endpoint separado `GET /sales/:id/payments` — seria uma chamada extra desnecessária.

**Decisão 3: Devoluções associadas — profundidade de dados**
- **Escolhido**: Incluir `returnOrders` (apenas campos de resumo: id, status, createdAt, total) no `GET /sales/:id`.
- **Rationale**: O frontend precisa apenas saber se há devoluções e qual o status. Dados completos ficam no módulo RMA.
- **Alternativa rejeitada**: Endpoint separado `GET /returns?saleId=X` chamado no frontend — latência extra e lógica de combinação no cliente.

**Decisão 4: Botão "Iniciar Devolução"**
- **Escolhido**: Adicionar botão no footer do modal, visível apenas quando `sale.status === 'COMPLETED'`. Ao clicar: fecha o modal e navega para `/returns/new?saleId={id}`.
- **Rationale**: O `ReturnFormComponent` já existe e aceita navegação com parâmetro `saleId`.
- **Alternativa rejeitada**: Abrir outro modal de devolução — profundidade de modais ruim para UX.

---

## Phase 1: Design & Contracts

### Data Model

Ver [data-model.md](./data-model.md)

### API Contract

Ver [contracts/api-v1.md](./contracts/api-v1.md)

### Quickstart

Ver [quickstart.md](./quickstart.md)
