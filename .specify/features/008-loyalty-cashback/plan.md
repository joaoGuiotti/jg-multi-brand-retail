# Implementation Plan: 008-loyalty-cashback

**Branch**: `008-loyalty-cashback` | **Date**: 2026-05-28 | **Spec**: [spec.md](file:///c:/DEV/github/antigravity-test-app-01/.specify/features/008-loyalty-cashback/spec.md)
**Input**: Feature specification from `.specify/features/008-loyalty-cashback/spec.md`

---

## Summary

O **Módulo de Fidelidade & Cashback** permitirá que cada lojista (Tenant) configure suas próprias políticas de relacionamento com clientes. Os pontos serão acumulados automaticamente sobre o valor líquido pago de cada venda no PDV e poderão ser resgatados como descontos na finalização de vendas subsequentes.

A abordagem técnica seguirá a **Arquitetura Limpa (Clean Architecture)** implementada no backend NestJS, usando controllers HTTP para REST, desacoplamento por meio de Use Cases em `/application`, interfaces de repositório e injeção em `/domain`, e persistência concreta via Prisma no PostgreSQL em `/infrastructure`. O frontend usará **Angular Standalone Components** com **Signals** para reatividade reativa no PDV.

---

## Technical Context

* **Language/Version:** TypeScript (Strict Mode) / Node.js 20+
* **Primary Dependencies:** NestJS v10, Prisma ORM, Angular v17+, `@nestjs/event-emitter` (para gatilhos assíncronos pós-venda)
* **Storage:** PostgreSQL 15+ (com RLS ativado via Prisma/Postgres), Redis 7+ (para cache eventual de configurações)
* **Testing:** Jest para testes unitários (backend) e testes de componentes (frontend)
* **Target Platform:** Web Desktop/Mobile (PDV e Painel Administrativo)
* **Project Type:** Web Multi-Tenant SaaS
* **Performance Goals:** Tempo de cálculo e desconto no PDV < 300ms
* **Constraints:** Isolamento multi-tenant absoluto via RLS (`tenant_id` obrigatório nas queries)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status | Verification Detail |
| :--- | :--- | :--- | :--- |
| **I. Multi-Tenancy First** | Enforce tenant isolation in all queries | **PASSED** | As tabelas `loyalty_programs`, `loyalty_accounts` e `loyalty_transactions` conterão a coluna `tenant_id` e seguirão o middleware de validação do tenant. |
| **II. RBAC Everywhere** | Endpoints guarded by roles | **PASSED** | Configurações e Ajustes de saldo protegidos com `@Roles(Role.ADMIN)`. Vendedores (`USER`) só podem ler o saldo e aplicar o desconto no checkout do PDV. |
| **III. Type-Safety** | Strictly typed contracts | **PASSED** | Contratos de DTO definidos estritamente no backend NestJS e consumidos via HTTP Typesafe no frontend Angular. |
| **IV. Observability** | Structured logging & Auditing | **PASSED** | Qualquer movimentação de saldo gera uma `LoyaltyTransaction` imutável e auditoria em `AuditLog`. |
| **V. Simplicity & YAGNI** | Keep codebase lean | **PASSED** | A expiração de pontos (`expirationDays`) será persistida como `null` e nenhuma lógica complexa de expiração em lote será codificada na v1. |

---

## Project Structure

A implementação será distribuída de forma modular dentro da estrutura de diretórios existente do monorepo:

### Documentation (this feature)
```text
.specify/features/008-loyalty-cashback/
├── spec.md              # Especificação funcional
├── plan.md              # Este arquivo (Plano de Implementação)
├── research.md          # Pesquisa técnica e decisões de design
├── data-model.md        # Modelagem física das tabelas do banco
├── quickstart.md        # Guia rápido de migrações e testes
└── contracts/           # Contratos JSON de payload e resposta
    ├── configure-program.json
    ├── get-account.json
    ├── redeem-points.json
    └── adjust-points.json
```

### Source Code

```text
apps/backend/src/
├── domain/
│   ├── entities/loyalty/
│   │   ├── loyalty-program.entity.ts
│   │   ├── loyalty-account.entity.ts
│   │   └── loyalty-transaction.entity.ts
│   └── repositories/loyalty/
│       └── loyalty.repository.interface.ts
├── application/
│   └── use-cases/loyalty/
│       ├── configure-loyalty-program.use-case.ts
│       ├── earn-points.use-case.ts
│       ├── redeem-points.use-case.ts
│       ├── adjust-points-manual.use-case.ts
│       └── get-loyalty-account.use-case.ts
└── infrastructure/
    ├── controllers/loyalty.controller.ts
    ├── dtos/loyalty/
    │   ├── configure-loyalty-program.dto.ts
    │   ├── redeem-points.dto.ts
    │   └── adjust-points-manual.dto.ts
    ├── persistence/loyalty/
    │   └── prisma-loyalty.repository.ts
    └── modules/loyalty.module.ts

apps/frontend/src/app/features/loyalty/
├── services/
│   └── loyalty.service.ts         # Chamadas HTTP typesafe
├── store/
│   └── loyalty.store.ts           # Signal-based store de fidelidade
├── pages/
│   └── loyalty-config/            # Configuração do programa (ADMIN)
└── components/
    ├── loyalty-badge/             # Visualização de saldo no PDV ao selecionar cliente
    ├── redeem-dialog/             # Modal de resgate no PDV
    └── loyalty-history/           # Histórico de transações na ficha do cliente
```

---

## Complexity Tracking

*Nenhuma violação identificada. A simplicidade está mantida ao adiar a lógica de expiração e reusar o RLS do Postgres existente no projeto.*
