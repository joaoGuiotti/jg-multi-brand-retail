# Feature Specification: Financeiro Completo & DRE Simplificada

**Feature Branch**: `010-finance-dre`  
**Created**: 2026-05-29  
**Status**: Draft  
**Input**: User description: "Seguir com plano para sprint 7 > **Financeiro Completo & DRE**"

## Clarifications

### Session 2026-05-29
- Q: A DRE e o Fluxo de Caixa precisam ser exportáveis em algum formato na v1, ou apenas a visualização em tela é suficiente? → A: Apenas exportação em PDF
- Q: Existe alguma restrição de acesso sobre quem pode visualizar a DRE e gerenciar contas a pagar/receber? → A: Apenas usuários com role ADMIN ou SUPER_ADMIN podem acessar o módulo financeiro.
- Q: Como o sistema deve garantir que o cálculo do CMV (Custo de Mercadorias Vendidas) reflita o custo real da época da venda, mesmo que o custo atual do produto mude? → A: Gravar o custo do produto de forma imutável no momento da venda (ex: no SaleItem).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestão de Contas a Receber Automáticas (Priority: P1)

Como gerente financeiro, quero que as vendas realizadas a prazo (boleto, crediário próprio) gerem automaticamente "contas a receber", para que eu possa acompanhar e dar baixa nos pagamentos sem redigitar dados.

**Why this priority**: Fundamental para garantir que as vendas faturadas sejam efetivamente cobradas e acompanhadas, garantindo o fluxo de caixa.

**Independent Test**: Can be fully tested by creating a sale with "Boleto" payment method and verifying that a corresponding receivable account is created in the financial module with the correct due date and amount.

**Acceptance Scenarios**:

1. **Given** uma venda concluída com método de pagamento a prazo, **When** o sistema processa a venda, **Then** cria um registro de "Conta a Receber" com status pendente e atrelado ao tenant.
2. **Given** uma conta a receber pendente, **When** o cliente realiza o pagamento, **Then** o usuário pode dar baixa (marcar como paga) registrando a data do pagamento.

---

### User Story 2 - Gestão Manual de Contas a Pagar e Receber (Priority: P2)

Como administrador, quero poder cadastrar manualmente contas a pagar (aluguel, fornecedores, contas de consumo) e contas a receber extras, para manter o controle total do meu fluxo financeiro.

**Why this priority**: Necessário para registrar despesas operacionais (OPEX) e compras de estoque, essenciais para o cálculo correto da DRE e fluxo de caixa.

**Independent Test**: Can be fully tested by manually adding a payable account, editing it, and marking it as paid.

**Acceptance Scenarios**:

1. **Given** a necessidade de registrar uma despesa, **When** o usuário preenche o formulário com categoria (ex: aluguel), valor, e data de vencimento, **Then** o sistema registra a "Conta a Pagar".
2. **Given** contas a pagar cadastradas, **When** o usuário acessa o painel, **Then** ele visualiza alertas de contas vencidas e a vencer próximas.

---

### User Story 3 - Visualização do Fluxo de Caixa (Priority: P2)

Como gestor, quero visualizar um fluxo de caixa simplificado com as entradas e saídas diárias/mensais, para prever a saúde financeira do negócio.

**Why this priority**: Fornece visibilidade rápida da liquidez e do saldo esperado nos próximos dias.

**Independent Test**: Can be fully tested by creating payables and receivables for specific dates and verifying the aggregated totals match on the cash flow dashboard.

**Acceptance Scenarios**:

1. **Given** registros financeiros no mês atual, **When** o usuário acessa o fluxo de caixa, **Then** o sistema exibe o total de entradas (recebimentos) e saídas (pagamentos) agregados por dia ou mês.

---

### User Story 4 - Demonstração do Resultado do Exercício (DRE) (Priority: P3)

Como gestor, quero visualizar o relatório de DRE, que me mostre a Receita Bruta, CMV (Custo de Mercadorias Vendidas), Despesas Operacionais e o Lucro Líquido, para avaliar a real rentabilidade do negócio.

**Why this priority**: Entrega a visão de rentabilidade. O CMV é calculado a partir do custo dos produtos vendidos, fornecendo uma métrica valiosa que PDVs simples não têm.

**Independent Test**: Can be fully tested by completing sales with known product cost prices, registering operational expenses, and validating the final net profit calculation in the DRE report.

**Acceptance Scenarios**:

1. **Given** vendas concluídas e despesas operacionais registradas num mês, **When** o usuário gera a DRE mensal, **Then** o sistema calcula: (Receitas) - (CMV baseado nos custos) - (Despesas) = (Lucro Líquido).

### Edge Cases

- What happens when a sale generating a receivable is cancelled? (The receivable should be cancelled or reversed).
- How does system handle partial payments of accounts receivable? (For v1, we assume full payment only, or partial requires manual adjustments).
- What happens when the product cost price changes over time? (CMV reflects the cost at the time of sale because the cost is recorded immutably in the SaleItem).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to manually create, edit, and cancel Accounts Payable and Accounts Receivable.
- **FR-002**: System MUST automatically generate an Account Receivable when a sale is completed using an installment or deferred payment method (e.g., Boleto).
- **FR-003**: System MUST allow marking accounts as PAID, recording the payment date.
- **FR-004**: System MUST aggregate and display daily and monthly cash flow (inflows vs outflows).
- **FR-005**: System MUST generate a simplified DRE report for a given period.
- **FR-006**: System MUST calculate the CMV (Cost of Goods Sold) based on the cost price of the products sold during the period.
- **FR-007**: System MUST calculate Net Profit dynamically based on Gross Revenue, CMV, and Operational Expenses.
- **FR-008**: System MUST allow exporting the DRE and Cash Flow reports in PDF format.

### Key Entities

- **FinancialAccount**: Represents either a payable or receivable, containing amount, due date, status (Pending, Paid, Overdue, Cancelled), and a category (e.g., Supplier, Rent, Sale).
- **CashFlowEntry**: Aggregated view of inflows and outflows for reporting.
- **DREStatement**: Calculated report structure containing Revenue, Cost of Goods Sold, Gross Profit, Expenses, and Net Profit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view the current month's DRE and Cash Flow in less than 2 seconds, handling datasets of up to 100,000 transactions.
- **SC-002**: Sales with deferred payments automatically reflect in receivables with 100% accuracy.
- **SC-003**: DRE Net Profit calculation matches manual accounting for the same inputs perfectly.

## Assumptions

- Users have stable internet connectivity.
- Partial payments of accounts are out of scope for v1 (accounts are fully pending or fully paid).
- Product cost prices are defined in the inventory module at the time of sale to calculate CMV.
- All financial data is strictly segregated by Tenant.
- Access to the financial module (DRE, Cash Flow, Payables, Receivables) is restricted to users with `ADMIN` or `SUPER_ADMIN` roles.
