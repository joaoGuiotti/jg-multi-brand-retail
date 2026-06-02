# Feature Specification: Comissionamento Inteligente (% Fixa v1)

**Feature Branch**: `011-fixed-commissions`  
**Created**: 2026-06-02  
**Status**: Draft  
**Input**: User description: "Seguir plano para Sprint 4 Módulo 4: Comissionamento Inteligente (% Fixa v1)"

## Clarifications

### Session 2026-06-02
- Q: Em vendas pagas a prazo ou de forma parcelada, a comissão do vendedor é considerada ganha integralmente no momento da venda, ou ela deve ser atrelada aos pagamentos futuros? → A: Integral no fechamento (A comissão é creditada 100% ao vendedor assim que a venda for concluída, assumindo o lojista o risco de inadimplência).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configuração de Metas e Comissão (Priority: P1)

Como Administrador da Loja (Admin), eu quero definir uma porcentagem fixa de comissão para a loja e cadastrar metas de vendas mensais para cada vendedor, para que eu possa incentivar e comissionar minha equipe de forma justa.

**Why this priority**: É a base do módulo. Sem a configuração do percentual e das metas, o sistema não tem os parâmetros necessários para calcular a comissão gerada nas vendas.

**Independent Test**: Pode ser testado acessando o painel de configurações de comissão, definindo a % fixa da loja (ex: 5%) e cadastrando uma meta de R$ 10.000,00 para o Vendedor A no mês atual, e validando a gravação no banco de dados isolada por Tenant.

**Acceptance Scenarios**:

1. **Given** que o Admin está no painel de configurações de comissão, **When** ele define o percentual fixo da loja e salva, **Then** o sistema registra esse percentual para o tenant ativo.
2. **Given** a tela de gestão de metas, **When** o Admin define uma meta de vendas para o mês X para um vendedor, **Then** o sistema grava essa meta associada ao vendedor e ao tenant.

---

### User Story 2 - Cálculo Automático da Comissão por Venda (Priority: P1)

Como Vendedor, eu quero que minha comissão seja calculada e registrada automaticamente logo após a conclusão de uma venda, para que meus ganhos sejam sempre apurados de forma imediata e transparente.

**Why this priority**: É a operação principal de backoffice que automatiza as regras financeiras e evita cálculos manuais trabalhosos.

**Independent Test**: Pode ser testado realizando uma venda no valor de R$ 100,00 por um vendedor (onde a loja possui comissão fixa de 5%). Ao finalizar a venda, o sistema deve criar automaticamente um registro de comissão de R$ 5,00 vinculado àquela venda e ao vendedor.

**Acceptance Scenarios**:

1. **Given** que a configuração de comissão fixa está ativa, **When** o vendedor conclui (`COMPLETED`) uma venda, **Then** o sistema deve aplicar o percentual de comissão sobre o total líquido da venda e gravar o registro de ganho para o vendedor responsável.
2. **Given** uma venda concluída, **When** a venda for cancelada ou sofrer devolução total no módulo de RMA, **Then** o sistema deve estornar ou inativar a comissão correspondente para evitar pagamentos indevidos.

---

### User Story 3 - Dashboard de Acompanhamento do Vendedor (Priority: P2)

Como Vendedor, eu quero acessar um painel onde eu possa visualizar minhas vendas do mês, a meta estabelecida, o % atingido e o valor de comissões acumuladas, para que eu possa acompanhar meu progresso e me sentir motivado a bater a meta.

**Why this priority**: Entrega a experiência e o valor final de engajamento para a equipe de vendas, tornando as metas e os ganhos palpáveis no dia a dia.

**Independent Test**: Pode ser testado logando como um vendedor específico e verificando se os ponteiros/indicadores de Meta, Vendas Realizadas e Comissões Acumuladas batem perfeitamente com os dados das vendas concluídas e metas configuradas.

**Acceptance Scenarios**:

1. **Given** que o vendedor está visualizando o dashboard, **When** ele abre o card de metas do mês atual, **Then** ele visualiza um gráfico (ex: barra de progresso) indicando o total vendido em relação à meta definida.
2. **Given** a ocorrência de uma nova venda autorizada pelo próprio vendedor, **When** ele acessa o dashboard, **Then** o valor acumulado de comissão e o progresso da meta devem refletir a soma atualizada em tempo real (ou próximo a isso).

---

### Edge Cases

- **Devoluções parciais:** Se houver uma devolução parcial, a comissão já creditada do vendedor deverá sofrer um ajuste (débito proporcional)? (Assumiremos que sim, via evento do módulo de Returns).
- **Alteração do percentual:** Se o Admin alterar a comissão de 5% para 7% no meio do mês, o que acontece com as vendas antigas? (As comissões são imutáveis e calculadas no momento da venda, usando o valor que estava em vigor no exato instante do fechamento).
- **Sem meta definida:** Se um vendedor realizar uma venda, mas não tiver uma meta definida para aquele mês, ele ainda ganha a comissão padrão? (Sim, comissão e metas são métricas independentes).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que administradores configurem uma taxa percentual fixa de comissionamento válida para toda a loja (Tenant).
- **FR-002**: O sistema MUST permitir a criação, edição e visualização de metas de vendas mensais (em R$) por Vendedor (usuário).
- **FR-003**: O sistema MUST interceptar a conclusão de vendas (`COMPLETED`) e calcular o valor da comissão com base no percentual ativo do Tenant.
- **FR-004**: O sistema MUST salvar um registro de comissão (`CommissionTransaction` ou similar) contendo o valor financeiro ganho, atrelado à venda e ao vendedor que a originou.
- **FR-005**: O sistema MUST exibir um painel para os vendedores logados consultarem seu atingimento de meta (Vendas vs Meta Mensal) e comissões acumuladas no período.
- **FR-006**: O sistema MUST ajustar/estornar o valor das comissões em casos de estorno ou devolução de vendas originadas pelo módulo de RMA.

### Key Entities *(include if feature involves data)*

- **CommissionConfig / Tenant (Extensão):** Guardará o `fixedPercentage` para o Tenant (caso a comissão fixa seja unificada).
- **SalesTarget (Meta):** Registrará `tenantId`, `userId`, `month`, `year`, e `amountTarget` (valor em R$).
- **Commission:** Gravará o ganho individual. Atributos chave: `tenantId`, `userId`, `saleId`, `percentageApplied`, `amountEarned`, `status` (PENDING, PAID, REVERSED) e data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das vendas fechadas geram um registro de comissão preciso com latência inferior a 1 segundo adicional no processo de checkout.
- **SC-002**: Vendedores conseguem acessar seu resumo de comissão e metas instantaneamente (tempo de carregamento inferior a 500ms).
- **SC-003**: Vazamento zero entre Tenants: Comissões e metas de um lojista jamais aparecem para a equipe de outro lojista.

## Assumptions

- O tipo de comissão suportado na v1 é unicamente o `FIXED_PERCENTAGE` (Taxa fixa para a loja/tenant inteira).
- Todos os usuários com perfil/role de vendedor (User) são elegíveis a receber comissões e ter metas.
- A baixa (pagamento) das comissões ocorre fora do sistema (no RH contábil), sendo nosso sistema apenas o apurador do valor devido.
- As comissões são geradas a partir do momento em que a venda entra no status `COMPLETED` e usa o valor líquido da venda (subtotal - descontos). A comissão é apurada de forma **integral no fechamento da venda**, independentemente de pagamentos futuros/parcelados, cabendo à loja o risco de inadimplência.
