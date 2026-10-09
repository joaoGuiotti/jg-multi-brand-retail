---
trigger: always_on
---

# 🏛️ Diretrizes Arquiteturais (Clean Architecture & Patterns)

## Camadas e regra de dependência

| Camada                              | Pode importar de                       | Pode usar Angular?            |
| ----------------------------------- | -------------------------------------- | ----------------------------- |
| `domain`                            | **somente** `domain`                   | ❌ Não                        |
| `application`                       | `domain`                               | ✅ DI (`inject`) e signals    |
| `infrastructure`                    | `domain`                               | ✅ `HttpClient`, `Injectable` |
| `presentation`                      | `application`, `domain` (apenas tipos) | ✅ Componentes                |
| `*.providers.ts` (composition root) | todas                                  | ✅                            |

A direção é sempre **para dentro**. `presentation` **nunca** importa de `infrastructure`.

1. **Domain:** regras de negócio puras, entidades, Value Objects (`*.vo.ts`, ex.: e-mail) e erros de domínio tipados. Zero Angular, zero bibliotecas externas.
2. **Ports & Adapters:**
   - **Ports:** `abstract class` no domínio (serve de token de DI).
   - **Adapters:** implementações em `infrastructure/adapters` (HTTP e in-memory).
3. **Container / Presenter:**
   - **Containers (smart):** injetam **apenas a Facade**, orquestram estado e rotas. Template enxuto.
   - **Presenters (dumb):** 100% visuais, só `input()` e `output()`. A11y e Lucide são mandatórios.
4. **Facades:** único ponto de contato entre a UI e o resto. Orquestram Store, Repository (port) e erros.
5. **State:** Signals (`signal()`, `computed()`, SignalStore ou service reativo). Estado de envio explícito: `type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'`.

## 📂 Mapa de pastas (referência: feature `cfp`)

```text
📦 apps/frontend/src/app/features
┣ 📂 __tests__                       # testes do app shell (ex.: app.spec.ts)
┗ 📂 cfp
  ┣ 📂 __tests__                     # TODOS os testes da feature, espelhando a árvore
  ┃ ┣ 📂 domain          └ speaker.entity.spec.ts
  ┃ ┣ 📂 application     └ cfp.facade.spec.ts, cfp.signal-store.spec.ts
  ┃ ┣ 📂 infrastructure  └ cfp-http.adapter.spec.ts, cfp-in-memory.adapter.spec.ts, cfp.mapper.spec.ts
  ┃ ┗ 📂 presentation    └ cfp-form-page.component.spec.ts, cfp-form.component.spec.ts, ...
  ┃
  ┣ 📂 domain                        # ⛔ Proibido importar Angular
  ┃ ┣ 📂 entities        └ speaker.entity.ts, cfp-form.types.ts (UM só arquivo de tipos)
  ┃ ┗ 📂 ports           └ cfp.repository.ts   # abstract class CfpRepository
  ┃
  ┣ 📂 application
  ┃ ┣ 📂 facades         └ cfp.facade.ts       # inject(CfpRepository) + Store
  ┃ ┗ 📂 state           └ cfp.signal-store.ts # sem I/O
  ┃
  ┣ 📂 infrastructure
  ┃ ┣ 📂 adapters        └ cfp-http.adapter.ts, cfp-in-memory.adapter.ts
  ┃ ┗ 📂 http            └ cfp.dtos.ts, cfp.mapper.ts
  ┃
  ┣ 📂 presentation
  ┃ ┣ 📂 containers      └ cfp-form-page/ (ts, html, scss quase sempre vazio)
  ┃ ┗ 📂 presenters      └ cfp-form/, cfp-notification/
  ┃
  ┣ 📜 cfp.routes.ts
  ┗ 📜 cfp.providers.ts              # composition root: liga port → adapter
```

---

## 🚫 Guardrails (aplicar em toda geração ou revisão)

1. **Testes centralizados em `__tests__`:**
   - Proibido `.spec.ts` ao lado da implementação.
   - Testes em `feature/__tests__/` espelhando a árvore; testes do app shell em `src/app/__tests__/`.
   - **Vitest:** use `vi.fn()`, `vi.spyOn`, `vi.useFakeTimers`. Proibido qualquer API do Jasmine (`jasmine.createSpy`, `spyOn` global).

2. **Inversão de Dependência:**
   - Facade, Store e Container **nunca** injetam o adapter concreto. Sempre o port: `private readonly repo = inject(CfpRepository)`.
   - Use `inject()`, não injeção por parâmetro de construtor.
   - A ligação port → adapter acontece **somente** em `cfp.providers.ts`, guiada por um token de configuração:

```ts
     { provide: CfpRepository,
       useFactory: () => inject(CFP_CONFIG).adapter === 'http'
         ? inject(CfpHttpAdapter)
         : inject(CfpInMemoryAdapter) }
```

- O valor de `adapter` é definido em **um único lugar** (`app.config.ts` ou `fileReplacements`): desenvolvimento = `'http'`; build de produção/demo = `'in-memory'`.

3. **Isolamento do Domínio:** `domain/` só importa de `domain/`. Proibido `@angular/*`, `rxjs` e libs externas.

4. **Presenters burros:** em `presentation/presenters/` é proibido `constructor` com injeção **e** proibido `inject()` (serviços, Router, Facades, Stores). Só `input()`, `output()` e, se preciso, `computed()` sobre inputs. Todo componente usa `ChangeDetectionStrategy.OnPush`.

5. **Tailwind e Design System:**
   - Proibidos valores arbitrários no HTML (`w-[245px]`, `text-[#f00]`). Use somente tokens do DS (`w-64`, `text-feedback-error`, `bg-overlay`), definidos na fonte de tokens do projeto (`tailwind.config.js` na v3 ou `@theme` no CSS na v4).
   - Proibido `@apply` nos `.scss` de componentes para "limpar" o HTML.
   - Estados dinâmicos via `[class.x]="cond"` do Angular. Nunca monte nomes de classe por concatenação (o Tailwind não os detecta). Use strings literais completas.
   - SCSS é **residual**: só quando o Tailwind não resolve, consumindo `var(--...)` do DS. Remova `.scss` vazios.

6. **Sufixos obrigatórios:** `.entity.ts`, `.vo.ts`, `.repository.ts`, `.adapter.ts`, `.facade.ts`, `.signal-store.ts`, `.dtos.ts`, `.mapper.ts`.

7. **DTO vs Domínio:** adapters nunca devolvem DTO cru. A conversão acontece em `infrastructure/http/*.mapper.ts` (puro, tipado, sem `any`). Adapter HTTP converte `HttpErrorResponse` em erro de domínio tipado.

8. **Fronteiras garantidas por lint:** a regra de dependência da tabela acima é enforçada por `eslint-plugin-boundaries` (ou `no-restricted-imports`). Se o lint acusar violação, **corrija o código**, nunca a regra. Não extraia libs Nx para resolver.

9. **Sem sujeira:** proibidos `any`, `console.log`, imports não usados e código comentado.