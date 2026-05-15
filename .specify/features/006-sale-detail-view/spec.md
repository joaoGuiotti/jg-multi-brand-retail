# Feature Specification: Sale Detail View

**Feature Branch**: `006-sale-detail-view`  
**Created**: 2026-05-15  
**Status**: Draft  
**Input**: User description: "Visualizar detalhes completos de uma venda: itens vendidos, formas de pagamento utilizadas, valores, status e opção de iniciar devolução"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar Detalhes de uma Venda (Priority: P1)

Como vendedor ou administrador, quero visualizar todos os detalhes de uma venda específica — incluindo os produtos vendidos, quantidades, valores unitários, descontos aplicados, formas de pagamento e status — para ter rastreabilidade completa de cada transação.

**Why this priority**: É o fluxo mais crítico do módulo: sem a visualização de detalhes, o usuário finaliza uma venda no POS e não tem como confirmar o que foi vendido, quanto foi cobrado ou como foi pago. É a base para todas as demais funcionalidades (devolução, auditoria, reimpressão).

**Independent Test**: Pode ser testado realizando uma venda no POS, navegando até o Histórico de Vendas, clicando em uma venda e verificando que os itens, quantidades, valores e forma de pagamento são exibidos corretamente.

**Acceptance Scenarios**:

1. **Given** estou no Histórico de Vendas, **When** clico em "Ver detalhes" de uma venda, **Then** sou navegado para a página de detalhes da venda com todos os seus itens listados (nome do produto, quantidade, preço unitário, desconto, subtotal).
2. **Given** estou na página de detalhes de uma venda, **When** a venda possui múltiplos pagamentos (ex: parte em PIX, parte em cartão), **Then** todos os pagamentos são exibidos com método, valor e status de cada um.
3. **Given** estou na página de detalhes, **When** a venda está com status COMPLETED, **Then** o status é exibido com destaque visual (cor e ícone), e o total pago confere com o valor total da venda.
4. **Given** estou na página de detalhes, **When** a venda está com status PENDING, **Then** o valor pendente de pagamento é destacado e o status reflete claramente que a venda ainda não foi quitada.
5. **Given** estou na página de detalhes, **When** a venda está com status CANCELLED, **Then** é exibida uma indicação visual clara de cancelamento e nenhuma ação destrutiva está disponível.

---

### User Story 2 - Iniciar Devolução a Partir da Venda (Priority: P1)

Como vendedor ou administrador, quero poder iniciar o processo de devolução diretamente da página de detalhes de uma venda COMPLETED, para evitar ter que navegar para uma seção separada para solicitar o RMA.

**Why this priority**: A jornada atual de devolução (RMA) está implementada, mas o ponto de entrada "Iniciar Devolução" estava previsto na venda e nunca foi conectado. Ter esse botão diretamente na venda é essencial para a completude do fluxo operacional.

**Independent Test**: Pode ser testado abrindo os detalhes de uma venda COMPLETED, clicando em "Iniciar Devolução" e verificando que o formulário de devolução é pré-preenchido com os itens daquela venda.

**Acceptance Scenarios**:

1. **Given** estou na página de detalhes de uma venda com status COMPLETED, **When** clico em "Iniciar Devolução", **Then** sou direcionado ao formulário de devolução com os itens da venda já carregados para seleção.
2. **Given** estou na página de detalhes de uma venda com status PENDING ou CANCELLED, **When** visualizo a página, **Then** o botão "Iniciar Devolução" não é exibido (ou está desabilitado com tooltip explicativo).
3. **Given** a venda já possui uma devolução em andamento (status REQUESTED ou APPROVED), **When** visualizo os detalhes, **Then** uma seção de "Devoluções Associadas" exibe o status atual da devolução existente, e o botão "Iniciar Devolução" não permite abertura de uma segunda solicitação para os mesmos itens.

---

### User Story 3 - Resumo Financeiro da Venda (Priority: P2)

Como administrador, quero ver um resumo financeiro consolidado da venda — subtotal, total de descontos, total pago e eventual saldo pendente — para ter controle financeiro preciso por transação.

**Why this priority**: Embora os dados individuais (itens e pagamentos) estejam cobertos na US1, um bloco de resumo financeiro consolidado facilita a auditoria e evita erros de leitura em vendas complexas.

**Independent Test**: Pode ser testado abrindo uma venda com desconto e múltiplas formas de pagamento, e verificando que o resumo exibe subtotal, desconto total, total da venda e total pago de forma correta e coerente.

**Acceptance Scenarios**:

