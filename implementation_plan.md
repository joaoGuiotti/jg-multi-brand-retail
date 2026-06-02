# 🚀 Planejamento de Features Inovadoras — Retail SaaS Multi-Brand

> Última atualização: 2026-04-09 | Decisões do Tech Lead aplicadas ✅

---

## 📋 Estado Atual do Projeto

| Módulo existente | Status |
|---|---|
| Auth (JWT + Refresh + Password Reset) | ✅ Implementado |
| Gestão de Produtos (CRUD + SKU + Barcode) | ✅ Implementado |
| PDV (Point of Sale) | ✅ Implementado |
| Vendas (Histórico + Relatórios) | ✅ Implementado |
| Clientes (CRUD + Documento + Endereço) | ✅ Implementado |
| Estoque (Movimentações + Summary) | ✅ Implementado |
| Pagamentos (PIX, Cartão, Boleto, etc.) | ✅ Implementado |
| Condicionais (Empréstimo/Retorno) | ✅ Implementado |
| Funcionários (RBAC: SUPER_ADMIN/ADMIN/USER) | ✅ Implementado |
| Dashboard (KPI + Charts) | ✅ Implementado |
| Relatórios (PDF) | ✅ Implementado |
| Multi-Tenancy (RLS + tenant_id) | ✅ Implementado |
| Audit Logs | ✅ Implementado |

---

## 🎯 Decisões Registradas

| # | Questão | Decisão |
|---|---|---|
| 1 | Ordem de implementação | **Notificações primeiro**, depois ordem sugerida |
| 2 | Acompanhamento | Marcar progresso no plano a cada entrega |
| 3 | Promoções `BUY_X_GET_Y` | **Incluir na v1** |
| 4 | Protocolo real-time | **WebSocket** para painel de notificações; **SSE** onde adequado (ver módulo) |
| 5 | Expiração de pontos (Fidelidade) | **Não na v1** — campo mantido no schema, funcionalidade desabilitada |
| 6 | Comissionamento | **% fixa na v1** — tiered e por categoria ficam no backlog |

---

## 🗺️ Roadmap de Implementação (Ordem Atualizada)

| Sprint | Feature | Dias | Status |
|---|---|---|---|
| Sprint 1 | **Notificações & Alertas em Tempo Real** | ~6 dias | ✅ Concluído |
| Sprint 2 | **Gestão de Devoluções & Trocas (RMA)** | ~4 dias | ✅ Concluído |
| Sprint 3 | **Programa de Fidelidade & Cashback** | ~5 dias | ✅ Concluído |
| Sprint 4 | **Comissionamento Inteligente (% Fixa)** | ~4 dias | ✅ Concluído |
| Sprint 5-6 | **Cupons & Promoções Dinâmicas** | ~7 dias | 🔲 Pendente |
| Sprint 7 | **Financeiro Completo & DRE** | ~5 dias | ✅ Concluído |
| Sprint 8 | **Inteligência Artificial (Gemini Flash)** | ~6 dias | 🔲 Pendente |
| Sprint 9 | **Integração WhatsApp API** | ~4 dias | 🔲 Pendente |
| Sprint 10 | **Billing & Assinaturas SaaS (Stripe/MP)** | ~5 dias | 🔲 Pendente |
| Sprint 11 | **Emissão Fiscal (NFC-e / NF-e)** | ~8 dias | 🔲 Pendente |

> [!NOTE]
> Notificações são implementadas primeiro pois todos os outros módulos emitem triggers para ela. Isso evita retrofit posterior.

---

## 📊 Diagrama de Dependências

```
[Devoluções] ──────────────────────────────────────┐
[Fidelidade] ──────────────────────────────────────┼──► [Notificações] ◄── BASE
[Comissões]  ──────────────────────────────────────┤
[Promoções]  ──────────────────────────────────────┘

[Emissão Fiscal] ──────────────────────────────────► [Vendas] + [Notificações]
```

---
---

# 📦 Módulo 1: Notificações & Alertas em Tempo Real

> **Sprint 1 — Status: ✅ Concluído**

## 🎯 Objetivo

Implementar um sistema de **notificações em tempo real** com dois protocolos complementares:
- **WebSocket (Socket.IO)** — painel de notificações do usuário logado (bilateral, com ack de leitura)
- **SSE (Server-Sent Events)** — feeds de alertas operacionais (estoque, metas) que não precisam de resposta do cliente

Notificações persistidas no banco com centro de notificações, badge de não-lidas e preferências por tipo. Alertas automáticos: estoque baixo, meta atingida, devolução pendente de aprovação, promoção expirando.

> [!IMPORTANT]
> Módulo base — deve ser implementado **antes** de todos os outros. Cada módulo posterior emite notificações ao concluir operações críticas.

### 🔀 Estratégia WebSocket vs SSE

| Caso de uso | Protocolo | Justificativa |
|---|---|---|
| Painel de notificações (bell icon) | **WebSocket** | Bidirecional: cliente envia `mark_as_read`, recebe push em tempo real |
| Feed de alertas de estoque (dashboard) | **SSE** | Unidirecional, mais simples, sem overhead de WS para dados que só precisam de push |
| Alertas críticos (toast/snackbar) | **WebSocket** | Requer garantia de entrega + ack |
| Ranking ao vivo de vendedores | **SSE** | Stream contínuo de dados agregados sem necessidade de bidirecionalidade |

---

## 🧱 Backend (NestJS)

### Estrutura sugerida:

```
src/
├── domain/entities/notifications/
│   ├── notification.entity.ts
│   └── notification-preference.entity.ts
├── domain/repositories/notifications/
│   └── notifications.repository.interface.ts
├── application/use-cases/notifications/
│   ├── create-notification.use-case.ts
│   ├── mark-as-read.use-case.ts
│   ├── mark-all-as-read.use-case.ts
│   ├── get-user-notifications.use-case.ts
│   └── update-preferences.use-case.ts
├── infrastructure/
│   ├── controllers/
│   │   ├── notifications.controller.ts      # REST: histórico, preferências
│   │   └── notifications-sse.controller.ts  # SSE: /notifications/stream
│   ├── gateways/
│   │   └── notifications.gateway.ts         # WebSocket Gateway (Socket.IO)
│   ├── dtos/notifications/
│   │   ├── create-notification.dto.ts
│   │   ├── notification-filters.dto.ts
│   │   └── update-preferences.dto.ts
│   ├── persistence/notifications/
│   │   └── prisma-notifications.repository.ts
│   ├── services/
│   │   └── notification-dispatcher.service.ts  # Orquestra WS + SSE + DB
│   └── modules/notifications.module.ts
```

### Schema Prisma (novas tabelas):

```prisma
enum NotificationType {
  LOW_STOCK
  OUT_OF_STOCK
  GOAL_ACHIEVED
  RETURN_PENDING
  RETURN_APPROVED
  PROMOTION_EXPIRING
  SALE_COMPLETED
  COMMISSION_CALCULATED
  SYSTEM
}

enum NotificationPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model Notification {
  id        String               @id @default(uuid())
  tenantId  String               @map("tenant_id")
  userId    String               @map("user_id")
  type      NotificationType
  priority  NotificationPriority @default(MEDIUM)
  title     String
  message   String
  data      Json?                // { productId?, saleId?, returnId?, ... }
  actionUrl String?              @map("action_url") // deep-link path
  readAt    DateTime?            @map("read_at")
  createdAt DateTime             @default(now()) @map("created_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@index([tenantId])
  @@index([userId, readAt])
  @@index([createdAt])
  @@map("notifications")
}

model NotificationPreference {
  id       String           @id @default(uuid())
  tenantId String           @map("tenant_id")
  userId   String           @map("user_id")
  type     NotificationType
  enabled  Boolean          @default(true)
  sound    Boolean          @default(true)

  tenant Tenant @relation(fields: [tenantId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@unique([userId, type])
  @@map("notification_preferences")
}
```

