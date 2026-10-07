# Feature Specification: Migração do Repositório para Nx Monorepo

**Feature Branch**: `013-nx-monorepo-migration`  
**Created**: 2026-10-07  
**Status**: Draft  
**Input**: User description: "usar @mcp:nx-mcp Para migrar esse projeto para NXRepo seguindo estrutura de apps apps - frontend (sem Shared UI) - backend libs - ui (angular) Ao final ajustar o ci **REGRAS** - Para cada etapa mapeada parar e me perguntar se desejo seguir"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Orquestração Unificada de Workspace com Nx (Priority: P1)

Como desenvolvedor da plataforma, quero executar tarefas de desenvolvimento, build, testes e linting através de um orquestrador de monorepo Nx padronizado, para que o gerenciamento de múltiplos pacotes seja centralizado, consistente e eficiente.

**Why this priority**: Estabelece o alicerce fundamental do monorepo, permitindo que as aplicações `frontend` e `backend` operem sob uma árvore de dependências e ferramentas comuns.

**Independent Test**: Pode ser validado executando comandos de compilação e inicialização para `frontend` e `backend` separadamente e em conjunto a partir da raiz do monorepo.

**Acceptance Scenarios**:

1. **Given** o workspace configurado com Nx, **When** o desenvolvedor executa o comando de build ou inicialização para a aplicação `frontend`, **Then** a aplicação é compilada e executada com sucesso sem depender de chamadas pontuais com caminhos relativos rígidos.
2. **Given** o workspace configurado com Nx, **When** o desenvolvedor executa o comando de build ou testes para a aplicação `backend`, **Then** a aplicação NestJS/Prisma é processada de forma independente através do pipeline unificado do workspace.

---

### User Story 2 - Extração e Compartilhamento da Biblioteca de UI Angular (Priority: P2)

Como desenvolvedor frontend, quero que os componentes, diretivas, pipes, estilos e presets de design compartilhado sejam desacoplados da aplicação principal e disponibilizados em uma biblioteca isolada (`libs/ui`), para que a aplicação `frontend` consuma elementos visuais através de importações modulares limpas.

**Why this priority**: Desacopla regras de apresentação reutilizáveis da aplicação cliente, reduzindo o acoplamento estrutural e viabilizando o reuso futuro por outros módulos ou microsserviços frontend.

**Independent Test**: Pode ser validado compilando e testando a biblioteca `libs/ui` isoladamente e confirmando que a aplicação `frontend` importa e renderiza os componentes de UI sem erros de compilação ou regressões visuais.

**Acceptance Scenarios**:

1. **Given** os arquivos de UI previamente residentes em `apps/frontend/src/app/shared/ui`, **When** forem migrados para a biblioteca `libs/ui`, **Then** o pacote `libs/ui` deve ser compilado de forma independente e disponibilizado via path mapping do workspace.
2. **Given** a aplicação `apps/frontend` sem os arquivos locais de `shared/ui`, **When** compilar ou rodar em modo de desenvolvimento, **Then** todas as referências a botões, inputs, pipes e modais devem ser resolvidas a partir de `libs/ui` sem quebras de estilo ou comportamento.

---

### User Story 3 - Automação de CI com Detecção de Mudanças e Execução Otimizada (Priority: P3)

Como mantenedor de DevOps/CI, quero que o fluxo de integração contínua no GitHub Actions execute validações eficientes e direcionadas para as aplicações e bibliotecas do monorepo Nx, para que o tempo de pipeline seja otimizado e falhas de regressão sejam imediatamente detectadas.

**Why this priority**: Assegura que o repositório mantenha alta confiabilidade após a transição arquitetural e que builds futuros sejam rápidos e determinísticos.

**Independent Test**: Pode ser validado acionando o pipeline de CI do GitHub Actions em branches de feature/pull requests e verificando a correta execução de lint, test e build para os projetos afetados.

**Acceptance Scenarios**:

1. **Given** uma alteração realizada exclusivamente na aplicação `backend`, **When** o pipeline de CI rodar, **Then** as validações de backend são executadas com sucesso sem exigir recompilação desnecessária de projetos inalterados.
2. **Given** uma alteração na biblioteca `libs/ui`, **When** o pipeline de CI for acionado, **Then** tanto `libs/ui` quanto a aplicação `apps/frontend` que dela depende são validadas e testadas.

---

### User Story 4 - Execução Controlada por Etapas com Aprovação Prévia (Priority: P4)

