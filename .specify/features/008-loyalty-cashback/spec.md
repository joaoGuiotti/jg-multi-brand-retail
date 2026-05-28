# Feature Specification: 008-loyalty-cashback

**Feature Branch**: `feature/008-loyalty-cashback`  
**Created**: 2026-05-28  
**Status**: Draft  
**Input**: User description: "Implementar o Programa de Fidelidade & Cashback"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configuração do Programa de Fidelidade (Priority: P1)

Como **Administrador da Loja (Admin)**, eu quero configurar as regras de fidelidade e cashback do meu estabelecimento para que eu possa incentivar a recorrência de compras de forma sustentável para o meu negócio.

**Why this priority**: É a fundação do programa. Sem as regras do tenant (fator de acúmulo, limite de desconto, taxa de resgate), o sistema não consegue calcular os pontos ou processar os resgates no PDV.

**Independent Test**: Pode ser testado de forma isolada salvando um formulário de configurações com valores específicos (ex: R$ 1,00 = 1 ponto, mínimo 100 pontos para resgate, limite máx de 50% de desconto) e verificando se essas configurações são recuperadas corretamente para o Tenant.

**Acceptance Scenarios**:

1. **Given** que o Admin está no painel de configurações de fidelidade,  
   **When** ele preenche os campos com parâmetros válidos e salva,  
   **Then** o sistema deve aplicar e persistir essas regras exclusivamente para o Tenant ativo.
2. **Given** que o Admin tenta definir uma porcentagem máxima de desconto inválida (ex: 120% ou -5%),  
   **When** ele tenta salvar,  
   **Then** o sistema deve exibir um erro de validação e não alterar as configurações ativas.

---

### User Story 2 - Acúmulo Automático de Pontos de Fidelidade (Priority: P1)

Como **Vendedor (Operator/User)**, eu quero que o sistema calcule e acumule os pontos de fidelidade do cliente de forma automática ao concluir uma venda no PDV para que o processo de caixa seja rápido e sem atrito.

**Why this priority**: É o motor operacional de ganho de valor para o cliente final. O acúmulo automático garante integridade do saldo sem depender de ação manual do operador de caixa.

**Independent Test**: Pode ser testado realizando uma venda no valor de R$ 150,00 para um cliente cadastrado e verificando se o saldo da conta de fidelidade dele foi incrementado em 150 pontos (assumindo a taxa padrão 1:1) e se a transação correspondente do tipo `EARN` foi registrada.

**Acceptance Scenarios**:

1. **Given** que uma venda está sendo registrada no PDV para um cliente selecionado,  
   **When** o operador de caixa conclui a venda com sucesso,  
   **Then** o sistema deve calcular os pontos baseados no valor pago, atualizar o saldo da conta de fidelidade do cliente e registrar uma movimentação de ganho de pontos (`EARN`).
2. **Given** que uma venda está sendo registrada no PDV,  
   **When** a venda é concluída SEM um cliente identificado,  
   **Then** o sistema não deve computar ou acumular nenhum ponto de fidelidade.

---

### User Story 3 - Resgate de Cashback como Desconto no PDV (Priority: P2)

Como **Cliente da Loja (Customer)**, eu quero resgatar meus pontos acumulados como desconto em dinheiro no momento do pagamento no PDV para que eu me sinta recompensado por comprar na loja.

**Why this priority**: É a funcionalidade que gera o "efeito recompensa" e fecha o ciclo de fidelidade. Embora dependa do acúmulo (P1), é de extrema importância para o sucesso operacional.

**Independent Test**: Pode ser testado selecionando um cliente com 500 pontos (equivalente a R$ 5,00 de desconto) no PDV, aplicando o desconto total no fechamento da venda de R$ 100,00 e verificando se o total a pagar reduziu para R$ 95,00 e se o saldo de pontos do cliente reduziu para 0.

**Acceptance Scenarios**:

1. **Given** que um cliente está selecionado em uma venda ativa e possui saldo de pontos superior ao resgate mínimo configurado,  
   **When** o vendedor aplica os pontos como desconto no PDV,  
   **Then** o sistema deve aplicar o desconto em reais na venda, deduzir os pontos correspondentes da conta do cliente e gerar uma transação de débito de pontos (`REDEEM`).
2. **Given** que um cliente possui saldo suficiente, mas o valor do desconto solicitado excede o limite máximo de desconto configurado pelo Admin (ex: excede 50% do total da compra),  
   **When** o vendedor tenta aplicar o desconto máximo de pontos,  
   **Then** o sistema deve limitar o desconto automaticamente ao teto máximo permitido e informar o operador.

---

### User Story 4 - Extrato de Pontos & Ajuste Manual de Saldo (Priority: P3)

Como **Administrador da Loja (Admin)**, eu quero visualizar o extrato de fidelidade dos clientes e poder fazer ajustes manuais no saldo (com justificativa) para que eu possa resolver disputas de clientes ou corrigir erros operacionais de caixa de forma auditada.

**Why this priority**: Operações de suporte e auditoria. Garante flexibilidade para o lojista contornar eventuais problemas físicos no caixa ou compras não registradas.

**Independent Test**: Pode ser testado acessando a ficha do cliente, realizando um ajuste manual de +100 pontos com a justificativa "Cliente esqueceu de se identificar na compra anterior" e confirmando se o saldo foi para 100 e se a transação do tipo `ADJUST` foi salva com a respectiva justificativa.

