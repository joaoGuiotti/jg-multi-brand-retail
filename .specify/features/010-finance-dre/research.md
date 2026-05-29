# Phase 0: Research

## PDF Generation Library

**Decision**: Use `pdfmake` on the backend (NestJS).
**Rationale**: Generates PDFs directly from a declarative document definition. It doesn't require launching a Chromium instance like `puppeteer`, reducing memory usage and simplifying Docker deployment. Generating on the backend ensures the report is consistent regardless of the client's browser and allows easy caching or mailing in the future.
**Alternatives considered**: 
- `puppeteer`: High memory footprint, requires Chromium binaries.
- `jspdf` (Frontend): Client-side generation can be inconsistent and heavy for large 100k transaction reports.