1. **Given** estou na página de detalhes de qualquer venda, **When** visualizo o bloco de resumo financeiro, **Then** são exibidos: subtotal dos itens, total de descontos aplicados, valor total da venda e total pago (ou pendente se aplicável).
2. **Given** a venda tem desconto no nível da venda (além de descontos por item), **When** visualizo o resumo, **Then** os descontos por item e o desconto global são apresentados de forma diferenciada e o total reflete a soma correta.

---

### Edge Cases

- O que acontece quando uma venda não possui nenhum pagamento registrado (venda PENDING sem pagamento)?  
  → A seção de pagamentos exibe "Nenhum pagamento registrado" e o valor total pendente é destacado.
- O que acontece quando o usuário tenta acessar diretamente a URL de detalhes de uma venda de outro tenant?  
  → O backend retorna 403/404 e o frontend exibe uma página de erro sem vazar informações da venda.
- O que acontece quando a venda tem itens de um produto que foi excluído/inativado depois da venda?  
  → Os itens são exibidos com o nome e valores registrados no momento da venda, mesmo que o produto não exista mais.
- O que acontece se o usuário já iniciou uma devolução parcial (apenas alguns itens)?  
  → A US2 US3 trata isso: itens já devolvidos aparecem marcados, e apenas itens elegíveis ficam disponíveis para nova devolução.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir uma página de detalhes acessível a partir do Histórico de Vendas para qualquer venda do tenant autenticado.
- **FR-002**: O sistema DEVE listar todos os itens da venda com: nome do produto, quantidade, preço unitário, desconto por item e subtotal do item.
- **FR-003**: O sistema DEVE exibir todas as formas de pagamento utilizadas na venda com: método, valor e status de cada pagamento.
- **FR-004**: O sistema DEVE apresentar um bloco de resumo financeiro com: subtotal dos itens, total de descontos, valor total da venda e valor total pago (ou pendente).
- **FR-005**: O sistema DEVE exibir o status atual da venda com diferenciação visual clara entre PENDING, COMPLETED e CANCELLED.
- **FR-006**: O sistema DEVE exibir o botão "Iniciar Devolução" exclusivamente para vendas com status COMPLETED.
- **FR-007**: Ao acionar "Iniciar Devolução", o sistema DEVE navegar ao formulário de devolução (RMA) com os dados da venda pré-carregados.
- **FR-008**: O sistema DEVE exibir devoluções já associadas à venda (se existirem), com seus respectivos status.
- **FR-009**: O sistema DEVE garantir que apenas usuários do tenant correto possam acessar os detalhes de uma venda (isolamento multi-tenant).
- **FR-010**: Os dados dos itens vendidos DEVEM refletir os valores registrados no momento da venda, independentemente de alterações posteriores no cadastro do produto.

### Key Entities

- **Sale (Venda)**: Representa a transação completa. Possui status (PENDING, COMPLETED, CANCELLED), data/hora, operador, desconto global e total.
- **SaleItem (Item da Venda)**: Linha individual de produto dentro da venda. Possui produto, quantidade, preço unitário, desconto unitário e subtotal calculado.
- **Payment (Pagamento)**: Registro de pagamento associado à venda. Possui método (CASH, PIX, CREDIT_CARD, DEBIT_CARD, STORE_CREDIT), valor e status.
- **ReturnOrder (Devolução)**: Devolução associada à venda. Referenciada na página de detalhes para indicar devoluções em andamento ou concluídas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue acessar os detalhes de qualquer venda a partir do Histórico de Vendas em no máximo 2 cliques.
- **SC-002**: Todos os valores financeiros exibidos (subtotal, desconto, total, pagamentos) são matematicamente coerentes entre si — zero divergências em 100% das vendas testadas.
- **SC-003**: O botão "Iniciar Devolução" aparece exclusivamente em vendas COMPLETED, sem falsos positivos em vendas PENDING ou CANCELLED.
- **SC-004**: O acesso a detalhes de venda de outro tenant resulta em erro de acesso, sem exposição de dados — 100% de conformidade com isolamento multi-tenant.
- **SC-005**: Em vendas com devolução já iniciada, a seção de devoluções associadas exibe o status atualizado sem necessidade de recarregar a página.

## Assumptions

- O usuário já está autenticado e o tenant está ativo.
- Os dados históricos dos itens (preço, desconto) são imutáveis após a criação da venda — o sistema não retroage preços.
- Apenas um botão "Iniciar Devolução" por venda; o formulário de RMA existente (Feature 004) é reutilizado como destino da navegação.
- A página de detalhes é acessada via navegação a partir do Histórico de Vendas (`/sales`), não há acesso por busca global nesta versão.
- Reimpressão de recibo/cupom está fora do escopo desta feature (será tratada em feature separada).
- Não há edição de venda após criação — a página é estritamente leitura.
