# Interface Contract: DashboardLayoutService

**Feature**: `009-configurable-dashboard`  
**Layer**: Frontend — Angular Service  
**Version**: v1 (localStorage) | Interface projetada para compatibilidade com v2 (backend)

---

## Descrição

`DashboardLayoutService` é o único ponto de acesso ao estado e persistência do layout da dashboard. Todos os componentes que precisam ler ou modificar o layout DEVEM usar este serviço — nenhum acesso direto ao `localStorage` é permitido fora dele.

---

## Interface Pública

```typescript
@Injectable({ providedIn: 'root' })
export class DashboardLayoutService {

  /**
   * Signal com a ordem atual dos widgets.
   * Leitura reativa — emite a cada mudança de layout.
   */
  readonly widgetOrder: Signal<WidgetId[]>;

  /**
   * Signal indicando se o modo de edição está ativo.
   * Controlado pelo DashboardComponent.
   */
  readonly isEditMode: Signal<boolean>;

  /**
   * Ativa o modo de edição.
   * Cria uma cópia do layout atual para edição sem afetar o layout salvo.
   */
  enterEditMode(): void;

  /**
   * Cancela o modo de edição e descarta todas as alterações.
   * Restaura widgetOrder ao estado anterior ao enterEditMode().
   */
  cancelEditMode(): void;

  /**
   * Salva o layout de edição atual como o layout persistido do usuário.
   * Escreve no localStorage (v1) ou faz PUT no backend (v2).
   * @returns true se salvo com sucesso, false em caso de erro
   */
  saveLayout(): boolean;

  /**
   * Atualiza a ordem dos widgets durante o modo de edição (chamado pelo CdkDropList).
   * Não persiste — apenas atualiza o estado em memória de edição.
   */
  moveWidget(event: CdkDragDrop<WidgetId[]>): void;

  /**
   * Restaura o layout para a ordem padrão do sistema e persiste.
   * Equivale a deletar o layout personalizado.
   * @returns true se restaurado com sucesso
   */
  resetToDefault(): boolean;

  /**
   * Carrega o layout do usuário autenticado atual.
   * Chamado na inicialização do DashboardComponent.
   * Aplica validações (filtra IDs inválidos, fallback para default).
   */
  loadLayout(): void;
}
```

---

## Contrato de Armazenamento (localStorage — v1)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `userId` | `string` | Sim | ID do usuário autenticado |
| `tenantId` | `string` | Sim | ID do tenant (isolamento multi-brand) |
| `widgetOrder` | `WidgetId[]` | Sim | Array ordenado de IDs de widgets |
| `savedAt` | `string` (ISO 8601) | Sim | Timestamp do último salvamento |
| `version` | `1` | Sim | Versão do schema |

**Chave localStorage**: `dashboard_layout_{tenantId}_{userId}`

---

## Comportamentos de Erro

| Cenário | Comportamento |
|---------|--------------|
| `localStorage` inacessível (modo privado bloqueado) | `saveLayout()` retorna `false`; erro logado no console; modo de edição permanece ativo |
| JSON inválido no localStorage | Layout ignorado; fallback para `DEFAULT_WIDGET_ORDER`; log de aviso |
| `widgetOrder` com IDs desconhecidos | IDs filtrados silenciosamente; IDs válidos preservados |
| `widgetOrder` vazio após filtragem | Fallback para `DEFAULT_WIDGET_ORDER` |
| Usuário diferente do layout salvo | Layout ignorado; fallback para `DEFAULT_WIDGET_ORDER` |

---

## Contrato de API Futura (v2 — referência para planejamento)

```
GET    /api/v1/dashboard/layout
PUT    /api/v1/dashboard/layout    body: { widgetOrder: WidgetId[] }
DELETE /api/v1/dashboard/layout
```

Autenticação via JWT Bearer Token (padrão do projeto). Escopo por `tenantId` aplicado automaticamente pelo middleware de tenant do backend.
