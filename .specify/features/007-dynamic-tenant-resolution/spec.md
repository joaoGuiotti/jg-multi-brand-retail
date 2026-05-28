# Feature Specification: Identificação Dinâmica de Inquilinos na Tela de Login

**Feature Branch**: `007-dynamic-tenant-resolution`  
**Created**: 2026-05-27  
**Status**: Approved  
**Input**: User description: "Identificação Dinâmica de Inquilinos (Branding & Identidade) na Tela de Login"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Identificação por Subdomínio/Host (Priority: P1) 🎯 MVP

Como usuário operador ou administrador de uma loja parceira, eu quero acessar o sistema através do subdomínio da minha própria marca para que a tela de login exiba imediatamente a identidade visual (nome e logotipo) da minha empresa antes de eu digitar minhas credenciais.

**Why this priority**: Esta é a alma da proposta multi-tenant/SaaS, transformando um portal de login genérico em uma área exclusiva e confiável para cada lojista parceiro.

**Independent Test**:
Acessar `http://loja-demo.localhost:4200/login`. A tela deve exibir o logotipo cadastrado para o tenant "Loja Demo" e o título "Entrar em Loja Demo". Ao acessar `http://localhost:4200/login` (sem subdomínio), o sistema deve exibir a marca genérica do "Retail SaaS".

**Acceptance Scenarios**:

1. **Given** que o tenant com slug `loja-demo` está cadastrado, ativo e possui uma URL de logotipo válida, **When** o usuário acessar a URL `http://loja-demo.localhost:4200/login`, **Then** a tela de login deve renderizar o logotipo da "Loja Demo" e a saudação personalizada.
2. **Given** que o usuário acessa um subdomínio de um tenant que não existe (ex: `marca-inexistente.localhost:4200/login`), **When** a página carregar, **Then** o sistema deve exibir uma mensagem informando que a loja não foi encontrada e exibir a marca padrão do sistema.

---

### Edge Cases

- **Tenant Desativado:** Se o inquilino for identificado (via host) mas possuir o status `active = false`, a tela de login deve bloquear o formulário e exibir a mensagem clara: *"Esta loja está temporariamente indisponível. Entre em contato com o suporte."*
- **Falha no Carregamento do Logotipo:** Caso a imagem do logotipo do inquilino resulte em erro 404 ou falha de conexão, a tela de login deve exibir o nome do inquilino em formato de texto estilizado de maneira legível, sem quebrar o layout da interface.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST extrair o slug do inquilino a partir do cabeçalho da requisição (ex: host do subdomínio como `*.localhost` ou `*.retailsaas.com`).
- **FR-002**: O backend MUST expor uma rota pública `GET /auth/tenants/by-slug/:slug` que retorna apenas as propriedades estéticas públicas do tenant (`name`, `logoUrl`, e configurações visuais de cores em `settings`).
- **FR-003**: A rota pública do tenant MUST NOT expor dados sensíveis ou operacionais como chaves de API, segredos, listagem de usuários, relatórios de faturamento ou permissões de segurança.
- **FR-004**: O frontend MUST realizar uma chamada de API ao carregar a página de login caso detecte um subdomínio no host, injetando o branding retornado na interface antes do preenchimento das credenciais.
- **FR-005**: O frontend MUST resolver o branding exclusivamente com base na identificação por subdomínio (resolução por e-mail no login genérico está fora de escopo para esta primeira entrega).
- **FR-006**: O sistema MUST exibir uma tela amigável de erro de suspensão se as configurações retornarem `active: false` para o tenant identificado.
- **FR-007**: O sistema MUST utilizar o fallback de identidade genérica ("Retail SaaS") se o slug correspondente não for localizado no banco de dados.

### Key Entities

- **Tenant**: A entidade que representa o cliente corporativo (inquilino/marca). Para esta funcionalidade, as propriedades públicas envolvidas são:
  - `name`: Nome público da loja/marca.
  - `slug`: Identificador único de rota/subdomínio.
  - `logoUrl`: Link de imagem do logotipo.
  - `active`: Status de ativação da conta.
  - `settings`: Configurações estéticas customizadas (Ex: cor primária e secundária do tema da interface).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A chamada de API pública para resolução do tenant pelo slug MUST responder em menos de 100 milissegundos sob condições normais de tráfego.
- **SC-002**: 100% dos acessos com subdomínio válido cadastrado MUST carregar a tela de login personalizada em menos de 2 segundos.
- **SC-003**: Tentativas de login sob inquilinos suspensos MUST ser 100% bloqueadas na camada de interface e de API, exibindo a mensagem amigável de suspensão.

---

## Assumptions

- O banco de dados PostgreSQL está ativo e populado com os tenants cadastrados e seus respectivos slugs.
- Para testes locais em ambiente de desenvolvimento, assumimos que mapeamentos do tipo `loja-demo.localhost` funcionam diretamente no navegador ou podem ser simulados via ferramentas locais de proxy.
- O upload e gerenciamento dos logotipos (logoUrl) dos tenants é assumido como pré-existente (armazenado em serviços públicos de imagem ou mockado via URLs válidas de teste).
- O controle de estilos do frontend suporta injeção dinâmica de variáveis CSS para aplicar as cores customizadas retornadas do backend.