### Tarefas Backend:

- [ ] Criar entities de domínio: `Notification`, `NotificationPreference`
- [ ] Criar DTOs com class-validator: `CreateNotificationDto`, `NotificationFiltersDto`, `UpdatePreferencesDto`
- [ ] Criar interface `INotificationsRepository`
- [ ] Implementar `PrismaNotificationsRepository`
- [ ] Criar use case: `CreateNotification` — cria, persiste e despacha
- [ ] Criar use case: `MarkAsRead` — marca individual como lida
- [ ] Criar use case: `MarkAllAsRead` — marca todas do usuário como lidas
- [ ] Criar use case: `GetUserNotifications` — lista paginada + unread count
- [ ] Criar use case: `UpdatePreferences` — ativa/desativa tipos por usuário
- [ ] Criar `NotificationsGateway` (WebSocket via `@nestjs/websockets` + `socket.io`)
  - [ ] Autenticação JWT no handshake (`onConnect`)
  - [ ] Handler: `mark_as_read` (cliente → servidor)
  - [ ] Emitter: `notification` (servidor → cliente)
  - [ ] Rooms por `tenant_id:user_id` para isolamento
- [ ] Criar `NotificationsSseController` — endpoint `GET /notifications/stream` (SSE)
  - [ ] Auth via Bearer token no header
  - [ ] Stream de alertas operacionais (estoque)
- [ ] Criar `NotificationDispatcherService`
  - [ ] Método `dispatch(userId, notification)` — salva no DB + emite via WS
  - [ ] Método `broadcast(tenantId, notification)` — emite para todos admins do tenant
  - [ ] Verificação de preferências antes de emitir
  - [ ] Debounce: máx 1 alerta por tipo+entidade por hora (evita flood)
- [ ] Criar `NotificationsController` — endpoints REST
  - [ ] `GET /notifications` — lista com filtros
  - [ ] `PATCH /notifications/:id/read` — marcar lida
  - [ ] `PATCH /notifications/read-all` — marcar todas lidas
  - [ ] `GET /notifications/unread-count` — contagem de não-lidas
  - [ ] `GET/PUT /notifications/preferences` — preferências do usuário
- [ ] Criar `NotificationsModule` e registrar no `AppModule`
- [ ] Criar migration Prisma
- [ ] Criar seed com preferências padrão habilitadas para todos os tipos

---

## 🎨 Frontend (Angular)

### Estrutura sugerida:

```
src/app/features/notifications/
├── components/
│   ├── notification-bell/           # Sino com badge de não-lidas no header
│   │   ├── notification-bell.component.ts
│   │   └── notification-bell.component.html
│   ├── notification-panel/          # Dropdown/painel lateral
│   │   ├── notification-panel.component.ts
│   │   └── notification-panel.component.html
│   ├── notification-item/           # Item individual com ícone por tipo
│   │   ├── notification-item.component.ts
│   │   └── notification-item.component.html
│   └── notification-settings/       # Página de preferências
│       ├── notification-settings.component.ts
│       └── notification-settings.component.html
├── services/
│   ├── notifications.service.ts          # HTTP: lista, markAsRead, preferences
│   └── notifications-ws.service.ts       # WebSocket client (socket.io-client)
└── store/
    └── notifications.store.ts            # Signal-based: notifications[], unreadCount
```

### Tarefas Frontend:

- [ ] Instalar `socket.io-client`
- [ ] Criar `NotificationsService` HTTP
- [ ] Criar `NotificationsWsService`
  - [ ] Conexão autenticada com JWT
  - [ ] Reconexão automática com backoff exponencial
  - [ ] Emite signal ao receber nova notificação
  - [ ] Envia `mark_as_read` via socket
- [ ] Criar `NotificationsStore` com signals
  - [ ] `notifications` — lista
  - [ ] `unreadCount` — computed signal
  - [ ] `isConnected` — status da conexão WS
  - [ ] `isLoading`
- [ ] Criar `NotificationBellComponent`
  - [ ] Badge animado com contagem
  - [ ] Pulsa ao receber nova notificação `HIGH`/`CRITICAL`
  - [ ] Integrar no `HeaderComponent`
- [ ] Criar `NotificationPanelComponent`
  - [ ] Dropdown com lista das últimas 20 notificações
  - [ ] Botão "Marcar todas como lidas"
  - [ ] Scroll infinito (lazy load de mais)
  - [ ] Agrupar por: Hoje / Ontem / Mais antigas
- [ ] Criar `NotificationItemComponent`
  - [ ] Ícone e cor por tipo (`LOW_STOCK` = laranja, `CRITICAL` = vermelho, etc.)
  - [ ] Deep-link ao clicar (`actionUrl`)
  - [ ] Indicador visual de não-lida (bolinha azul)
- [ ] Criar `NotificationSettingsComponent` (página lazy-loaded)
  - [ ] Toggles por tipo de notificação
  - [ ] Toggle de som
- [ ] Implementar toast/snackbar para prioridade `HIGH` e `CRITICAL`
- [ ] Implementar Audio API para som de notificação (quando `sound=true`)
- [ ] Adicionar rota lazy-loaded `/notifications/settings`

---

## 🧪 Testes

### Testes Unitários:
- `NotificationDispatcherService` — debounce, verificação de preferências
- `NotificationsGateway` — auth no handshake, rooms por tenant
- `NotificationsStore` — unreadCount computed, markAsRead atualiza estado
- `NotificationsWsService` — reconexão, parse de mensagens, emissão de ack

### Testes E2E:
- Fluxo WS: conectar → receber notificação em tempo real → bell atualiza → clicar → navega
- Fluxo SSE: abrir dashboard → stream de alerta de estoque chega → toast exibido
- Multi-tenancy: notificação do tenant A não aparece para usuário do tenant B

---

## 🔒 Segurança

- WebSocket autenticado via JWT no handshake (rejeitado se token inválido)
- Rooms nomeadas `${tenantId}:${userId}` — isolamento completo
- Usuários só recebem notificações do próprio `tenant_id` e `user_id`
- SSE autenticado via `Authorization: Bearer` no header
- Rate limiting: máx 1 alerta do mesmo tipo+entidade por hora (anti-flood BullMQ)
- Sanitização do `message` e `title` para evitar XSS

---

## ⚠️ Riscos Técnicos

| Risco | Mitigação |
|---|---|
| Flood de alertas (estoque baixo em loop) | Debounce no `NotificationDispatcherService` — 1/hora por tipo+entidade |
| Múltiplas instâncias do backend (scale) | Redis Adapter para Socket.IO (`@socket.io/redis-adapter`) |
| Desconexões frequentes do WS | Backoff exponencial + fallback para polling REST a cada 30s |
| Notificações perdidas (usuário offline) | Persistência no DB — sync ao reconectar carrega não-lidas |
| Performance com grande volume de notificações | Index em `[userId, readAt]` + limpeza automática de >90 dias via BullMQ |

---

## 📊 Critérios de Aceite

- [ ] Bell icon exibe badge com contagem de não-lidas em tempo real
- [ ] Nova notificação aparece no painel sem refresh de página
- [ ] Notificações `HIGH`/`CRITICAL` disparam toast e som
- [ ] Clicar na notificação navega ao contexto correto (deep-link)
- [ ] "Marcar todas como lidas" zera o badge
- [ ] Preferências são respeitadas (tipo desabilitado não exibe nem toca)
- [ ] Alertas automáticos funcionam: estoque baixo, devolução pendente (após integrar)
- [ ] Dados isolados por tenant (multi-tenancy)

---

## ⏱️ Estimativa Técnica

