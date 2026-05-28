# Data Model Mapping: Resolução de Tenant & Identidade Visual

Este documento define o mapeamento de banco de dados e os esquemas de transferência de dados públicos para o recurso de identificação dinâmica de inquilinos.

---

## 🗄️ 1. Modelo de Banco de Dados (Prisma)

A funcionalidade consome dados existentes no modelo `Tenant` no arquivo `schema.prisma`.

```prisma
model Tenant {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  logoUrl   String?  @map("logo_url")
  settings  Json?    // Estrutura customizada contendo dados estéticos
  active    Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // ... relações de negócio omitidas
}
```

---

## 📊 2. Estrutura do Campo `settings` (Esquema JSON)

Para suportar temas de inquilino de maneira simples e flexível, utilizaremos a propriedade `theme` dentro do campo JSON `settings`.

### Exemplo de Objeto Armazenado:
```json
{
  "currency": "BRL",
  "timezone": "America/Sao_Paulo",
  "features": {
    "conditionals": true,
    "inventory": true
  },
  "theme": {
    "primaryColor": "#10b981", 
    "accentColor": "#047857"
  }
}
```

---

## ✉️ 3. DTO de Resposta Pública (Data Transfer Object)

Este é o formato de dados estrito que o backend expõe publicamente. Ele oculta propriedades administrativas.

### `PublicTenantOutput` DTO

```typescript
export class PublicTenantOutput {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  active: boolean;
  theme: {
    primaryColor: string;
    accentColor: string;
  };
}
```

### Regras de Mapeamento do DTO no Backend:
- **Fallback de Cores:** Se o campo `settings` estiver nulo ou não possuir a chave `theme`, o backend deve retornar as cores padrão do sistema:
  - `primaryColor`: `#3b82f6` (Azul clássico)
  - `accentColor`: `#1d4ed8` (Azul escuro)
- **Status `active`:** É mantido na resposta para que o frontend exiba a tela de bloqueio e desative o formulário se `active = false`.
