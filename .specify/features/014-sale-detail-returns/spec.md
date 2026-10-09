# Feature Specification: Detalhamento de Devoluções na Modal de Venda

**Feature Branch**: `014-sale-detail-returns`  
**Created**: 2026-10-09  
**Status**: Draft  
**Input**: User description: "Ajustar sale-detail-modal para mostrar as devoluções de forma detalhada em forma de lista dentro dessa modal"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualização de Devoluções em Lista Detalhada (Priority: P1)

Como operador de caixa ou gerente de loja, quero visualizar uma lista detalhada de todas as devoluções associadas a uma venda diretamente dentro da modal de detalhes da venda, para que eu possa auditar itens devolvidos, quantidades, motivos e valores sem precisar navegar para outra tela.

**Why this priority**: É o objetivo central da funcionalidade. Atualmente a modal apresenta apenas informações superficiais (código e valor total), forçando o usuário a buscar informações adicionais em outras telas para entender o que foi devolvido.

**Independent Test**: Pode ser testado abrindo os detalhes de uma venda que possui devoluções registradas e confirmando que a seção de devoluções exibe uma lista estruturada contendo dados do pedido de devolução e o detalhamento de cada item devolvido (produto, quantidade, condição e valor).

**Acceptance Scenarios**:

1. **Given** que o usuário abre a modal de detalhes de uma venda que possui uma ou mais devoluções registradas,  
   **When** a seção de devoluções associadas for renderizada,  
   **Then** o sistema deve exibir uma lista com cada devolução contendo seu identificador, data/hora, status atual, modalidade de reembolso, motivo e o total reembolsado.

2. **Given** que uma devolução possui itens registrados,  
   **When** o usuário inspeciona a devolução na lista,  
   **Then** o sistema deve exibir a lista de itens devolvidos indicando o nome do produto, SKU/código, quantidade devolvida, valor unitário, valor total do item e a condição física do produto (ex.: bom estado, avariado, com defeito).

---

### User Story 2 - Navegação Clara e Estado Visual de Múltiplas Devoluções (Priority: P2)

Como atendente, quero que a lista de devoluções seja organizada de forma legível e expansível caso haja múltiplas devoluções, permitindo alternar entre a visão resumida e o detalhamento dos itens sem poluir o restante das informações da venda.

**Why this priority**: Garante boa usabilidade e ergonomia visual em vendas complexas ou que tiveram devoluções parciais em momentos distintos.

**Independent Test**: Pode ser testado abrindo uma venda com mais de uma devolução e verificando a possibilidade de expandir/recolher os itens de cada devolução e a clareza dos totais individuais.

**Acceptance Scenarios**:

1. **Given** uma venda com múltiplas devoluções parciais,  
   **When** o usuário visualiza a seção de devoluções,  
   **Then** cada registro de devolução deve estar claramente delimitado, com badge de status distinto e agrupamento próprio de seus itens correspondentes.

2. **Given** que o usuário analisa os itens de uma devolução,  
   **When** compara com os itens originais da venda,  
   **Then** os valores e quantidades devolvidos devem ser consistentes com os itens faturados na venda.

---

### User Story 3 - Tratamento de Vendas sem Devoluções (Priority: P3)

Como usuário do sistema, quero que uma venda sem devoluções apresente uma interface limpa e objetiva, sem elementos vazios ou mensagens confusas de devolução.

**Why this priority**: Evita ruído visual na experiência rotineira de consulta de vendas regulares.

**Independent Test**: Abrir os detalhes de uma venda sem devoluções e confirmar que nenhuma lista vazia ou aviso invasivo de devolução é exibido.

**Acceptance Scenarios**:

1. **Given** que o usuário abre a modal de uma venda que não possui devoluções,  
   **When** os detalhes da venda forem carregados,  
   **Then** a seção de devoluções detalhadas não deve poluir a tela, mantendo o foco nos itens da venda, pagamentos e totais financeiros.