| Tarefa | Estimativa |
|---|---|
| Schema + Migration + Seed | 2h |
| Entities + Repository | 3h |
| Use Cases | 4h |
| WebSocket Gateway + Dispatcher | 6h |
| SSE Controller | 2h |
| REST Controller + DTOs | 2h |
| Frontend — WS Service + Store | 4h |
| Frontend — Bell + Panel + Item | 6h |
| Frontend — Toast + Sound + Settings | 3h |
| Testes unitários | 4h |
| Testes E2E | 3h |
| **TOTAL** | **~39h (~6 dias)** |

---

## 📦 Dependências

| Pacote | Onde | Observação |
|---|---|---|
| `@nestjs/websockets` | Backend | Já no ecossistema NestJS |
| `@nestjs/platform-socket.io` | Backend | Instalar |
| `socket.io` | Backend | Peer dep do platform |
| `@socket.io/redis-adapter` | Backend | Para escala multi-instância |
| `socket.io-client` | Frontend | Instalar |
| `bullmq` | Backend | Já existente — rate limiting e cleanup |

---
---

# 📦 Módulo 2: Gestão de Devoluções & Trocas (RMA)

> **Sprint 2 — Status: ✅ Concluído** | *Depende de: Notificações (Sprint 1)*

## 🎯 Objetivo

Implementar um workflow completo de **devoluções e trocas** (Return Merchandise Authorization) vinculado a vendas existentes. O vendedor inicia a devolução, seleciona os itens, o sistema gera crédito em loja ou reembolso, e o estoque é automaticamente ajustado. Ao criar uma devolução, notificação automática é enviada para o ADMIN via WebSocket.

---

## 🧱 Backend (NestJS)

### Estrutura sugerida:

```
src/
├── domain/entities/returns/
│   ├── return-order.entity.ts
│   └── return-item.entity.ts
├── domain/repositories/returns/
│   └── returns.repository.interface.ts
├── application/use-cases/returns/
│   ├── create-return.use-case.ts
│   ├── approve-return.use-case.ts
│   ├── reject-return.use-case.ts
│   ├── process-refund.use-case.ts
│   └── list-returns.use-case.ts
├── infrastructure/
│   ├── controllers/returns.controller.ts
│   ├── dtos/returns/
│   │   ├── create-return.dto.ts
│   │   └── approve-return.dto.ts
│   ├── persistence/returns/
│   │   └── prisma-returns.repository.ts
│   └── modules/returns.module.ts
```

### Schema Prisma:

```prisma
enum ReturnStatus {
  REQUESTED
  APPROVED
  REFUNDED
  REJECTED
}

enum RefundType {
  STORE_CREDIT
  CASH_REFUND
  EXCHANGE
}

model ReturnOrder {
  id          String       @id @default(uuid())
  tenantId    String       @map("tenant_id")
  saleId      String       @map("sale_id")
  userId      String       @map("user_id")
  customerId  String?      @map("customer_id")
  status      ReturnStatus @default(REQUESTED)
  refundType  RefundType   @map("refund_type")
  reason      String?
  totalRefund Decimal      @map("total_refund") @db.Decimal(10, 2)
  approvedBy  String?      @map("approved_by")
  approvedAt  DateTime?    @map("approved_at")
  processedAt DateTime?    @map("processed_at")
  createdAt   DateTime     @default(now()) @map("created_at")

  tenant   Tenant       @relation(fields: [tenantId], references: [id])
  sale     Sale         @relation(fields: [saleId], references: [id])
  user     User         @relation(fields: [userId], references: [id], name: "CreatedReturns")
  approver User?        @relation(fields: [approvedBy], references: [id], name: "ApprovedReturns")
  customer Customer?    @relation(fields: [customerId], references: [id])
  items    ReturnItem[]

  @@index([tenantId])
  @@index([saleId])
  @@map("return_orders")
}

model ReturnItem {
  id            String  @id @default(uuid())
  returnOrderId String  @map("return_order_id")
  productId     String  @map("product_id")
  quantity      Int
  unitPrice     Decimal @map("unit_price") @db.Decimal(10, 2)
  total         Decimal @db.Decimal(10, 2)
  condition     String  @default("GOOD") // "GOOD" | "DAMAGED" | "DEFECTIVE"

  returnOrder ReturnOrder @relation(fields: [returnOrderId], references: [id], onDelete: Cascade)
  product     Product     @relation(fields: [productId], references: [id])

  @@index([returnOrderId])
  @@map("return_items")
}
```

### Tarefas Backend:

- [ ] Criar entities de domínio: `ReturnOrder`, `ReturnItem`
- [ ] Criar DTOs: `CreateReturnDto`, `ApproveReturnDto`
- [ ] Criar interface `IReturnsRepository`
- [ ] Implementar `PrismaReturnsRepository`
- [ ] Criar use case: `CreateReturn` — valida qty devolvida vs qty vendida, cria solicitação
- [ ] Criar use case: `ApproveReturn` — ADMIN aprova, integra estoque via `InventoryModule`
- [ ] Criar use case: `RejectReturn` — ADMIN rejeita com motivo
- [ ] Criar use case: `ProcessRefund` — processa reembolso (crédito loja ou caixa)
- [ ] Criar use case: `ListReturns` — lista com filtros por status/período
- [ ] Criar `ReturnsController` com endpoints REST
- [ ] Integrar com `InventoryModule` — gerar `InventoryMovement` tipo `RETURN` ao aprovar
- [ ] Integrar com `NotificationDispatcherService`:
  - `RETURN_PENDING` → broadcast para ADMINs ao criar devolução
  - `RETURN_APPROVED` → notificar USER ao ser aprovada
- [ ] Criar `ReturnsModule` e registrar no `AppModule`
- [ ] Criar migration Prisma

---

## 🎨 Frontend (Angular)

### Estrutura sugerida:

```
src/app/features/returns/
├── pages/
│   ├── return-list/          # Lista de devoluções (ADMIN + USER)
│   └── return-form/          # Wizard de nova devolução (USER)
├── components/
│   ├── return-item-selector/ # Checklist de itens da venda + qty
│   ├── return-status-badge/  # Badge colorido por status
│   └── return-summary/       # Resumo do reembolso calculado
├── services/
│   └── returns.service.ts
└── store/
    └── returns.store.ts
```

### Tarefas Frontend:

- [ ] Criar `ReturnsService` HTTP
- [ ] Criar `ReturnsStore` com signals
- [ ] Criar página `ReturnListComponent` — tabela paginada, filtros por status/data
- [ ] Criar página `ReturnFormComponent` — wizard: buscar venda → selecionar itens → motivo → tipo reembolso
- [ ] Criar componente `ReturnItemSelectorComponent` — checkbox por item com campo de qty e condição
- [ ] Criar componente `ReturnStatusBadgeComponent` — REQUESTED/APPROVED/REFUNDED/REJECTED
- [ ] Criar componente `ReturnSummaryComponent` — preview do valor de reembolso em tempo real
- [ ] Adicionar botão "Iniciar Devolução" na página de detalhe de venda
- [ ] Adicionar rotas lazy-loaded
- [ ] Adicionar item "Devoluções" no sidebar (ADMIN e USER)
- [ ] ACTION URL de deep-link: clicar na notificação `RETURN_PENDING` → abre lista filtrada por pendentes

---

## 🧪 Testes

### Testes Unitários:
- `CreateReturnUseCase` — qty devolvida > qty vendida deve falhar
- `ApproveReturnUseCase` — somente ADMIN, estoque deve ser reintegrado via mock
- `ProcessRefundUseCase` — valor calculado corretamente por itens selecionados

### Testes E2E:
- Fluxo: realizar venda → iniciar devolução parcial → ADMIN aprova → verificar estoque restaurado
- Validar notificação `RETURN_PENDING` chega ao ADMIN em tempo real

---

