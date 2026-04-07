# CI/CD Pipeline Quickstart

## How to test the pipeline
1. Commit any valid code change.
2. Push the branch.
3. Observe GitHub Actions tab for execution of the defined jobs (`backend-tests`, `frontend-tests`, `build-validation`).

## How to simulate failure
1. Intentionally introduce a syntax error or a failing test in either `apps/backend` or `apps/frontend`.
2. Push your code.
3. Verify the CI pipeline rightfully fails the run and marks the commit with a red cross X.
