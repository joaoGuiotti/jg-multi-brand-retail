---
name: angular-guidelines
description: >-
  Use esta skill sempre que código Angular (Componentes, Diretivas, Pipes, Serviços,
  Stores, Testes e Rotas) estiver sendo criado, analisado ou refatorado. Define padrões
  modernos obrigatórios do Angular 21+: Standalone, Signals, SignalStore, inject(),
  Built-in Control Flow e ChangeDetectionStrategy.OnPush.
---

# 🅰️ Angular Modern Guidelines Skill (Angular 21+)

## Integração Obrigatória com MCP `angular-cli`

Sempre que o servidor MCP **`angular-cli`** estiver disponível, o agente **DEVE** utilizá-lo:

1. **Validação de Melhores Práticas & Documentação Oficial:**
   - **`get_best_practices`**: Consulte para validar decisões de implementação e recomendações oficiais.
   - **`search_documentation`**: Pesquise a documentação oficial para APIs, sintaxes exatas e novidades.
   - **`ai_tutor`**: Orientações conceituais sobre recursos modernos do Angular.

2. **Modernização & Migração OnPush/Zoneless:**
   - **`onpush_zoneless_migration`**: Para auditar ou migrar componentes legados para `OnPush` e Signals.

3. **Inspeção de Workspace & Execução de Tarefas:**
   - **`list_projects`**: Inspecionar projetos no `angular.json`.
   - **`run_target`**: Executar targets (`build`, `test`, `lint`).
   - **`devserver_*`**: Gerenciar servidor de desenvolvimento.

## Diretrizes Fundamentais

### 1. Standalone Architecture & Zoneless
- **100% Standalone:** Todos os componentes, diretivas e pipes devem ter `standalone: true` e declarar dependências diretamente no array `imports: [...]`. Não utilize `NgModule`.
- **Change Detection:** Todo componente DEVE adotar `changeDetection: ChangeDetectionStrategy.OnPush`.
- **Preparado para Zoneless:** Não confie em `NgZone` ou `tick()`. Confie na reatividade orientada a Signals.

### 2. Signals & Reatividade Fina
- **Estado Local:** Use `signal()` para valores mutáveis e `computed()` para valores derivados.
- **Side-effects Controlados:** Use `effect()` apenas para interações com APIs externas que não retornem estado.
- **Inputs & Outputs:**
  - Substitua `@Input()` por `input<Type>()` ou `input.required<Type>()`.
  - Substitua `@Output()` por `output<Type>()`.
  - Para binding bidirecional, utilize `model<Type>()`.

### 3. Injeção de Dependências
- **Injeção Funcional com `inject()`:** Use `inject(ServiceClass)` no nível do campo em vez de injeções no construtor.
- Construtores devem permanecer limpos, sem argumentos desnecessários.

### 4. Built-in Control Flow
- NUNCA utilize diretivas estruturais legadas (`*ngIf`, `*ngFor`, `*ngSwitch`).
- Utilize a sintaxe moderna nativa:
  ```html
  @if (state.isLoading()) {
    <app-loading-spinner />
  } @else if (state.hasError()) {
    <app-error-banner [message]="state.errorMessage()" />
  } @else {
    @for (item of state.items(); track item.id) {
      <app-card [data]="item" />
    } @empty {
      <p class="empty-state">Nenhum item encontrado.</p>
    }
  }
  ```
- No `@for`, a cláusula `track` é **obrigatória**.

### 5. Deferrable Views (`@defer`)
- Em seções pesadas ou componentes fora do primeiro viewport, aplique `@defer`:
  ```html
  @defer (on viewport) {
    <app-heavy-chart [data]="chartData()" />
  } @placeholder {
    <div class="skeleton-chart" aria-hidden="true"></div>
  } @loading (minimum 300ms) {
    <p>Carregando gráfico...</p>
  }
  ```

## Clean Architecture & Padrões no Angular

### Camadas de Separação
1. **Domain (Núcleo):** Modelos puros (`interface`, `type`), Value Objects e classes abstratas definindo contratos (Ports).
2. **Infrastructure (Adaptadores):** Clientes HTTP, LocalStorage e integrações externas.
3. **Application (Orquestração):** Facades e State Store com `SignalStore` ou Services baseados em `signal()`.
4. **UI Layer (Container / Presenter Pattern):**
   - **Smart Containers:** Conectam-se ao Facade/Store, escutam rotas e passam dados aos Presenters.
   - **Dumb Presenters:** Apenas recebem dados via `input()` e notificam ações via `output()`.

## TypeScript Strict & Qualidade de Código
- Tipagem 100% estrita: proíba o uso de `any` (utilize `unknown` com type guards ou tipos genéricos).
- Funções puras e imutabilidade no tratamento de listas e objetos.