## 🔒 Segurança

- USER solicita devolução; somente ADMIN aprova/rejeita
- Qty devolvida validada server-side contra o pedido original
- Devolução permitida apenas em vendas com status `COMPLETED`
- Multi-tenancy: `tenant_id` em todas as tabelas e queries

---

## ⚠️ Riscos Técnicos

| Risco | Mitigação |
|---|---|
| Devolução duplicada do mesmo item | Verificar qty total devolvida acumulada por `SaleItem` |
| Crédito em loja sem rastreio claro | Usar `PaymentMethod.STORE_CREDIT` existente no schema |
| Concorrência no ajuste de estoque | Transaction Prisma na aprovação |

---

## 📊 Critérios de Aceite

- [ ] USER inicia devolução de uma venda concluída, selecionando itens e quantities
- [ ] ADMIN recebe notificação em tempo real ao criar devolução
- [ ] ADMIN aprova ou rejeita com motivo
- [ ] Estoque é reintegrado automaticamente na aprovação
- [ ] Tipo de reembolso é registrado (crédito, dinheiro, troca)
- [ ] Histórico de devoluções com filtros por status

---

## ⏱️ Estimativa Técnica

| Tarefa | Estimativa |
|---|---|
| Schema + Migration | 2h |
| Entities + Repositories | 3h |
| Use Cases | 5h |
| Controller + DTOs | 2h |
| Integrações (Estoque + Notificações) | 3h |
| Frontend — Pages + Components | 8h |
| Testes unitários | 3h |
| Testes E2E | 2h |
| **TOTAL** | **~28h (~4 dias)** |

---

## 📦 Dependências

- `NotificationsModule` (Sprint 1 — obrigatório)

---
---

# 📦 Módulo 3: Programa de Fidelidade & Cashback

> **Sprint 3 — Status: ✅ Concluído** | *Depende de: Notificações (Sprint 1)*

## 🎯 Objetivo

Implementar um sistema de fidelidade e cashback por tenant. Cada loja configura suas próprias regras de acúmulo de pontos por real gasto. Clientes acumulam pontos a cada compra e podem resgatar como desconto no PDV. Aumenta **retenção, ticket médio e recorrência**.

> [!NOTE]
> **Decisão v1:** Expiração de pontos (`expirationDays`) mantida no schema mas **desabilitada funcionalmente** na v1. BullMQ job de expiração fica no backlog para v2.

---

## 🧱 Backend (NestJS)

### Estrutura sugerida:

```
src/
├── domain/entities/loyalty/
│   ├── loyalty-program.entity.ts
│   ├── loyalty-account.entity.ts
│   └── loyalty-transaction.entity.ts
├── domain/repositories/loyalty/
│   └── loyalty.repository.interface.ts
├── application/use-cases/loyalty/
│   ├── configure-loyalty-program.use-case.ts
│   ├── earn-points.use-case.ts
│   ├── redeem-points.use-case.ts
│   └── get-loyalty-balance.use-case.ts
├── infrastructure/
│   ├── controllers/loyalty.controller.ts
│   ├── dtos/loyalty/
│   │   ├── configure-program.dto.ts
│   │   ├── earn-points.dto.ts
│   │   └── redeem-points.dto.ts
│   ├── persistence/loyalty/
│   │   └── prisma-loyalty.repository.ts
│   └── modules/loyalty.module.ts
```

### Schema Prisma:

```prisma
model LoyaltyProgram {
  id              String   @id @default(uuid())
  tenantId        String   @unique @map("tenant_id")
  name            String   @default("Programa de Fidelidade")
  pointsPerReal   Decimal  @default(1) @map("points_per_real") @db.Decimal(10, 2)
  redeemRatio     Decimal  @default(0.01) @map("redeem_ratio") @db.Decimal(10, 4)
  minRedeemPoints Int      @default(100) @map("min_redeem_points")
  maxDiscountPct  Decimal  @default(50) @map("max_discount_pct") @db.Decimal(5, 2)
  expirationDays  Int?     @map("expiration_days") // v1: sempre null
  active          Boolean  @default(true)
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  tenant   Tenant           @relation(fields: [tenantId], references: [id])
  accounts LoyaltyAccount[]

  @@map("loyalty_programs")
}

model LoyaltyAccount {
  id               String   @id @default(uuid())
  tenantId         String   @map("tenant_id")
  customerId       String   @map("customer_id")
  loyaltyProgramId String   @map("loyalty_program_id")
  balance          Int      @default(0)
  totalEarned      Int      @default(0) @map("total_earned")
  totalRedeemed    Int      @default(0) @map("total_redeemed")
  createdAt        DateTime @default(now()) @map("created_at")

  customer       Customer             @relation(fields: [customerId], references: [id])
  loyaltyProgram LoyaltyProgram       @relation(fields: [loyaltyProgramId], references: [id])
  transactions   LoyaltyTransaction[]

  @@unique([tenantId, customerId])
  @@map("loyalty_accounts")
}

model LoyaltyTransaction {
  id        String   @id @default(uuid())
  accountId String   @map("account_id")
  type      String   // "EARN" | "REDEEM" | "ADJUST"   (EXPIRE desabilitado v1)
  points    Int
  saleId    String?  @map("sale_id")
  reason    String?
  createdAt DateTime @default(now()) @map("created_at")

  account LoyaltyAccount @relation(fields: [accountId], references: [id])

  @@index([accountId])
  @@map("loyalty_transactions")
}
```

### Tarefas Backend:

- [ ] Criar entities: `LoyaltyProgram`, `LoyaltyAccount`, `LoyaltyTransaction`
- [ ] Criar DTOs: `ConfigureProgramDto`, `EarnPointsDto`, `RedeemPointsDto`
- [ ] Criar interface `ILoyaltyRepository`
- [ ] Implementar `PrismaLoyaltyRepository`
- [ ] Criar use case: `ConfigureLoyaltyProgram` — ADMIN configura regras do programa
- [ ] Criar use case: `EarnPoints` — auto-trigger pós-venda `COMPLETED` via evento
- [ ] Criar use case: `RedeemPoints` — valida saldo, aplica desconto, registra transação
- [ ] Criar use case: `GetLoyaltyBalance` — retorna saldo + histórico do cliente
- [ ] Criar `LoyaltyController` com endpoints REST
- [ ] Integrar com `SalesModule` — chamar `EarnPoints` ao completar venda
- [ ] Integrar com `NotificationDispatcherService` — notificar vendedor quando cliente acumula pontos suficientes para resgate
- [ ] Criar `LoyaltyModule` e registrar no `AppModule`
- [ ] Criar migration + seed com programa de fidelidade padrão

---

## 🎨 Frontend (Angular)

### Estrutura sugerida:

```
src/app/features/loyalty/
├── pages/
│   ├── loyalty-config/       # Configuração do programa (ADMIN)
│   └── loyalty-dashboard/    # Visão geral do programa
├── components/
│   ├── loyalty-badge/        # Badge com saldo do cliente (PDV)
│   ├── redeem-dialog/        # Modal de resgate no PDV
│   └── loyalty-history/      # Histórico de transações do cliente
├── services/
│   └── loyalty.service.ts
└── store/
    └── loyalty.store.ts
```

### Tarefas Frontend:

