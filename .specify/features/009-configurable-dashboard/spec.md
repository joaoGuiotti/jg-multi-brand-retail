# Feature Specification: Configurable Dashboard with User Layout Persistence

**Feature Branch**: `009-configurable-dashboard`  
**Created**: 2026-05-28  
**Status**: Draft  
**Input**: User description: "Para o app frontend, tenho a dashboard que esta muito boa por sinal, porem quero a que criar uma nova feature para implementar um dashboard configuravel que possa ser salvo por usuario(persistencia do layout), assim podendo clicar em uma opção para editar a posição dos itens do dashboard"

## Clarifications

### Session 2026-05-28

- Q: Qual é o modelo de posicionamento dos widgets no layout personalizável? → A: Sequência linear — o usuário reordena os widgets em lista/grade fixa; a posição é determinada pelo índice na sequência (1º, 2º, 3º…); o layout se adapta responsivamente a partir dessa ordem.
- Q: Onde o layout personalizado será persistido na v1? → A: Exclusivamente no front-end via localStorage, com chave isolada por usuário (userId). Persistência em banco de dados via backend API é adiada para v2.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar em Modo de Edição do Layout (Priority: P1)

O usuário está na dashboard padrão e deseja reorganizar os widgets. Ele clica em um botão "Personalizar" (ou ícone de edição) na barra de ações da página. A dashboard entra em modo de edição, onde cada widget exibe alças visuais indicando que pode ser movido ou reordenado. O usuário arrasta widgets para novas posições. Ao terminar, ele clica em "Salvar Layout", e a nova organização é persistida imediatamente para seu perfil.

**Why this priority**: É o fluxo central da feature. Sem o modo de edição e capacidade de mover itens, as demais funcionalidades não têm valor. Entrega a proposta de valor principal.

**Independent Test**: Pode ser testado completamente abrindo a dashboard, ativando o modo de edição, reorganizando dois widgets quaisquer, salvando e verificando que, ao recarregar a página, a ordem permanece.

**Acceptance Scenarios**:

1. **Given** o usuário está na dashboard com layout padrão, **When** clica no botão "Personalizar Dashboard", **Then** a dashboard entra em modo de edição, todos os widgets exibem indicadores visuais de que são movíveis, e um par de botões "Salvar" e "Cancelar" aparece no cabeçalho.
2. **Given** o usuário está no modo de edição, **When** arrasta um widget para uma nova posição, **Then** o widget se move para a nova posição e os demais widgets ajustam-se para preencher o espaço.
3. **Given** o usuário reorganizou os widgets no modo de edição, **When** clica em "Salvar Layout", **Then** o modo de edição é encerrado, o layout é persistido para o usuário autenticado, e uma mensagem de confirmação é exibida brevemente.
4. **Given** o usuário está no modo de edição, **When** clica em "Cancelar", **Then** o layout retorna ao estado anterior ao modo de edição, sem nenhuma alteração salva.

---

### User Story 2 - Persistência Automática por Usuário (Priority: P2)

Após salvar um layout personalizado, o usuário fecha o navegador e reabre a aplicação no dia seguinte. Ao acessar a dashboard, ela exibe automaticamente o layout que foi salvo anteriormente — sem que o usuário precise configurar novamente.

**Why this priority**: A persistência é o que torna a personalização útil. Sem ela, a funcionalidade é descartável. Prioridade logo após o modo de edição em si.

**Independent Test**: Pode ser testado salvando um layout, fazendo logout, logando novamente com o mesmo usuário, e verificando que o layout personalizado é carregado automaticamente.

**Acceptance Scenarios**:

1. **Given** o usuário salvou um layout personalizado, **When** realiza logout e login novamente, **Then** a dashboard exibe o mesmo layout personalizado que foi salvo.
2. **Given** dois usuários diferentes acessam o sistema, **When** cada um personaliza e salva seu próprio layout, **Then** cada usuário vê apenas o seu próprio layout ao acessar a dashboard.
3. **Given** o usuário nunca personalizou a dashboard, **When** acessa a dashboard pela primeira vez, **Then** o layout padrão do sistema é exibido.

---

### User Story 3 - Restaurar Layout Padrão (Priority: P3)

O usuário personalizou o layout mas deseja voltar ao arranjo original definido pelo sistema. No modo de edição (ou via menu de opções), ele seleciona "Restaurar Layout Padrão". Uma confirmação é solicitada. Ao confirmar, o layout volta ao estado padrão e esse estado é salvo.

**Why this priority**: Garante que o usuário nunca fique "preso" em uma configuração indesejada. É uma funcionalidade de segurança da experiência, mas não é o caminho principal.

**Independent Test**: Pode ser testado salvando um layout personalizado, acionando "Restaurar Padrão", confirmando, e verificando que o layout padrão é exibido e persistido.

**Acceptance Scenarios**:

1. **Given** o usuário possui um layout personalizado salvo, **When** aciona "Restaurar Layout Padrão" e confirma, **Then** a dashboard exibe o layout padrão do sistema e esse estado é salvo como novo layout do usuário.
2. **Given** o usuário aciona "Restaurar Padrão", **When** cancela o diálogo de confirmação, **Then** nenhuma alteração é feita e o layout personalizado permanece ativo.

---

### Edge Cases

