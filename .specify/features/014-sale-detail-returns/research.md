# Research & Technical Decisions: Detalhamento de Devoluções na Modal de Venda

**Feature**: `014-sale-detail-returns`  
**Date**: 2026-10-09  

---

## 1. Estratégia de Obtenção de Dados das Devoluções

### Contexto
Atualmente, o endpoint `GET /sales/:id` retorna a venda com um resumo simplificado de devoluções (`id`, `status`, `totalRefund`, `createdAt`), enquanto a tabela `return_orders` e seus itens (`return_items`) possuem informações completas sobre produtos devolvidos, quantidades, condições físicas (`GOOD`, `DAMAGED`, `DEFECTIVE`), tipo de reembolso (`STORE_CREDIT`, `CASH_REFUND`, `EXCHANGE`) e motivo.

Além disso, o endpoint `GET /returns` é restrito a `ADMIN` e `SUPER_ADMIN` no `ReturnsController`, enquanto caixas e operadores (`USER`) têm acesso a `GET /sales/:id`.

### Decisão
**Enriquecer o aggregate da venda no backend (`GET /sales/:id`) mantendo retrocompatibilidade no frontend.**

- No backend: Atualizar a consulta do repositório Prisma (`findById` em `prisma-sale.repository.ts`) para incluir os itens da devolução e os dados básicos do produto (`name`, `sku`), propagando através do mapper e do presenter (`SaleOutput` e `SalePresenter`).
- No frontend: Tipar `ReturnSummary` e `ReturnItemSummary` em `sale.model.ts` para que `SaleDetailModalComponent` receba os itens diretamente na chamada única `salesService.getSale(id)`.
- Como fallback/resiliência: Se a venda vier sem itens detalhados em dados legados ou mocks, o componente trata graciosamente exibindo apenas as informações disponíveis sem erro em tela.

### Rationale
1. **Performance e UX**: Uma única requisição HTTP atômica carrega a venda e todo seu histórico de devoluções, evitando múltiplos loaders, spinners descentralizados ou race conditions.
2. **Segurança e RBAC (Princípio II da Constituição)**: Operadores com perfil `USER` precisam auditar as devoluções de suas vendas no PDV sem violar as regras de acesso que restringem a listagem global de devoluções.
3. **Isolamento Multi-tenant (Princípio I da Constituição)**: O aggregate da venda já é estritamente filtrado por `tenantId` e RLS.

### Alternativas Consideradas
- *Fazer requisição secundária a `GET /returns?saleId=:id` no frontend*: Rejeitada porque exigiria rebaixar a segurança do endpoint `GET /returns` para o perfil `USER`, geraria requisições adicionais desnecessárias e causaria flashes de carregamento na modal.
- *Carregar itens apenas sob demanda ao clicar em "Expandir"*: Rejeitada por overengineering (YAGNI), já que vendas no varejo possuem poucas devoluções (raramente mais de 1 ou 2), e o payload extra é inferior a 1KB.

---

## 2. Padrão Visual e Componentização na Modal (UX/UI)

### Contexto
A modal de detalhe da venda precisa apresentar informações densas (cabeçalho, itens da venda, pagamentos, totais financeiros) sem poluir o visual com uma lista excessivamente longa de devoluções.

### Decisão
**Implementar cartões estruturados expansíveis (Card com lista de itens integrada) por devolução.**

- **Cabeçalho da Devolução**:
  - Identificador formatado `#DEV-...`
  - Data e hora formatadas
  - Badge de status (`REQUESTED` / `APPROVED` / `REFUNDED` / `REJECTED`)
  - Badge do tipo de reembolso (`Crédito em Loja`, `Estorno em Dinheiro`, `Troca`)
  - Total devolvido com destaque monetário
- **Corpo da Devolução**:
  - Motivo/justificativa registrado (se houver)
  - Lista de itens devolvidos em formato de tabela/grid leve:
    - Produto (Nome e SKU)
    - Quantidade devolvida
    - Preço unitário e total da linha
    - Badge de condição (`Bom Estado`, `Avariado`, `Defeito`)
- **Resumo Financeiro Consolidado**:
  - Indicador informativo mostrando o total já reembolsado em relação ao total da venda.

### Rationale
- Alinha-se diretamente com o Design System existente (`@shared/ui`, `ui-card`, `ui-badge`, `ui-button`, `ui-number`).
- Permite leitura rápida dos valores essenciais e aprofundamento imediato nos itens devolvidos.
- Respeita padrões WCAG 2.2 de contraste e clareza visual.

### Alternativas Consideradas
- *Substituir toda a modal por abas ("Itens da Venda" / "Devoluções")*: Rejeitada porque a visualização lado a lado ou sequencial dá contexto completo da transação sem cliques adicionais.

---

## 3. Conformidade com a Constituição do Projeto

| Princípio | Aplicação nesta Feature |
| :--- | :--- |
| **I. Multi-Tenancy First** | As devoluções associadas continuam estritamente isoladas pelo `tenantId` garantido no repositório de vendas e RLS. |
| **II. RBAC Everywhere** | Acesso garantido para `ADMIN` e `USER` via `SalesController`, sem expor endpoints administrativos desnecessariamente. |
| **III. Type-Safety** | Tipagem estrita completa em TypeScript, sem uso de `any`, com interfaces atualizadas em backend e frontend. |
| **IV. Observabilidade** | Erros de carregamento tratados com feedback amigável no template e logs limpos. |
| **V. Simplicity & YAGNI** | Uso de Angular Signals existentes no componente (`signal`, `computed`), sem introdução de novas dependências. |
