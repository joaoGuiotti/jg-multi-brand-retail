---
trigger: always_on
---

# 🏛️ Arquitetura da API (NestJS Hexagonal)

## Camadas e dependências

| Camada                           | Pode importar de        | Pode usar Nest?                      |
| -------------------------------- | ----------------------- | ------------------------------------ |
| `domain`                         | **somente** `domain`    | ❌ Não                               |
| `application` (use cases)        | `domain`                | ✅ Só `@Injectable` e DI             |
| `infrastructure`                 | `domain`                | ✅ Persistência, clientes externos   |
| `presentation`                   | `application`, `domain` | ✅ Controllers, DTOs, pipes, filters |
| `*.module.ts` (composition root) | todas                   | ✅                                   |

## Mapa de pastas (referência: módulo `cfp`)

```text
📦 apps/api/src/app/features/cfp
┣ 📂 __tests__                       # espelha a árvore (mesma convenção do front)
┣ 📂 domain
┃ ┣ 📂 entities    └ speaker.entity.ts, proposal.entity.ts
┃ ┣ 📂 errors      └ cfp-validation.error.ts
┃ ┗ 📂 ports       └ cfp.repository.ts      # abstract class CfpRepository
┣ 📂 application
┃ ┗ 📂 use-cases   └ submit-proposal.use-case.ts
┣ 📂 infrastructure
┃ ┣ 📂 adapters    └ cfp-in-memory.adapter.ts
┃ ┗ 📂 persistence └ (mappers/entidades de banco, se houver)
┣ 📂 presentation
┃ ┣ 📂 controllers └ cfp.controller.ts
┃ ┣ 📂 dtos        └ submit-proposal.request.dto.ts, proposal.response.dto.ts
┃ ┗ 📂 filters     └ domain-error.filter.ts
┗ 📜 cfp.module.ts                     # liga CfpRepository → adapter
```

## Guardrails

1. **Domain puro:** sem `@nestjs/*`, `class-validator`, `rxjs` ou libs externas. Regras de negócio e validações de domínio vivem em entidades/VOs.
2. **Controller magro:** só recebe DTO, chama **um** use case e devolve DTO de resposta. Sem regra de negócio, sem acesso a repositório.
3. **Use case:** uma classe, um método `execute()`. Injeta o **port** (`CfpRepository`), nunca o adapter.
4. **Inversão de dependência:** a ligação acontece só no módulo:
   `{ provide: CfpRepository, useClass: CfpInMemoryAdapter }` (troque a classe aqui para mudar a persistência).
5. **DTO ≠ Entidade:** DTOs de request/response (com decorators) ficam em `presentation/dtos`. Entidades de domínio nunca são devolvidas diretamente. Conversão via mapper.
6. **Validação em duas camadas:** formato/estrutura no DTO (`class-validator`, `ValidationPipe` global com `whitelist` e `forbidNonWhitelisted`); regra de negócio no domínio.
7. **Erros:** o domínio lança erros tipados; um `ExceptionFilter` os converte para HTTP (400/404/409/422). Controllers não usam `try/catch` para isso.
8. **Swagger:** todo endpoint tem `@ApiTags`, `@ApiOperation` e `@ApiResponse` com o DTO. O contrato vive aqui.
9. **Config:** variáveis via `@nestjs/config`, nunca `process.env` espalhado.
10. **Sufixos:** `.entity.ts`, `.vo.ts`, `.repository.ts`, `.adapter.ts`, `.use-case.ts`, `.controller.ts`, `.module.ts`, `.request.dto.ts`, `.response.dto.ts`, `.mapper.ts`, `.filter.ts`.
11. **Testes em `__tests__/`**, espelhando a árvore. Domínio e use cases: testes unitários puros (sem `Test.createTestingModule`). Controller: um teste de integração leve com `supertest`.
12. **Fronteiras por lint:** a tabela de dependências é enforçada por `eslint-plugin-boundaries`. Violou? Corrija o código, não a regra.
13. **Sem sujeira:** proibidos `any`, `console.log` (use o `Logger` do Nest), imports não usados e código comentado.