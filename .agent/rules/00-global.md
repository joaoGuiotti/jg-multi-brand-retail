---
trigger: always_on
---

# 🌐 Regras Globais do Workspace

## Projeto

Portfólio simples para o LinkedIn, **sem overengineering**. Monorepo Nx:

- `apps/frontend`: Angular 21+ → siga as rules `frontend-*`.
- `apps/api`: NestJS → siga as rules `api-*`.

## Roteamento (obrigatório)

1. Antes de qualquer tarefa, identifique **em qual app ela acontece**.
2. Só aplique as rules e skills do app alvo. **Nunca** aplique convenções de Angular (Presenters, Signals, Tailwind, Lucide) na API, nem de Nest (módulos, controllers, class-validator) no front.
3. Skills de Angular, A11y, Lucide e Design Tokens são **exclusivas do frontend**. Skills do Nest são exclusivas da API.
4. Tarefa que toca os dois apps: **comece pelo contrato da API**, depois a API, depois o front. Declare a ordem antes de editar.
5. **Não edite um app fora do escopo pedido.** Se a mudança exigir tocar o outro app, avise e peça confirmação.

## Comandos (sempre Nx, nunca `ng`/`nest` direto)

`npx nx <lint|test|build|serve> <frontend|api>`, `npx nx format:write`.
Uma tarefa só termina com lint, test e build verdes do(s) app(s) alterado(s).

## Arquitetura comum

Ambos usam **arquitetura hexagonal** com a mesma regra: `domain` não importa de nada; dependências apontam para dentro; ports são `abstract class`; a ligação port → adapter acontece só no composition root (`*.providers.ts` no front, `*.module.ts` na API).

## Fora de escopo (salvo pedido)

Libs Nx por camada, Nx Cloud, Husky, microsserviços, CQRS/Event Sourcing, autenticação complexa, e2e amplo.

## OpenSpec

Specs e changes devem indicar o escopo (`[frontend]`, `[api]` ou `[contract]`) em cada tarefa. Cada tarefa vai para o app correto.

## Commits

Conventional Commits, com escopo: `feat(api):`, `refactor(frontend):`.