Como líder técnico e usuário do sistema, quero que cada etapa do plano de migração seja apresentada e pausada aguardando minha confirmação explícita antes de avançar para a próxima, para manter controle total sobre cada alteração de infraestrutura e código.

**Why this priority**: Garante governança, rastreabilidade e segurança durante toda a transformação do projeto, respeitando a regra estrita definida para a operação.

**Independent Test**: Pode ser validado confirmando que nenhuma etapa subsequente de modificação é iniciada sem que o status atual seja exibido e o consentimento explícito do usuário seja solicitado.

**Acceptance Scenarios**:

1. **Given** a conclusão de uma etapa planejada da migração, **When** o agente finalizar os arquivos e verificações pertinentes, **Then** ele deve parar a execução, apresentar o resumo do progresso e aguardar a confirmação do usuário antes de iniciar a etapa seguinte.

---

### Edge Cases

- Como lidar com dependências compartilhadas no `package.json` raiz versus dependências específicas de frameworks (`@nestjs/*`, `@angular/*`, `prisma`) para evitar conflitos de versão?
- Como garantir que configurações locais de TypeScript (`tsconfig.base.json`, `paths`) e presets do Tailwind permaneçam funcionais tanto para a aplicação quanto para a lib extraída?
- Como evitar que scripts do Docker (`docker-compose.yml`, Dockerfiles) quebrem ao esperar caminhos antigos de build ou pastas internas de `shared/ui`?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O projeto DEVE ser configurado como um monorepo gerenciado por Nx, mantendo a estrutura modular centralizada.
- **FR-002**: A aplicação frontend DEVE permanecer localizada em `apps/frontend`, removendo os fontes locais de `src/app/shared/ui`.
- **FR-003**: A aplicação backend NestJS DEVE permanecer localizada em `apps/backend` e ser integrada aos targets executáveis do monorepo Nx.
- **FR-004**: Uma biblioteca Angular DEVE ser criada em `libs/ui`, contendo todos os componentes, diretivas, pipes, serviços, estilos e preset do Tailwind originalmente situados em `shared/ui`.
- **FR-005**: O arquivo de configuração de caminhos TypeScript (ex.: `tsconfig.base.json`) DEVE exportar o alias para a biblioteca `libs/ui` (ex.: `@retail/ui` ou `@shared/ui`), permitindo que `apps/frontend` o consuma de forma declarativa.
- **FR-006**: Os fluxos de trabalho do GitHub Actions em `.github/workflows/ci.yml` DEVEM ser adaptados para executar os comandos do Nx (com suporte a cache e execução de projetos afetados ou comandos orquestrados).
- **FR-007**: Todo o processo de planejamento e implementação DEVE seguir a regra mandatória de parar ao fim de cada fase mapeada e solicitar aprovação formal do usuário antes de prosseguir.

### Key Entities *(include if feature involves data)*

- **Nx Workspace**: Entidade de configuração do monorepo (`nx.json`, `package.json`), gerenciando alvos compartilhados (build, test, lint, serve) e grafo de dependências entre projetos.
- **Application Project (`apps/frontend`, `apps/backend`)**: Projetos executáveis que representam as interfaces do usuário e serviços de API.
- **Library Project (`libs/ui`)**: Módulo de biblioteca que encapsula design tokens, componentes compartilhados de UI Angular e presets cosméticos.
- **CI Workflow**: Pipeline declarativo de automação que valida os projetos contra lint, testes unitários e builds integrados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos componentes e utilitários visuais anteriormente presentes em `shared/ui` devem ser extraídos e compilados a partir de `libs/ui`.
- **SC-002**: `apps/frontend` e `apps/backend` devem compilar e inicializar com sucesso via comandos do monorepo sem falhas de resolução de dependências.
- **SC-003**: Todos os testes unitários existentes e verificações de linting devem executar e passar com 100% de sucesso nas novas localizações.
- **SC-004**: O pipeline de CI deve concluir a validação do monorepo com êxito no GitHub Actions.
- **SC-005**: 100% das etapas de migração devem cumprir a exigência de parada para confirmação prévia com o usuário.

## Assumptions

- A versão do Node.js mantida pelo repositório (>= 20.0.0) e npm (>= 10.0.0) é compatível com as versões recentes do Nx.
- A migração preservará o comportamento funcional existente de frontend e backend sem alterações em regras de negócio ou contratos de API.
- O Docker Compose e os Dockerfiles existentes serão mantidos funcionais ou adaptados conforme os novos artefatos de saída do Nx.