- [ ] Criar `LoyaltyService` HTTP
- [ ] Criar `LoyaltyStore` com signals (`balance`, `program`, `transactions`)
- [ ] Criar página `LoyaltyConfigComponent` — formulário de configuração (pontos/real, ratio, mínimo)
- [ ] Criar componente `LoyaltyBadgeComponent` — badge de saldo exibido no PDV ao selecionar cliente
- [ ] Criar componente `RedeemDialogComponent` — modal com slider de pontos a resgatar + preview do desconto
- [ ] Criar componente `LoyaltyHistoryComponent` — tabela de transações EARN/REDEEM/ADJUST
- [ ] Criar página `LoyaltyDashboardComponent` — métricas: total puntos em circulação, clientes ativos, resgates do mês
- [ ] Integrar `LoyaltyBadge` no `PosComponent` quando cliente é selecionado
- [ ] Integrar opção de resgate no fluxo de checkout do PDV
- [ ] Adicionar rotas lazy-loaded
- [ ] Adicionar item "Fidelidade" no sidebar (ADMIN/SUPER_ADMIN)
- [ ] Adicionar KPI card no dashboard: "Clientes Fidelizados" / "Pontos em Circulação"

---

## 🧪 Testes

### Testes Unitários:
- `EarnPointsUseCase` — cálculo de pontos arredondado por `pointsPerReal`
- `RedeemPointsUseCase` — saldo insuficiente, exceder `maxDiscountPct`
- `LoyaltyStore` — atualização de signals ao receber dados

### Testes E2E:
- Fluxo: configurar programa → venda R$150 → verificar pontos acumulados → resgatar → verificar desconto aplicado
- Isolamento: cliente do tenant A não tem pontos no tenant B

---

## 🔒 Segurança

- Apenas ADMIN configura o programa de fidelidade
- Resgate validado server-side: saldo >= `minRedeemPoints`
- Desconto de resgate não excede `maxDiscountPct` da venda
- Transactions Prisma para evitar race condition no resgate
- Multi-tenancy completo

---

## ⚠️ Riscos Técnicos

| Risco | Mitigação |
|---|---|
| Race condition no resgate simultâneo | Prisma `$transaction` com lock na conta |
| Expiração v2 compatível com schema atual | Campo `expirationDays` já presente no schema — apenas ativar lógica |

---

## 📊 Critérios de Aceite

- [ ] Admin configura regras de pontos
- [ ] Pontos são acumulados automaticamente ao completar venda
- [ ] Vendedor visualiza saldo de pontos do cliente no PDV
- [ ] Cliente resgata pontos como desconto no PDV
- [ ] Histórico de transações acessível
- [ ] Dados isolados por tenant

---

## ⏱️ Estimativa Técnica

| Tarefa | Estimativa |
|---|---|
| Schema + Migration + Seed | 3h |
| Entities + Repositories | 4h |
| Use Cases | 5h |
| Controller + DTOs | 3h |
| Integração com Sales + Notificações | 3h |
| Frontend — Service + Store | 3h |
| Frontend — Pages + Components | 8h |
| Testes unitários | 4h |
| Testes E2E | 3h |
| **TOTAL** | **~36h (~5 dias)** |

---
---

# 📦 Módulo 11: Emissão Fiscal (NFC-e / NF-e)

> **Sprint 11 — Status: 🔲 Pendente** | *Depende de: Vendas + Notificações (Sprints Anteriores)*

## 🎯 Objetivo

Integrar a emissão de cupons fiscais eletrônicos (NFC-e) diretamente pelo PDV e Notas Fiscais Eletrônicas (NF-e) para o backoffice, utilizando uma API de mensageria de terceiros (ex: Focus NFe, Webmania). Isso elimina a complexidade de assinar e transmitir XMLs diretamente para a SEFAZ, além de garantir a emissão mesmo com instabilidades da fazenda local.

> [!NOTE]
> Conforme definido com o Tech Lead, este módulo será atacado nas **últimas sprints (Sprint 11)**, permitindo que a loja consolide sua operação de vendas e MVP antes da obrigatoriedade fiscal automatizada.

## 🧱 Backend (NestJS)

- **Novas Entidades Fiscais:** Expandir `Tenant` (CNPJ, Inscrição Estadual, Certificado A1), `Product` (NCM, CEST, CST, Origem) e criar `Invoice` (status da nota, link DANFE, xml).
- **Emissão Assíncrona via BullMQ:** Ao fechar a venda, um job processa os dados, monta o payload e envia para a API Parceira, evitando que o PDV trave.
- **Webhooks:** Endpoint para receber o retorno da API Parceira ("Autorizada", "Rejeitada", "Cancelada") e atualizar o status no banco.
- **Integração com Notificações:** Emite alerta em tempo real (`HIGH`) via WebSocket para o vendedor quando a nota é autorizada (pronta para impressão) ou rejeitada (erro no NCM, por exemplo).

## 🎨 Frontend (Angular)

- **Configurações Fiscais da Loja:** Upload de certificado `.pfx` e parametrização.
- **Aba Tributária no Produto:** Cadastro de NCM e impostos de produtos.
- **Integração no PDV:** 
  - Possibilidade de "CPF na Nota".
  - Botão para emissão de cupom fiscal na finalização da venda.
- **Histórico e Impressão:** Download de XML e DANFE nas listagens de vendas.

## ⏱️ Estimativa Técnica

Esforço aproximado de **~8 dias** considerando integrações de API externa, filas assíncronas e lidar com exceções da SEFAZ.

---

## 📦 Dependências

| Pacote | Onde | Observação |
|---|---|---|
| `@nestjs/bullmq` | Backend | Para gestão da fila assíncrona de emissão fiscal e tratamento de falhas da SEFAZ. |
| `bullmq` | Backend | Motor da fila e sistema de retry persistido em Redis (introduzido no Módulo 1). |

- `NotificationsModule` (Sprint 1)

---
---

# 📦 Módulo 4: Comissionamento Inteligente (% Fixa v1)

> **Sprint 4 — Status: ✅ Concluído** | *Depende de: Notificações (Sprint 1)*

## 🎯 Objetivo

Implementar sistema de **comissões e metas de vendas** por vendedor. Admin define % de comissão fixa por tenant e metas mensais por vendedor. O sistema calcula automaticamente a comissão ao concluir cada venda. Vendedores acompanham meta e ganhos em tempo real no dashboard.

> [!NOTE]
> **Decisão v1:** Apenas `FIXED_PERCENTAGE`. Tipos `TIERED` e `PER_CATEGORY` ficam no backlog (v2). Schema preparado para expansão futura.

---

## 🧱 Backend (NestJS)

### Estrutura sugerida:

```
src/
├── domain/entities/commissions/
│   ├── commission-rule.entity.ts       # Regra de % por tenant (v1: apenas FIXED)
│   ├── sales-goal.entity.ts            # Metas mensais por vendedor
│   └── commission-record.entity.ts     # Registro imutável por venda
├── domain/repositories/commissions/
│   └── commissions.repository.interface.ts
├── application/use-cases/commissions/
│   ├── configure-commission-rule.use-case.ts
│   ├── set-sales-goal.use-case.ts
│   ├── calculate-commission.use-case.ts
│   ├── reverse-commission.use-case.ts      # Estorno ao cancelar venda
│   ├── get-seller-performance.use-case.ts
│   └── generate-commission-report.use-case.ts
├── infrastructure/
│   ├── controllers/commissions.controller.ts
│   ├── dtos/commissions/
│   │   ├── commission-rule.dto.ts
│   │   ├── sales-goal.dto.ts
│   │   └── commission-filters.dto.ts
│   ├── persistence/commissions/
│   │   └── prisma-commissions.repository.ts
│   └── modules/commissions.module.ts
```

### Schema Prisma (v1 — apenas FIXED_PERCENTAGE):

