# CI/CD Pipeline Research

## Needs Clarification Resolution
- **Prisma Mocking**: The user specified that Prisma testing does not need a database setup. Thus, `backend-tests` job does not need Postgres or Redis service containers.
- **Dependency Management**: Standard `npm ci` is preferred over `npm install` for reliable CI consistency.

## Environment Decisions
- **Decision**: GitHub Actions as CI runner.
- **Rationale**: Requested purely by user explicitly. Fits within general ecosystem conventions effortlessly.
- **Alternatives considered**: None (as per explicit user specification).

## Job Separation
- **Decision**: Run `frontend-tests` and `backend-tests` in parallel jobs inside a single workflow file, with a final dummy `build-validation` or simple reliance on individual statuses.
- **Rationale**: Isolating them speeds up the pipeline overall instead of sequential runs.
- **Alternatives considered**: Monolithic sequential job. Rejected due to poor DX and slow feedback loops.
