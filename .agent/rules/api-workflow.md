---
trigger: always_on
---

# 🔄 Fluxo de Trabalho (API)

1. **Ler:** leia os arquivos envolvidos e o contrato atual (Swagger/DTOs).
2. **Design:** defina a camada de cada arquivo. Mudou o contrato? Liste o que muda (rota, request, response, status codes).
3. **Codificar** na ordem: domain → port → use case → adapter → DTOs/mapper → controller → module.
4. **Verificar:** `npx nx lint api`, `npx nx test api`, `npx nx build api` verdes. Testes novos em `__tests__/`.
5. **Resumo:** o que mudou, decisões e **impacto no front** (campos novos, renomeados, removidos). Se houver impacto, diga quais arquivos do front precisam mudar (`cfp.dtos.ts`, `cfp.mapper.ts`), sem editá-los a menos que eu peça.

## Comportamento

Mudanças pequenas e coesas. Na ambiguidade, pergunte antes. Não crie documentação além da pedida.