```prisma
// v1: type sempre FIXED_PERCENTAGE — campo mantido para expansão v2
model CommissionRule {
  id         String   @id @default(uuid())
  tenantId   String   @map("tenant_id")
  percentage Decimal  @db.Decimal(5, 2)   // % de comissão sobre o total da venda
  active     Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
  @@map("commission_rules")
}

model SalesGoal {
  id         String   @id @default(uuid())
  tenantId   String   @map("tenant_id")
  userId     String   @map("user_id")
  month      Int      // 1-12
  year       Int
  goalAmount Decimal  @map("goal_amount") @db.Decimal(10, 2)
  bonusPct   Decimal  @default(0) @map("bonus_pct") @db.Decimal(5, 2)
  createdAt  DateTime @default(now()) @map("created_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@unique([tenantId, userId, month, year])
  @@map("sales_goals")
}

model CommissionRecord {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  userId        String    @map("user_id")
  saleId        String    @map("sale_id")
  saleTotal     Decimal   @map("sale_total") @db.Decimal(10, 2)
  commissionPct Decimal   @map("commission_pct") @db.Decimal(5, 2)
  commissionVal Decimal   @map("commission_val") @db.Decimal(10, 2)
  reversed      Boolean   @default(false)   // true se venda foi cancelada
  reversedAt    DateTime? @map("reversed_at")
  isPaid        Boolean   @default(false) @map("is_paid")
  paidAt        DateTime? @map("paid_at")
  createdAt     DateTime  @default(now()) @map("created_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])
  user   User   @relation(fields: [userId], references: [id])
  sale   Sale   @relation(fields: [saleId], references: [id])

  @@index([tenantId])
  @@index([userId])
  @@map("commission_records")
}
```

### Tarefas Backend:

- [ ] Criar entities: `CommissionRule`, `SalesGoal`, `CommissionRecord`
- [ ] Criar DTOs: `CommissionRuleDto` (apenas `percentage`), `SalesGoalDto`, `CommissionFiltersDto`
- [ ] Criar interface `ICommissionsRepository`
- [ ] Implementar `PrismaCommissionsRepository`
- [ ] Criar use case: `ConfigureCommissionRule` — ADMIN define % (único registro ativo por tenant)
- [ ] Criar use case: `SetSalesGoal` — ADMIN define meta mensal por vendedor
- [ ] Criar use case: `CalculateCommission` — auto-trigger pós-venda `COMPLETED`
- [ ] Criar use case: `ReverseCommission` — marca `reversed=true` ao cancelar venda
- [ ] Criar use case: `GetSellerPerformance` — agrega vendas+comissões do mês
- [ ] Criar use case: `GenerateCommissionReport` — relatório mensal em PDF
- [ ] Criar `CommissionsController`
- [ ] Integrar com `SalesModule` — `CalculateCommission` ao completar venda; `ReverseCommission` ao cancelar
- [ ] Integrar com `NotificationDispatcherService` — `GOAL_ACHIEVED` ao bater meta mensal
- [ ] Criar `CommissionsModule` e registrar no `AppModule`
- [ ] Criar migration + seed

---

## 🎨 Frontend (Angular)

### Estrutura sugerida:

```
src/app/features/commissions/
├── pages/
│   ├── commission-config/     # Config de % (ADMIN)
│   ├── goals-management/      # Gestão de metas por vendedor (ADMIN)
│   └── seller-performance/    # Painel pessoal do vendedor
├── components/
│   ├── goal-progress-bar/     # Barra de progresso visual
│   ├── commission-summary/    # Card: comissão acumulada no mês
│   ├── performance-chart/     # ApexCharts: evolução vendas vs meta
│   └── ranking-table/         # Ranking de vendedores (ADMIN)
├── services/
│   └── commissions.service.ts
└── store/
    └── commissions.store.ts
```

### Tarefas Frontend:

- [ ] Criar `CommissionsService` HTTP
- [ ] Criar `CommissionsStore` com signals
- [ ] Criar página `CommissionConfigComponent` — campo simples de % + salvar
- [ ] Criar página `GoalsManagementComponent` — tabela por vendedor/mês, edição inline
- [ ] Criar página `SellerPerformanceComponent` — dashboard pessoal
- [ ] Criar componente `GoalProgressBarComponent` — % atingido com animação
- [ ] Criar componente `CommissionSummaryComponent` — valor acumulado do mês
- [ ] Criar componente `PerformanceChartComponent` — ApexCharts linha: vendas vs meta
- [ ] Criar componente `RankingTableComponent` — top vendedores do mês (ADMIN)
- [ ] Adicionar widget de meta + comissão no Dashboard principal (vendedor logado)
- [ ] Adicionar rotas lazy-loaded
- [ ] Adicionar item "Comissões" no sidebar

---

## 🧪 Testes

### Testes Unitários:
- `CalculateCommissionUseCase` — `comissionVal = saleTotal * (percentage / 100)`
- `ReverseCommissionUseCase` — `reversed=true`, não revertida duas vezes
- `GetSellerPerformanceUseCase` — agregação correta excluindo registros `reversed`

### Testes E2E:
- Fluxo: configurar 5% → definir meta R$10.000 → vendedor faz venda R$500 → comissão R$25 registrada → progresso 5%
- Fluxo: cancelar venda → comissão revertida → progresso decresce

---

## 🔒 Segurança

- ADMIN configura % e metas; USER apenas visualiza seus dados
- `CommissionRecord` é imutável (exceto flag `reversed`)
- Relatórios de comissão filtrados por `userId` para vendedores
- Multi-tenancy

---

## ⚠️ Riscos Técnicos

| Risco | Mitigação |
|---|---|
| Venda cancelada após comissão calculada | `ReverseCommission` use case + campo `reversed` |
| Performance com muitos registros | Índice em `[userId]` + query com `month/year` filter |
| Múltiplas regras ativas ao mesmo tempo | Business rule: apenas 1 regra ativa por tenant |

---

## 📊 Critérios de Aceite

- [ ] Admin configura % de comissão do tenant
- [ ] Admin define metas mensais por vendedor
- [ ] Comissão calculada automaticamente ao concluir venda
- [ ] Comissão revertida ao cancelar venda
- [ ] Vendedor visualiza progresso da meta e comissões acumuladas
- [ ] Admin visualiza ranking e relatório mensal

---

## ⏱️ Estimativa Técnica

| Tarefa | Estimativa |
|---|---|
| Schema + Migration | 2h |
| Entities + Repositories | 3h |
| Use Cases (% fixa + estorno) | 5h |
| Controller + DTOs | 2h |
| Integração Sales + Notificações | 3h |
| Frontend — Pages + Components | 8h |
| Testes unitários | 4h |
| Testes E2E | 2h |
| **TOTAL** | **~29h (~4 dias)** |

---

## 📦 Dependências

- `ng-apexcharts` (já existente)
- `NotificationsModule` (Sprint 1)

---
---

# 📦 Módulo 5: Cupons & Promoções Dinâmicas

> **Sprint 5-6 — Status: 🔲 Pendente** | *Depende de: Notificações (Sprint 1)*

## 🎯 Objetivo

Implementar uma **engine de promoções e cupons** com regras compostas. Tipos suportados na v1: `PERCENTAGE` (desconto %), `FIXED_AMOUNT` (desconto fixo) e `BUY_X_GET_Y` (compre X leve Y). Cupons aplicados no PDV via código. Promoções ativas aplicadas automaticamente ao montar o carrinho.

> [!NOTE]
> **Decisão v1:** Os três tipos (`PERCENTAGE`, `FIXED_AMOUNT`, `BUY_X_GET_Y`) são incluídos. `BUY_X_GET_Y` requer `PromotionEngine` domain service com lógica de itens qualificadores.

---

## 🧱 Backend (NestJS)

### Estrutura sugerida:

