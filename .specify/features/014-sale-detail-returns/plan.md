# Implementation Plan: Detalhamento de Devoluções na Modal de Venda

**Branch**: `014-sale-detail-returns` | **Date**: 2026-10-09 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/014-sale-detail-returns/spec.md`

---

## Summary

Ajustar a modal de detalhes da venda (`SaleDetailModalComponent`) em `apps/frontend` para apresentar uma lista estruturada e detalhada de todas as devoluções associadas à venda consultada. A visualização exibirá dados da devolução (status, modalidade de reembolso, data, motivo e total) e os itens devolvidos (produto, SKU, quantidade, preço unitário, total da linha e condição física do item). No backend (`apps/backend`), o repositório e mapper de vendas serão enriquecidos para incluir as relações de `returnOrders` e seus respectivos itens de forma atômica e segura.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (Node.js 20+ runtime)  
**Primary Dependencies**: Angular 17+ (Signals, Standalone Components), Tailwind CSS, `@shared/ui` (`UiCardComponent`, `UiBadgeComponent`, `UiTableComponent`, `UiButtonComponent`), NestJS 11+, Prisma ORM  
**Storage**: PostgreSQL 15+ via Prisma ORM  
**Testing**: Vitest (`@angular/build:unit-test`), Jest (Backend) via Nx CLI  
**Target Platform**: Navegador Web moderno (Desktop e Tablet para PDV)  
**Project Type**: Monorepo Nx (Web Application: `apps/frontend` + `apps/backend`)  
**Performance Goals**: Renderização da modal em < 500ms; resposta da API em < 200ms p95  
**Constraints**: Zero quebra de contratos existentes; compatibilidade com vendas sem devoluções; sem permissão de edição direta de devoluções dentro da modal de consulta de venda  
**Scale/Scope**: 1 componente de modal ajustado, 1 modelo frontend atualizado, 1 use-case/presenter backend enriquecido, testes unitários atualizados  

---

## Constitution Check

*GATE: Pre-Phase 0 research and Post-Phase 1 design verification.*

| Princípio Constitucional | Status | Justificativa / Verificação |
| :--- | :---: | :--- |
| **I. Multi-Tenancy First** | ✅ PASS | Consultas continuam estritamente delimitadas por `tenantId` no repositório de vendas. Sem vazamento cross-tenant. |
| **II. RBAC Everywhere** | ✅ PASS | Operadores `USER` e `ADMIN` acessam a consulta de vendas autorizada, sem necessitar de permissões globais do módulo de devoluções. |
| **III. Type-Safety & Contract** | ✅ PASS | Tipos estritos em TypeScript sem `any`. DTOs e presenters alinhados entre frontend e backend. |
| **IV. Observabilidade & Erros** | ✅ PASS | Tratamento resiliente de falhas de rede no componente Angular com estado de erro visual limpo. |
| **V. Simplicity & YAGNI** | ✅ PASS | Reutilização da chamada existente `getSale` e componentes `@shared/ui`, sem novas dependências externas. |

---

## Project Structure

### Documentation (this feature)

```text
specs/014-sale-detail-returns/
├── plan.md              # Este plano de implementação
├── research.md          # Decisões de arquitetura e tecnologia (Fase 0)
├── data-model.md        # Modelagem de dados e tipagens (Fase 1)
├── quickstart.md        # Guia rápido de execução e testes locais (Fase 1)
├── contracts/           # Contratos de API
│   └── sale-detail-contract.md
└── tasks.md             # Tarefas geradas pelo /speckit-tasks (Fase 2)
```

### Source Code (repository files)

```text
apps/
├── backend/
│   └── src/
│       ├── application/
│       │   └── use-cases/
│       │       └── sales/
│       │           ├── common/sale-output.ts                # Enriquecer ReturnSummaryOutput com itens
│       │           └── __tests__/get-sale.use-case.spec.ts  # Teste unitário do caso de uso
│       └── infrastructure/
│           ├── persistence/
│           │   └── repositories/prisma-sale.repository.ts   # Incluir returnOrders.items no findById
│           ├── mappers/sale.mapper.ts                       # Mapear returnItems para o domínio
│           └── presenters/sale.presenter.ts                 # Formatar ReturnSummaryPresenter com itens
└── frontend/
    └── src/
        └── app/
            ├── core/
            │   └── models/sale.model.ts                     # Atualizar ReturnSummary e ReturnItemSummary
            └── features/
                └── sales/
                    └── components/
                        └── sale-detail-modal/
                            ├── sale-detail-modal.component.ts      # Lógica e helpers de badge/formatação
                            ├── sale-detail-modal.component.html    # Template com lista detalhada de devoluções
                            └── sale-detail-modal.component.spec.ts # Testes unitários com devoluções detalhadas
```

**Structure Decision**: Monorepo Nx padrão existente, tocando apenas nos pontos necessários da agregação da venda no backend e da camada de apresentação da modal no frontend.

---

## Complexity Tracking

> Nenhuma violação constitucional identificada. A implementação segue os princípios de simplicidade, tipagem estrita e reuso de infraestrutura existente.