---

### Edge Cases

- **Devolução parcial de um mesmo item**: O sistema deve exibir claramente a quantidade devolvida específica daquela operação, mesmo que seja menor que a quantidade total comprada.
- **Múltiplas devoluções para a mesma venda**: Todas as devoluções associadas à venda devem ser listadas em ordem cronológica (mais recentes primeiro), cada uma com seus respectivos itens e totais.
- **Devolução com status rejeitado ou cancelado**: Deve ser identificada visualmente com indicador de alerta/erro, preservando os motivos e itens que foram solicitados.
- **Item sem condição registrada**: Deve exibir indicador padrão neutro sem quebrar o layout da lista.
- **Falha no carregamento dos detalhes da devolução**: Se houver falha de rede ao buscar o detalhamento, o sistema deve exibir mensagem de erro amigável na seção de devoluções sem impedir a leitura dos dados principais da venda.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir uma lista detalhada de devoluções dentro da modal de detalhes da venda sempre que a venda possuir devoluções vinculadas.
- **FR-002**: Cada item da lista de devoluções DEVE conter identificador da devolução, data/hora da ocorrência, status atual, modalidade de reembolso (crédito em loja, estorno em dinheiro, troca), motivo registrado e valor total do reembolso.
- **FR-003**: Cada devolução DEVE listar todos os seus itens individuais com nome do produto, identificador/SKU, quantidade devolvida, valor unitário, subtotal do item e condição do item (bom, avariado ou com defeito).
- **FR-004**: O sistema DEVE aplicar identificadores visuais (badges/cores) padronizados para os status da devolução (Solicitado, Aprovado, Reembolsado, Rejeitado).
- **FR-005**: O sistema DEVE exibir um resumo consolidado do valor total devolvido em relação ao total faturado da venda quando houver devoluções.
- **FR-006**: O sistema DEVE ordenar as devoluções por ordem cronológica decrescente (da mais recente para a mais antiga).
- **FR-007**: O sistema DEVE permitir recolher ou expandir a lista de itens da devolução caso haja mais de uma devolução associada, mantendo a modal navegável e sem barra de rolagem excessiva.
- **FR-008**: O sistema DEVE exibir estado de carregamento e mensagem de erro específica para o bloco de devoluções caso ocorra falha de comunicação, sem impactar a exibição dos dados da venda.

### Key Entities

- **Venda (Sale)**: Transação de venda original com dados do cliente, itens comprados, pagamentos efetuados e histórico de devoluções associadas.
- **Ordem de Devolução (Return Order)**: Registro formal de uma solicitação ou conclusão de devolução vinculada a uma venda, contendo motivo, tipo de reembolso, status, data e valor total a reembolsar.
- **Item Devolvido (Return Item)**: Registro específico de cada produto e quantidade devolvida dentro de uma ordem de devolução, incluindo sua condição física avaliada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos dados dos itens devolvidos (produto, quantidade, valor e condição) devem estar visíveis diretamente na modal sem necessidade de cliques para sair da tela.
- **SC-002**: Usuários conseguem identificar o status e motivo de qualquer devolução da venda em menos de 5 segundos após a abertura da modal.
- **SC-003**: Vendas sem devoluções não devem apresentar degradação visual ou aumento no tempo de abertura da modal.
- **SC-004**: O tempo de renderização e exibição das devoluções detalhadas na modal não deve exceder 1 segundo após a resposta dos dados.

## Assumptions

- A visualização das devoluções na modal de venda é somente leitura para consulta rápida; ações operacionais de processamento ou aprovação de devolução continuam em seus fluxos dedicados do módulo de devoluções.
- As devoluções associadas já contêm vínculos de integridade com a venda correspondente no sistema.
- Usuários que possuem permissão para visualizar detalhes de uma venda têm autorização para visualizar as devoluções associadas a ela.