**Acceptance Scenarios**:

1. **Given** que o Admin está visualizando a ficha de fidelidade de um cliente,  
   **When** ele executa um ajuste de crédito ou débito manual e insere a justificativa obrigatória,  
   **Then** o sistema deve atualizar o saldo, gerar um registro do tipo `ADJUST` e gravar o autor e a justificativa para fins de auditoria.

---

### Edge Cases

- **Devolução de Venda (Estorno de Pontos):** O que acontece com os pontos acumulados quando uma venda é devolvida no módulo RMA?
  - *Comportamento esperado:* Se uma venda com acúmulo de pontos for devolvida/cancelada, os pontos obtidos naquela venda devem ser automaticamente debitados da conta do cliente para evitar fraudes. Caso o cliente já tenha gasto os pontos, a conta de fidelidade ficará temporariamente com saldo negativo.
- **Resgate Simultâneo (Race Condition):** O que acontece se o mesmo cliente for selecionado em dois caixas diferentes simultaneamente e ambos tentarem resgatar os mesmos pontos?
  - *Comportamento esperado:* O sistema deve usar transações com travas (*pessimistic lock* ou validação de concorrência) no banco para garantir que o primeiro resgate zere o saldo e o segundo caixa receba um erro informando "Saldo insuficiente".

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema deve permitir que o Admin configure as regras do programa de fidelidade do seu tenant (Ativo/Inativo, Fator de acúmulo de pontos por real, Taxa de conversão de pontos em desconto, Limite mínimo de pontos para resgate e Limite máximo de % de desconto sobre o total do carrinho).
- **FR-002**: O sistema deve criar automaticamente uma conta de fidelidade (`LoyaltyAccount`) para cada cliente cadastrado no Tenant.
- **FR-003**: O sistema deve calcular e acumular pontos automaticamente ao concluir (`COMPLETED`) uma venda associada a um cliente.
- **FR-004**: O sistema deve permitir que o vendedor selecione e aplique pontos de fidelidade como método de desconto no PDV, atualizando o total líquido da venda reativamente.
- **FR-005**: O sistema deve gravar registros imutáveis de transações de fidelidade (`LoyaltyTransaction`) para cada alteração de saldo, suportando os tipos: `EARN` (acúmulo por compra), `REDEEM` (resgate no PDV) e `ADJUST` (ajuste administrativo).
- **FR-006**: O sistema deve acumular pontos calculados sobre o **total líquido pago pelo cliente** (descontando quaisquer cupons ou descontos promocionais aplicados).
- **FR-007**: O sistema deve definir os pontos como **sem data de expiração (nunca expiram)** por padrão na v1 (salvando o campo correspondente como nulo no banco de dados).
- **FR-008**: Apenas usuários com permissão de `ADMIN` ou `SUPER_ADMIN` podem alterar as configurações do programa de fidelidade e realizar ajustes manuais de saldo de pontos dos clientes.

---

### Key Entities

- **LoyaltyProgram (Configuração do Programa):**
  - Representa as regras do programa de fidelidade de um Tenant específico.
  - Atributos principais: `tenantId`, `pointsPerReal` (reais para pontos), `redeemRatio` (pontos para reais), `minRedeemPoints` (mínimo de resgate), `maxDiscountPct` (máximo de desconto em % por venda), `active` (status).
- **LoyaltyAccount (Conta de Fidelidade):**
  - Conta corrente de pontos de um cliente em um Tenant.
  - Atributos principais: `tenantId`, `customerId`, `balance` (saldo atual), `totalEarned` (acumulado histórico), `totalRedeemed` (resgatado histórico).
- **LoyaltyTransaction (Movimentação de Fidelidade):**
  - Histórico imutável de movimentação da conta de pontos do cliente.
  - Atributos principais: `accountId`, `type` (EARN | REDEEM | ADJUST), `points` (valor positivo ou negativo), `saleId` (opcional, link com a venda), `reason` (justificativa de ajustes).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O tempo de resposta para aplicar o desconto de fidelidade no checkout do PDV e recalcular os totais deve ser inferior a 300ms na interface.
- **SC-002**: 100% das vendas finalizadas com cliente identificado devem gerar a transação correspondente de acúmulo de pontos no banco de dados em menos de 1 segundo.
- **SC-003**: 100% das tentativas de resgatar pontos acima do saldo disponível do cliente devem ser rejeitadas no servidor com aviso claro ao operador de caixa.
- **SC-004**: Isolamento absoluto: 0% de vazamento de dados de fidelidade de clientes entre diferentes tenants (um cliente do Tenant A nunca pode ter pontos acumulados ou resgatados no Tenant B).

---

## Assumptions

- O sistema já possui um fluxo funcional de vendas e cadastro de clientes que servem de base para a fidelização.
- O e-mail/notificação ao cliente sobre os pontos acumulados não será enviado na v1 (focado apenas no PDV físico).
- Ajustes manuais de saldo geram logs auditáveis automáticos que não podem ser apagados ou alterados no banco de dados.
- O resgate de pontos será feito exclusivamente por clientes físicos devidamente registrados com CPF/Documento ou celular único no Tenant.
