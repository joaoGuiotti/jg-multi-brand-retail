# Quickstart Guide: 008-loyalty-cashback

Este guia descreve como preparar o ambiente de desenvolvimento, aplicar as modificações no banco de dados e testar as APIs do Módulo de Fidelidade & Cashback no **Retail OS**.

---

## 🛠️ Configuração do Ambiente

### 1. Aplicar as Migrações do Prisma
No terminal do backend (`apps/backend/`), execute o comando para criar e aplicar a migração no PostgreSQL:

```bash
cd apps/backend
npx prisma migrate dev --name add_loyalty_and_cashback
```

### 2. Popular o Banco de Dados (Seed)
Atualize o arquivo de seed do projeto para gerar regras de fidelidade padrão ativas para os Tenants existentes de teste. Depois rode:

```bash
npm run seed
```

---

## 🧪 Roteiro de Testes Manuais (API)

Abaixo estão os payloads para testar a API REST usando cURL. 
*Nota: Lembre-se de substituir `{{token}}` pelo JWT válido de autenticação obtido no login e `{{tenantId}}` pelo id do seu tenant.*

### 1. Configurar as Regras de Fidelidade (ADMIN)
Defina o fator de acúmulo (1 real = 1 ponto) e limite máximo de desconto (50%).

```bash
curl -X PUT "http://localhost:3000/api/v1/loyalty/config" \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "pointsPerReal": 1.00,
    "redeemRatio": 0.0100,
    "minRedeemPoints": 100,
    "maxDiscountPct": 50.00
  }'
```

### 2. Buscar Conta de Fidelidade do Cliente (Vendedor/Admin)
Busca a carteira de pontos atualizada do cliente selecionado.

```bash
curl -X GET "http://localhost:3000/api/v1/loyalty/accounts/customer/{{customerId}}" \
  -H "Authorization: Bearer {{token}}"
```

### 3. Simular Acúmulo de Pontos (Evento de Venda Concluída)
Conclua uma venda no PDV de R$ 200,00 e certifique-se de que a conta de fidelidade do cliente recebeu +200 pontos.

```bash
curl -X GET "http://localhost:3000/api/v1/loyalty/accounts/customer/{{customerId}}" \
  -H "Authorization: Bearer {{token}}"
# Resposta esperada: balance: 200, totalEarned: 200
```

### 4. Resgatar Desconto de Cashback no PDV (Vendedor/Operador)
Debite 100 pontos da conta do cliente para gerar R$ 1,00 de desconto na venda ativa.

```bash
curl -X POST "http://localhost:3000/api/v1/loyalty/redeem" \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "{{customerId}}",
    "pointsToRedeem": 100,
    "saleId": "{{saleId}}"
  }'
```

### 5. Ajuste Manual de Saldo (ADMIN)
Adicione 50 pontos com justificativa de auditoria.

```bash
curl -X POST "http://localhost:3000/api/v1/loyalty/adjust" \
  -H "Authorization: Bearer {{token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "{{customerId}}",
    "points": 50,
    "reason": "Resolvendo disputa de pontos: Compra não registrada em 25/05/2026"
  }'
```
