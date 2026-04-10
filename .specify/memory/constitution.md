<!--
==============================================================================
SYNC IMPACT REPORT
==============================================================================
Version change: (template) → 1.0.0
Modified principles: N/A — initial ratification, all principles newly defined.
Added sections: Core Principles (5), Technology & Architecture Constraints, Development Workflow, Governance
Removed sections: None
Templates requiring updates:
  ✅ .specify/templates/plan-template.md — Constitution Check gate already present; principles
     are now concrete and can be applied directly. No structural change needed.
  ✅ .specify/templates/spec-template.md — Requirements and success-criteria sections align
     with principle-driven constraints (RBAC, multi-tenancy, type safety). No change needed.
  ✅ .specify/templates/tasks-template.md — Logging/observability and security-hardening tasks
     already present in Phase N; no structural change needed.
  ⚠  .specify/templates/commands/ — Directory does not exist; no command files to update.
     (speckit uses skill SKILL.md files under .agent/skills/ instead.)
Follow-up TODOs:
  - None. All fields are populated.
==============================================================================
-->

# Retail SaaS — Multi-Brand Platform Constitution

## Core Principles

### I. Multi-Tenancy First (NON-NEGOTIABLE)

Every feature MUST enforce tenant isolation from the first line of code.
All database tables MUST carry a `tenant_id` column. Every query MUST be
scoped to the authenticated tenant's ID — no cross-tenant data leakage is
permissible under any circumstance. Row-Level Security (RLS) at the
PostgreSQL level MUST be the last line of defence, not a substitute for
application-layer scoping. Middleware MUST validate the tenant context on
every authenticated request.

**Rationale**: The core value proposition of the platform is that each
brand's data is fully invisible to all other brands. A breach of tenant
isolation is a critical, business-ending failure.

### II. Role-Based Access Control (RBAC) Everywhere

All endpoints and UI actions MUST be guarded by the three-tier RBAC model:
`SUPER_ADMIN` (cross-tenant platform management), `ADMIN` (single-tenant
store management), and `USER` (operator/cashier). Guards MUST be applied
at the controller/route level on the backend and via route guards and
structural hiding on the frontend. No capability check MUST be left to the
caller's discretion.

**Rationale**: Mixing roles or missing guards leads to privilege escalation,
which undermines both security and the multi-brand SaaS model.

### III. Type-Safety & Contract Integrity

TypeScript strict mode MUST be enabled across the entire monorepo (both
`apps/backend` and `apps/frontend`). DTOs and shared types from
`libs/shared/` MUST be used as the single source of truth for all API
contracts. `any` is forbidden unless explicitly annotated with a
`// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment
and a justification. Prisma-generated types MUST be preferred over manual
DB field definitions.

**Rationale**: A strongly typed contract between frontend and backend
eliminates a large class of runtime errors in a multi-tenant context where
data shape mismatch can silently corrupt tenant-scoped records.

### IV. Observability & Structured Error Handling

All services MUST use structured logging (JSON format in production).
Errors MUST be caught at the service/use-case boundary, classified
(4xx vs 5xx), and propagated as typed NestJS exceptions with meaningful
messages. Background jobs (BullMQ) MUST log start, completion, and failure
events. Redis cache operations MUST have explicit TTL and must fail
gracefully (never blocking the primary request path).

**Rationale**: In a SaaS platform shared by multiple tenants, silent
failures and unstructured logs make it impossible to triage incidents
without risk of data exposure between tenants.

### V. Simplicity & YAGNI (You Aren't Gonna Need It)

Features MUST be scoped to requirements confirmed in the current spec. New
abstractions MUST be justified by at least two concrete use-cases at the
time of introduction. Third-party libraries MUST be evaluated for bundle
size impact (frontend) and long-term maintenance risk before adoption.
Prefer Angular Signals over complex RxJS chains for new UI state unless
streaming semantics are genuinely required.

**Rationale**: Retail SaaS products accumulate complexity quickly. Keeping
the codebase lean ensures adaptability and reduces onboarding friction.

## Technology & Architecture Constraints

- **Backend**: NestJS (TypeScript), Prisma ORM, PostgreSQL 15+, Redis 7+,
  BullMQ for background jobs. Node.js 20+ runtime.
- **Frontend**: Angular 17+ with Standalone Components, Tailwind CSS,
  Angular Signals for state management.
- **Auth**: JWT + Refresh Token. Access token MUST have a short expiry
  (≤ 15 min). Refresh token rotation MUST be enforced.
- **Monorepo layout**: `apps/backend/`, `apps/frontend/`, `libs/shared/`.
  Shared code lives exclusively in `libs/shared/`.
- **Containerisation**: Docker + Docker Compose for local dev and production.
  Production deployment MUST use `docker-compose.prod.yml`.
- **CI/CD**: GitHub Actions pipeline MUST pass before any merge to `main`.
- **Database migrations**: Every schema change MUST be accompanied by a
  Prisma migration file committed in the same PR. No ad-hoc schema edits
  in production.

## Development Workflow

- **Branching**: Feature branches follow the pattern `###-feature-name`
  (sequential numbering). Direct pushes to `main` are forbidden.
- **Pull Requests**: Every PR MUST reference the relevant spec or task ID.
  Reviewers MUST verify the Constitution Check gate defined in `plan.md`
  before approving.
- **Testing Gates**: Unit tests MUST cover all use-case classes. Integration
  tests MUST cover all tenant-scoped endpoints. CI MUST enforce ≥ 80%
  coverage on `apps/backend/src/`. E2E tests (Playwright or Cypress) are
  RECOMMENDED for critical user journeys.
- **Seeds & Migrations**: `npm run seed` MUST be idempotent. Running it
  twice MUST NOT create duplicate records.
- **API versioning**: All backend routes MUST be prefixed with `/api/v1/`.
  Breaking changes require a new version prefix (`/api/v2/`) and a
  migration plan.

## Governance

This Constitution supersedes all other documented development practices
within this repository. Any practice not addressed here defaults to the
TypeScript community's widely-accepted conventions.

**Amendment procedure**:
1. Open a PR with changes to `.specify/memory/constitution.md` and
   `.specify/templates/constitution-template.md` (keep in sync).
2. Describe the rationale and version bump type (MAJOR/MINOR/PATCH) in
   the PR description.
3. The PR MUST be approved by at least one other maintainer.
4. Run `/speckit-constitution` after merge to propagate changes to all
   dependent templates.

**Versioning policy** (semantic):
- MAJOR — backward-incompatible governance changes or principle removals.
- MINOR — new principles or materially expanded guidance.
- PATCH — clarifications, wording fixes, typo corrections.

**Compliance review**: Every sprint retrospective MUST include a brief
constitution compliance check. Violations identified during code review
MUST be resolved before merge, not deferred.

For day-to-day development guidance see `README.md` and
`.agent/skills/speckit-implement/SKILL.md`.

**Version**: 1.0.0 | **Ratified**: 2026-04-06 | **Last Amended**: 2026-04-06