```
src/
├── domain/entities/promotions/
│   ├── promotion.entity.ts
│   ├── coupon.entity.ts
│   └── coupon-usage.entity.ts
├── domain/services/
│   └── promotion-engine.domain-service.ts   # Lógica de regras compostas
├── domain/repositories/promotions/
│   └── promotions.repository.interface.ts
├── application/use-cases/promotions/
│   ├── create-promotion.use-case.ts
│   ├── create-coupon.use-case.ts
│   ├── validate-coupon.use-case.ts
│   ├── apply-promotions-to-cart.use-case.ts
│   └── list-promotions.use-case.ts
├── infrastructure/
│   ├── controllers/promotions.controller.ts
│   ├── dtos/promotions/
│   │   ├── create-promotion.dto.ts
│   │   ├── create-coupon.dto.ts
│   │   └── validate-coupon.dto.ts
│   ├── persistence/promotions/
│   │   └── prisma-promotions.repository.ts
│   └── modules/promotions.module.ts
```

### Schema Prisma:

```prisma
enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
  BUY_X_GET_Y
}

model Promotion {
  id           String       @id @default(uuid())
  tenantId     String       @map("tenant_id")
  name         String
  description  String?
  discountType DiscountType @map("discount_type")
  discountVal  Decimal      @map("discount_value") @db.Decimal(10, 2)
  rules        Json
  // PERCENTAGE/FIXED_AMOUNT rules: { minAmount?, categoryIds?, brandIds? }
  // BUY_X_GET_Y rules: { buyQty: 3, getQty: 1, categoryIds? }
  startDate    DateTime     @map("start_date")
  endDate      DateTime     @map("end_date")
  active       Boolean      @default(true)
  maxUses      Int?         @map("max_uses")
  currentUses  Int          @default(0) @map("current_uses")
  stackable    Boolean      @default(false)
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  tenant  Tenant   @relation(fields: [tenantId], references: [id])
  coupons Coupon[]

  @@index([tenantId])
  @@index([startDate, endDate])
  @@map("promotions")
}

model Coupon {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")
  promotionId String   @map("promotion_id")
  code        String
  maxUses     Int?     @map("max_uses")
  currentUses Int      @default(0) @map("current_uses")
  expiresAt   DateTime @map("expires_at")
  active      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")

  tenant    Tenant        @relation(fields: [tenantId], references: [id])
  promotion Promotion     @relation(fields: [promotionId], references: [id])
  usages    CouponUsage[]

  @@unique([tenantId, code])
  @@map("coupons")
}

model CouponUsage {
  id        String   @id @default(uuid())
  couponId  String   @map("coupon_id")
  saleId    String   @map("sale_id")
  discount  Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now()) @map("created_at")

  coupon Coupon @relation(fields: [couponId], references: [id])
  sale   Sale   @relation(fields: [saleId], references: [id])

  @@index([couponId])
  @@map("coupon_usages")
}
```

### Tarefas Backend:

- [ ] Criar entities: `Promotion`, `Coupon`, `CouponUsage`
- [ ] Criar DTOs: `CreatePromotionDto`, `CreateCouponDto`, `ValidateCouponDto`
- [ ] Criar interface `IPromotionsRepository`
- [ ] Implementar `PrismaPromotionsRepository`
- [ ] Criar `PromotionEngine` domain service
  - [ ] `applyPercentage(cart, promotion)` — desconto % com regras de categoria/marca/minAmount
  - [ ] `applyFixedAmount(cart, promotion)` — desconto fixo com condições
  - [ ] `applyBuyXGetY(cart, promotion)` — identifica itens qualificadores, aplica desconto nos mais baratos
  - [ ] Suporte a `stackable=true` (múltiplas promoções no mesmo carrinho)
- [ ] Criar use case: `CreatePromotion` — ADMIN cria promoção
- [ ] Criar use case: `CreateCoupon` — ADMIN gera cupom vinculado à promoção
- [ ] Criar use case: `ValidateCoupon` — valida código, expiração, limite de uso, tenant
- [ ] Criar use case: `ApplyPromotionsToCart` — calcula desconto total para o carrinho (promoções ativas + cupom)
- [ ] Criar use case: `ListPromotions` — CRUD com filtros
- [ ] Criar `PromotionsController`
- [ ] Integrar com `SalesModule` — registrar `CouponUsage` ao finalizar venda
- [ ] Integrar com Redis — cachear promoções ativas por tenant (TTL 5min)
- [ ] Integrar com `NotificationDispatcherService` — `PROMOTION_EXPIRING` 24h antes via BullMQ
- [ ] Criar `PromotionsModule`
- [ ] Criar migration + seed (3 promoções de exemplo: %, fixo, 3x2)

---

## 🎨 Frontend (Angular)

### Estrutura sugerida:

```
src/app/features/promotions/
├── pages/
│   ├── promotion-list/        # Lista de promoções com status
│   ├── promotion-form/        # Wizard de criação/edição
│   └── coupon-management/     # Gestão de cupons da promoção
├── components/
│   ├── promotion-rule-builder/ # Builder visual: tipo → regras → período
│   ├── coupon-input/           # Campo de cupom no PDV
│   ├── discount-preview/       # Preview do desconto calculado em tempo real
│   └── active-promotions-badge/# Exibe promoções ativas no PDV
├── services/
│   └── promotions.service.ts
└── store/
    └── promotions.store.ts
```

### Tarefas Frontend:

- [ ] Criar `PromotionsService` HTTP
- [ ] Criar `PromotionsStore` com signals
- [ ] Criar página `PromotionListComponent` — tabela com badges ativo/expirado/agendado
- [ ] Criar página `PromotionFormComponent` — wizard de 4 passos: tipo → regras → período → cupons
- [ ] Criar componente `PromotionRuleBuilderComponent` — UI contextual por tipo de promoção
- [ ] Criar página `CouponManagementComponent` — lista de cupons com uso/limite/status
- [ ] Criar componente `CouponInputComponent` — campo de código no PDV com feedback visual
- [ ] Criar componente `DiscountPreviewComponent` — exibe desconto aplicado item por item
- [ ] Criar componente `ActivePromotionsBadgeComponent` — chips de promoções ativas no PDV
- [ ] Integrar campo de cupom no `PosComponent`
- [ ] Integrar `ApplyPromotionsToCart` no cálculo do carrinho (debounce 300ms)
- [ ] Adicionar rotas lazy-loaded
- [ ] Adicionar item "Promoções" no sidebar (ADMIN)

---

## 🧪 Testes

### Testes Unitários:
- `PromotionEngine.applyPercentage` — com e sem regras de categoria/brand
- `PromotionEngine.applyBuyXGetY` — 3 itens elegíveis → desconto no mais barato
- `PromotionEngine.applyBuyXGetY` — 2 itens elegíveis → sem desconto (mínimo não atingido)
- `ValidateCouponUseCase` — expirado, limite atingido, tenant inválido
- Cache Redis: segunda chamada retorna do cache

### Testes E2E:
- Fluxo: criar promoção "10% acima R$100" → PDV: carrinho R$150 → desconto R$15 aplicado
- Fluxo: criar cupom → digitar no PDV → validar e aplicar → registrar uso
- Fluxo BuyXGetY: criar "compre 3 leve 1" → PDV: 4 itens igual → 1 grátis

---

## 🔒 Segurança

- ADMIN cria/edita promoções; USER as aplica no PDV
- `ValidateCoupon` server-side — cliente não pode forjar validade
- Rate limiting: máx 10 tentativas/min por IP no endpoint de validação de cupom
- Coupon code: alfanumérico uppercase, mínimo 6 caracteres
- Cache de promoções: invalidar ao criar/editar/desativar
- Multi-tenancy: cupom do tenant A **não** funciona no tenant B

---

## ⚠️ Riscos Técnicos

| Risco | Mitigação |
|---|---|
| `BUY_X_GET_Y` com itens de categorias mistas | `PromotionEngine` filtra por `categoryIds` antes de contar qualificadores |
| Stacking abusivo de promoções | Campo `stackable=false` como default; engine verifica antes de combinar |
| Cupons brute-force | Rate limiting + codes longos; lockout após 10 tentativas |
| Cache stale ao editar promoção | Invalidar cache Redis ao salvar/desativar promoção |
| Performance: muitas promoções ativas | Cache Redis por tenant (TTL 5min) + índice em `[startDate, endDate]` |

