# Quickstart: Sale Detail View

**Feature**: `006-sale-detail-view`  
**Date**: 2026-05-15

## Propósito

Este guia detalha como testar a visualização completa de detalhes de uma venda, desde a sua criação até o preenchimento de todos os dados no modal do Histórico de Vendas.

## Setup e Preparação

1. Suba os containers do banco de dados:
   ```bash
   docker-compose up -d postgres
   ```
2. Certifique-se de que o backend e frontend estão rodando:
   ```bash
   npm run start:dev --workspace=apps/backend
   npm start --workspace=apps/frontend
   ```

## Fluxo de Teste End-to-End

### Passo 1: Preparar dados (via UI)
1. Acesse o sistema e faça login (ex: `admin@lojademo.com` / `loja123`).
2. Acesse a tela de POS (`/pos`).
3. Adicione 2 ou mais itens ao carrinho.
4. Clique em "Cobrar" ou "Checkout".
5. Realize pagamentos divididos:
   - Adicione R$ 50,00 em PIX.
   - Adicione o valor restante em Cartão de Crédito.
6. Finalize a venda.

### Passo 2: Validar o Modal de Detalhes
1. Navegue para o Histórico de Vendas (`/sales`).
2. A venda recém-criada deve estar no topo da lista com status "COMPLETED".
3. Clique no botão de "Visualizar" ou "Ver Detalhes" na linha da venda.
4. **Validações no Modal**:
   - [ ] A aba/seção de itens lista corretamente os produtos, quantidades e preços.
   - [ ] A seção "Payment Information" (Finanças) exibe os dois pagamentos (PIX e Cartão) com valores corretos.
   - [ ] O botão "Iniciar Devolução" está visível e ativo.

### Passo 3: Iniciar Devolução
1. Dentro do modal, clique em "Iniciar Devolução".
2. **Validações**:
   - [ ] O modal deve fechar automaticamente.
   - [ ] A navegação deve ocorrer para `/returns/new` (ou similar) carregando os itens da venda.

### Passo 4: Validar Estado de Devolução (Edge Case)
1. Conclua o pedido de devolução na tela de RMA.
2. Volte ao Histórico de Vendas (`/sales`) e abra novamente os detalhes da mesma venda.
3. **Validações**:
   - [ ] O status da venda agora deve refletir a devolução ou a seção de devoluções deve exibir o RMA recém-criado.
   - [ ] O botão "Iniciar Devolução" deve estar desabilitado ou oculto.

## Verificação Técnica (API)

Caso queira validar o backend isoladamente:

```bash
# Obtenha o ID da última venda e seu token
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/sales

# Acesse os detalhes
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/sales/<SALE_ID>
```
**Resultado esperado**: O JSON de resposta deve conter os arrays `payments` e `returns` preenchidos.