- O que acontece quando o usuário perde a conexão durante o salvamento do layout? O sistema deve informar que o salvamento falhou e manter o modo de edição ativo para nova tentativa.
- O que acontece se um widget que estava no layout salvo for removido ou renomeado em uma atualização do sistema? O layout restante deve ser carregado normalmente, ignorando referências a widgets inexistentes, e o usuário deve ser informado que seu layout foi parcialmente ajustado.
- O que acontece se o usuário tentar salvar um layout com todos os widgets ocultos ou removidos? O sistema deve requerer ao menos um widget visível antes de permitir o salvamento.
- Como o layout se comporta em telas menores (tablet/mobile)? O modo de edição está disponível apenas em telas com resolução suficiente para suportar reorganização; em dispositivos móveis, o layout padrão é exibido sem a opção de edição.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE disponibilizar um botão de ação visível na dashboard para ativar o modo de edição de layout.
- **FR-002**: No modo de edição, o sistema DEVE permitir que o usuário reordene widgets da dashboard por meio de interação de arrastar e soltar (drag-and-drop). O modelo de posição é **sequência linear**: cada widget ocupa uma posição indexada (1º, 2º, 3º…) em uma lista ordenada; o layout adapta-se responsivamente a partir dessa sequência.
- **FR-003**: O sistema DEVE exibir indicadores visuais claros em cada widget enquanto o modo de edição está ativo, diferenciando o estado editável do estado de visualização normal.
- **FR-004**: O sistema DEVE exibir ações de "Salvar Layout" e "Cancelar" enquanto o modo de edição está ativo.
- **FR-005**: Ao confirmar o salvamento, o sistema DEVE persistir o layout personalizado associado ao usuário autenticado.
- **FR-006**: Ao carregar a dashboard, o sistema DEVE recuperar e aplicar automaticamente o layout salvo do usuário autenticado, quando existir.
- **FR-007**: Quando o usuário nunca personalizou a dashboard, o sistema DEVE exibir o layout padrão definido pelo sistema.
- **FR-008**: O layout de cada usuário DEVE ser isolado — a personalização de um usuário não pode afetar a dashboard de outro usuário.
- **FR-009**: O sistema DEVE oferecer a opção de restaurar o layout padrão, com uma etapa de confirmação antes de aplicar a restauração.
- **FR-010**: O sistema DEVE exibir feedback visual ao usuário após salvar o layout com sucesso (ex.: notificação ou mensagem temporária).
- **FR-011**: Ao cancelar o modo de edição sem salvar, o sistema DEVE descartar quaisquer alterações e restaurar o layout do estado anterior à edição.
- **FR-012**: O sistema DEVE exibir uma mensagem de erro e manter o modo de edição caso o salvamento falhe por falha de comunicação.

### Key Entities *(include if feature involves data)*

- **Layout do Dashboard**: Representa a configuração de organização dos widgets para um usuário específico. Atributos incluem: identificador do usuário, **lista ordenada de identificadores de widgets** (array de IDs na sequência desejada), e metadados de quando foi salvo pela última vez. O modelo de posição é sequência linear — nenhuma coordenada x/y ou slot de grid é necessário.
- **Widget**: Representa um componente individual exibido na dashboard (ex.: KPI Cards, Gráfico de Receita, Vendas Recentes, Movimentações de Estoque, Ações Rápidas). Atributos incluem: identificador único e estado de visibilidade.
- **Layout Padrão**: Configuração de referência definida pelo sistema, usada quando nenhum layout personalizado existe para o usuário.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários conseguem ativar o modo de edição, reorganizar ao menos dois widgets e salvar o layout em menos de 60 segundos.
- **SC-002**: O layout personalizado é carregado automaticamente em 100% das sessões subsequentes do mesmo usuário, sem necessidade de reconfiguração manual.
- **SC-003**: O layout de um usuário nunca afeta ou sobrescreve o layout de outro usuário — isolamento verificado em testes com múltiplas contas simultâneas.
- **SC-004**: Ao menos 80% dos usuários que tentam personalizar a dashboard conseguem salvar e ver o layout aplicado sem assistência ou mensagens de erro.
- **SC-005**: A experiência de arrastar e soltar widgets no modo de edição é fluida, sem travamentos perceptíveis pelo usuário durante a reorganização.
- **SC-006**: O feedback de confirmação após salvar é exibido em até 3 segundos após a ação do usuário.

## Assumptions

- O sistema de autenticação existente é suficiente para identificar unicamente cada usuário e associar layouts a eles — nenhuma alteração no sistema de login é necessária.
- Os widgets do dashboard são os componentes atualmente existentes: KPI Cards, Gráfico de Receita, Vendas Recentes, Movimentações de Estoque e Ações Rápidas. A capacidade de ocultar/exibir widgets individualmente está fora do escopo desta versão (apenas reordenação).
- **[v1]** A persistência do layout será feita exclusivamente no front-end via `localStorage`, com chave isolada por usuário (ex.: `dashboard_layout_{userId}_{tenantId}`). Isso elimina qualquer dependência de backend nesta versão e permite entrega rápida. A acessibilidade do layout em múltiplos dispositivos/navegadores está fora do escopo da v1 e será tratada na v2 com persistência em banco de dados via API backend.
- **[v2 — futuro]** Persistência server-side via endpoint dedicado no backend, associada ao perfil do usuário autenticado, garantindo sincronização entre dispositivos.
- O layout padrão (estado sem personalização) é o layout atualmente implementado no componente de dashboard.
- O suporte a dispositivos móveis para o modo de edição está fora do escopo desta versão; em telas pequenas, o layout padrão ou o layout salvo é exibido de forma responsiva, mas sem a opção de editar.
- Não há requisito de versionar ou fazer histórico de layouts anteriores nesta versão — apenas o layout salvo mais recente é mantido.
