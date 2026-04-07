# CI Yaml Contract

The file will exist at `.github/workflows/ci.yml`.

**Interface format:**
```yaml
name: CI/CD Pipeline
on:
  push:
    branches:
      - main-sdd
      - main

jobs:
  backend-tests:
    # Setup Node, install dependencies, lint, test, build

  frontend-tests:
    # Setup Node, install dependencies, lint, test, build

  build-validation:
    # Requires backend-tests and frontend-tests to succeed.
```
