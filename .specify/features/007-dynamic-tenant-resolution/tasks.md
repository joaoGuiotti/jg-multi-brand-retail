---
description: "Tasks list for 007-dynamic-tenant-resolution implementation"
---

# Tasks: Identificação Dinâmica de Inquilinos na Tela de Login

**Input**: Design documents from `/specs/007-dynamic-tenant-resolution/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: Opcionais — incluímos testes de unidade do NestJS no backend para garantir a integridade do DTO e da regra de segurança do endpoint público.

**Organization**: As tarefas são agrupadas sequencialmente por fases de infraestrutura e pela User Story 1 (MVP de Subdomínio) para permitir a entrega incremental e independente de cada fatia de funcionalidade.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparação e alinhamento do ambiente local para testar subdomínios locais.

- [x] T001 Adicionar o tenant de teste no script de seed ou via Prisma Studio em `apps/backend/prisma/schema.prisma` conforme as instruções descritas em `specs/007-dynamic-tenant-resolution/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura de API pública do NestJS que serve como base obrigatória para qualquer interação do frontend.

**⚠️ CRITICAL**: Nenhuma tarefa da User Story 1 no frontend pode ser iniciada até que o backend esteja 100% pronto e testado nesta fase.

- [x] T002 Criar o DTO de resposta pública segura `PublicTenantOutput` em `apps/backend/src/infrastructure/dtos/auth/public-tenant-output.dto.ts` contendo apenas `id`, `name`, `slug`, `logoUrl`, `active` e `theme`
- [x] T003 Criar o caso de uso `GetPublicTenantUseCase` em `apps/backend/src/application/use-cases/auth/get-public-tenant.use-case.ts` para buscar o inquilino por `slug` no `TenantRepository`, validar e formatar a resposta aplicando fallback de cores se o campo `settings` estiver nulo ou incompleto
- [x] T004 Expor a rota pública `GET /auth/tenants/by-slug/:slug` no controlador `apps/backend/src/infrastructure/controllers/auth.controller.ts`, injetando e chamando o `GetPublicTenantUseCase` (sem guards de autenticação)
- [x] T005 Implementar testes de unidade integrados em `apps/backend/test/get-public-tenant.spec.ts` para certificar que a rota pública retorna as cores corretas, oculta dados confidenciais e retorna `active: false` se o tenant estiver suspenso

**Checkpoint**: Fundação de API pronta — o backend responde publicamente com o branding de qualquer inquilino via slug de forma rápida e segura.

---

## Phase 3: User Story 1 - Identificação por Subdomínio/Host (Priority: P1) 🎯 MVP

**Goal**: Permitir que o frontend Angular capture o host de acesso, resolva o inquilino de forma transparente e renderize a identidade visual personalizada na tela de login antes da autenticação.

**Independent Test**:
Abrir o navegador no endereço `http://loja-demo.localhost:4200/login`. A tela deve exibir o logotipo da Loja Demo, o título personalizado e a cor do botão de envio deve adotar a cor primária configurada na seed.

### Implementation for User Story 1

- [x] T006 [P] [US1] Adicionar o método de API pública `getPublicTenant(slug: string)` no serviço `apps/frontend/src/app/core/services/auth.service.ts` realizando uma chamada HTTP direta ao novo endpoint do backend
- [x] T007 [P] [US1] Declarar as variáveis CSS de cores padrão de inquilino (`--tenant-primary-color` e `--tenant-accent-color`) no arquivo global de estilos `apps/frontend/src/styles.css`
- [x] T008 [P] [US1] Ajustar a configuração do Tailwind CSS em `apps/frontend/tailwind.config.js` para estender o mapa de cores, vinculando `brand-primary` e `brand-accent` às variáveis CSS declaradas
- [x] T009 [US1] Atualizar o componente de Login em `apps/frontend/src/app/features/auth/login/login.component.ts` para detectar o host (via `window.location.hostname`), resolver o slug e carregar os dados de marca do backend. Incluir também o suporte a query parameter `?tenant=slug` para testes em localhost simples
- [x] T010 [US1] Implementar a lógica de injeção dinâmica de propriedades CSS (setProperty) no elemento raiz do documento (`document.documentElement`) dentro do `login.component.ts` para aplicar as cores do inquilino em tempo de execução
- [x] T011 [US1] Ajustar o template HTML em `apps/frontend/src/app/features/auth/login/login.component.html` para exibir dinamicamente o logotipo (ou nome em texto estilizado se a imagem falhar), o título do formulário com a marca, e aplicar as classes dinâmicas do Tailwind (ex: `bg-brand-primary`) nos botões de ação principal
- [x] T012 [US1] Inserir a validação do status do inquilino no `login.component.html` e `login.component.ts`. Se `active === false`, exibir banner de alerta visível de suspensão e desativar inputs de texto e botões de submit

**Checkpoint**: User Story 1 totalmente integrada. A tela de login genérica agora se adapta de forma 100% dinâmica à marca do subdomínio acessado de ponta a ponta.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Polimento final, auditoria de segurança dos campos retornados e verificação de edge cases locais.

- [x] T013 Adicionar logs estruturados e amigáveis de depuração para resoluções bem sucedidas e falhas de slug inexistentes no backend `apps/backend/src/application/use-cases/auth/get-public-tenant.use-case.ts`
- [x] T014 Validar que erros de tenant inexistente (404) são capturados e mapeados pelo frontend para um fallback de marca genérica padrão sem expor exceções brutas na tela
- [x] T015 Executar todos os testes descritos no manual de verificação do recurso contidos no arquivo `specs/007-dynamic-tenant-resolution/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — feito para carregar os mocks locais.
- **Foundational (Phase 2)**: Depende do Setup finalizado — Bloqueia o desenvolvimento do frontend da User Story 1.
- **User Story 1 (Phase 3)**: Depende da conclusão da Phase 2 (Backend ativo e exposto).
- **Polish (Phase 4)**: Depende da entrega completa das telas e fluxos do MVP da User Story 1.

---

## Parallel Execution Examples

```bash
# Executar as tarefas estáticas de folha de estilo e serviço do Angular de forma paralela:
Tarefa: "Adicionar o método de API pública getPublicTenant no serviço auth.service.ts"
Tarefa: "Declarar as variáveis CSS de cores padrão de inquilino no styles.css"
Tarefa: "Ajustar a configuração do Tailwind CSS no tailwind.config.js"
```

---

## Implementation Strategy

### MVP First (Apenas Subdomínio)

1. Mapear o mock local da seed (Fase 1).
2. Escrever a API pública no NestJS e testar as respostas filtradas do Prisma no Swagger/Rest Client (Fase 2).
3. Conectar a fiação visual de CSS variáveis no frontend Angular (Fase 3).
4. Unir o login dinâmico de host no Angular (Fase 3).
5. **PARAR E VERIFICAR**: Testar acessando `loja-demo.localhost:4200/login` e validar a injeção instantânea das cores e logotipo do cliente.
6. Aplicar polimento de tratamento de erros e fallbacks limpos (Fase 4).