---

## 📊 Critérios de Aceite

- [ ] Admin cria promoções dos 3 tipos (%, fixo, BuyXGetY)
- [ ] Promoções ativas são aplicadas automaticamente no PDV quando regras atingidas
- [ ] Cupons podem ser digitados no PDV e validados em tempo real
- [ ] `BUY_X_GET_Y`: desconto aplicado nos itens de menor valor quando qty atingida
- [ ] Relatório de uso de cupons acessível ao Admin
- [ ] Multi-tenancy: cupom de outra loja é rejeitado

---

## ⏱️ Estimativa Técnica

| Tarefa | Estimativa |
|---|---|
| Schema + Migration + Seed | 3h |
| Entities + Repositories | 3h |
| `PromotionEngine` Domain Service | 8h |
| Use Cases | 6h |
| Controller + DTOs | 3h |
| Cache Redis + BullMQ schedule | 3h |
| Integração POS + Sales | 4h |
| Frontend — Pages + Components | 12h |
| Testes unitários (engine) | 6h |
| Testes E2E | 3h |
| **TOTAL** | **~51h (~7 dias)** |

---

## 📦 Dependências

- `ioredis` / Redis (já existente)
- `bullmq` (já existente — para `PROMOTION_EXPIRING` schedule)
- `NotificationsModule` (Sprint 1)

---
---

# 📦 Módulo 6: Financeiro Completo & DRE Simplificada

> **Sprint 7 — Status: 🔲 Pendente** | *Depende de: PDV e Vendas (Core)*

## 🎯 Objetivo
Implementar um controle completo de contas a pagar e contas a receber (para vendas em boleto ou crediário próprio) e gerar o relatório visual DRE (Demonstração do Resultado do Exercício) e fluxo de caixa simplificados.

## 🧱 Backend (NestJS)
### Novas Tabelas Prisma:
```prisma
enum AccountStatus {
  PENDING
  PAID
  OVERDUE
  CANCELLED
}

model FinancialAccount {
  id          String        @id @default(uuid())
  tenantId    String        @map("tenant_id")
  type        String        // "PAYABLE" | "RECEIVABLE"
  description String
  amount      Decimal       @db.Decimal(10, 2)
  dueDate     DateTime      @map("due_date")
  paidAt      DateTime?     @map("paid_at")
  status      AccountStatus @default(PENDING)
  category    String        // "SUPPLIER" | "RENT" | "UTILITIES" | "SALARIES" | "TAXES" | "SALE"
  saleId      String?       @map("sale_id") // Se for contas a receber de uma venda
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
  @@index([status])
  @@map("financial_accounts")
}
```

### Use Cases:
- `CreatePayable` / `CreateReceivable` — registro manual ou automático (ao gerar venda a prazo).
- `PayAccount` / `ReceiveAccount` — quita a conta com data e forma de pagamento.
- `GetCashFlow` — agrega entradas e saídas diárias/mensais.
- `GetDRE` — calcula Receita Bruta, CMV (Custo de Mercadorias Vendidas baseado nos preços de custo de produtos), Despesas Operacionais e Lucro Líquido.

---

# 📦 Módulo 7: Cadastro Inteligente & IA Operacional (Gemini Flash)

> **Sprint 8 — Status: 🔲 Pendente** | *Depende de: Cadastro de Produtos (Core)*

## 🎯 Objetivo
Integrar o Google Gemini 2.5 Flash para permitir que o lojista cadastre produtos tirando apenas uma foto da etiqueta/NF, e receba insights operacionais semanais em linguagem natural baseados nas vendas e no estoque.

## 🧱 Backend (NestJS)
### Serviços & Use Cases:
- Instalar `@google/generative-ai`
- `AnalyzeProductImage` — recebe buffer de imagem, chama Gemini estruturando retorno com JSON Schema (Name, Description, suggestedCategory, SKU sugerido, Margem sugerida).
- `GenerateOperationalInsights` — job BullMQ que roda semanalmente, lê dados agregados do Tenant e gera insights textuais de demanda, inventário e metas.

## 🎨 Frontend (Angular)
- `ProductForm` com dropzone para foto e botão "Cadastrar por Foto (IA)". Ao clicar, auto-completa os campos para revisão.
- Card "Insights da IA" no topo do Dashboard com carrossel dinâmico de previsões operacionais.

---

# 📦 Módulo 8: Integração WhatsApp API

> **Sprint 9 — Status: 🔲 Pendente** | *Depende de: Notificações (Sprint 1)*

## 🎯 Objetivo
Automatizar a comunicação com o cliente enviando comprovantes em PDF, cupons de cashback, alertas de estoque crítico para gerentes e lembretes de cobrança automáticos via WhatsApp API.

## 🧱 Backend (NestJS)
### Serviços:
- `WhatsAppService` — cliente genérico para disparar requisições REST para gateways integradores (Evolution API, Z-API ou Cloud API oficial).
- `WhatsAppNotificationHandler` — intercepta triggers do `NotificationDispatcherService` e direciona alertas críticos direto para os números configurados de administradores ou clientes.

---

# 📦 Módulo 9: Billing & Monetização SaaS (Recorrência)

> **Sprint 10 — Status: 🔲 Pendente** | *Depende de: Multi-Tenant (Core)*

## 🎯 Objetivo
Cobrar mensalidades dos Tenants via checkout recorrente integrado ao Stripe ou Mercado Pago, aplicando travas de recursos baseados no plano ativo (Starter, Pro, Business).

## 🧱 Backend (NestJS)
- `StripeWebhookController` — processa eventos de assinatura (paga, atrasada, cancelada).
- `PlanEnforcerMiddleware` — intercepta requisições e bloqueia caso o tenant exceda cotas de usuários ou produtos do plano contratado.

---
---

# 📊 Resumo Executivo

## Totais por Sprint

| Sprint | Feature | Estimativa | Status |
|---|---|---|---|
| Sprint 1 | Notificações & Alertas em Tempo Real | ~39h (~6 dias) | ✅ Concluído |
| Sprint 2 | Gestão de Devoluções & Trocas (RMA) | ~28h (~4 dias) | ✅ Concluído |
| Sprint 3 | Programa de Fidelidade & Cashback | ~36h (~5 dias) | ⏳ Próxima Feature |
| Sprint 4 | Comissionamento Inteligente (% Fixa) | ~29h (~4 dias) | 🔲 Pendente |
| Sprint 5-6 | Cupons & Promoções Dinâmicas | ~51h (~7 dias) | 🔲 Pendente |
| Sprint 7 | Financeiro Completo & DRE | ~36h (~5 dias) | 🔲 Pendente |
| Sprint 8 | Inteligência Artificial (Gemini Flash) | ~40h (~6 dias) | 🔲 Pendente |
| Sprint 9 | Integração WhatsApp API | ~24h (~3 dias) | 🔲 Pendente |
| Sprint 10 | Billing & Assinaturas SaaS | ~36h (~5 dias) | 🔲 Pendente |
| **TOTAL** | | **~319h (~45 dias úteis)** | |

## Progresso do Roadmap

- Sprint 1 — Notificações: ✅ Concluído
- Sprint 2 — Devoluções: ✅ Concluído
- Sprint 3 — Fidelidade: ⏳ Próxima Feature
- Sprint 4 — Comissões: 🔲 Pendente
- Sprint 5-6 — Promoções: 🔲 Pendente
- Sprint 7 — Financeiro: 🔲 Pendente
- Sprint 8 — Inteligência Artificial: 🔲 Pendente
- Sprint 9 — WhatsApp API: 🔲 Pendente
- Sprint 10 — Billing SaaS: 🔲 Pendente
