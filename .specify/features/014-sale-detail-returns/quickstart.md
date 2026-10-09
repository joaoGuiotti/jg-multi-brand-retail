# Quickstart: Validação e Teste do Detalhamento de Devoluções na Modal de Venda

**Feature**: `014-sale-detail-returns`  
**Branch**: `014-sale-detail-returns`  

---

## 1. Pré-requisitos
- Node.js 20+ instalado
- Repositório clonado e dependências instaladas (`npm ci` ou `npm install`)

---

## 2. Executando os Testes Automatizados

### Frontend (Componente de Detalhes da Venda)
Para executar os testes unitários da modal de detalhes da venda com Vitest/Jest via Nx:
```bash
npx nx test frontend --testFile=sale-detail-modal.component.spec.ts
```

### Backend (Use Case e Repositório de Vendas)
Para validar o endpoint e mapper de vendas:
```bash
npx nx test backend --testFile=get-sale.use-case.spec.ts
```

---

## 3. Validação Visual Local (Desenvolvimento)

1. Inicie a API e o Frontend:
   ```bash
   npx nx serve backend
   npx nx serve frontend
   ```
2. Acesse a aplicação no navegador em `http://localhost:4200`.
3. Navegue até o menu **Vendas** (`/sales`).
4. Localize uma venda com devoluções associadas (ou gere uma nova devolução em `/returns/new`).
5. Clique em **Ver Detalhes** (ícone de olho ou ação da linha) para abrir a modal `SaleDetailModalComponent`.
6. Confirme a renderização da seção **Devoluções Associadas**:
   - Cabeçalho com status, modalidade de reembolso e data.
   - Detalhamento de itens com SKU, quantidade, preço unitário e badge de condição física.
   - Resumo do total devolvido.
