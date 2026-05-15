# Research: Sale Detail View

**Feature**: `006-sale-detail-view`  
**Date**: 2026-05-15

## Contexto Explorado

### Estado atual do código (descobertas)

| Artefato | Estado |
|----------|--------|
| `SaleDetailModalComponent` (frontend) | ✅ Existe — UI completa com itens, pagamentos, resumo financeiro, botão Print Receipt |
| `Sale` model frontend | ✅ Inclui `payments: Payment[]` |
| `GetSaleUseCase` (backend) | ⚠️ Retorna `SaleOutput` **sem** `payments` e **sem** `returns` |
| `SaleOutput` type | ❌ Campos `payments` e `returns` ausentes |
| `PrismaSaleRepository.findById` | ❌ Não faz `include: { payments: true, returnOrders: true }` no Prisma |
| `SalePresenter` | ❌ Não serializa `payments` |
| Botão "Iniciar Devolução" no modal | ❌ Ausente |
| Seção de devoluções associadas | ❌ Ausente |

### Fluxo existente de `GET /api/v1/sales/:id`

```
SalesController.findOne()
  → GetSaleUseCase.execute({ tenantId, id })
    → SaleRepository.findById(tenantId, id)     ← Prisma query SEM include payments
      → SaleOutputMapper.toOutput(sale, tenantId) ← SaleOutput SEM payments
    → SalePresenter(output)                      ← Serialização SEM payments
```

### Fluxo após a feature

```
SalesController.findOne()                         (sem mudança)
  → GetSaleUseCase.execute({ tenantId, id })      (sem mudança)
    → SaleRepository.findById(tenantId, id)       ← Prisma: include { payments, returnOrders }
      → SaleOutputMapper.toOutput(sale, tenantId) ← SaleOutput COM payments + returns
    → SalePresenter(output)                       ← Serialização COM payments + returns
```

## Decisões e Rationale

### D1: Manter modal em vez de criar página de rota dedicada
- **Decisão**: Manter `SaleDetailModalComponent` como ponto de entrada
- **Rationale**: Já está em produção. Criar `/sales/:id` seria duplicação de lógica sem benefício UX nesta versão.
- **Alternativas consideradas**: Página dedicada via rota lazy — rejeitada por sobrecarga.

### D2: Incluir `payments` diretamente no `GET /sales/:id`
- **Decisão**: Extend `findById` com `include: { payments: true }`
- **Rationale**: Frontend já tem `Sale.payments[]`. Gap foi de omissão no backend.
- **Alternativas consideradas**: `GET /payments?saleId=X` separado — rejeitado por latência extra.

### D3: Incluir `returnOrders` resumidos no `GET /sales/:id`
- **Decisão**: `include: { returnOrders: { select: { id, status, createdAt, total } } }`
- **Rationale**: Frontend precisa saber apenas se há devoluções e seus status. Nada mais.
- **Alternativas consideradas**: `GET /returns?saleId=X` — rejeitado por complexidade no frontend.

### D4: Botão "Iniciar Devolução" → navegação com parâmetro
- **Decisão**: `router.navigate(['/returns/new'], { queryParams: { saleId } })` + fechar modal
- **Rationale**: `ReturnFormComponent` já existe e lida com `saleId` via query param.
- **Alternativas consideradas**: Modal aninhado — rejeitado por má UX (profundidade de modais).

### D5: Desabilitar botão RMA para vendas já com devolução aberta
- **Decisão**: Verificar se `sale.returns.some(r => ['REQUESTED','APPROVED'].includes(r.status))`; se sim, botão desabilitado com tooltip explicativo.
- **Rationale**: FR-008 e US2 SC-003 exigem feedback claro sobre devoluções em andamento.
