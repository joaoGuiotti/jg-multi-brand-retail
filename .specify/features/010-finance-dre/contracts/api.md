# API Contracts: Finance Module

## Endpoints

### `GET /api/v1/finance/accounts`
- Query Params: `type` (PAYABLE|RECEIVABLE), `status`, `startDate`, `endDate`
- Response: `FinancialAccount[]`

### `POST /api/v1/finance/accounts`
- Body: `CreateAccountDto` (description, amount, dueDate, type, category)
- Response: `FinancialAccount`

### `PATCH /api/v1/finance/accounts/:id/pay`
- Body: `PayAccountDto` (paidAt)
- Response: `FinancialAccount`

### `GET /api/v1/finance/cash-flow`
- Query Params: `month`, `year`
- Response: `CashFlowStatementDto` (inflows, outflows by day)

### `GET /api/v1/finance/dre`
- Query Params: `month`, `year`
- Response: `DREStatementDto` (grossRevenue, cmv, grossProfit, expenses, netProfit)

### `GET /api/v1/finance/dre/pdf`
- Query Params: `month`, `year`
- Response: `application/pdf` binary stream
